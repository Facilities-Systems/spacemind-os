"""add_users_table_and_created_by

Revision ID: a3f2c9d1e847
Revises: ef18bd8927d7
Create Date: 2026-04-10 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f2c9d1e847'
down_revision: Union[str, None] = 'ef18bd8927d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.add_column(
        'decompositions',
        sa.Column('created_by', sa.String(length=36), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('decompositions', 'created_by')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
