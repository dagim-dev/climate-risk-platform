"""drop properties.pdf_url

Signed PDF links expire after PDF_SIGNED_URL_EXPIRE_MINUTES, so storing one only
handed clients dead links later. Links are now issued fresh on each request.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-26

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("properties", "pdf_url")


def downgrade() -> None:
    op.add_column("properties", sa.Column("pdf_url", sa.String(length=1000), nullable=True))
