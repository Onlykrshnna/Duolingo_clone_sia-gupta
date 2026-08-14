import enum
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, func, UUID, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

# Enums
class ExerciseType(str, enum.Enum):
    intro = "intro"
    multiple_choice = "multiple_choice"
    translate = "translate"
    word_bank = "word_bank"
    match_pairs = "match_pairs"
    fill_blank = "fill_blank"
    type_answer = "type_answer"
    image_selection = "image_selection"
    listening = "listening"


class SkillProgressStatus(str, enum.Enum):
    locked = "locked"
    available = "available"
    in_progress = "in_progress"
    completed = "completed"


class LessonAttemptResult(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    in_progress = "in_progress"


# Content Tables (seeded, read-mostly)
class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    language_code: Mapped[str] = mapped_column(String, nullable=False)  # target language (legacy alias)
    source_language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    target_language: Mapped[str] = mapped_column(String, nullable=False, default="es")
    flag_icon: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    units: Mapped[List["Unit"]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    color_theme: Mapped[str] = mapped_column(String, nullable=False)  # hex color code

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="units")
    skills: Mapped[List["Skill"]] = relationship(back_populates="unit", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    total_levels: Mapped[int] = mapped_column(Integer, nullable=False)
    lessons_per_level: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    unit: Mapped["Unit"] = relationship(back_populates="skills")
    lessons: Mapped[List["Lesson"]] = relationship(back_populates="skill", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    # Relationships
    skill: Mapped["Skill"] = relationship(back_populates="lessons")
    exercises: Mapped[List["Exercise"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[ExerciseType] = mapped_column(Enum(ExerciseType), nullable=False)
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    prompt_audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    correct_answer: Mapped[dict] = mapped_column(JSON, nullable=False)
    exercise_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")
    options: Mapped[List["ExerciseOption"]] = relationship(back_populates="exercise", cascade="all, delete-orphan")


class ExerciseOption(Base):
    __tablename__ = "exercise_options"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    pair_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    exercise: Mapped["Exercise"] = relationship(back_populates="options")


# User & Progress Tables (mutable, per-learner)
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_default_learner: Mapped[bool] = mapped_column(Boolean, default=False)
    active_course_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    selected_language: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    native_language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    learning_language: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    active_course: Mapped[Optional["Course"]] = relationship()
    stats: Mapped["UserStats"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    skill_progressions: Mapped[List["UserSkillProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    lesson_attempts: Mapped[List["UserLessonAttempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    leaderboard_entry: Mapped[Optional["LeaderboardEntry"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    achievements: Mapped[List["UserAchievement"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    enrolled_courses: Mapped[List["UserCourse"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserCourse(Base):
    """Per-language enrollment with isolated progress and stats."""
    __tablename__ = "user_courses"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    language_code: Mapped[str] = mapped_column(String, nullable=False)
    language_name: Mapped[str] = mapped_column(String, nullable=False)
    flag: Mapped[str] = mapped_column(String, nullable=False)
    current_unit: Mapped[str] = mapped_column(String, nullable=False, default="Unit 1")
    current_lesson: Mapped[str] = mapped_column(String, nullable=False, default="Lesson 1")
    xp: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_max: Mapped[int] = mapped_column(Integer, default=5)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    daily_xp_goal: Mapped[int] = mapped_column(Integer, default=20)
    daily_xp_today: Mapped[int] = mapped_column(Integer, default=0)
    completion_percent: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_heart_lost_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="enrolled_courses")
    course: Mapped["Course"] = relationship()


class UserStats(Base):
    __tablename__ = "user_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hearts_current: Mapped[int] = mapped_column(Integer, default=5)
    hearts_max: Mapped[int] = mapped_column(Integer, default=5)
    last_heart_lost_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    daily_xp_goal: Mapped[int] = mapped_column(Integer, default=20)
    daily_xp_today: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="stats")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill_progress"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    current_level: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[SkillProgressStatus] = mapped_column(Enum(SkillProgressStatus), default=SkillProgressStatus.locked)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="skill_progressions")


class UserLessonAttempt(Base):
    __tablename__ = "user_lesson_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[LessonAttemptResult] = mapped_column(Enum(LessonAttemptResult), default=LessonAttemptResult.in_progress)
    is_practice: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="lesson_attempts")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str] = mapped_column(String, nullable=False)
    weekly_xp: Mapped[int] = mapped_column(Integer, default=0)
    league: Mapped[str] = mapped_column(String, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="leaderboard_entry")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    users: Mapped[List["UserAchievement"]] = relationship(back_populates="achievement", cascade="all, delete-orphan")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    achievement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="users")


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    xp_target: Mapped[int] = mapped_column(Integer, nullable=False)
    quest_type: Mapped[str] = mapped_column(String, nullable=False) # "xp" or "lesson"


class UserQuestProgress(Base):
    __tablename__ = "user_quest_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "quest_id", name="uq_user_quest"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quest_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quests.id", ondelete="CASCADE"), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    quest: Mapped["Quest"] = relationship()

