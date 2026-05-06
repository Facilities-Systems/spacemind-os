"""add_sensor_tables

Revision ID: b3d8e5f2a174
Revises: a2c7d4e1f093
Create Date: 2026-05-06

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b3d8e5f2a174'
down_revision = 'a2c7d4e1f093'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'sensor_devices',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('location_id', sa.String(50), nullable=True, index=True),
        sa.Column('zone_name', sa.String(100), nullable=True),
        sa.Column('sensor_type', sa.String(50), nullable=False, index=True),
        sa.Column('api_key_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'sensor_readings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('sensor_id', sa.String(36), sa.ForeignKey('sensor_devices.id', ondelete='CASCADE'),
                  nullable=False, index=True),
        sa.Column('sensor_type', sa.String(50), nullable=False, index=True),
        sa.Column('location_id', sa.String(50), nullable=True, index=True),
        sa.Column('zone_name', sa.String(100), nullable=True),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=False, default=False),
    )


def downgrade() -> None:
    op.drop_table('sensor_readings')
    op.drop_table('sensor_devices')
