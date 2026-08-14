"""Deduplicate user_quest_progress and add unique (user_id, quest_id, date) constraint.

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-08-14 13:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, Sequence[str], None] = "d3e4f5a6b7c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(connection, table_name: str) -> bool:
    inspector = sa.inspect(connection)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    connection = op.get_bind()
    if not _table_exists(connection, "user_quest_progress"):
        return

    # Keep the oldest row per (user_id, quest_id, date) — lowest id wins.
    op.execute(
        sa.text(
            """
            DELETE FROM user_quest_progress
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM user_quest_progress
                GROUP BY user_id, quest_id, date
            )
            """
        )
    )

    existing_indexes = {
        idx["name"] for idx in sa.inspect(connection).get_indexes("user_quest_progress")
    }
    if "uq_user_quest_date" not in existing_indexes:
        op.create_unique_constraint(
            "uq_user_quest_date",
            "user_quest_progress",
            ["user_id", "quest_id", "date"],
        )


def downgrade() -> None:
    connection = op.get_bind()
    if not _table_exists(connection, "user_quest_progress"):
        return

    existing_indexes = {
        idx["name"] for idx in sa.inspect(connection).get_indexes("user_quest_progress")
    }
    if "uq_user_quest_date" in existing_indexes:
        op.drop_constraint("uq_user_quest_date", "user_quest_progress", type_="unique")
