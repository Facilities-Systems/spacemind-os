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

    def predict_maintenance_need(self, asset_id: str) -> dict:
        """Return a 0–100 risk score based on condition trend, days since maintenance, and frequency."""
        asset = self._repo.get_asset(asset_id)
        if not asset:
            return {"asset_id": asset_id, "risk_score": 0, "risk_level": "unknown"}

        history = self._repo.get_maintenance_history(asset_id)
        now = datetime.now(UTC)

        # Days since last maintenance (max 365)
        days_since = 365
        if asset.last_maintained_at:
            days_since = min(365, (now - asset.last_maintained_at.replace(tzinfo=UTC)).days)

        # Days overdue (0 if not scheduled)
        overdue_days = 0
        if asset.next_maintenance_due:
            diff = (now - asset.next_maintenance_due.replace(tzinfo=UTC)).days
            overdue_days = max(0, diff)

        # Condition decay factor (10 = perfect, 0 = critical)
        condition_factor = max(0.0, 10.0 - float(asset.condition_score or 10.0))

        # Maintenance frequency in last 12 months
        twelve_months_ago = now.replace(year=now.year - 1)
        recent_events = sum(
            1 for h in history
            if h.performed_at and h.performed_at.replace(tzinfo=UTC) >= twelve_months_ago
        )

        # Weighted risk score 0–100
        score = min(100, int(
            (days_since / 365) * 30 +       # 30% weight: time since maintenance
            (overdue_days / 30) * 25 +       # 25% weight: overdue days (cap at 30)
            condition_factor * 4 +           # 40% weight: condition (0–10 * 4 = 0–40)
            max(0, (4 - recent_events)) * 5  # 5% weight: low maintenance frequency
        ))

        risk_level = "low" if score < 30 else "medium" if score < 60 else "high"
        return {
            "asset_id": asset_id,
            "asset_name": str(asset.name),
            "asset_code": str(asset.asset_code),
            "category": str(asset.category),
            "risk_score": score,
            "risk_level": risk_level,
            "condition_score": float(asset.condition_score or 10.0),
            "days_since_maintenance": days_since,
            "overdue_days": overdue_days,
            "recent_maintenance_count": recent_events,
        }

    def get_maintenance_schedule(self) -> list:
        """All active assets sorted by next_maintenance_due, due within 60 days."""
        assets = self._repo.list_assets(status="active")
        now = datetime.now(UTC)
        cutoff = now.replace(day=now.day)
        schedule = []
        for asset in assets:
            if asset.next_maintenance_due:
                due = asset.next_maintenance_due.replace(tzinfo=UTC)
                days_until = (due - now).days
                if days_until <= 60:
                    schedule.append({
                        "asset_id": str(asset.id),
                        "asset_name": str(asset.name),
                        "asset_code": str(asset.asset_code),
                        "category": str(asset.category),
                        "next_maintenance_due": asset.next_maintenance_due.isoformat(),
                        "days_until_due": days_until,
                        "condition_score": float(asset.condition_score or 10.0),
                        "overdue": days_until < 0,
                    })
        return sorted(schedule, key=lambda x: x["days_until_due"])

    def get_risk_report(self) -> list:
        """Risk score for every active asset, sorted by score descending."""
        assets = self._repo.list_assets(status="active")
        results = [self.predict_maintenance_need(str(a.id)) for a in assets]
        return sorted(results, key=lambda x: x["risk_score"], reverse=True)

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
