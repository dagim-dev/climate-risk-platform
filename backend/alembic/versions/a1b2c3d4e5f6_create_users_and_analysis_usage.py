"""create users and analysis_usage tables

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-08-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "analysis_usage",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ip_address", "usage_date", name="uq_analysis_usage_ip_date"),
    )
    op.create_index(op.f("ix_analysis_usage_ip_address"), "analysis_usage", ["ip_address"], unique=False)
    op.create_index(op.f("ix_analysis_usage_usage_date"), "analysis_usage", ["usage_date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_analysis_usage_usage_date"), table_name="analysis_usage")
    op.drop_index(op.f("ix_analysis_usage_ip_address"), table_name="analysis_usage")
    op.drop_table("analysis_usage")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
