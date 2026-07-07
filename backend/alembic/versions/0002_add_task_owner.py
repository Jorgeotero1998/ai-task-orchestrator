"""add task owner column

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("owner", sa.String(length=255), nullable=True))
    op.create_index("ix_tasks_owner_created_at", "tasks", ["owner", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_tasks_owner_created_at", table_name="tasks")
    op.drop_column("tasks", "owner")
