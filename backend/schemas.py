import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# Base configurations for ORM compatibility
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Content Schemas ---
class CourseResponse(BaseSchema):
    id: uuid.UUID
    title: str
    language_code: str
    source_language: str = "en"
    target_language: str = "es"
    flag_icon: str
    created_at: datetime


class ExerciseOptionResponse(BaseSchema):
    id: uuid.UUID
    exercise_id: uuid.UUID
    label: str
    is_correct: bool
    pair_key: Optional[str] = None
    image_url: Optional[str] = None
    order_index: int


class ExerciseResponse(BaseSchema):
    id: uuid.UUID
    lesson_id: uuid.UUID
    order_index: int
    type: str
    prompt: str
    prompt_audio_url: Optional[str] = None
    correct_answer: dict
    metadata: dict = Field(validation_alias="exercise_metadata")
    options: List[ExerciseOptionResponse]


class LessonResponse(BaseSchema):
    id: uuid.UUID
    skill_id: uuid.UUID
    level: int
    order_index: int
    xp_reward: int
    course_id: Optional[uuid.UUID] = None
    language_code: Optional[str] = None
    exercises: List[ExerciseResponse]


class SkillResponse(BaseSchema):
    id: uuid.UUID
    unit_id: uuid.UUID
    title: str
    icon: str
    order_index: int
    total_levels: int
    lessons_per_level: int
    current_level: int = 0
    status: str = "locked"  # "locked" | "available" | "in_progress" | "completed"
    lessons_completed: int = 0
    next_lesson_id: Optional[uuid.UUID] = None


class UnitResponse(BaseSchema):
    id: uuid.UUID
    course_id: uuid.UUID
    title: str
    description: str
    order_index: int
    color_theme: str
    skills: List[SkillResponse]


class PathResponse(BaseSchema):
    units: List[UnitResponse]


# --- Gamification & Stats Schemas ---
class UserStatsResponse(BaseSchema):
    user_id: uuid.UUID
    total_xp: int
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date] = None
    hearts_current: int
    hearts_max: int
    last_heart_lost_at: Optional[datetime] = None
    gems: int
    daily_xp_goal: int
    daily_xp_today: int


class UserStatsRefillResponse(BaseSchema):
    success: bool
    message: str
    gems_remaining: int
    hearts_current: int


class RegenStatusResponse(BaseSchema):
    hearts_current: int
    hearts_max: int
    time_left_seconds: int


class LeaderboardEntryResponse(BaseSchema):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    display_name: str
    avatar_url: str
    weekly_xp: int
    league: str
    rank: int


class AchievementResponse(BaseSchema):
    id: uuid.UUID
    key: str
    title: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None


class UserProfileResponse(BaseSchema):
    id: uuid.UUID
    username: str
    display_name: str
    avatar_url: str
    created_at: datetime
    stats: UserStatsResponse
    achievements: List[AchievementResponse]
    join_date: datetime
    course_progress_summary: str
    active_course_id: Optional[uuid.UUID] = None
    onboarding_completed: bool = False
    selected_language: Optional[str] = None
    native_language: str = "en"
    learning_language: Optional[str] = None
    active_course_title: Optional[str] = None
    current_unit_title: Optional[str] = None
    current_skill_title: Optional[str] = None


# --- Lesson Session Action Schemas ---
class StartLessonResponse(BaseSchema):
    attempt_id: uuid.UUID
    lesson_id: uuid.UUID
    user_id: uuid.UUID
    started_at: datetime


class AnswerRequest(BaseModel):
    exercise_id: uuid.UUID
    submitted_answer: dict


class AnswerResponse(BaseModel):
    correct: bool
    correct_answer: dict
    hearts_remaining: int
    hearts_lost: int


class CompleteResponse(BaseModel):
    attempt_id: uuid.UUID
    xp_earned: int
    hearts_lost: int
    result: str  # "passed" | "failed"
    current_streak: int
    daily_xp_today: int
    daily_xp_goal: int
    gems_earned: int = 0
    path: Optional[PathResponse] = None
    stats: Optional[UserStatsResponse] = None


class QuestResponse(BaseSchema):
    id: uuid.UUID
    title: str
    description: str
    xp_target: int
    quest_type: str


class UserQuestProgressResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    quest_id: uuid.UUID
    progress: int
    completed: bool
    date: date
    quest: QuestResponse


class UserCourseResponse(BaseSchema):
    id: uuid.UUID
    course_id: uuid.UUID
    language_code: str
    language_name: str
    flag: str
    current_unit: str
    current_lesson: str
    xp: int
    streak: int
    hearts: int
    hearts_max: int
    gems: int
    completion_percent: int
    is_active: bool
    daily_xp_today: int = 0
    daily_xp_goal: int = 20


class EnrollCourseRequest(BaseModel):
    course_id: uuid.UUID
    complete_onboarding: bool = False
    selected_language: Optional[str] = None
    redirect_to_first_lesson: bool = False

