"""add_medical_equipment_fields

Revision ID: f3a1c8e2b047
Revises: e6b2f9a4d531
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = 'f3a1c8e2b047'
down_revision = 'e6b2f9a4d531'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("medical_items") as batch_op:
        batch_op.add_column(sa.Column("equipment_serial_number", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("last_service_date", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("medical_items") as batch_op:
        batch_op.drop_column("last_service_date")
        batch_op.drop_column("equipment_serial_number")
