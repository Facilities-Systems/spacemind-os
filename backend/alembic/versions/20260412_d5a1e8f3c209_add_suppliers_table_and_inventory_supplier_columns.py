"""add suppliers table and inventory supplier columns

Revision ID: d5a1e8f3c209
Revises: c4e7d9f2b318
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa

revision = 'd5a1e8f3c209'
down_revision = 'c4e7d9f2b318'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── suppliers ────────────────────────────────────────────────────────────
    op.create_table(
        'suppliers',
        sa.Column('id',             sa.String(36),  primary_key=True),
        sa.Column('name',           sa.String(200), nullable=False, unique=True),
        sa.Column('contact_name',   sa.String(200), nullable=True),
        sa.Column('contact_email',  sa.String(255), nullable=True),
        sa.Column('contact_phone',  sa.String(50),  nullable=True),
        sa.Column('category',       sa.String(100), nullable=True),
        sa.Column('lead_time_days', sa.Integer(),   nullable=True),
        sa.Column('notes',          sa.Text(),      nullable=True),
        sa.Column('is_active',      sa.Boolean(),   nullable=False, server_default='1'),
        sa.Column('created_at',     sa.DateTime(),  nullable=False),
    )
    op.create_index('ix_suppliers_name', 'suppliers', ['name'])

    # ── inventory_items: add supplier columns ────────────────────────────────
    op.add_column('inventory_items', sa.Column('supplier_id',   sa.String(36),  nullable=True))
    op.add_column('inventory_items', sa.Column('supplier_name', sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column('inventory_items', 'supplier_name')
    op.drop_column('inventory_items', 'supplier_id')
    op.drop_index('ix_suppliers_name', table_name='suppliers')
    op.drop_table('suppliers')
