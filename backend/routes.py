import uuid
import logging
import os
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth_utils import get_user_or_default
from database import get_db
from models import (
    Course, Unit, Skill, Lesson, Exercise, ExerciseOption,
    User, UserStats, UserSkillProgress, UserLessonAttempt,
    LeaderboardEntry, Achievement, UserAchievement,
    SkillProgressStatus, LessonAttemptResult, ExerciseType,
    Quest, UserQuestProgress
)
from schemas import (
    CourseResponse, PathResponse, SkillResponse, LessonResponse,
    UserStatsResponse, UserStatsRefillResponse, RegenStatusResponse,
    LeaderboardEntryResponse, AchievementResponse, UserProfileResponse,
    StartLessonResponse, AnswerRequest, AnswerResponse, CompleteResponse,
    QuestResponse, UserQuestProgressResponse, UserCourseResponse, EnrollCourseRequest
)
from quest_progress_utils import (
    ensure_today_quest_progress,
    get_or_create_quest_progress,
    fetch_user_quest_progress_for_day,
)
from logic import compute_streak, calculate_regenerated_hearts, should_reset_daily_xp, REGEN_INTERVAL_SECONDS
from answer_utils import normalize_answer, answer_in_set
from path_builder import build_course_path
from progress_utils import get_or_create_user_skill_progress, get_user_skill_progress
from course_utils import (
    enroll_user_course,
    switch_active_course,
    list_user_courses,
    get_active_user_course,
    get_user_course_row,
    get_effective_stats,
    migrate_user_to_user_courses,
    user_course_summary,
    sync_user_course,
    refresh_course_progress,
    resolve_lesson_for_course,
)


def grade_exercise(exercise: Exercise, submitted: dict) -> bool:
    """Type-aware answer grading with normalized text comparison."""
    if exercise.type == ExerciseType.intro:
        return True

    meta = exercise.exercise_metadata or {}

    if exercise.type in (
        ExerciseType.multiple_choice,
        ExerciseType.fill_blank,
        ExerciseType.image_selection,
        ExerciseType.listening,
    ):
        return exercise.correct_answer.get("selected") == submitted.get("selected")

    if exercise.type == ExerciseType.type_answer:
        text = normalize_answer(submitted.get("text") or "")
        alternatives = list(meta.get("alternatives") or [])
        correct = exercise.correct_answer.get("text") or ""
        alternatives.append(correct)
        return answer_in_set(text, alternatives)

    if exercise.type == ExerciseType.translate:
        translation = normalize_answer(submitted.get("translation") or "")
        alternatives = list(meta.get("alternatives") or [])
        correct = exercise.correct_answer.get("translation") or ""
        alternatives.append(correct)
        return answer_in_set(translation, alternatives)

    if exercise.type == ExerciseType.word_bank:
        submitted_words = submitted.get("words") or []
        correct_words = exercise.correct_answer.get("words") or []
        if len(submitted_words) != len(correct_words):
            return False
        return all(
            normalize_answer(s) == normalize_answer(c)
            for s, c in zip(submitted_words, correct_words)
        )

    if exercise.type == ExerciseType.match_pairs:
        submitted_pairs = submitted.get("pairs") or {}
        correct_pairs = exercise.correct_answer.get("pairs") or {}
        if set(submitted_pairs.keys()) != set(correct_pairs.keys()):
            return False
        return all(submitted_pairs.get(k) == correct_pairs.get(k) for k in correct_pairs)

    return exercise.correct_answer == submitted

router = APIRouter(prefix="/api/v1")
log = logging.getLogger("duolingo.api")


async def get_learning_context(db: AsyncSession, user: User) -> dict:
    """Resolve active course and current unit/skill for profile display."""
    if not user.active_course_id:
        return {
            "active_course_title": None,
            "current_unit_title": None,
            "current_skill_title": None,
        }

    course_result = await db.execute(select(Course).where(Course.id == user.active_course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        return {
            "active_course_title": None,
            "current_unit_title": None,
            "current_skill_title": None,
        }

    units_result = await db.execute(
        select(Unit)
        .where(Unit.course_id == course.id)
        .order_by(Unit.order_index)
    )
    units = units_result.scalars().all()

    progress_result = await db.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user.id)
    )
    progress_map = {p.skill_id: p for p in progress_result.scalars().all()}

    current_unit_title = None
    current_skill_title = None

    for unit in units:
        skills_result = await db.execute(
            select(Skill).where(Skill.unit_id == unit.id).order_by(Skill.order_index)
        )
        skills = skills_result.scalars().all()
        for skill in skills:
            prog = progress_map.get(skill.id)
            status = prog.status if prog else SkillProgressStatus.locked
            if status in (SkillProgressStatus.available, SkillProgressStatus.in_progress):
                current_unit_title = unit.title
                current_skill_title = skill.title
                break
        if current_skill_title:
            break

    if not current_skill_title and units:
        first_unit = units[0]
        skills_result = await db.execute(
            select(Skill).where(Skill.unit_id == first_unit.id).order_by(Skill.order_index)
        )
        first_skill = skills_result.scalars().first()
        current_unit_title = first_unit.title
        current_skill_title = first_skill.title if first_skill else None

    return {
        "active_course_title": course.title,
        "current_unit_title": current_unit_title,
        "current_skill_title": current_skill_title,
    }


# Helper: Lazy Heart Regeneration Update
async def sync_heart_regeneration(db: AsyncSession, stats: UserStats) -> UserStats:
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # Naive UTC datetime for DB matching
    new_hearts, new_lost_at = calculate_regenerated_hearts(
        stats.hearts_current,
        stats.hearts_max,
        stats.last_heart_lost_at,
        now
    )
    if new_hearts != stats.hearts_current or new_lost_at != stats.last_heart_lost_at:
        stats.hearts_current = new_hearts
        stats.last_heart_lost_at = new_lost_at
        db.add(stats)
        await db.commit()
        await db.refresh(stats)
    return stats


async def sync_daily_xp_reset(db: AsyncSession, stats: UserStats) -> UserStats:
    """Reset daily_xp_today when a new calendar day starts."""
    today = datetime.now(timezone.utc).date()
    if should_reset_daily_xp(stats.last_activity_date, today) and stats.daily_xp_today != 0:
        stats.daily_xp_today = 0
        db.add(stats)
        await db.commit()
        await db.refresh(stats)
    return stats


async def sync_user_stats(db: AsyncSession, stats: UserStats) -> UserStats:
    """Apply lazy daily XP reset and heart regeneration before returning stats."""
    stats = await sync_daily_xp_reset(db, stats)
    stats = await sync_heart_regeneration(db, stats)
    return stats

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).order_by(Course.title))
    courses = result.scalars().all()
    return [
        CourseResponse(
            id=c.id,
            title=c.title,
            language_code=c.language_code,
            source_language=c.source_language or "en",
            target_language=c.target_language or c.language_code,
            flag_icon=get_flag_asset(c.target_language or c.language_code or c.flag_icon),
            created_at=c.created_at,
        )
        for c in courses
    ]


@router.get("/courses/{course_id}/path", response_model=PathResponse)
async def get_course_path(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, "me")
    return await build_course_path(db, course_id, user.id)


@router.get("/skills/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    # Get user progress for this skill (default learner)
    user_result = await db.execute(select(User).where(User.is_default_learner == True))
    user = user_result.scalar_one_or_none()
    
    current_level = 0
    status = "locked"
    lessons_completed = 0
    
    if user:
        prog = await get_user_skill_progress(db, user.id, skill_id)
        if prog:
            current_level = prog.current_level
            status = prog.status.value
            lessons_completed = prog.lessons_completed

    # Query active lesson ID
    next_lesson_result = await db.execute(
        select(Lesson.id)
        .where(Lesson.skill_id == skill_id)
        .where(Lesson.level == current_level + 1)
        .where(Lesson.order_index == lessons_completed + 1)
    )
    next_lesson_id = next_lesson_result.scalar_one_or_none()
    if not next_lesson_id:
        fallback_result = await db.execute(
            select(Lesson.id)
            .where(Lesson.skill_id == skill_id)
            .order_by(Lesson.level, Lesson.order_index)
            .limit(1)
        )
        next_lesson_id = fallback_result.scalar_one_or_none()

    return {
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
        "next_lesson_id": next_lesson_id
    }


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, "me")
    if not user.active_course_id:
        raise HTTPException(status_code=400, detail="No active course selected.")
    return await _get_lesson_for_course(db, user, user.active_course_id, lesson_id)


@router.get("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def get_course_lesson(
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_default(db, "me")
    return await _get_lesson_for_course(db, user, course_id, lesson_id)


async def _get_lesson_for_course(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
) -> dict:
    try:
        lesson, language_code, _ = await resolve_lesson_for_course(db, user, lesson_id, course_id)

        result = await db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .options(
                selectinload(Lesson.exercises).selectinload(Exercise.options)
            )
        )
        lesson = result.scalar_one_or_none()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        from exercise_api_utils import sanitize_lesson_exercises

        try:
            valid_exercises, rejected = sanitize_lesson_exercises(
                lesson.exercises,
                lesson_id=lesson_id,
                expected_language=language_code,
            )
        except ValueError as exc:
            log.error("GET /courses/%s/lessons/%s — all exercises invalid: %s", course_id, lesson_id, exc)
            raise HTTPException(
                status_code=500,
                detail=str(exc) if os.getenv("ENV", "development") != "production" else "Lesson data is invalid.",
            ) from exc

        if not valid_exercises:
            raise HTTPException(status_code=500, detail="Lesson contains no valid exercises.")

        lesson.exercises = valid_exercises
        log.info(
            "GET /courses/%s/lessons/%s — ok (%d exercises, %d filtered)",
            course_id,
            lesson_id,
            len(valid_exercises),
            len(rejected),
        )
        return {
            "id": lesson.id,
            "skill_id": lesson.skill_id,
            "level": lesson.level,
            "order_index": lesson.order_index,
            "xp_reward": lesson.xp_reward,
            "course_id": course_id,
            "language_code": language_code,
            "exercises": valid_exercises,
        }
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("GET /courses/%s/lessons/%s — failed: %s", course_id, lesson_id, exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to load lesson data. Check backend logs.",
        ) from exc


# ==========================================
# 2. Lesson Session Endpoints
# ==========================================

@router.post("/lessons/{lesson_id}/start", response_model=StartLessonResponse)
async def start_lesson(
    lesson_id: uuid.UUID,
    is_practice: bool = False,
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_or_default(db, "me")
    if not user.active_course_id:
        raise HTTPException(status_code=400, detail="No active course selected.")
    try:
        return await _start_lesson_impl(lesson_id, user.active_course_id, is_practice, db)
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("POST /lessons/%s/start failed: %s", lesson_id, exc)
        raise HTTPException(
            status_code=500,
            detail="Could not start the lesson. Please try again.",
        ) from exc


@router.post("/courses/{course_id}/lessons/{lesson_id}/start", response_model=StartLessonResponse)
async def start_course_lesson(
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
    is_practice: bool = False,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await _start_lesson_impl(lesson_id, course_id, is_practice, db)
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("POST /courses/%s/lessons/%s/start failed: %s", course_id, lesson_id, exc)
        raise HTTPException(
            status_code=500,
            detail="Could not start the lesson. Please try again.",
        ) from exc


async def _start_lesson_impl(
    lesson_id: uuid.UUID,
    course_id: uuid.UUID,
    is_practice: bool,
    db: AsyncSession,
) -> dict:
    user = await get_user_or_default(db, "me")
    lesson, _, _ = await resolve_lesson_for_course(db, user, lesson_id, course_id)

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    await migrate_user_to_user_courses(db, user, stats)
    effective = await get_effective_stats(db, user, stats)
    hearts_current = effective["hearts_current"]

    if not is_practice and hearts_current <= 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot start lesson. You have 0 hearts! Refill or practice first."
        )

    if not is_practice:
        prog = await get_or_create_user_skill_progress(
            db, user.id, lesson.skill_id, default_status=SkillProgressStatus.in_progress
        )
        if prog.status != SkillProgressStatus.completed:
            prog.status = SkillProgressStatus.in_progress

    attempt = UserLessonAttempt(
        user_id=user.id,
        lesson_id=lesson_id,
        result=LessonAttemptResult.in_progress,
        started_at=datetime.now(timezone.utc).replace(tzinfo=None),
        is_practice=is_practice
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "lesson_id": attempt.lesson_id,
        "user_id": attempt.user_id,
        "started_at": attempt.started_at
    }


@router.post("/lessons/attempts/{attempt_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    attempt_id: uuid.UUID,
    payload: AnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Load the attempt
    attempt_result = await db.execute(
        select(UserLessonAttempt).where(UserLessonAttempt.id == attempt_id)
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt or attempt.result != LessonAttemptResult.in_progress:
        raise HTTPException(status_code=404, detail="Active lesson attempt not found.")

    # 2. Load the exercise details
    exercise_result = await db.execute(
        select(Exercise).where(Exercise.id == payload.exercise_id)
    )
    exercise = exercise_result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found.")

    # 3. Get user stats (CORS / health checks)
    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == attempt.user_id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    # Compare answers (type-aware grading)
    is_correct = grade_exercise(exercise, payload.submitted_answer)
    hearts_lost = 0

    user_result = await db.execute(select(User).where(User.id == attempt.user_id))
    user = user_result.scalar_one()
    uc = await get_active_user_course(db, user)

    if not is_correct and not attempt.is_practice:
        if uc and uc.hearts > 0:
            uc.hearts -= 1
            hearts_lost = 1
            attempt.hearts_lost += 1
            if uc.hearts < uc.hearts_max and uc.last_heart_lost_at is None:
                uc.last_heart_lost_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.add(uc)
        elif not uc and stats.hearts_current > 0:
            stats.hearts_current -= 1
            hearts_lost = 1
            attempt.hearts_lost += 1
            if stats.hearts_current < stats.hearts_max and stats.last_heart_lost_at is None:
                stats.last_heart_lost_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.add(stats)
        db.add(attempt)
        await db.commit()

    hearts_remaining = uc.hearts if uc else stats.hearts_current

    return {
        "correct": is_correct,
        "correct_answer": exercise.correct_answer,
        "hearts_remaining": hearts_remaining,
        "hearts_lost": hearts_lost,
    }


@router.post("/lessons/attempts/{attempt_id}/complete", response_model=CompleteResponse)
async def complete_lesson(attempt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # 1. Fetch lesson attempt
    attempt_result = await db.execute(
        select(UserLessonAttempt)
        .where(UserLessonAttempt.id == attempt_id)
        .options(selectinload(UserLessonAttempt.user))
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt or attempt.result != LessonAttemptResult.in_progress:
        raise HTTPException(status_code=404, detail="Active lesson attempt not found.")

    # 2. Fetch lesson configurations
    lesson_result = await db.execute(
        select(Lesson)
        .where(Lesson.id == attempt.lesson_id)
        .options(selectinload(Lesson.skill).selectinload(Skill.unit))
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson metadata missing.")

    user = attempt.user
    lesson_course_id = lesson.skill.unit.course_id
    if user.active_course_id and user.active_course_id != lesson_course_id:
        raise HTTPException(
            status_code=403,
            detail="This lesson belongs to a different course. Switch back or start a lesson from your active course.",
        )

    # 3. Retrieve user stats
    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == attempt.user_id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if attempt.is_practice:
        attempt.completed_at = now
        attempt.result = LessonAttemptResult.passed
        attempt.xp_earned = 0

        await migrate_user_to_user_courses(db, user, stats)
        uc = await get_active_user_course(db, user)
        if uc:
            uc.hearts = uc.hearts_max
            uc.last_heart_lost_at = None
            db.add(uc)
        else:
            stats.hearts_current = stats.hearts_max
            stats.last_heart_lost_at = None
            db.add(stats)

        db.add(attempt)
        await db.commit()

        stats_payload = await get_effective_stats(db, user, stats)
        active_course_id = user.active_course_id or lesson_course_id
        path_data = await build_course_path(db, active_course_id, user.id)

        return {
            "attempt_id": attempt.id,
            "xp_earned": 0,
            "hearts_lost": attempt.hearts_lost,
            "result": "passed",
            "current_streak": stats_payload["current_streak"],
            "daily_xp_today": stats_payload["daily_xp_today"],
            "daily_xp_goal": stats_payload["daily_xp_goal"],
            "gems_earned": 0,
            "path": path_data,
            "stats": stats_payload,
        }

    xp_earned = lesson.xp_reward
    gems_earned = 10
    attempt.xp_earned = xp_earned
    attempt.result = LessonAttemptResult.passed
    attempt.completed_at = now

    course_id = lesson.skill.unit.course_id
    today_date = now.date()
    uc = await get_user_course_row(db, attempt.user_id, course_id)

    if uc:
        uc.xp += xp_earned
        uc.daily_xp_today += xp_earned
        uc.gems += gems_earned
        new_streak = compute_streak(uc.last_activity_date, today_date, uc.streak)
        uc.streak = new_streak
        uc.longest_streak = max(uc.longest_streak, new_streak)
        uc.last_activity_date = today_date
        db.add(uc)
        streak_for_achievements = uc.streak
    else:
        stats.total_xp += xp_earned
        stats.daily_xp_today += xp_earned
        stats.gems += gems_earned
        new_streak = compute_streak(stats.last_activity_date, today_date, stats.current_streak)
        stats.current_streak = new_streak
        stats.longest_streak = max(stats.longest_streak, new_streak)
        stats.last_activity_date = today_date
        streak_for_achievements = stats.current_streak

    # Update UserSkillProgress
    skill = lesson.skill
    prog = await get_or_create_user_skill_progress(
        db, attempt.user_id, skill.id, default_status=SkillProgressStatus.in_progress
    )

    prog.lessons_completed += 1
    if prog.lessons_completed >= skill.lessons_per_level:
        prog.current_level += 1
        prog.lessons_completed = 0
        if prog.current_level >= skill.total_levels:
            prog.status = SkillProgressStatus.completed
        else:
            prog.status = SkillProgressStatus.in_progress

    # Check achievements
    # 1. "first_lesson" achievement check
    ach_first_result = await db.execute(select(Achievement).where(Achievement.key == "first_lesson"))
    ach_first = ach_first_result.scalar_one_or_none()
    if ach_first:
        # Check if already unlocked
        unl_result = await db.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == attempt.user_id)
            .where(UserAchievement.achievement_id == ach_first.id)
        )
        if not unl_result.scalar_one_or_none():
            user_ach = UserAchievement(user_id=attempt.user_id, achievement_id=ach_first.id, unlocked_at=now)
            db.add(user_ach)

    # 2. "7_day_streak" achievement check
    if streak_for_achievements >= 7:
        ach_streak_result = await db.execute(select(Achievement).where(Achievement.key == "7_day_streak"))
        ach_streak = ach_streak_result.scalar_one_or_none()
        if ach_streak:
            unl_result = await db.execute(
                select(UserAchievement)
                .where(UserAchievement.user_id == attempt.user_id)
                .where(UserAchievement.achievement_id == ach_streak.id)
            )
            if not unl_result.scalar_one_or_none():
                user_ach = UserAchievement(user_id=attempt.user_id, achievement_id=ach_streak.id, unlocked_at=now)
                db.add(user_ach)

    # Update Quests Progress for normal lessons
    # Today's date (UTC naive to match SQL date format)
    today_date = now.date()
    
    # Fetch all active quests
    quests_res = await db.execute(select(Quest))
    all_quests = quests_res.scalars().all()
    
    for quest in all_quests:
        q_progress = await get_or_create_quest_progress(
            db,
            attempt.user_id,
            quest.id,
            today_date,
            context="complete_lesson",
        )

        # Increment progress
        if quest.quest_type == "xp":
            q_progress.progress += xp_earned
        elif quest.quest_type == "lesson":
            q_progress.progress += 1
            
        if q_progress.progress >= quest.xp_target:
            q_progress.completed = True

    # Keep leaderboard weekly XP in sync with earned XP
    lb_result = await db.execute(
        select(LeaderboardEntry).where(LeaderboardEntry.user_id == attempt.user_id)
    )
    lb_entry = lb_result.scalars().first()
    if lb_entry:
        lb_entry.weekly_xp += xp_earned
        db.add(lb_entry)

    if uc:
        await refresh_course_progress(db, attempt.user_id, course_id)

    db.add(prog)
    db.add(attempt)
    if not uc:
        db.add(stats)
    await db.commit()

    active_course_id = user.active_course_id or course_id
    path_data = await build_course_path(db, active_course_id, attempt.user_id)
    stats_payload = await get_effective_stats(db, user, stats)

    return {
        "attempt_id": attempt.id,
        "xp_earned": xp_earned,
        "hearts_lost": attempt.hearts_lost,
        "result": "passed",
        "current_streak": stats_payload["current_streak"],
        "daily_xp_today": stats_payload["daily_xp_today"],
        "daily_xp_goal": stats_payload["daily_xp_goal"],
        "gems_earned": gems_earned,
        "path": path_data,
        "stats": stats_payload,
    }


@router.post("/lessons/attempts/{attempt_id}/abandon", response_model=CompleteResponse)
async def abandon_lesson(attempt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    attempt_result = await db.execute(
        select(UserLessonAttempt).where(UserLessonAttempt.id == attempt_id)
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt or attempt.result != LessonAttemptResult.in_progress:
        raise HTTPException(status_code=404, detail="Active lesson attempt not found.")

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == attempt.user_id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    attempt.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    attempt.result = LessonAttemptResult.failed
    attempt.xp_earned = 0
    db.add(attempt)
    await db.commit()

    return {
        "attempt_id": attempt.id,
        "xp_earned": 0,
        "hearts_lost": attempt.hearts_lost,
        "result": "failed",
        "current_streak": stats.current_streak,
        "daily_xp_today": stats.daily_xp_today,
        "daily_xp_goal": stats.daily_xp_goal,
        "gems_earned": 0,
    }


# ==========================================
# 3. Gamification Endpoints
# ==========================================

@router.get("/users/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats record not found.")

    await migrate_user_to_user_courses(db, user, stats)
    return await get_effective_stats(db, user, stats)


@router.post("/users/{user_id}/hearts/refill", response_model=UserStatsRefillResponse)
async def refill_hearts(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)
    
    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    if stats.hearts_current >= stats.hearts_max:
        return {
            "success": False,
            "message": "Hearts are already at maximum count.",
            "gems_remaining": stats.gems,
            "hearts_current": stats.hearts_current
        }

    # Costs 10 gems
    if stats.gems < 10:
         return {
            "success": False,
            "message": "Insufficient gems. Needs 10 gems.",
            "gems_remaining": stats.gems,
            "hearts_current": stats.hearts_current
        }

    stats.gems -= 10
    stats.hearts_current = stats.hearts_max
    stats.last_heart_lost_at = None

    db.add(stats)
    await db.commit()
    await db.refresh(stats)

    return {
        "success": True,
        "message": "Hearts refilled successfully.",
        "gems_remaining": stats.gems,
        "hearts_current": stats.hearts_current
    }


@router.get("/users/{user_id}/hearts/regen-status", response_model=RegenStatusResponse)
async def get_hearts_regen_status(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    # Apply lazy sync
    stats = await sync_user_stats(db, stats)

    if stats.hearts_current >= stats.hearts_max:
        return {
            "hearts_current": stats.hearts_current,
            "hearts_max": stats.hearts_max,
            "time_left_seconds": 0
        }

    if stats.last_heart_lost_at is None:
        return {
            "hearts_current": stats.hearts_current,
            "hearts_max": stats.hearts_max,
            "time_left_seconds": 0
        }

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    elapsed = (now - stats.last_heart_lost_at).total_seconds()
    if elapsed < 0:
        elapsed = 0
        
    seconds_into_current_regen = elapsed % REGEN_INTERVAL_SECONDS
    time_left_seconds = int(REGEN_INTERVAL_SECONDS - seconds_into_current_regen)

    return {
        "hearts_current": stats.hearts_current,
        "hearts_max": stats.hearts_max,
        "time_left_seconds": time_left_seconds
    }


@router.get("/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    # Ranks elements by weekly XP descending
    result = await db.execute(
        select(LeaderboardEntry).order_by(LeaderboardEntry.weekly_xp.desc())
    )
    entries = result.scalars().all()
    
    # Recalculate ranks in-memory just in case
    response = []
    for rank, entry in enumerate(entries, 1):
        response.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "display_name": entry.display_name,
            "avatar_url": entry.avatar_url,
            "weekly_xp": entry.weekly_xp,
            "league": entry.league,
            "rank": rank
        })
    return response


@router.get("/users/{user_id}/achievements", response_model=List[AchievementResponse])
async def get_user_achievements(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)

    # Load all achievements
    ach_result = await db.execute(select(Achievement))
    achievements = ach_result.scalars().all()

    # Load unlocked user achievements
    unl_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user.id)
    )
    user_unlocked = {u.achievement_id: u.unlocked_at for u in unl_result.scalars().all()}

    response = []
    for ach in achievements:
        unlocked = ach.id in user_unlocked
        unlocked_at = user_unlocked.get(ach.id) if unlocked else None
        response.append({
            "id": ach.id,
            "key": ach.key,
            "title": ach.title,
            "description": ach.description,
            "icon": ach.icon,
            "unlocked": unlocked,
            "unlocked_at": unlocked_at
        })
    return response


# ==========================================
# 4. Profile Endpoints
# ==========================================

@router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found.")

    await migrate_user_to_user_courses(db, user, stats)
    await db.commit()
    effective = await get_effective_stats(db, user, stats)

    # Unlocked achievements
    ach_result = await db.execute(select(Achievement))
    achievements = ach_result.scalars().all()
    
    unl_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user.id)
    )
    user_unlocked = {u.achievement_id: u.unlocked_at for u in unl_result.scalars().all()}

    achievements_response = []
    for ach in achievements:
        unlocked = ach.id in user_unlocked
        unlocked_at = user_unlocked.get(ach.id) if unlocked else None
        achievements_response.append({
            "id": ach.id,
            "key": ach.key,
            "title": ach.title,
            "description": ach.description,
            "icon": ach.icon,
            "unlocked": unlocked,
            "unlocked_at": unlocked_at
        })

    # Progress Summary — scoped to active course when enrolled
    prog_result = await db.execute(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == user.id)
        .where(UserSkillProgress.status == SkillProgressStatus.completed)
    )
    if user.active_course_id:
        units_res = await db.execute(select(Unit).where(Unit.course_id == user.active_course_id))
        unit_ids = [u.id for u in units_res.scalars().all()]
        skills_res = await db.execute(select(Skill).where(Skill.unit_id.in_(unit_ids))) if unit_ids else None
        course_skills = skills_res.scalars().all() if skills_res else []
        course_skill_ids = {s.id for s in course_skills}
        completed_skills_count = sum(
            1
            for p in prog_result.scalars().all()
            if p.skill_id in course_skill_ids and p.status == SkillProgressStatus.completed
        )
        total_skills = len(course_skill_ids)
    else:
        completed_skills_count = len(prog_result.scalars().all())
        skills_count_result = await db.execute(select(Skill))
        total_skills = len(skills_count_result.scalars().all())

    course_summary = f"Completed {completed_skills_count} of {total_skills} skills"

    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "stats": effective,
        "achievements": achievements_response,
        "join_date": user.created_at,
        "course_progress_summary": course_summary,
        "active_course_id": user.active_course_id,
        "onboarding_completed": user.onboarding_completed,
        "selected_language": user.selected_language,
        "native_language": user.native_language,
        "learning_language": user.learning_language,
        **await get_learning_context(db, user),
    }


@router.get("/users/{user_id}/quests", response_model=List[UserQuestProgressResponse])
async def get_user_quests(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        user = await get_user_or_default(db, user_id)

        quests_res = await db.execute(select(Quest))
        quests_rows = quests_res.scalars().all()
        all_quests = list(quests_rows)

        today_date = datetime.now(timezone.utc).date()

        await ensure_today_quest_progress(
            db,
            user.id,
            all_quests,
            today_date,
            context="get_user_quests",
        )
        await db.commit()

        cleaned = await fetch_user_quest_progress_for_day(
            db, user.id, today_date
        )
        await db.commit()

        quest_lookup = {q.id: q for q in all_quests}
        for p in cleaned:
            if p.quest_id in quest_lookup and p.quest is None:
                p.quest = quest_lookup[p.quest_id]

        return cleaned
    except Exception as exc:
        log.exception(
            "get_user_quests failed for user_id=%s: %s",
            user_id if "user_id" in locals() else "unknown",
            exc,
        )
        try:
            await db.rollback()
        except Exception:
            pass
        return []


from pydantic import BaseModel

class SelectCourseRequest(BaseModel):
    course_id: uuid.UUID
    complete_onboarding: bool = False
    selected_language: Optional[str] = None

@router.post("/users/{user_id}/select-course")
async def select_course(user_id: str, payload: SelectCourseRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)

    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()

    await enroll_user_course(
        db, user, course,
        make_active=True,
        copy_from_stats=stats if not await list_user_courses(db, user.id) else None,
    )
    await switch_active_course(db, user, payload.course_id)

    user.native_language = course.source_language
    user.learning_language = course.target_language
    if payload.selected_language:
        user.selected_language = payload.selected_language
    else:
        user.selected_language = course.target_language
    if payload.complete_onboarding:
        user.onboarding_completed = True
    db.add(user)
    await db.commit()

    enrolled = await list_user_courses(db, user.id)
    return {
        "success": True,
        "active_course_id": user.active_course_id,
        "onboarding_completed": user.onboarding_completed,
        "selected_language": user.selected_language,
        "native_language": user.native_language,
        "learning_language": user.learning_language,
        "enrolled_count": len(enrolled),
    }


@router.get("/users/{user_id}/courses", response_model=List[UserCourseResponse])
async def get_user_courses(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)
    stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user.id))
    stats = stats_result.scalar_one_or_none()
    await migrate_user_to_user_courses(db, user, stats)
    await db.commit()
    courses = await list_user_courses(db, user.id)
    summaries = []
    for uc in courses:
        summaries.append(await user_course_summary(db, uc))
    return summaries


@router.post("/users/{user_id}/enroll-course")
async def enroll_course(user_id: str, payload: EnrollCourseRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)
    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    uc = await enroll_user_course(db, user, course, make_active=True)
    if payload.complete_onboarding:
        user.onboarding_completed = True
    user.selected_language = payload.selected_language or course.target_language
    db.add(user)
    await db.commit()

    first_lesson_id = None
    if payload.redirect_to_first_lesson:
        path = await build_course_path(db, course.id, user.id)
        for unit in path.get("units", []):
            for skill in unit.get("skills", []):
                if skill.get("next_lesson_id"):
                    first_lesson_id = str(skill["next_lesson_id"])
                    break
            if first_lesson_id:
                break

    summary = await user_course_summary(db, uc)
    stats_row = (await db.execute(select(UserStats).where(UserStats.user_id == user.id))).scalar_one()
    stats_payload = await get_effective_stats(db, user, stats_row)
    path = await build_course_path(db, course.id, user.id)
    return {
        "success": True,
        "course": summary,
        "first_lesson_id": first_lesson_id,
        "active_course_id": str(user.active_course_id),
        "stats": stats_payload,
        "path": path,
    }


@router.post("/users/{user_id}/switch-course")
async def switch_course(user_id: str, payload: SelectCourseRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_or_default(db, user_id)
    try:
        uc = await switch_active_course(db, user, payload.course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")
    await db.commit()
    summary = await user_course_summary(db, uc)
    stats = await get_effective_stats(
        db, user,
        (await db.execute(select(UserStats).where(UserStats.user_id == user.id))).scalar_one(),
    )
    path = await build_course_path(db, payload.course_id, user.id)
    return {
        "success": True,
        "course": summary,
        "stats": stats,
        "path": path,
        "active_course_id": str(user.active_course_id),
    }



