"""UserCourse enrollment, switching, and per-course progress helpers."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fastapi import HTTPException

from models import Course, Lesson, Skill, SkillProgressStatus, Unit, User, UserCourse, UserSkillProgress, UserStats
from path_builder import build_course_path
from logic import calculate_regenerated_hearts, should_reset_daily_xp, compute_streak

from language_registry import get_flag_asset, get_language_name, normalize_language_code


def _language_name(course: Course) -> str:
    code = course.target_language or course.language_code
    for prefix in (" for English speakers", " for English Speakers"):
        if prefix in course.title:
            return course.title.split(prefix)[0].strip()
    return get_language_name(code)


def _course_flag(course: Course) -> str:
    code = normalize_language_code(course.target_language or course.language_code or course.flag_icon)
    return get_flag_asset(code)


async def get_user_course_row(
    db: AsyncSession, user_id: uuid.UUID, course_id: uuid.UUID
) -> UserCourse | None:
    result = await db.execute(
        select(UserCourse)
        .where(UserCourse.user_id == user_id)
        .where(UserCourse.course_id == course_id)
    )
    return result.scalar_one_or_none()


async def get_active_user_course(db: AsyncSession, user: User) -> UserCourse | None:
    if user.active_course_id:
        uc = await get_user_course_row(db, user.id, user.active_course_id)
        if uc:
            return uc
    result = await db.execute(
        select(UserCourse)
        .where(UserCourse.user_id == user.id)
        .where(UserCourse.is_active.is_(True))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_user_courses(db: AsyncSession, user_id: uuid.UUID) -> list[UserCourse]:
    result = await db.execute(
        select(UserCourse)
        .where(UserCourse.user_id == user_id)
        .options(selectinload(UserCourse.course))
        .order_by(UserCourse.created_at)
    )
    return list(result.scalars().all())


async def enroll_user_course(
    db: AsyncSession,
    user: User,
    course: Course,
    *,
    make_active: bool = False,
    copy_from_stats: UserStats | None = None,
) -> UserCourse:
    existing = await get_user_course_row(db, user.id, course.id)
    if existing:
        if make_active:
            await switch_active_course(db, user, course.id)
        return existing

    lang_code = course.target_language or course.language_code
    uc = UserCourse(
        user_id=user.id,
        course_id=course.id,
        language_code=lang_code,
        language_name=_language_name(course),
        flag=_course_flag(course),
        is_active=make_active,
    )
    if copy_from_stats and make_active:
        uc.xp = copy_from_stats.total_xp
        uc.streak = copy_from_stats.current_streak
        uc.longest_streak = copy_from_stats.longest_streak
        uc.hearts = copy_from_stats.hearts_current
        uc.hearts_max = copy_from_stats.hearts_max
        uc.gems = copy_from_stats.gems
        uc.daily_xp_goal = copy_from_stats.daily_xp_goal
        uc.daily_xp_today = copy_from_stats.daily_xp_today
        uc.last_activity_date = copy_from_stats.last_activity_date
        uc.last_heart_lost_at = copy_from_stats.last_heart_lost_at

    db.add(uc)
    await db.flush()
    await refresh_course_progress(db, user.id, course.id)
    if make_active:
        await switch_active_course(db, user, course.id)
    return uc


async def switch_active_course(db: AsyncSession, user: User, course_id: uuid.UUID) -> UserCourse:
    uc = await get_user_course_row(db, user.id, course_id)
    if not uc:
        raise ValueError("User is not enrolled in this course")

    await db.execute(
        update(UserCourse).where(UserCourse.user_id == user.id).values(is_active=False)
    )
    uc.is_active = True
    user.active_course_id = course_id
    user.learning_language = uc.language_code
    user.selected_language = uc.language_code
    db.add(user)
    db.add(uc)
    await db.flush()
    await refresh_course_progress(db, user.id, course_id)
    return uc


async def refresh_course_progress(db: AsyncSession, user_id: uuid.UUID, course_id: uuid.UUID) -> None:
    uc = await get_user_course_row(db, user_id, course_id)
    if not uc:
        return

    path = await build_course_path(db, course_id, user_id)
    total_skills = 0
    completed_skills = 0
    current_unit = "Unit 1"
    current_lesson = "Lesson 1"

    for unit in path.get("units", []):
        for skill in unit.get("skills", []):
            total_skills += 1
            if skill.get("status") == "completed":
                completed_skills += 1
            elif skill.get("status") in ("available", "in_progress"):
                current_unit = unit.get("title", current_unit)
                current_lesson = skill.get("title", current_lesson)

    uc.current_unit = current_unit
    uc.current_lesson = current_lesson
    uc.completion_percent = int((completed_skills / total_skills) * 100) if total_skills else 0
    db.add(uc)


def user_course_to_stats_response(uc: UserCourse) -> dict:
    """Map UserCourse to UserStatsResponse shape."""
    return {
        "user_id": uc.user_id,
        "total_xp": uc.xp,
        "current_streak": uc.streak,
        "longest_streak": uc.longest_streak,
        "last_activity_date": uc.last_activity_date,
        "hearts_current": uc.hearts,
        "hearts_max": uc.hearts_max,
        "last_heart_lost_at": uc.last_heart_lost_at,
        "gems": uc.gems,
        "daily_xp_goal": uc.daily_xp_goal,
        "daily_xp_today": uc.daily_xp_today,
    }


async def sync_stats_to_user_course(db: AsyncSession, user: User, stats: UserStats) -> UserCourse | None:
    uc = await get_active_user_course(db, user)
    if not uc:
        return None
    uc.xp = stats.total_xp
    uc.streak = stats.current_streak
    uc.longest_streak = stats.longest_streak
    uc.hearts = stats.hearts_current
    uc.hearts_max = stats.hearts_max
    uc.gems = stats.gems
    uc.daily_xp_goal = stats.daily_xp_goal
    uc.daily_xp_today = stats.daily_xp_today
    uc.last_activity_date = stats.last_activity_date
    uc.last_heart_lost_at = stats.last_heart_lost_at
    db.add(uc)
    if user.active_course_id:
        await refresh_course_progress(db, user.id, user.active_course_id)
    return uc


async def apply_user_course_to_stats(stats: UserStats, uc: UserCourse) -> UserStats:
    """Load active course stats into UserStats for API responses."""
    stats.total_xp = uc.xp
    stats.current_streak = uc.streak
    stats.longest_streak = uc.longest_streak
    stats.hearts_current = uc.hearts
    stats.hearts_max = uc.hearts_max
    stats.gems = uc.gems
    stats.daily_xp_goal = uc.daily_xp_goal
    stats.daily_xp_today = uc.daily_xp_today
    stats.last_activity_date = uc.last_activity_date
    stats.last_heart_lost_at = uc.last_heart_lost_at
    return stats


async def save_stats_to_active_course(db: AsyncSession, user: User, stats: UserStats) -> None:
    uc = await get_active_user_course(db, user)
    if not uc:
        return
    uc.xp = stats.total_xp
    uc.streak = stats.current_streak
    uc.longest_streak = stats.longest_streak
    uc.hearts = stats.hearts_current
    uc.hearts_max = stats.hearts_max
    uc.gems = stats.gems
    uc.daily_xp_goal = stats.daily_xp_goal
    uc.daily_xp_today = stats.daily_xp_today
    uc.last_activity_date = stats.last_activity_date
    uc.last_heart_lost_at = stats.last_heart_lost_at
    db.add(uc)
    if user.active_course_id:
        await refresh_course_progress(db, user.id, user.active_course_id)


async def migrate_user_to_user_courses(db: AsyncSession, user: User, stats: UserStats | None) -> None:
    """One-time migration: create UserCourse from legacy active_course_id + UserStats."""
    existing = await list_user_courses(db, user.id)
    if existing:
        return
    if not user.active_course_id:
        return
    course_result = await db.execute(select(Course).where(Course.id == user.active_course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        return
    await enroll_user_course(db, user, course, make_active=True, copy_from_stats=stats)


async def user_course_summary(db: AsyncSession, uc: UserCourse) -> dict:
    await refresh_course_progress(db, uc.user_id, uc.course_id)
    await db.refresh(uc)
    return {
        "id": uc.id,
        "course_id": uc.course_id,
        "language_code": uc.language_code,
        "language_name": uc.language_name,
        "flag": get_flag_asset(uc.language_code or uc.flag),
        "current_unit": uc.current_unit,
        "current_lesson": uc.current_lesson,
        "xp": uc.xp,
        "streak": uc.streak,
        "hearts": uc.hearts,
        "hearts_max": uc.hearts_max,
        "gems": uc.gems,
        "completion_percent": uc.completion_percent,
        "is_active": uc.is_active,
        "daily_xp_today": uc.daily_xp_today,
        "daily_xp_goal": uc.daily_xp_goal,
    }


async def sync_user_course(db: AsyncSession, uc: UserCourse) -> UserCourse:
    """Lazy daily XP reset and heart regeneration for per-course stats."""
    today = datetime.now(timezone.utc).date()
    if should_reset_daily_xp(uc.last_activity_date, today) and uc.daily_xp_today != 0:
        uc.daily_xp_today = 0
        db.add(uc)
        await db.commit()
        await db.refresh(uc)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    new_hearts, new_lost_at = calculate_regenerated_hearts(
        uc.hearts, uc.hearts_max, uc.last_heart_lost_at, now
    )
    if new_hearts != uc.hearts or new_lost_at != uc.last_heart_lost_at:
        uc.hearts = new_hearts
        uc.last_heart_lost_at = new_lost_at
        db.add(uc)
        await db.commit()
        await db.refresh(uc)
    return uc


async def update_course_on_lesson_complete(
    db: AsyncSession,
    user_id: uuid.UUID,
    course_id: uuid.UUID,
    *,
    xp_earned: int,
    gems_earned: int,
    today_date: date,
    last_activity_date: date | None,
    current_streak: int,
) -> UserCourse | None:
    uc = await get_user_course_row(db, user_id, course_id)
    if not uc:
        return None
    uc.xp += xp_earned
    uc.daily_xp_today += xp_earned
    uc.gems += gems_earned
    new_streak = compute_streak(last_activity_date, today_date, uc.streak)
    uc.streak = new_streak
    uc.longest_streak = max(uc.longest_streak, new_streak)
    uc.last_activity_date = today_date
    db.add(uc)
    await refresh_course_progress(db, user_id, course_id)
    return uc


async def update_course_hearts(db: AsyncSession, user: User, hearts: int, lost_at: datetime | None) -> None:
    uc = await get_active_user_course(db, user)
    if uc:
        uc.hearts = hearts
        uc.last_heart_lost_at = lost_at
        db.add(uc)


async def get_effective_stats(db: AsyncSession, user: User, stats: UserStats) -> dict:
    """Return stats from active UserCourse when enrolled, else synced global UserStats."""
    uc = await get_active_user_course(db, user)
    if uc:
        uc = await sync_user_course(db, uc)
        return user_course_to_stats_response(uc)

    today = datetime.now(timezone.utc).date()
    if should_reset_daily_xp(stats.last_activity_date, today) and stats.daily_xp_today != 0:
        stats.daily_xp_today = 0
        db.add(stats)
        await db.commit()
        await db.refresh(stats)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    new_hearts, new_lost_at = calculate_regenerated_hearts(
        stats.hearts_current, stats.hearts_max, stats.last_heart_lost_at, now
    )
    if new_hearts != stats.hearts_current or new_lost_at != stats.last_heart_lost_at:
        stats.hearts_current = new_hearts
        stats.last_heart_lost_at = new_lost_at
        db.add(stats)
        await db.commit()
        await db.refresh(stats)

    return {
        "user_id": stats.user_id,
        "total_xp": stats.total_xp,
        "current_streak": stats.current_streak,
        "longest_streak": stats.longest_streak,
        "last_activity_date": stats.last_activity_date,
        "hearts_current": stats.hearts_current,
        "hearts_max": stats.hearts_max,
        "last_heart_lost_at": stats.last_heart_lost_at,
        "gems": stats.gems,
        "daily_xp_goal": stats.daily_xp_goal,
        "daily_xp_today": stats.daily_xp_today,
    }


async def resolve_lesson_for_course(
    db: AsyncSession,
    user: User,
    lesson_id: uuid.UUID,
    course_id: uuid.UUID,
) -> tuple[Lesson, str, uuid.UUID]:
    """Load a lesson and ensure it belongs to the requested active course."""
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.skill).selectinload(Skill.unit).selectinload(Unit.course),
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    lesson_course_id = lesson.skill.unit.course_id
    if lesson_course_id != course_id:
        raise HTTPException(
            status_code=403,
            detail="This lesson does not belong to the selected course.",
        )

    if user.active_course_id and user.active_course_id != course_id:
        raise HTTPException(
            status_code=403,
            detail="Switch to the correct course before accessing this lesson.",
        )

    uc = await get_user_course_row(db, user.id, course_id)
    if not uc:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course.")

    course = lesson.skill.unit.course
    language_code = normalize_language_code(course.target_language or course.language_code)
    if not language_code:
        raise HTTPException(status_code=500, detail="Course language is not configured.")
    return lesson, language_code, lesson_course_id
