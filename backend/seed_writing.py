"""Seed writing systems and characters from writing_content."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from writing_content import (
    COURSE_ID_TO_LANG,
    COURSE_IDS,
    WRITING_SYSTEMS_BY_COURSE,
)
from models import WritingSystem, Character
from writing_utils import get_writing_systems_for_course


def resolve_lang_code(course_id: uuid.UUID, target_language: str | None) -> str | None:
    if target_language and target_language in WRITING_SYSTEMS_BY_COURSE:
        return target_language
    return COURSE_ID_TO_LANG.get(str(course_id))


def seed_writing_systems(session, course_id: uuid.UUID, lang_code: str) -> None:
    specs = WRITING_SYSTEMS_BY_COURSE.get(lang_code, [])
    if not specs:
        return

    slug_to_id: dict[str, uuid.UUID] = {}

    for spec in specs:
        ws_id = uuid.uuid4()
        slug_to_id[spec["slug"]] = ws_id
        unlock_after_id = None
        if spec.get("unlock_after_slug"):
            unlock_after_id = slug_to_id.get(spec["unlock_after_slug"])

        session.add(
            WritingSystem(
                id=ws_id,
                course_id=course_id,
                slug=spec["slug"],
                title=spec["title"],
                description=spec["description"],
                order_index=spec["order_index"],
                unlock_after_id=unlock_after_id,
            )
        )

        for idx, ch in enumerate(spec.get("characters") or [], 1):
            session.add(
                Character(
                    id=uuid.uuid4(),
                    writing_system_id=ws_id,
                    glyph=ch["glyph"],
                    romanization=ch["romanization"],
                    pronunciation=ch["pronunciation"],
                    example_glyph=ch["example_glyph"],
                    example_meaning=ch["example_meaning"],
                    image_emoji=ch.get("image", "📖"),
                    order_index=idx,
                )
            )


async def ensure_writing_systems_for_course(
    db: AsyncSession,
    course_id: uuid.UUID,
    lang_code: str | None,
) -> None:
    """Create writing-system rows on first request if the DB was never seeded."""
    if not lang_code:
        return

    existing = await get_writing_systems_for_course(db, course_id)
    if existing:
        return

    specs = WRITING_SYSTEMS_BY_COURSE.get(lang_code, [])
    if not specs:
        return

    slug_to_id: dict[str, uuid.UUID] = {}

    for spec in specs:
        ws_id = uuid.uuid4()
        slug_to_id[spec["slug"]] = ws_id
        unlock_after_id = None
        if spec.get("unlock_after_slug"):
            unlock_after_id = slug_to_id.get(spec["unlock_after_slug"])

        db.add(
            WritingSystem(
                id=ws_id,
                course_id=course_id,
                slug=spec["slug"],
                title=spec["title"],
                description=spec["description"],
                order_index=spec["order_index"],
                unlock_after_id=unlock_after_id,
            )
        )

        for idx, ch in enumerate(spec.get("characters") or [], 1):
            db.add(
                Character(
                    id=uuid.uuid4(),
                    writing_system_id=ws_id,
                    glyph=ch["glyph"],
                    romanization=ch["romanization"],
                    pronunciation=ch["pronunciation"],
                    example_glyph=ch["example_glyph"],
                    example_meaning=ch["example_meaning"],
                    image_emoji=ch.get("image", "📖"),
                    order_index=idx,
                )
            )

    await db.commit()


def seed_all_writing_systems(session) -> None:
    for lang, course_id_str in COURSE_IDS.items():
        seed_writing_systems(session, uuid.UUID(course_id_str), lang)
