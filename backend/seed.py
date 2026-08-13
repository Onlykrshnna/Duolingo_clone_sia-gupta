import asyncio
import uuid
from datetime import datetime, date, timedelta, timezone
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import DATABASE_URL
from models import (
    Base, Course, Unit, Skill, Lesson, Exercise, ExerciseOption,
    User, UserStats, UserSkillProgress, UserLessonAttempt, UserAchievement,
    LeaderboardEntry,
    Achievement, Quest, UserQuestProgress, UserCourse,
)
from lesson_generator import load_lesson_content, persist_generated_lesson
from language_registry import get_flag_asset
from course_utils import enroll_user_course

SKILL_CONTENT_KEY = {
    "Greetings": "greetings",
    "Travel Basics": "travel",
    "Travel": "travel",
    "People": "family",
    "Food Basics": "food",
    "Food & Drinks": "food",
    "Restaurant": "food",
    "Family": "family",
}

# Create connection engine
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


def seed_secondary_course(session, course_id, title, target_language, unit_specs):
    """Seed a course: English source → target language, with full exercise sets."""
    session.add(
        Course(
            id=course_id,
            title=title,
            language_code=target_language,
            source_language="en",
            target_language=target_language,
            flag_icon=get_flag_asset(target_language),
            created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
    )

    for unit_idx, unit_spec in enumerate(unit_specs, 1):
        unit_id = unit_spec["id"]
        session.add(
            Unit(
                id=unit_id,
                course_id=course_id,
                title=unit_spec["title"],
                description=unit_spec["description"],
                order_index=unit_idx,
                color_theme=unit_spec["color"],
            )
        )

        for skill_idx, skill_spec in enumerate(unit_spec["skills"], 1):
            skill_id = skill_spec["id"]
            session.add(
                Skill(
                    id=skill_id,
                    unit_id=unit_id,
                    title=skill_spec["title"],
                    icon=skill_spec["icon"],
                    order_index=skill_idx,
                    total_levels=1,
                    lessons_per_level=1,
                )
            )

            lesson_uuid = uuid.uuid4()
            session.add(
                Lesson(
                    id=lesson_uuid,
                    skill_id=skill_id,
                    level=1,
                    order_index=1,
                    xp_reward=15,
                )
            )

            content_key = skill_spec["content_key"]
            lesson_data = load_lesson_content(target_language, content_key)
            persist_generated_lesson(
                session,
                lesson_uuid,
                lesson_data,
                seed=hash(str(lesson_uuid)) % 10000,
            )


async def seed_data():
    # Create tables automatically (highly convenient for SQLite local fallback)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Starting Database Seeding...")

        # 1. Truncate all tables in dependency order
        print("Clearing existing data...")
        await session.execute(delete(UserQuestProgress))
        await session.execute(delete(UserLessonAttempt))
        await session.execute(delete(UserAchievement))
        await session.execute(delete(Quest))
        await session.execute(delete(LeaderboardEntry))
        await session.execute(delete(UserStats))
        await session.execute(delete(UserSkillProgress))
        await session.execute(delete(UserCourse))
        await session.execute(delete(ExerciseOption))
        await session.execute(delete(Exercise))
        await session.execute(delete(Lesson))
        await session.execute(delete(Skill))
        await session.execute(delete(Unit))
        await session.execute(delete(Course))
        await session.execute(delete(User))
        await session.execute(delete(Achievement))
        await session.commit()

        # 2. Seed Achievements
        print("Seeding Achievements...")
        ach_first = Achievement(
            id=uuid.UUID("a1000000-0000-0000-0000-000000000000"),
            key="first_lesson",
            title="First Steps",
            description="Completed your first lesson successfully!",
            icon="🚀"
        )
        ach_streak = Achievement(
            id=uuid.UUID("a2000000-0000-0000-0000-000000000000"),
            key="7_day_streak",
            title="Week on Fire",
            description="Reached a 7-day learning streak!",
            icon="🔥"
        )
        session.add_all([ach_first, ach_streak])

        # Seed Daily Quests
        print("Seeding Daily Quests...")
        quest_xp = Quest(
            id=uuid.UUID("e1000000-0000-0000-0000-000000000000"),
            title="Earn 20 XP",
            description="Gain 20 XP from your daily lessons.",
            xp_target=20,
            quest_type="xp"
        )
        quest_lesson = Quest(
            id=uuid.UUID("e2000000-0000-0000-0000-000000000000"),
            title="Complete 1 lesson",
            description="Complete any lesson on your learning path.",
            xp_target=1,
            quest_type="lesson"
        )
        session.add_all([quest_xp, quest_lesson])

        # 3. Seed Course
        print("Seeding Course...")
        course_id = uuid.UUID("c0000000-0000-0000-0000-000000000000")
        course = Course(
            id=course_id,
            title="Spanish for English speakers",
            language_code="es",
            source_language="en",
            target_language="es",
            flag_icon=get_flag_asset("es"),
            created_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        session.add(course)

        # 4. Seed Units
        print("Seeding Units...")
        unit1_id = uuid.UUID("a1000000-0000-0000-0000-000000000000")
        unit1 = Unit(
            id=unit1_id,
            course_id=course_id,
            title="Unit 1: Greetings & Basics",
            description="Learn hello, goodbye, thank you, and basic phrases in Spanish.",
            order_index=1,
            color_theme="#58CC02"
        )
        unit2_id = uuid.UUID("a2000000-0000-0000-0000-000000000000")
        unit2 = Unit(
            id=unit2_id,
            course_id=course_id,
            title="Unit 2: Food & Family",
            description="Talk about food, travel, and family in Spanish.",
            order_index=2,
            color_theme="#38BDF8"
        )
        session.add_all([unit1, unit2])

        # 5. Seed Skills
        print("Seeding Skills...")
        # Unit 1 Skills
        skill_greet_id = uuid.UUID("b1100000-0000-0000-0000-000000000000")
        skill_greet = Skill(
            id=skill_greet_id,
            unit_id=unit1_id,
            title="Greetings",
            icon="wave",
            order_index=1,
            total_levels=1,
            lessons_per_level=1,
        )
        skill_travel_id = uuid.UUID("b1200000-0000-0000-0000-000000000000")
        skill_travel = Skill(
            id=skill_travel_id,
            unit_id=unit1_id,
            title="Travel Basics",
            icon="plane",
            order_index=2,
            total_levels=1,
            lessons_per_level=1,
        )
        skill_people_id = uuid.UUID("b1300000-0000-0000-0000-000000000000")
        skill_people = Skill(
            id=skill_people_id,
            unit_id=unit1_id,
            title="People",
            icon="people",
            order_index=3,
            total_levels=1,
            lessons_per_level=1,
        )

        # Unit 2 Skills
        skill_food_id = uuid.UUID("b2100000-0000-0000-0000-000000000000")
        skill_food = Skill(
            id=skill_food_id,
            unit_id=unit2_id,
            title="Food & Drinks",
            icon="apple",
            order_index=1,
            total_levels=1,
            lessons_per_level=1,
        )
        skill_rest_id = uuid.UUID("b2200000-0000-0000-0000-000000000000")
        skill_rest = Skill(
            id=skill_rest_id,
            unit_id=unit2_id,
            title="Restaurant",
            icon="fork",
            order_index=2,
            total_levels=1,
            lessons_per_level=1,
        )
        skill_fam_id = uuid.UUID("b2300000-0000-0000-0000-000000000000")
        skill_fam = Skill(
            id=skill_fam_id,
            unit_id=unit2_id,
            title="Family",
            icon="heart",
            order_index=3,
            total_levels=1,
            lessons_per_level=1,
        )
        session.add_all([skill_greet, skill_travel, skill_people, skill_food, skill_rest, skill_fam])

        # 6. Seed Lessons & Exercises
        print("Seeding Lessons & Exercises...")
        skills = [
            (skill_greet_id, "Greetings"),
            (skill_travel_id, "Travel Basics"),
            (skill_people_id, "People"),
            (skill_food_id, "Food & Drinks"),
            (skill_rest_id, "Restaurant"),
            (skill_fam_id, "Family")
        ]

        for skill_id, skill_name in skills:
            lesson_uuid = uuid.uuid4()
            lesson = Lesson(
                id=lesson_uuid,
                skill_id=skill_id,
                level=1,
                order_index=1,
                xp_reward=15,
            )
            session.add(lesson)
            content_key = SKILL_CONTENT_KEY.get(skill_name, "greetings")
            lesson_data = load_lesson_content("es", content_key)
            persist_generated_lesson(
                session,
                lesson_uuid,
                lesson_data,
                seed=hash(str(lesson_uuid)) % 10000,
            )

        # 6b. Seed additional courses (French, German, Japanese)
        print("Seeding additional courses...")

        seed_secondary_course(
            session,
            uuid.UUID("c1000000-0000-0000-0000-000000000001"),
            "French for English speakers",
            "fr",
            [
                {
                    "id": uuid.UUID("f1000000-0000-0000-0000-000000000001"),
                    "title": "Unit 1: Greetings",
                    "description": "Learn greetings and basic food vocabulary in French.",
                    "color": "#6366F1",
                    "skills": [
                        {"id": uuid.UUID("f1100000-0000-0000-0000-000000000001"), "title": "Greetings", "icon": "wave", "content_key": "greetings"},
                        {"id": uuid.UUID("f1200000-0000-0000-0000-000000000001"), "title": "Food Basics", "icon": "apple", "content_key": "food"},
                    ],
                },
                {
                    "id": uuid.UUID("f2000000-0000-0000-0000-000000000001"),
                    "title": "Unit 2: Travel & Family",
                    "description": "Travel phrases and family words in French.",
                    "color": "#A855F7",
                    "skills": [
                        {"id": uuid.UUID("f2100000-0000-0000-0000-000000000001"), "title": "Travel", "icon": "plane", "content_key": "travel"},
                        {"id": uuid.UUID("f2200000-0000-0000-0000-000000000001"), "title": "Family", "icon": "heart", "content_key": "family"},
                    ],
                },
            ],
        )

        seed_secondary_course(
            session,
            uuid.UUID("c2000000-0000-0000-0000-000000000002"),
            "German for English speakers",
            "de",
            [
                {
                    "id": uuid.UUID("d1000000-0000-0000-0000-000000000002"),
                    "title": "Unit 1: Greetings",
                    "description": "Greetings and food basics in German.",
                    "color": "#F59E0B",
                    "skills": [
                        {"id": uuid.UUID("d1100000-0000-0000-0000-000000000002"), "title": "Greetings", "icon": "wave", "content_key": "greetings"},
                        {"id": uuid.UUID("d1200000-0000-0000-0000-000000000002"), "title": "Food Basics", "icon": "apple", "content_key": "food"},
                    ],
                },
                {
                    "id": uuid.UUID("d2000000-0000-0000-0000-000000000002"),
                    "title": "Unit 2: Travel & Family",
                    "description": "Travel and family vocabulary in German.",
                    "color": "#EF4444",
                    "skills": [
                        {"id": uuid.UUID("d2100000-0000-0000-0000-000000000002"), "title": "Travel", "icon": "plane", "content_key": "travel"},
                        {"id": uuid.UUID("d2200000-0000-0000-0000-000000000002"), "title": "Family", "icon": "heart", "content_key": "family"},
                    ],
                },
            ],
        )

        seed_secondary_course(
            session,
            uuid.UUID("c3000000-0000-0000-0000-000000000003"),
            "Japanese for English speakers",
            "ja",
            [
                {
                    "id": uuid.UUID("e1000000-0000-0000-0000-000000000003"),
                    "title": "Unit 1: Greetings",
                    "description": "Hello, goodbye, thank you, and basic Japanese greetings.",
                    "color": "#EC4899",
                    "skills": [
                        {"id": uuid.UUID("e1100000-0000-0000-0000-000000000003"), "title": "Greetings", "icon": "wave", "content_key": "greetings"},
                        {"id": uuid.UUID("e1200000-0000-0000-0000-000000000003"), "title": "Food Basics", "icon": "apple", "content_key": "food"},
                    ],
                },
                {
                    "id": uuid.UUID("e2000000-0000-0000-0000-000000000003"),
                    "title": "Unit 2: Travel & Family",
                    "description": "Travel and family vocabulary in Japanese.",
                    "color": "#14B8A6",
                    "skills": [
                        {"id": uuid.UUID("e2100000-0000-0000-0000-000000000003"), "title": "Travel", "icon": "plane", "content_key": "travel"},
                        {"id": uuid.UUID("e2200000-0000-0000-0000-000000000003"), "title": "Family", "icon": "heart", "content_key": "family"},
                    ],
                },
            ],
        )

        for extra_id, extra_title, extra_lang in [
            (uuid.UUID("c4000000-0000-0000-0000-000000000004"), "Italian for English speakers", "it"),
            (uuid.UUID("c5000000-0000-0000-0000-000000000005"), "Portuguese for English speakers", "pt"),
        ]:
            session.add(
                Course(
                    id=extra_id,
                    title=extra_title,
                    language_code=extra_lang,
                    source_language="en",
                    target_language=extra_lang,
                    flag_icon=get_flag_asset(extra_lang),
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
            )

        # 7. Seed Default Learner User
        print("Seeding Default Learner User...")
        user_uuid = uuid.UUID("d0000000-0000-0000-0000-000000000000")
        learner = User(
            id=user_uuid,
            username="default_learner",
            display_name="Duo Learner",
            avatar_url="/avatars/duo_mascot.png",
            created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=10),
            is_default_learner=True,
            onboarding_completed=False,
            native_language="en",
        )
        session.add(learner)

        # Stats — fresh first-time learner defaults
        stats = UserStats(
            user_id=user_uuid,
            total_xp=0,
            current_streak=0,
            longest_streak=0,
            last_activity_date=None,
            hearts_current=5,
            hearts_max=5,
            last_heart_lost_at=None,
            gems=500,
            daily_xp_goal=20,
            daily_xp_today=0
        )
        session.add(stats)

        # Enroll default learner in all language courses (Spanish active)
        print("Enrolling default learner in courses...")
        from sqlalchemy import select as sa_select

        course_ids = [
            uuid.UUID("c0000000-0000-0000-0000-000000000000"),
            uuid.UUID("c1000000-0000-0000-0000-000000000001"),
            uuid.UUID("c2000000-0000-0000-0000-000000000002"),
            uuid.UUID("c3000000-0000-0000-0000-000000000003"),
            uuid.UUID("c4000000-0000-0000-0000-000000000004"),
            uuid.UUID("c5000000-0000-0000-0000-000000000005"),
        ]
        for cid in course_ids:
            course_row = await session.execute(sa_select(Course).where(Course.id == cid))
            course_obj = course_row.scalar_one()
            await enroll_user_course(
                session,
                learner,
                course_obj,
                make_active=(cid == course_ids[0]),
                copy_from_stats=stats if cid == course_ids[0] else None,
            )

        # No skill progress rows — first skill unlocks dynamically via path API

        # 8. Seed Leaderboard Entries
        print("Seeding Leaderboard Entries...")
        leaderboard_data = [
            (uuid.uuid4(), "LanguageMaster", "/avatars/bot1.png", 1200, "Bronze League"),
            (uuid.uuid4(), "PolyglotPro", "/avatars/bot2.png", 950, "Bronze League"),
            (uuid.uuid4(), "SpanishLearner", "/avatars/bot3.png", 800, "Bronze League"),
            # The active user entry — fresh account, 0 weekly XP
            (user_uuid, "Duo Learner", "/avatars/duo_mascot.png", 0, "Bronze League"),
            (uuid.uuid4(), "TacoTuesday", "/avatars/bot4.png", 300, "Bronze League"),
            (uuid.uuid4(), "AmigoEstudiante", "/avatars/bot5.png", 250, "Bronze League"),
            (uuid.uuid4(), "HolaMascot", "/avatars/bot6.png", 180, "Bronze League"),
            (uuid.uuid4(), "DuolingoOwl", "/avatars/bot7.png", 120, "Bronze League"),
            (uuid.uuid4(), "VeloFast", "/avatars/bot8.png", 50, "Bronze League"),
        ]

        # Sort leaderboard descending to rank properly
        leaderboard_data.sort(key=lambda x: x[3], reverse=True)

        for rank, data in enumerate(leaderboard_data, 1):
            user_id = data[0] if data[0] == user_uuid else None
            entry = LeaderboardEntry(
                user_id=user_id,
                display_name=data[1],
                avatar_url=data[2],
                weekly_xp=data[3],
                league=data[4],
                rank=rank
            )
            session.add(entry)

        await session.commit()
        print("Seeding Complete Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
