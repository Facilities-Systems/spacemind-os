"""add_fts_gin_indexes

Revision ID: c9d2f4a7e381
Revises: b3d8e5f2a174
Create Date: 2026-05-07

PostgreSQL only — GIN indexes on tsvector columns for full-text search.
SQLite has no tsvector; the search service falls back to ILIKE automatically.
"""
from alembic import op
from sqlalchemy import text

revision = 'c9d2f4a7e381'
down_revision = 'b3d8e5f2a174'
branch_labels = None
depends_on = None


def _is_postgres() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def upgrade() -> None:
    if not _is_postgres():
        return

    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_items_fts
        ON inventory_items
        USING gin(to_tsvector('english',
            coalesce(name,'') || ' ' || coalesce(code,'') || ' ' || coalesce(notes,'')));
    """))

    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_assets_fts
        ON assets
        USING gin(to_tsvector('english',
            coalesce(name,'') || ' ' || coalesce(asset_code,'') || ' ' || coalesce(notes,'')));
    """))

    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_medical_items_fts
        ON medical_items
        USING gin(to_tsvector('english',
            coalesce(name,'') || ' ' || coalesce(notes,'')));
    """))

    op.execute(text("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_decompositions_fts
        ON decompositions
        USING gin(to_tsvector('english',
            coalesce(request_text,'') || ' ' || coalesce(request_summary,'')));
    """))


def downgrade() -> None:
    if not _is_postgres():
        return

    op.execute(text("DROP INDEX IF EXISTS ix_inventory_items_fts;"))
    op.execute(text("DROP INDEX IF EXISTS ix_assets_fts;"))
    op.execute(text("DROP INDEX IF EXISTS ix_medical_items_fts;"))
    op.execute(text("DROP INDEX IF EXISTS ix_decompositions_fts;"))
