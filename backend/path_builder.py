"""Build course learning path with skill lock/unlock states."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Lesson, Skill, SkillProgressStatus, Unit, UserSkillProgress
from progress_utils import pick_best_progress
from writing_utils import is_primary_writing_complete


async def build_course_path(
    db: AsyncSession,
    course_id: uuid.UUID,
    user_id: uuid.UUID,
) -> dict:
    units_result = await db.execute(
        select(Unit).where(Unit.course_id == course_id).order_by(Unit.order_index)
    )
    units = units_result.scalars().all()

    progress_result = await db.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user_id)
    )
    all_progress = progress_result.scalars().all()
    progress_map: dict = {}
    for prog in all_progress:
        existing = progress_map.get(prog.skill_id)
        if existing is None:
            progress_map[prog.skill_id] = prog
        else:
            progress_map[prog.skill_id] = pick_best_progress(existing, prog)

    skills_by_unit: dict[uuid.UUID, list] = {}
    ordered_skills = []

    for unit in units:
        skills_result = await db.execute(
            select(Skill).where(Skill.unit_id == unit.id).order_by(Skill.order_index)
        )
        unit_skills = skills_result.scalars().all()
        skills_by_unit[unit.id] = unit_skills
        ordered_skills.extend(unit_skills)

    lessons_result = await db.execute(
        select(Lesson.id, Lesson.skill_id, Lesson.level, Lesson.order_index).where(
            Lesson.skill_id.in_([s.id for s in ordered_skills])
        )
    )
    all_lessons = lessons_result.all()
    lesson_map = {(l.skill_id, l.level, l.order_index): l.id for l in all_lessons}

    first_lesson_map: dict[uuid.UUID, uuid.UUID] = {}
    for lesson in sorted(all_lessons, key=lambda x: (x.level, x.order_index)):
        if lesson.skill_id not in first_lesson_map:
            first_lesson_map[lesson.skill_id] = lesson.id

    is_previous_completed = True
    skills_progress_response: dict[uuid.UUID, dict] = {}
    writing_complete = await is_primary_writing_complete(db, user_id, course_id)
    first_skill_id = ordered_skills[0].id if ordered_skills else None

    for skill in ordered_skills:
        prog = progress_map.get(skill.id)
        if prog:
            status = prog.status.value
            current_level = prog.current_level
            lessons_completed = prog.lessons_completed
            skill_done = prog.status == SkillProgressStatus.completed or current_level >= skill.total_levels
            is_previous_completed = skill_done
        else:
            status = "available" if is_previous_completed else "locked"
            current_level = 0
            lessons_completed = 0
            is_previous_completed = False

        if not writing_complete and skill.id == first_skill_id:
            status = "locked"

        next_lesson_id = lesson_map.get((skill.id, current_level + 1, lessons_completed + 1))
        if not next_lesson_id:
            next_lesson_id = first_lesson_map.get(skill.id)

        skills_progress_response[skill.id] = {
            "id": skill.id,
            "unit_id": skill.unit_id,
            "title": skill.title,
            "icon": skill.icon,
            "order_index": skill.order_index,
            "total_levels": skill.total_levels,
            "lessons_per_level": skill.lessons_per_level,
            "current_level": current_level,
            "status": status,
            "lessons_completed": lessons_completed,
            "next_lesson_id": next_lesson_id,
        }

    path_units = []
    for unit in units:
        unit_skills_response = [
            skills_progress_response[skill.id] for skill in skills_by_unit.get(unit.id, [])
        ]
        path_units.append(
            {
                "id": unit.id,
                "course_id": unit.course_id,
                "title": unit.title,
                "description": unit.description,
                "order_index": unit.order_index,
                "color_theme": unit.color_theme,
                "skills": unit_skills_response,
            }
        )

    return {"units": path_units}
