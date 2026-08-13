"""UserSkillProgress helpers — dedupe rows and safe get/create."""
from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import SkillProgressStatus, UserSkillProgress


def _progress_rank(prog: UserSkillProgress) -> tuple:
    status_score = {
        SkillProgressStatus.completed: 3,
        SkillProgressStatus.in_progress: 2,
        SkillProgressStatus.available: 1,
        SkillProgressStatus.locked: 0,
    }.get(prog.status, 0)
    return (prog.current_level, prog.lessons_completed, status_score)


def pick_best_progress(a: UserSkillProgress, b: UserSkillProgress) -> UserSkillProgress:
    return a if _progress_rank(a) >= _progress_rank(b) else b


async def fetch_skill_progress_rows(
    db: AsyncSession,
    user_id: uuid.UUID,
    skill_id: uuid.UUID,
) -> list[UserSkillProgress]:
    result = await db.execute(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == user_id)
        .where(UserSkillProgress.skill_id == skill_id)
        .order_by(UserSkillProgress.updated_at.desc())
    )
    return list(result.scalars().all())


async def dedupe_skill_progress(
    db: AsyncSession,
    rows: list[UserSkillProgress],
) -> UserSkillProgress | None:
    """Keep the most advanced row; delete duplicate progress records."""
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0]

    keeper = max(rows, key=_progress_rank)
    duplicate_ids = [row.id for row in rows if row.id != keeper.id]
    if duplicate_ids:
        await db.execute(delete(UserSkillProgress).where(UserSkillProgress.id.in_(duplicate_ids)))
        await db.flush()
    return keeper


async def get_user_skill_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    skill_id: uuid.UUID,
) -> UserSkillProgress | None:
    rows = await fetch_skill_progress_rows(db, user_id, skill_id)
    return await dedupe_skill_progress(db, rows)


async def get_or_create_user_skill_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    skill_id: uuid.UUID,
    *,
    default_status: SkillProgressStatus = SkillProgressStatus.in_progress,
) -> UserSkillProgress:
    prog = await get_user_skill_progress(db, user_id, skill_id)
    if prog:
        return prog

    prog = UserSkillProgress(
        user_id=user_id,
        skill_id=skill_id,
        current_level=0,
        status=default_status,
        lessons_completed=0,
    )
    db.add(prog)
    await db.flush()
    return prog
