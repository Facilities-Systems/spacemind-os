"""add floor_plans table

Revision ID: e6b2f9a4d531
Revises: d5a1e8f3c209
Create Date: 2026-04-12

"""
import uuid
from datetime import datetime, UTC

from alembic import op
import sqlalchemy as sa

revision = 'e6b2f9a4d531'
down_revision = 'd5a1e8f3c209'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'floor_plans',
        sa.Column('id',             sa.String(36),  primary_key=True),
        sa.Column('building_id',    sa.String(20),  nullable=False),
        sa.Column('building_name',  sa.String(200), nullable=False),
        sa.Column('floor_name',     sa.String(100), nullable=False),
        sa.Column('floor_order',    sa.Integer,     nullable=False, server_default='0'),
        sa.Column('total_area_sqm', sa.Integer,     nullable=False, server_default='800'),
        sa.Column('capacity_pax',   sa.Integer,     nullable=False, server_default='60'),
        sa.Column('total_desks',    sa.Integer,     nullable=False, server_default='0'),
        sa.Column('occupied_desks', sa.Integer,     nullable=False, server_default='0'),
        sa.Column('meeting_rooms',  sa.Integer,     nullable=False, server_default='0'),
        sa.Column('status',         sa.String(30),  nullable=False, server_default='active'),
        sa.Column('created_at',     sa.DateTime,    nullable=False),
        sa.Column('updated_at',     sa.DateTime,    nullable=False),
    )
    op.create_index('ix_floor_plans_building_id', 'floor_plans', ['building_id'])

    # ── Seed data from frontend BUILDINGS / STATS constants ────────────────────
    now = datetime.now(UTC).replace(tzinfo=None)

    rows = [
        # FP1 HQ — Durban
        ('fp1', 'FP1 HQ — Durban',  'Ground Floor', 0, 1840, 120,   0,   0,  4, 'active'),
        ('fp1', 'FP1 HQ — Durban',  'Level 1',      1, 2100, 200,  96,  72,  8, 'active'),
        ('fp1', 'FP1 HQ — Durban',  'Level 2',      2, 2100, 200, 104,  88,  6, 'active'),
        ('fp1', 'FP1 HQ — Durban',  'Level 3',      3, 1900, 150,  48,  30, 12, 'active'),
        ('fp1', 'FP1 HQ — Durban',  'Rooftop',      4,  600,  80,   0,   0,  1, 'active'),
        # FP2 Office Park
        ('fp2', 'FP2 Office Park',  'Ground Floor', 0, 1200,  80,   0,   0,  3, 'active'),
        ('fp2', 'FP2 Office Park',  'Level 1',      1, 1400, 120,  64,  50,  5, 'active'),
        ('fp2', 'FP2 Office Park',  'Level 2',      2, 1400, 120,  68,  44,  4, 'active'),
        # London UK
        ('lnd', 'London UK',        'Ground Floor', 0,  800,  60,   0,   0,  3, 'active'),
        ('lnd', 'London UK',        'Level 1',      1,  800,  60,  24,  16,  3, 'active'),
        # Nairobi KE
        ('nbi', 'Nairobi KE',       'Ground Floor', 0,  800,  60,   0,   0,  3, 'active'),
        ('nbi', 'Nairobi KE',       'Level 1',      1,  800,  60,  24,  16,  3, 'active'),
        # Lagos NG
        ('lag', 'Lagos NG',         'Ground Floor', 0,  800,  60,  24,  16,  3, 'active'),
    ]

    bind = op.get_bind()
    for (bid, bname, fname, forder, area, cap, desks, occ, rooms, status) in rows:
        bind.execute(
            sa.text(
                "INSERT INTO floor_plans "
                "(id, building_id, building_name, floor_name, floor_order, "
                " total_area_sqm, capacity_pax, total_desks, occupied_desks, "
                " meeting_rooms, status, created_at, updated_at) "
                "VALUES (:id, :bid, :bname, :fname, :forder, "
                "        :area, :cap, :desks, :occ, "
                "        :rooms, :status, :now, :now)"
            ),
            {
                "id": str(uuid.uuid4()), "bid": bid, "bname": bname,
                "fname": fname, "forder": forder,
                "area": area, "cap": cap, "desks": desks, "occ": occ,
                "rooms": rooms, "status": status, "now": now,
            },
        )


def downgrade() -> None:
    op.drop_index('ix_floor_plans_building_id', table_name='floor_plans')
    op.drop_table('floor_plans')
