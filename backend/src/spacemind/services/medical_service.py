"""
SpaceMind OS — Medical Service
Orchestrates medical supply and incident management.
Every write is audit-logged.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from spacemind.domain.models import MedicalIncident, MedicalItem
from spacemind.domain.schemas import (
    IncidentCreate,
    MedicalItemCreate,
    MedicalItemUpdate,
)
from spacemind.services.audit_service import AuditService
from spacemind.storage.repository import MedicalRepository


class MedicalService:
    def __init__(self, db: Session):
        self._repo = MedicalRepository(db)
        self._audit = AuditService(db)

    # ── Medical Items ──────────────────────────────────────────────────────────

    def create_item(self, data: MedicalItemCreate, user_id: str | None = None,
                    user_email: str | None = None) -> MedicalItem:
        item = self._repo.create_item(data)
        self._audit.log(
            action="medical.item.created",
            resource_type="medical_item",
            resource_id=item.id,
            user_id=user_id,
            user_email=user_email,
            details={"name": item.name, "category": item.category, "qty": item.quantity},
        )
        return item

    def get_item(self, item_id: str) -> MedicalItem | None:
        return self._repo.get_item(item_id)

    def list_items(self, category: str | None = None):
        return self._repo.list_items(category=category)

    def update_item(self, item_id: str, data: MedicalItemUpdate,
                    user_id: str | None = None, user_email: str | None = None) -> MedicalItem | None:
        item = self._repo.update_item(item_id, data)
        if item:
            self._audit.log(
                action="medical.item.updated",
                resource_type="medical_item",
                resource_id=item_id,
                user_id=user_id,
                user_email=user_email,
                details=data.model_dump(exclude_none=True),
            )
        return item

    def delete_item(self, item_id: str, user_id: str | None = None,
                    user_email: str | None = None) -> bool:
        deleted = self._repo.delete_item(item_id)
        if deleted:
            self._audit.log(
                action="medical.item.deleted",
                resource_type="medical_item",
                resource_id=item_id,
                user_id=user_id,
                user_email=user_email,
            )
        return deleted

    # ── Incidents ──────────────────────────────────────────────────────────────

    def log_incident(self, data: IncidentCreate, user_id: str | None = None,
                     user_email: str | None = None) -> MedicalIncident:
        incident = self._repo.create_incident(data)
        self._audit.log(
            action="medical.incident.logged",
            resource_type="medical_incident",
            resource_id=incident.id,
            user_id=user_id,
            user_email=user_email,
            details={"type": incident.incident_type, "severity": incident.severity},
        )
        return incident

    def list_incidents(self, status: str | None = None):
        return self._repo.list_incidents(status=status)

    def update_incident_status(self, incident_id: str, status: str,
                                user_id: str | None = None,
                                user_email: str | None = None) -> MedicalIncident | None:
        incident = self._repo.update_incident_status(incident_id, status)
        if incident:
            self._audit.log(
                action=f"medical.incident.{status.lower()}",
                resource_type="medical_incident",
                resource_id=incident_id,
                user_id=user_id,
                user_email=user_email,
                details={"new_status": status},
            )
        return incident

    # ── Analytics ─────────────────────────────────────────────────────────────

    def get_analytics(self) -> dict:
        return self._repo.get_analytics()

    def get_alerts(self, days_ahead: int = 30) -> dict:
        return {
            "expired":       self._repo.get_expired_items(),
            "expiring_soon": self._repo.get_expiring_items(days_ahead=days_ahead),
            "low_stock":     self._repo.get_low_stock_items(),
        }
