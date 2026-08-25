"""add pdf_url and subscription_tier

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("pdf_url", sa.String(length=1000), nullable=True))
    op.add_column(
        "users",
        sa.Column("subscription_tier", sa.String(length=50), server_default="free", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "subscription_tier")
    op.drop_column("properties", "pdf_url")
