"""add_audit_log

Revision ID: b7e4d2f9c301
Revises: a3f2c9d1e847
Create Date: 2026-04-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b7e4d2f9c301'
down_revision: Union[str, None] = 'a3f2c9d1e847'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'audit_log',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('user_email', sa.String(length=255), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=36), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_log_created_at',  'audit_log', ['created_at'])
    op.create_index('ix_audit_log_user_id',      'audit_log', ['user_id'])
    op.create_index('ix_audit_log_action',       'audit_log', ['action'])
    op.create_index('ix_audit_log_resource_id',  'audit_log', ['resource_id'])


def downgrade() -> None:
    op.drop_index('ix_audit_log_resource_id',  table_name='audit_log')
    op.drop_index('ix_audit_log_action',       table_name='audit_log')
    op.drop_index('ix_audit_log_user_id',      table_name='audit_log')
    op.drop_index('ix_audit_log_created_at',   table_name='audit_log')
    op.drop_table('audit_log')
