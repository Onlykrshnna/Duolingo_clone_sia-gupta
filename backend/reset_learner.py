"""
Reset ONLY the default learner's progress to a fresh first-time-user state.

Preserves all course content, exercises, achievements definitions, quests,
and seeded leaderboard bot entries.

Usage (from backend/):
    python reset_learner.py
"""

import asyncio
import uuid
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import DATABASE_URL
from ensure_schema import ensure_onboarding_column
from models import (
    User,
    UserStats,
    UserSkillProgress,
    UserLessonAttempt,
    UserAchievement,
    UserQuestProgress,
    LeaderboardEntry,
)

DEFAULT_LEARNER_ID = uuid.UUID("d0000000-0000-0000-0000-000000000000")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def reset_default_learner() -> None:
    await ensure_onboarding_column()
    async with AsyncSessionLocal() as session:
        user_result = await session.execute(
            select(User).where(User.is_default_learner == True)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise RuntimeError("Default learner not found. Run seed.py first.")

        user_id = user.id
        print(f"Resetting progress for default learner ({user.username}, {user_id})...")

        # Remove all mutable progress rows
        tables_cleared = [
            ("user_lesson_attempts", UserLessonAttempt),
            ("user_achievements", UserAchievement),
            ("user_quest_progress", UserQuestProgress),
            ("user_skill_progress", UserSkillProgress),
        ]
        for table_name, model in tables_cleared:
            result = await session.execute(delete(model).where(model.user_id == user_id))
            print(f"  Cleared {table_name}: {result.rowcount} row(s)")

        # Reset user profile flags
        await session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                active_course_id=None,
                onboarding_completed=False,
                selected_language=None,
                learning_language=None,
            )
        )
        print("  Reset users.active_course_id -> NULL, onboarding_completed -> False, languages -> NULL")

        # Reset stats to first-time defaults
        stats_result = await session.execute(
            select(UserStats).where(UserStats.user_id == user_id)
        )
        stats = stats_result.scalar_one_or_none()
        if stats:
            stats.total_xp = 0
            stats.current_streak = 0
            stats.longest_streak = 0
            stats.last_activity_date = None
            stats.hearts_current = stats.hearts_max
            stats.last_heart_lost_at = None
            stats.daily_xp_today = 0
            # Keep gems at model default (500) unless already lower
            if stats.gems < 100:
                stats.gems = 500
            print("  Reset user_stats -> fresh defaults (XP 0, streak 0, hearts full, daily XP 0)")
        else:
            print("  WARNING: user_stats row missing — run seed.py")

        # Reset default learner leaderboard entry
        lb_result = await session.execute(
            select(LeaderboardEntry).where(LeaderboardEntry.user_id == user_id)
        )
        lb_entry = lb_result.scalar_one_or_none()
        if lb_entry:
            lb_entry.weekly_xp = 0
            print("  Reset leaderboard_entries.weekly_xp -> 0 for default learner")
        else:
            print("  WARNING: leaderboard entry for default learner not found")

        await session.commit()

        # Re-rank entire leaderboard by weekly_xp
        all_entries_result = await session.execute(
            select(LeaderboardEntry).order_by(LeaderboardEntry.weekly_xp.desc())
        )
        entries = all_entries_result.scalars().all()
        for rank, entry in enumerate(entries, start=1):
            entry.rank = rank
        await session.commit()
        print(f"  Re-ranked {len(entries)} leaderboard entries")

        print("\nDefault learner reset complete.")
        print("Tables affected: user_lesson_attempts, user_achievements, user_quest_progress,")
        print("                 user_skill_progress, user_stats, users, leaderboard_entries")


if __name__ == "__main__":
    asyncio.run(reset_default_learner())
