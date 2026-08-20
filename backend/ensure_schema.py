"""Ensure DB schema matches models (SQLite dev convenience).

Defensive: each step is wrapped so the FastAPI app never fails to start
because of a best-effort cleanup or column addition.
"""
import asyncio
import logging
from typing import Iterable

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from config import DATABASE_URL
from models import Base

log = logging.getLogger("duolingo.schema")


def _table_columns(sync_conn, table_name: str) -> set[str]:
    """Return the real set of column names for a table (via PRAGMA)."""
    try:
        rows = sync_conn.execute(text(f'PRAGMA table_info("{table_name}")')).fetchall()
    except Exception as exc:
        log.warning("Could not PRAGMA table_info(%s): %s", table_name, exc)
        return set()
    # PRAGMA table_info rows: (cid, name, type, notnull, dflt_value, pk)
    return {row[1] for row in rows}


def _safe_run(label: str, fn, *args, **kwargs) -> None:
    """Run fn() and swallow+log any exception so startup never crashes."""
    try:
        fn(*args, **kwargs)
    except Exception as exc:
        log.warning("Schema step [%s] skipped (non-fatal): %s", label, exc, exc_info=True)


def _migrate_users_table(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "users" not in inspector.get_table_names():
        return
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "onboarding_completed" not in columns:
        sync_conn.execute(
            text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT 0")
        )
    if "selected_language" not in columns:
        sync_conn.execute(text("ALTER TABLE users ADD COLUMN selected_language VARCHAR NULL"))
    if "native_language" not in columns:
        sync_conn.execute(
            text("ALTER TABLE users ADD COLUMN native_language VARCHAR NOT NULL DEFAULT 'en'")
        )
    if "learning_language" not in columns:
        sync_conn.execute(text("ALTER TABLE users ADD COLUMN learning_language VARCHAR NULL"))


def _migrate_courses_table(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "courses" not in inspector.get_table_names():
        return
    columns = [c["name"] for c in inspector.get_columns("courses")]
    if "source_language" not in columns:
        sync_conn.execute(
            text("ALTER TABLE courses ADD COLUMN source_language VARCHAR NOT NULL DEFAULT 'en'")
        )
    if "target_language" not in columns:
        sync_conn.execute(
            text(
                "ALTER TABLE courses ADD COLUMN target_language VARCHAR NOT NULL DEFAULT 'es'"
            )
        )
    # Only run UPDATE if the legacy column is still present (ignore errors).
    try:
        if "language_code" in columns:
            sync_conn.execute(text("UPDATE courses SET target_language = language_code"))
    except Exception:
        pass


def _migrate_exercise_options_table(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "exercise_options" not in inspector.get_table_names():
        return
    columns = [c["name"] for c in inspector.get_columns("exercise_options")]
    if "image_url" not in columns:
        sync_conn.execute(text("ALTER TABLE exercise_options ADD COLUMN image_url VARCHAR NULL"))


def _safe_delete_by_ids(sync_conn, table: str, id_column: str, ids: Iterable) -> None:
    """Bulk DELETE rows matching ids; a no-op if the id column doesn't exist."""
    id_list = [str(x) for x in list(ids)]
    if not id_list:
        return
    for row_id in id_list:
        try:
            sync_conn.execute(
                text(f'DELETE FROM "{table}" WHERE "{id_column}" = :id'),
                {"id": row_id},
            )
        except Exception as exc:
            log.warning(
                "Could not DELETE from %s where %s=%s: %s", table, id_column, row_id, exc
            )


def _dedupe_by_key(sync_conn, table: str, key_columns: list[str], order_columns: list[str]) -> None:
    """Generic dedupe: keep the first row per key (by order_columns desc),
    delete the rest. Requires an `id` column; skips safely if missing."""
    inspector = inspect(sync_conn)
    if table not in inspector.get_table_names():
        return
    cols = _table_columns(sync_conn, table)
    if "id" not in cols:
        log.info(
            "Skip dedupe for %s: no 'id' column present (has %s). Table uses composite PK.",
            table,
            sorted(cols),
        )
        return
    if not all(c in cols for c in key_columns + order_columns):
        log.info(
            "Skip dedupe for %s: required columns missing. Have=%s need=%s",
            table,
            sorted(cols),
            sorted(set(key_columns) | set(order_columns)),
        )
        return

    select_cols = ", ".join(
        f'"{c}"' for c in (["id"] + key_columns + [o for o in order_columns if o != "id"])
    )
    order_clause = ", ".join(f'"{c}" DESC' for c in order_columns)
    key_clause = ", ".join(f'"{c}"' for c in key_columns)

    try:
        rows = sync_conn.execute(
            text(
                f"""
                SELECT {select_cols}
                FROM "{table}"
                ORDER BY {key_clause}, {order_clause}
                """
            )
        ).fetchall()
    except Exception as exc:
        log.warning("Could not SELECT from %s for dedupe: %s", table, exc)
        return

    seen: set[tuple] = set()
    delete_ids: list[str] = []
    for row in rows:
        row_dict = row._mapping if hasattr(row, "_mapping") else {}
        key = tuple(str(row_dict.get(c) if row_dict else row[i + 1]) for i, c in enumerate(key_columns))
        if not key:
            continue
        if key in seen:
            delete_ids.append(str(row_dict.get("id") if row_dict else row[0]))
        else:
            seen.add(key)

    _safe_delete_by_ids(sync_conn, table, "id", delete_ids)
    if delete_ids:
        log.warning(
            "Deduped table %s on %s — removed %d duplicate rows.",
            table,
            key_columns,
            len(delete_ids),
        )


def _dedupe_user_skill_progress(sync_conn) -> None:
    _dedupe_by_key(
        sync_conn,
        "user_skill_progress",
        key_columns=["user_id", "skill_id"],
        order_columns=["current_level", "lessons_completed", "updated_at", "id"],
    )


def _dedupe_user_quest_progress(sync_conn) -> None:
    _dedupe_by_key(
        sync_conn,
        "user_quest_progress",
        key_columns=["user_id", "quest_id"],
        order_columns=["date", "id"],
    )


def _ensure_user_quest_progress_unique(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "user_quest_progress" not in inspector.get_table_names():
        return
    cols = _table_columns(sync_conn, "user_quest_progress")
    if not {"user_id", "quest_id"}.issubset(cols):
        log.info(
            "Skip uq_user_quest index creation: missing user_id/quest_id. Have=%s",
            sorted(cols),
        )
        return

    existing = {idx["name"] for idx in inspector.get_indexes("user_quest_progress")}
    if "uq_user_quest" not in existing:
        try:
            sync_conn.execute(
                text(
                    """
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_user_quest
                    ON user_quest_progress (user_id, quest_id)
                    """
                )
            )
        except Exception as exc:
            log.warning("Could not create uq_user_quest index: %s", exc)

    if "uq_user_quest_date" in existing:
        try:
            sync_conn.execute(text("DROP INDEX IF EXISTS uq_user_quest_date"))
        except Exception:
            pass


async def ensure_onboarding_column() -> None:
    """Ensure schema; never raises — failures are logged and skipped."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "Base.metadata.create_all",
                    lambda sc: Base.metadata.create_all(sc),
                    sync_c,
                )
            )
            await conn.run_sync(
                lambda sync_c: _safe_run("users columns", _migrate_users_table, sync_c)
            )
            await conn.run_sync(
                lambda sync_c: _safe_run("courses columns", _migrate_courses_table, sync_c)
            )
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "exercise_options columns", _migrate_exercise_options_table, sync_c
                )
            )
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "dedupe user_skill_progress", _dedupe_user_skill_progress, sync_c
                )
            )
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "dedupe user_quest_progress", _dedupe_user_quest_progress, sync_c
                )
            )
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "unique index user_quest_progress",
                    _ensure_user_quest_progress_unique,
                    sync_c,
                )
            )
    except Exception as exc:
        log.error("Schema ensure failed (continuing startup anyway): %s", exc, exc_info=True)
    finally:
        await engine.dispose()


async def ensure_tables() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(
                lambda sync_c: _safe_run(
                    "Base.metadata.create_all",
                    lambda sc: Base.metadata.create_all(sc),
                    sync_c,
                )
            )
    except Exception as exc:
        log.warning("ensure_tables skipped: %s", exc)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(ensure_onboarding_column())
