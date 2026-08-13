"""Writing system progress helpers."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Character, CharacterProgress, CharacterReview, WritingSystem


async def get_writing_systems_for_course(
    db: AsyncSession, course_id: uuid.UUID
) -> list[WritingSystem]:
    result = await db.execute(
        select(WritingSystem)
        .where(WritingSystem.course_id == course_id)
        .options(selectinload(WritingSystem.characters))
        .order_by(WritingSystem.order_index)
    )
    return list(result.scalars().all())


async def get_progress_map(
    db: AsyncSession, user_id: uuid.UUID, character_ids: list[uuid.UUID]
) -> dict[uuid.UUID, CharacterProgress]:
    if not character_ids:
        return {}
    result = await db.execute(
        select(CharacterProgress)
        .where(CharacterProgress.user_id == user_id)
        .where(CharacterProgress.character_id.in_(character_ids))
    )
    return {p.character_id: p for p in result.scalars().all()}


def section_is_unlocked(
    ws: WritingSystem,
    systems_by_id: dict[uuid.UUID, WritingSystem],
    progress_by_char: dict[uuid.UUID, CharacterProgress],
) -> bool:
    if not ws.unlock_after_id:
        return True
    parent = systems_by_id.get(ws.unlock_after_id)
    if not parent or not parent.characters:
        return False
    learned = sum(
        1 for c in parent.characters if progress_by_char.get(c.id) and progress_by_char[c.id].learned
    )
    return learned >= len(parent.characters)


def section_stats(
    characters: list[Character], progress_map: dict[uuid.UUID, CharacterProgress]
) -> dict:
    total = len(characters)
    learned = sum(1 for c in characters if progress_map.get(c.id) and progress_map[c.id].learned)
    mastered = sum(1 for c in characters if progress_map.get(c.id) and progress_map[c.id].mastered)
    practice = sum(progress_map.get(c.id).practice_count if progress_map.get(c.id) else 0 for c in characters)
    correct = sum(progress_map.get(c.id).correct_count if progress_map.get(c.id) else 0 for c in characters)
    wrong = sum(progress_map.get(c.id).wrong_count if progress_map.get(c.id) else 0 for c in characters)
    attempts = correct + wrong
    accuracy = round((correct / attempts) * 100) if attempts else 0
    return {
        "total_characters": total,
        "characters_learned": learned,
        "characters_mastered": mastered,
        "practice_count": practice,
        "accuracy_percent": accuracy,
        "completed": total > 0 and learned >= total,
    }


async def is_primary_writing_complete(db: AsyncSession, user_id: uuid.UUID, course_id: uuid.UUID) -> bool:
    systems = await get_writing_systems_for_course(db, course_id)
    if not systems:
        return True
    primary = systems[0]
    if not primary.characters:
        return True
    char_ids = [c.id for c in primary.characters]
    progress = await get_progress_map(db, user_id, char_ids)
    learned = sum(1 for cid in char_ids if progress.get(cid) and progress[cid].learned)
    return learned >= len(char_ids)


async def record_character_attempt(
    db: AsyncSession,
    user_id: uuid.UUID,
    character_id: uuid.UUID,
    *,
    correct: bool,
) -> CharacterProgress:
    result = await db.execute(
        select(CharacterProgress)
        .where(CharacterProgress.user_id == user_id)
        .where(CharacterProgress.character_id == character_id)
    )
    prog = result.scalar_one_or_none()
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if not prog:
        prog = CharacterProgress(user_id=user_id, character_id=character_id)
        db.add(prog)

    prog.practice_count += 1
    prog.last_practiced_at = now

    if correct:
        prog.correct_count += 1
        prog.streak += 1
        prog.learned = True
        if prog.streak >= 2:
            prog.mastered = True
        review = await db.execute(
            select(CharacterReview)
            .where(CharacterReview.user_id == user_id)
            .where(CharacterReview.character_id == character_id)
        )
        rev = review.scalar_one_or_none()
        if rev:
            await db.delete(rev)
    else:
        prog.wrong_count += 1
        prog.streak = 0
        review = await db.execute(
            select(CharacterReview)
            .where(CharacterReview.user_id == user_id)
            .where(CharacterReview.character_id == character_id)
        )
        rev = review.scalar_one_or_none()
        if not rev:
            rev = CharacterReview(user_id=user_id, character_id=character_id)
            db.add(rev)
        rev.wrong_streak += 1
        rev.due_at = now + timedelta(minutes=min(30, rev.wrong_streak * 5))

    await db.flush()
    return prog


async def get_review_character_ids(db: AsyncSession, user_id: uuid.UUID, course_id: uuid.UUID) -> list[uuid.UUID]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = await db.execute(
        select(CharacterReview.character_id)
        .join(Character, Character.id == CharacterReview.character_id)
        .join(WritingSystem, WritingSystem.id == Character.writing_system_id)
        .where(CharacterReview.user_id == user_id)
        .where(WritingSystem.course_id == course_id)
        .where(CharacterReview.due_at <= now)
    )
    return [row[0] for row in result.all()]
