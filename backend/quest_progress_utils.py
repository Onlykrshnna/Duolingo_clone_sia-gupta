"""Safe read/write helpers for UserQuestProgress — prevents duplicate-row crashes."""
from __future__ import annotations

import logging
import uuid
from datetime import date
from typing import Iterable, Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models import Quest, UserQuestProgress

logger = logging.getLogger("duolingo.quest_progress")


async def fetch_quest_progress_rows(
    db: AsyncSession,
    user_id: uuid.UUID,
    quest_id: uuid.UUID,
    progress_date: date | None = None,
) -> list[UserQuestProgress]:
    stmt = (
        select(UserQuestProgress)
        .where(UserQuestProgress.user_id == user_id)
        .where(UserQuestProgress.quest_id == quest_id)
    )
    if progress_date is not None:
        stmt = stmt.where(UserQuestProgress.date == progress_date)
    stmt = stmt.order_by(UserQuestProgress.date.desc(), UserQuestProgress.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def dedupe_quest_progress_rows(
    db: AsyncSession,
    rows: Sequence[UserQuestProgress],
    *,
    context: str,
) -> UserQuestProgress | None:
    """Keep the newest row (latest date, then highest id); delete duplicates."""
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0]

    sorted_rows = sorted(
        rows,
        key=lambda r: (r.date, r.id),
        reverse=True,
    )
    keep = sorted_rows[0]
    duplicates = sorted_rows[1:]
    logger.warning(
        "Duplicate UserQuestProgress rows detected (%s): user_id=%s quest_id=%s count=%d — keeping newest id=%s date=%s",
        context,
        keep.user_id,
        keep.quest_id,
        len(rows),
        keep.id,
        keep.date,
    )
    for dup in duplicates:
        await db.delete(dup)
    await db.flush()
    return keep


async def get_quest_progress_safe(
    db: AsyncSession,
    user_id: uuid.UUID,
    quest_id: uuid.UUID,
    progress_date: date | None = None,
    *,
    context: str = "get_quest_progress_safe",
) -> UserQuestProgress | None:
    rows = await fetch_quest_progress_rows(db, user_id, quest_id, progress_date)
    return await dedupe_quest_progress_rows(db, rows, context=context)


async def get_or_create_quest_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    quest_id: uuid.UUID,
    progress_date: date,
    *,
    context: str = "get_or_create_quest_progress",
) -> UserQuestProgress:
    existing = await get_quest_progress_safe(
        db, user_id, quest_id, None, context=context
    )
    if existing:
        existing.date = progress_date
        return existing

    row = UserQuestProgress(
        user_id=user_id,
        quest_id=quest_id,
        progress=0,
        completed=False,
        date=progress_date,
    )
    try:
        async with db.begin_nested():
            db.add(row)
            await db.flush()
        return row
    except IntegrityError:
        logger.warning(
            "IntegrityError creating UserQuestProgress (%s) — refetching existing row",
            context,
        )
        refetched = await get_quest_progress_safe(
            db, user_id, quest_id, None, context=f"{context}:retry"
        )
        if refetched:
            refetched.date = progress_date
            return refetched
        raise


async def ensure_today_quest_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    quests: Iterable[Quest],
    progress_date: date,
    *,
    context: str = "ensure_today_quest_progress",
) -> None:
    for quest in quests:
        await get_or_create_quest_progress(
            db,
            user_id,
            quest.id,
            progress_date,
            context=f"{context}:quest={quest.id}",
        )


async def fetch_user_quest_progress_for_day(
    db: AsyncSession,
    user_id: uuid.UUID,
    progress_date: date,
) -> list[UserQuestProgress]:
    """Return one row per quest, deduping any bad data. Updates date to progress_date for survivors."""
    result = await db.execute(
        select(UserQuestProgress)
        .where(UserQuestProgress.user_id == user_id)
        .order_by(UserQuestProgress.quest_id, UserQuestProgress.date.desc(), UserQuestProgress.id.desc())
    )
    all_rows = list(result.scalars().all())

    by_quest: dict[uuid.UUID, list[UserQuestProgress]] = {}
    for row in all_rows:
        by_quest.setdefault(row.quest_id, []).append(row)

    cleaned: list[UserQuestProgress] = []
    for quest_id, group in by_quest.items():
        survivor = await dedupe_quest_progress_rows(
            db,
            group,
            context=f"fetch_user_quest_progress_for_day:quest={quest_id}",
        )
        if survivor:
            survivor.date = progress_date
            cleaned.append(survivor)
    return cleaned
