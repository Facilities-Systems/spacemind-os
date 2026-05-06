"""add_assets_tables

Revision ID: a2c7d4e1f093
Revises: f3a1c8e2b047
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = 'a2c7d4e1f093'
down_revision = 'f3a1c8e2b047'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'assets',
        sa.Column('id',                  sa.String(36),  nullable=False, primary_key=True),
        sa.Column('name',                sa.String(200), nullable=False),
        sa.Column('asset_code',          sa.String(50),  nullable=False, unique=True),
        sa.Column('category',            sa.String(50),  nullable=False),
        sa.Column('location_id',         sa.String(50),  nullable=True),
        sa.Column('floor_plan_id',       sa.String(36),  nullable=True),
        sa.Column('status',              sa.String(30),  nullable=False, server_default='active'),
        sa.Column('purchase_date',       sa.DateTime(),  nullable=True),
        sa.Column('purchase_cost',       sa.Float(),     nullable=True),
        sa.Column('current_value',       sa.Float(),     nullable=True),
        sa.Column('depreciation_method', sa.String(30),  nullable=True, server_default='straight_line'),
        sa.Column('useful_life_years',   sa.Integer(),   nullable=True),
        sa.Column('condition_score',     sa.Float(),     nullable=True, server_default='10.0'),
        sa.Column('last_maintained_at',  sa.DateTime(),  nullable=True),
        sa.Column('next_maintenance_due',sa.DateTime(),  nullable=True),
        sa.Column('supplier_id',         sa.String(36),  nullable=True),
        sa.Column('notes',               sa.Text(),      nullable=True),
        sa.Column('created_at',          sa.DateTime(),  nullable=False),
        sa.Column('updated_at',          sa.DateTime(),  nullable=False),
        sa.ForeignKeyConstraint(['floor_plan_id'], ['floor_plans.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['supplier_id'],   ['suppliers.id'],   ondelete='SET NULL'),
    )
    op.create_index('ix_assets_asset_code', 'assets', ['asset_code'], unique=True)
    op.create_index('ix_assets_category',   'assets', ['category'])
    op.create_index('ix_assets_status',     'assets', ['status'])

    op.create_table(
        'asset_maintenance_logs',
        sa.Column('id',               sa.String(36),  nullable=False, primary_key=True),
        sa.Column('asset_id',         sa.String(36),  nullable=False),
        sa.Column('maintenance_type', sa.String(50),  nullable=False),
        sa.Column('description',      sa.Text(),      nullable=False),
        sa.Column('cost',             sa.Float(),     nullable=True),
        sa.Column('performed_by',     sa.String(100), nullable=True),
        sa.Column('performed_at',     sa.DateTime(),  nullable=False),
        sa.Column('condition_before', sa.Float(),     nullable=True),
        sa.Column('condition_after',  sa.Float(),     nullable=True),
        sa.Column('notes',            sa.Text(),      nullable=True),
        sa.Column('created_by',       sa.String(36),  nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_asset_maintenance_logs_asset_id', 'asset_maintenance_logs', ['asset_id'])


def downgrade() -> None:
    op.drop_table('asset_maintenance_logs')
    op.drop_index('ix_assets_status',     table_name='assets')
    op.drop_index('ix_assets_category',   table_name='assets')
    op.drop_index('ix_assets_asset_code', table_name='assets')
    op.drop_table('assets')
