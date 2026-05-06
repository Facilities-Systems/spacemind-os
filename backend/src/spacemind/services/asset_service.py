"""
SpaceMind OS — Asset Lifecycle Service
Handles depreciation calculation, condition trending, and AI repair-vs-replace analysis.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from spacemind.ai.client import AIClient
from spacemind.core.config import settings
from spacemind.domain.models import Asset, AssetMaintenanceLog
from spacemind.domain.schemas import AssetCreate, AssetUpdate, MaintenanceLogCreate
from spacemind.services.audit_service import AuditService
from spacemind.storage.repository import AssetRepository


class AssetService:
    def __init__(self, db: Session):
        self._repo = AssetRepository(db)
        self._audit = AuditService(db)
        self._ai = AIClient()

    # ── CRUD ──────────────────────────────────────────────────────────────────

    def create_asset(self, data: AssetCreate, user_id: str | None = None,
                     user_email: str | None = None) -> Asset:
        asset = self._repo.create_asset(data)
        self._audit.log(
            action="asset.created",
            resource_type="asset",
            resource_id=str(asset.id),
            user_id=user_id,
            user_email=user_email,
            details={"code": asset.asset_code, "name": asset.name, "category": asset.category},
        )
        return asset

    def get_asset(self, asset_id: str) -> Asset | None:
        return self._repo.get_asset(asset_id)

    def list_assets(self, category: str | None = None, status: str | None = None,
                    location_id: str | None = None):
        return self._repo.list_assets(category=category, status=status, location_id=location_id)

    def update_asset(self, asset_id: str, data: AssetUpdate,
                     user_id: str | None = None, user_email: str | None = None) -> Asset | None:
        asset = self._repo.update_asset(asset_id, data)
        if asset:
            self._audit.log(
                action="asset.updated",
                resource_type="asset",
                resource_id=asset_id,
                user_id=user_id,
                user_email=user_email,
                details=data.model_dump(exclude_none=True),
            )
        return asset

    def decommission_asset(self, asset_id: str, user_id: str | None = None,
                            user_email: str | None = None) -> bool:
        ok = self._repo.decommission_asset(asset_id)
        if ok:
            self._audit.log(
                action="asset.decommissioned",
                resource_type="asset",
                resource_id=asset_id,
                user_id=user_id,
                user_email=user_email,
            )
        return ok

    # ── Maintenance log ───────────────────────────────────────────────────────

    def log_maintenance(self, asset_id: str, data: MaintenanceLogCreate,
                        user_id: str | None = None, user_email: str | None = None) -> AssetMaintenanceLog | None:
        log_entry = self._repo.add_maintenance_log(asset_id, data, created_by=user_id)
        if log_entry:
            self._audit.log(
                action="asset.maintenance.logged",
                resource_type="asset_maintenance_log",
                resource_id=str(log_entry.id),
                user_id=user_id,
                user_email=user_email,
                details={"asset_id": asset_id, "type": data.maintenance_type, "cost": data.cost},
            )
        return log_entry

    def get_maintenance_history(self, asset_id: str) -> list[AssetMaintenanceLog]:
        return self._repo.get_maintenance_history(asset_id)

    # ── Analytics ─────────────────────────────────────────────────────────────

    def get_analytics(self) -> dict:
        return self._repo.get_analytics()

    def calculate_current_value(self, asset: Asset) -> float | None:
        if not asset.purchase_cost or not asset.purchase_date or not asset.useful_life_years:
            return asset.current_value
        age_years = (datetime.now(UTC) - asset.purchase_date.replace(tzinfo=UTC)).days / 365.25
        remaining_pct = max(0.0, 1.0 - (age_years / asset.useful_life_years))
        return round(asset.purchase_cost * remaining_pct, 2)

    # ── AI analysis ───────────────────────────────────────────────────────────

    def analyse_with_ai(self, asset_id: str) -> str:
        asset = self._repo.get_asset(asset_id)
        if not asset:
            return "Asset not found."
        history = self._repo.get_maintenance_history(asset_id)
        current_val = self.calculate_current_value(asset)

        history_text = "\n".join(
            f"- {log.performed_at}: {log.maintenance_type} — {log.description}"
            f" (cost: R{log.cost or 0:.0f}, condition after: {log.condition_after or '?'}/10)"
            for log in history[-10:]
        ) or "No maintenance history recorded."

        prompt = f"""You are a Facilities Management expert. Analyse this asset and recommend REPAIR or REPLACE.

Asset: {asset.name} ({asset.asset_code})
Category: {asset.category}
Status: {asset.status}
Condition score: {asset.condition_score}/10
Purchase cost: R{asset.purchase_cost or '?'}
Estimated current value: R{current_val or '?'}
Useful life: {asset.useful_life_years or '?'} years
Last maintained: {asset.last_maintained_at or 'Never'}
Next maintenance due: {asset.next_maintenance_due or 'Not scheduled'}

Maintenance history (last 10 events):
{history_text}

Provide:
1. RECOMMENDATION: REPAIR or REPLACE (bold, first line)
2. Reasoning (2-3 sentences, specific to this asset's data)
3. Estimated cost implication
4. Suggested next action with timeline

Be specific and quantitative where data permits."""

        system = "You are a Facilities Management expert providing concise, data-driven asset lifecycle recommendations."
        text, _ = self._ai._call(system=system, user_message=prompt, model=settings.primary_model, max_tokens=500)
        return text
