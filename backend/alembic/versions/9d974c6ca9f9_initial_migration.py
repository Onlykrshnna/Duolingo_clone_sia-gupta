"""Initial migration

Revision ID: 9d974c6ca9f9
Revises: 
Create Date: 2026-08-13 15:37:29.657157

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9d974c6ca9f9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums
    op.execute("CREATE TYPE exercisetype AS ENUM ('multiple_choice', 'translate', 'word_bank', 'match_pairs', 'fill_blank', 'type_answer')")
    op.execute("CREATE TYPE skillprogressstatus AS ENUM ('locked', 'available', 'in_progress', 'completed')")
    op.execute("CREATE TYPE lessonattemptresult AS ENUM ('passed', 'failed', 'in_progress')")

    # 2. Create courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('language_code', sa.String(), nullable=False),
        sa.Column('flag_icon', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Create units table
    op.create_table(
        'units',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('color_theme', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Create skills table
    op.create_table(
        'skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('unit_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('total_levels', sa.Integer(), nullable=False),
        sa.Column('lessons_per_level', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Create lessons table
    op.create_table(
        'lessons',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('xp_reward', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Create exercises table
    op.create_table(
        'exercises',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('multiple_choice', 'translate', 'word_bank', 'match_pairs', 'fill_blank', 'type_answer', name='exercisetype'), nullable=False),
        sa.Column('prompt', sa.String(), nullable=False),
        sa.Column('prompt_audio_url', sa.String(), nullable=True),
        sa.Column('correct_answer', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. Create exercise_options table
    op.create_table(
        'exercise_options',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('pair_key', sa.String(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_default_learner', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

    # 9. Create user_stats table
    op.create_table(
        'user_stats',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('total_xp', sa.Integer(), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False),
        sa.Column('longest_streak', sa.Integer(), nullable=False),
        sa.Column('last_activity_date', sa.Date(), nullable=True),
        sa.Column('hearts_current', sa.Integer(), nullable=False),
        sa.Column('hearts_max', sa.Integer(), nullable=False),
        sa.Column('last_heart_lost_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('gems', sa.Integer(), nullable=False),
        sa.Column('daily_xp_goal', sa.Integer(), nullable=False),
        sa.Column('daily_xp_today', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 10. Create user_skill_progress table
    op.create_table(
        'user_skill_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('current_level', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('locked', 'available', 'in_progress', 'completed', name='skillprogressstatus'), nullable=False),
        sa.Column('lessons_completed', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 11. Create user_lesson_attempts table
    op.create_table(
        'user_lesson_attempts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('xp_earned', sa.Integer(), nullable=False),
        sa.Column('hearts_lost', sa.Integer(), nullable=False),
        sa.Column('result', sa.Enum('passed', 'failed', 'in_progress', name='lessonattemptresult'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 12. Create leaderboard_entries table
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=False),
        sa.Column('weekly_xp', sa.Integer(), nullable=False),
        sa.Column('league', sa.String(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 13. Create achievements table
    op.create_table(
        'achievements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )

    # 14. Create user_achievements table
    op.create_table(
        'user_achievements',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('achievement_id', sa.UUID(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'achievement_id')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    op.drop_table('leaderboard_entries')
    op.drop_table('user_lesson_attempts')
    op.drop_table('user_skill_progress')
    op.drop_table('user_stats')
    op.drop_table('users')
    op.drop_table('exercise_options')
    op.drop_table('exercises')
    op.drop_table('lessons')
    op.drop_table('skills')
    op.drop_table('units')
    op.drop_table('courses')

    # Drop enums
    op.execute("DROP TYPE lessonattemptresult")
    op.execute("DROP TYPE skillprogressstatus")
    op.execute("DROP TYPE exercisetype")
