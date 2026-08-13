"""Writing system API routes."""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import get_user_or_default
from database import get_db
from models import Character, Course, WritingSystem
from seed_writing import ensure_writing_systems_for_course, resolve_lang_code
from writing_content import LANGUAGE_NAMES
from writing_utils import (
    get_progress_map,
    get_review_character_ids,
    get_writing_systems_for_course,
    record_character_attempt,
    section_is_unlocked,
    section_stats,
)

router = APIRouter(prefix="/api/v1")

AUDIO_PLACEHOLDER = "/api/v1/media/audio-placeholder"
IMAGE_PLACEHOLDER = "/api/v1/media/image-placeholder"


class CharacterProgressResponse(BaseModel):
    character_id: uuid.UUID
    learned: bool
    mastered: bool
    practice_count: int
    correct_count: int
    wrong_count: int
    accuracy_percent: int


class CharacterDetailResponse(BaseModel):
    id: uuid.UUID
    glyph: str
    romanization: str
    romaji: str
    pronunciation: str
    meaning: str
    example_word: str
    example_glyph: str
    example_meaning: str
    image_emoji: str
    image: str
    audio: Optional[str] = None
    order_index: int
    locked: bool = False
    completed: bool = False
    progress: Optional[CharacterProgressResponse] = None


class WritingSectionSummary(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    order_index: int
    unlocked: bool
    locked: bool
    total_characters: int
    characters_learned: int
    characters_mastered: int
    practice_count: int
    accuracy_percent: int
    completed: bool
    characters: List[CharacterDetailResponse] = Field(default_factory=list)


class WritingProgressSummary(BaseModel):
    total_characters: int
    characters_learned: int
    characters_mastered: int
    primary_completed: bool
    review_due_count: int


class WritingSystemOverview(BaseModel):
    course_id: uuid.UUID
    language: str
    language_code: str
    sections: List[WritingSectionSummary]
    characters: List[CharacterDetailResponse] = Field(default_factory=list)
    progress: WritingProgressSummary
    total_characters: int
    characters_learned: int
    characters_mastered: int
    primary_completed: bool
    review_due_count: int


class CharacterResponse(BaseModel):
    id: uuid.UUID
    glyph: str
    romanization: str
    pronunciation: str
    example_glyph: str
    example_meaning: str
    image_emoji: str
    order_index: int
    progress: Optional[CharacterProgressResponse] = None


class CharacterAttemptRequest(BaseModel):
    character_id: uuid.UUID
    correct: bool


def _progress_response(prog) -> CharacterProgressResponse:
    attempts = prog.correct_count + prog.wrong_count
    acc = round((prog.correct_count / attempts) * 100) if attempts else 0
    return CharacterProgressResponse(
        character_id=prog.character_id,
        learned=prog.learned,
        mastered=prog.mastered,
        practice_count=prog.practice_count,
        correct_count=prog.correct_count,
        wrong_count=prog.wrong_count,
        accuracy_percent=acc,
    )


def _character_detail(
    ch: Character,
    *,
    section_unlocked: bool,
    progress_map: dict,
) -> CharacterDetailResponse:
    prog = progress_map.get(ch.id)
    progress = _progress_response(prog) if prog else None
    completed = bool(prog and prog.learned)
    return CharacterDetailResponse(
        id=ch.id,
        glyph=ch.glyph,
        romanization=ch.romanization,
        romaji=ch.romanization,
        pronunciation=ch.pronunciation,
        meaning=ch.example_meaning,
        example_word=ch.example_glyph,
        example_glyph=ch.example_glyph,
        example_meaning=ch.example_meaning,
        image_emoji=ch.image_emoji,
        image=f"{IMAGE_PLACEHOLDER}/{ch.id}",
        audio=f"{AUDIO_PLACEHOLDER}/{ch.id}",
        order_index=ch.order_index,
        locked=not section_unlocked,
        completed=completed,
        progress=progress,
    )


async def _build_overview(db: AsyncSession, course: Course, user_id: uuid.UUID) -> WritingSystemOverview:
    lang_code = resolve_lang_code(course.id, course.target_language or course.language_code)
    await ensure_writing_systems_for_course(db, course.id, lang_code)

    systems = await get_writing_systems_for_course(db, course.id)
    all_char_ids = [c.id for ws in systems for c in ws.characters]
    progress_map = await get_progress_map(db, user_id, all_char_ids)
    systems_by_id = {ws.id: ws for ws in systems}

    sections: list[WritingSectionSummary] = []
    flat_characters: list[CharacterDetailResponse] = []
    total_learned = 0
    total_mastered = 0
    total_chars = 0

    for ws in systems:
        stats = section_stats(ws.characters, progress_map)
        unlocked = section_is_unlocked(ws, systems_by_id, progress_map)
        total_learned += stats["characters_learned"]
        total_mastered += stats["characters_mastered"]
        total_chars += stats["total_characters"]

        char_details = [
            _character_detail(ch, section_unlocked=unlocked, progress_map=progress_map)
            for ch in sorted(ws.characters, key=lambda c: c.order_index)
        ]
        flat_characters.extend(char_details)

        sections.append(
            WritingSectionSummary(
                id=ws.id,
                slug=ws.slug,
                title=ws.title,
                description=ws.description,
                order_index=ws.order_index,
                unlocked=unlocked,
                locked=not unlocked,
                characters=char_details,
                **stats,
            )
        )

    primary = systems[0] if systems else None
    primary_completed = False
    if primary:
        ps = section_stats(primary.characters, progress_map)
        primary_completed = ps["completed"]

    review_due = await get_review_character_ids(db, user_id, course.id)
    language_code = course.target_language or course.language_code or lang_code or "en"
    language_name = LANGUAGE_NAMES.get(language_code, language_code.upper())

    progress = WritingProgressSummary(
        total_characters=total_chars,
        characters_learned=total_learned,
        characters_mastered=total_mastered,
        primary_completed=primary_completed,
        review_due_count=len(review_due),
    )

    return WritingSystemOverview(
        course_id=course.id,
        language=language_name,
        language_code=language_code,
        sections=sections,
        characters=flat_characters,
        progress=progress,
        total_characters=total_chars,
        characters_learned=total_learned,
        characters_mastered=total_mastered,
        primary_completed=primary_completed,
        review_due_count=len(review_due),
    )


@router.get("/courses/{course_id}/writing-system", response_model=WritingSystemOverview)
async def get_writing_overview(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, "me")
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return await _build_overview(db, course, user.id)


@router.get("/courses/{course_id}/writing-system/{slug}/characters", response_model=List[CharacterResponse])
async def get_section_characters(
    course_id: uuid.UUID, slug: str, db: AsyncSession = Depends(get_db)
):
    user = await get_user_or_default(db, "me")
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lang_code = resolve_lang_code(course.id, course.target_language or course.language_code)
    await ensure_writing_systems_for_course(db, course.id, lang_code)

    result = await db.execute(
        select(WritingSystem)
        .where(WritingSystem.course_id == course_id)
        .where(WritingSystem.slug == slug)
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Writing section not found")

    char_result = await db.execute(
        select(Character)
        .where(Character.writing_system_id == ws.id)
        .order_by(Character.order_index)
    )
    characters = list(char_result.scalars().all())
    progress_map = await get_progress_map(db, user.id, [c.id for c in characters])

    out: list[CharacterResponse] = []
    for ch in characters:
        prog = progress_map.get(ch.id)
        progress = _progress_response(prog) if prog else None
        out.append(
            CharacterResponse(
                id=ch.id,
                glyph=ch.glyph,
                romanization=ch.romanization,
                pronunciation=ch.pronunciation,
                example_glyph=ch.example_glyph,
                example_meaning=ch.example_meaning,
                image_emoji=ch.image_emoji,
                order_index=ch.order_index,
                progress=progress,
            )
        )
    return out


@router.post("/courses/{course_id}/writing-system/progress")
async def update_character_progress(
    course_id: uuid.UUID,
    payload: CharacterAttemptRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_default(db, "me")
    char = await db.get(Character, payload.character_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    ws = await db.get(WritingSystem, char.writing_system_id)
    if not ws or ws.course_id != course_id:
        raise HTTPException(status_code=403, detail="Character does not belong to this course")

    prog = await record_character_attempt(db, user.id, payload.character_id, correct=payload.correct)
    await db.commit()

    attempts = prog.correct_count + prog.wrong_count
    acc = round((prog.correct_count / attempts) * 100) if attempts else 0
    return {
        "success": True,
        "learned": prog.learned,
        "mastered": prog.mastered,
        "practice_count": prog.practice_count,
        "accuracy_percent": acc,
    }
