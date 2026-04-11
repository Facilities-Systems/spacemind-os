"""inventory and medical tables

Revision ID: c4e7d9f2b318
Revises: b7e4d2f9c301
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'c4e7d9f2b318'
down_revision = 'b7e4d2f9c301'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── inventory_items ──────────────────────────────────────────────────────
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(20), nullable=False, server_default='units'),
        sa.Column('min_level', sa.Float(), nullable=False, server_default='0'),
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_inventory_items_code', 'inventory_items', ['code'])
    op.create_index('ix_inventory_items_category', 'inventory_items', ['category'])

    # ── inventory_transactions ───────────────────────────────────────────────
    op.create_table(
        'inventory_transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('item_id', sa.String(36), nullable=False),
        sa.Column('item_name', sa.String(200), nullable=False),
        sa.Column('item_code', sa.String(50), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('borrower', sa.String(200), nullable=False),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('work_order', sa.String(100), nullable=True),
        sa.Column('date_out', sa.DateTime(), nullable=False),
        sa.Column('expected_return', sa.DateTime(), nullable=True),
        sa.Column('date_returned', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='Outstanding'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
    )
    op.create_index('ix_inventory_transactions_item_id', 'inventory_transactions', ['item_id'])
    op.create_index('ix_inventory_transactions_status', 'inventory_transactions', ['status'])

    # ── inventory_requisitions ───────────────────────────────────────────────
    op.create_table(
        'inventory_requisitions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('requester', sa.String(200), nullable=False),
        sa.Column('role', sa.String(100), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('work_order', sa.String(100), nullable=True),
        sa.Column('priority', sa.String(20), nullable=False, server_default='Medium'),
        sa.Column('items_description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='Pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(36), nullable=True),
    )
    op.create_index('ix_inventory_requisitions_status', 'inventory_requisitions', ['status'])

    # ── medical_items ────────────────────────────────────────────────────────
    op.create_table(
        'medical_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(20), nullable=False, server_default='units'),
        sa.Column('min_level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_medical_items_category', 'medical_items', ['category'])

    # ── medical_incidents ────────────────────────────────────────────────────
    op.create_table(
        'medical_incidents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('incident_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('employee_name', sa.String(200), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('treatment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='Open'),
        sa.Column('reported_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
    )
    op.create_index('ix_medical_incidents_severity', 'medical_incidents', ['severity'])
    op.create_index('ix_medical_incidents_status', 'medical_incidents', ['status'])


def downgrade() -> None:
    op.drop_table('medical_incidents')
    op.drop_table('medical_items')
    op.drop_table('inventory_requisitions')
    op.drop_table('inventory_transactions')
    op.drop_table('inventory_items')
