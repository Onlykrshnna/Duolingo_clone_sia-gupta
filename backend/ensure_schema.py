"""Ensure DB schema matches models (SQLite dev convenience)."""
import asyncio
import logging
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from config import DATABASE_URL
from models import Base


def _migrate_users_table(sync_conn) -> None:
    inspector = inspect(sync_conn)
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
    sync_conn.execute(text("UPDATE courses SET target_language = language_code"))


def _migrate_exercise_options_table(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "exercise_options" not in inspector.get_table_names():
        return
    columns = [c["name"] for c in inspector.get_columns("exercise_options")]
    if "image_url" not in columns:
        sync_conn.execute(text("ALTER TABLE exercise_options ADD COLUMN image_url VARCHAR NULL"))


def _dedupe_user_skill_progress(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "user_skill_progress" not in inspector.get_table_names():
        return

    rows = sync_conn.execute(
        text(
            """
            SELECT id, user_id, skill_id, current_level, lessons_completed, status
            FROM user_skill_progress
            ORDER BY user_id, skill_id, current_level DESC, lessons_completed DESC, updated_at DESC
            """
        )
    ).fetchall()

    seen: set[tuple] = set()
    delete_ids: list[str] = []
    for row in rows:
        key = (str(row.user_id), str(row.skill_id))
        if key in seen:
            delete_ids.append(str(row.id))
        else:
            seen.add(key)

    for row_id in delete_ids:
        sync_conn.execute(text("DELETE FROM user_skill_progress WHERE id = :id"), {"id": row_id})


def _dedupe_user_quest_progress(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "user_quest_progress" not in inspector.get_table_names():
        return

    rows = sync_conn.execute(
        text(
            """
            SELECT id, user_id, quest_id, date
            FROM user_quest_progress
            ORDER BY user_id, quest_id, date DESC, id DESC
            """
        )
    ).fetchall()

    seen: set[tuple[str, str]] = set()
    delete_ids: list[str] = []
    for row in rows:
        key = (str(row.user_id), str(row.quest_id))
        if key in seen:
            delete_ids.append(str(row.id))
        else:
            seen.add(key)

    for row_id in delete_ids:
        sync_conn.execute(
            text("DELETE FROM user_quest_progress WHERE id = :id"),
            {"id": row_id},
        )

    if delete_ids:
        logging.getLogger("duolingo.schema").warning(
            "Removed %d duplicate user_quest_progress rows on startup (kept newest per user+quest)",
            len(delete_ids),
        )


def _ensure_user_quest_progress_unique(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "user_quest_progress" not in inspector.get_table_names():
        return

    existing = {
        idx["name"]
        for idx in inspector.get_indexes("user_quest_progress")
    }
    if "uq_user_quest" not in existing:
        sync_conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_user_quest
                ON user_quest_progress (user_id, quest_id)
                """
            )
        )
    if "uq_user_quest_date" in existing:
        try:
            sync_conn.execute(text("DROP INDEX IF EXISTS uq_user_quest_date"))
        except Exception:
            pass


async def ensure_onboarding_column() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_users_table)
        await conn.run_sync(_migrate_courses_table)
        await conn.run_sync(_migrate_exercise_options_table)
        await conn.run_sync(_dedupe_user_skill_progress)
        await conn.run_sync(_dedupe_user_quest_progress)
        await conn.run_sync(_ensure_user_quest_progress_unique)
    await engine.dispose()


async def ensure_tables() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(ensure_onboarding_column())
