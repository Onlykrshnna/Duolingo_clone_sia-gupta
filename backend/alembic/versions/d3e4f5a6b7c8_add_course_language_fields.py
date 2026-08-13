"""Add source/target language to courses and native/learning language to users."""
from alembic import op
import sqlalchemy as sa

revision = "d3e4f5a6b7c8"
down_revision = "c2d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("source_language", sa.String(), nullable=False, server_default="en"),
    )
    op.add_column(
        "courses",
        sa.Column("target_language", sa.String(), nullable=False, server_default="es"),
    )
    op.execute("UPDATE courses SET target_language = language_code")

    op.add_column(
        "users",
        sa.Column("native_language", sa.String(), nullable=False, server_default="en"),
    )
    op.add_column("users", sa.Column("learning_language", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "learning_language")
    op.drop_column("users", "native_language")
    op.drop_column("courses", "target_language")
    op.drop_column("courses", "source_language")
