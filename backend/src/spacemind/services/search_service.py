"""
SpaceMind OS — Unified Full-Text Search Service
SQLite dev: ORM ilike() filters.
PostgreSQL production: plainto_tsquery + ts_rank with GIN indexes.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from spacemind.core.config import settings
from spacemind.domain.models import Asset, DecompositionRecord, InventoryItem, MedicalItem

log = logging.getLogger(__name__)

_ALL_DOMAINS = ("inventory", "assets", "medical", "history")


class SearchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._sqlite = "sqlite" in settings.database_url.lower()

    def search(
        self,
        q: str,
        domains: list[str] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        q = q.strip()
        if len(q) < 2:
            return []

        active = [d for d in (domains or list(_ALL_DOMAINS)) if d in _ALL_DOMAINS]
        per_domain = max(5, limit // len(active)) if active else limit

        results: list[dict[str, Any]] = []
        for domain in active:
            results.extend(self._dispatch(domain, q, per_domain))

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:limit]

    # ── Dispatch ──────────────────────────────────────────────────────────────

    def _dispatch(self, domain: str, q: str, limit: int) -> list[dict[str, Any]]:
        if domain == "inventory":
            return self._inventory(q, limit)
        if domain == "assets":
            return self._assets(q, limit)
        if domain == "medical":
            return self._medical(q, limit)
        if domain == "history":
            return self._history(q, limit)
        return []

    # ── Inventory ─────────────────────────────────────────────────────────────

    def _inventory(self, q: str, limit: int) -> list[dict[str, Any]]:
        if self._sqlite:
            rows = (
                self.db.query(InventoryItem)
                .filter(or_(
                    InventoryItem.name.ilike(f"%{q}%"),
                    InventoryItem.code.ilike(f"%{q}%"),
                    InventoryItem.category.ilike(f"%{q}%"),
                    InventoryItem.notes.ilike(f"%{q}%"),
                ))
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id, "domain": "inventory",
                    "title": r.name,
                    "subtitle": f"{r.code} · {r.category} · {r.quantity} {r.unit}",
                    "url": "/storeroom",
                    "score": 1.0,
                }
                for r in rows
            ]
        sql = text("""
            SELECT id, name, code, category, quantity, unit,
                   ts_rank(
                       to_tsvector('english',
                           coalesce(name,'') || ' ' || coalesce(code,'') || ' ' || coalesce(notes,'')),
                       plainto_tsquery('english', :q)
                   ) AS score
            FROM inventory_items
            WHERE to_tsvector('english',
                      coalesce(name,'') || ' ' || coalesce(code,'') || ' ' || coalesce(notes,''))
                  @@ plainto_tsquery('english', :q)
            ORDER BY score DESC
            LIMIT :lim
        """)
        rows = self.db.execute(sql, {"q": q, "lim": limit}).fetchall()
        return [
            {
                "id": str(r.id), "domain": "inventory",
                "title": r.name,
                "subtitle": f"{r.code} · {r.category} · {r.quantity} {r.unit}",
                "url": "/storeroom",
                "score": float(r.score),
            }
            for r in rows
        ]

    # ── Assets ────────────────────────────────────────────────────────────────

    def _assets(self, q: str, limit: int) -> list[dict[str, Any]]:
        if self._sqlite:
            rows = (
                self.db.query(Asset)
                .filter(or_(
                    Asset.name.ilike(f"%{q}%"),
                    Asset.asset_code.ilike(f"%{q}%"),
                    Asset.category.ilike(f"%{q}%"),
                    Asset.notes.ilike(f"%{q}%"),
                ))
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id, "domain": "assets",
                    "title": r.name,
                    "subtitle": f"{r.asset_code} · {r.category} · {r.status}",
                    "url": "/assets",
                    "score": 1.0,
                }
                for r in rows
            ]
        sql = text("""
            SELECT id, name, asset_code, category, status,
                   ts_rank(
                       to_tsvector('english',
                           coalesce(name,'') || ' ' || coalesce(asset_code,'') || ' ' || coalesce(notes,'')),
                       plainto_tsquery('english', :q)
                   ) AS score
            FROM assets
            WHERE to_tsvector('english',
                      coalesce(name,'') || ' ' || coalesce(asset_code,'') || ' ' || coalesce(notes,''))
                  @@ plainto_tsquery('english', :q)
            ORDER BY score DESC
            LIMIT :lim
        """)
        rows = self.db.execute(sql, {"q": q, "lim": limit}).fetchall()
        return [
            {
                "id": str(r.id), "domain": "assets",
                "title": r.name,
                "subtitle": f"{r.asset_code} · {r.category} · {r.status}",
                "url": "/assets",
                "score": float(r.score),
            }
            for r in rows
        ]

    # ── Medical ───────────────────────────────────────────────────────────────

    def _medical(self, q: str, limit: int) -> list[dict[str, Any]]:
        if self._sqlite:
            rows = (
                self.db.query(MedicalItem)
                .filter(or_(
                    MedicalItem.name.ilike(f"%{q}%"),
                    MedicalItem.category.ilike(f"%{q}%"),
                    MedicalItem.notes.ilike(f"%{q}%"),
                ))
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id, "domain": "medical",
                    "title": r.name,
                    "subtitle": f"{r.category} · {r.quantity} {r.unit}",
                    "url": "/medical",
                    "score": 1.0,
                }
                for r in rows
            ]
        sql = text("""
            SELECT id, name, category, quantity, unit,
                   ts_rank(
                       to_tsvector('english',
                           coalesce(name,'') || ' ' || coalesce(notes,'')),
                       plainto_tsquery('english', :q)
                   ) AS score
            FROM medical_items
            WHERE to_tsvector('english', coalesce(name,'') || ' ' || coalesce(notes,''))
                  @@ plainto_tsquery('english', :q)
            ORDER BY score DESC
            LIMIT :lim
        """)
        rows = self.db.execute(sql, {"q": q, "lim": limit}).fetchall()
        return [
            {
                "id": str(r.id), "domain": "medical",
                "title": r.name,
                "subtitle": f"{r.category} · {r.quantity} {r.unit}",
                "url": "/medical",
                "score": float(r.score),
            }
            for r in rows
        ]

    # ── History ───────────────────────────────────────────────────────────────

    def _history(self, q: str, limit: int) -> list[dict[str, Any]]:
        if self._sqlite:
            rows = (
                self.db.query(DecompositionRecord)
                .filter(or_(
                    DecompositionRecord.request_text.ilike(f"%{q}%"),
                    DecompositionRecord.request_summary.ilike(f"%{q}%"),
                    DecompositionRecord.request_type.ilike(f"%{q}%"),
                ))
                .order_by(DecompositionRecord.created_at.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id, "domain": "history",
                    "title": r.request_summary or r.request_text[:80],
                    "subtitle": f"{r.request_type.replace('_', ' ').title()} · {r.location_id}",
                    "url": f"/history/{r.id}",
                    "score": 1.0,
                }
                for r in rows
            ]
        sql = text("""
            SELECT id, request_summary, request_text, request_type, location_id,
                   ts_rank(
                       to_tsvector('english',
                           coalesce(request_text,'') || ' ' || coalesce(request_summary,'')),
                       plainto_tsquery('english', :q)
                   ) AS score
            FROM decompositions
            WHERE to_tsvector('english',
                      coalesce(request_text,'') || ' ' || coalesce(request_summary,''))
                  @@ plainto_tsquery('english', :q)
            ORDER BY score DESC
            LIMIT :lim
        """)
        rows = self.db.execute(sql, {"q": q, "lim": limit}).fetchall()
        return [
            {
                "id": str(r.id), "domain": "history",
                "title": r.request_summary or r.request_text[:80],
                "subtitle": f"{r.request_type.replace('_', ' ').title()} · {r.location_id}",
                "url": f"/history/{r.id}",
                "score": float(r.score),
            }
            for r in rows
        ]
