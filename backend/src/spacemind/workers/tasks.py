"""
SpaceMind OS — Background Tasks
Two daily beat tasks, both also callable on-demand via admin API.
Core logic is in plain functions (Session-injected) so they're testable without Celery.
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from spacemind.core.logging import log
from spacemind.domain.models import Asset, AuditLog, MedicalItem
from spacemind.storage.database import SessionLocal
from spacemind.workers.celery_app import celery_app


# ─── Pure business logic (testable, Celery-independent) ─────────────────────

def run_maintenance_check(db: Session) -> dict[str, Any]:
    """
    Find assets whose next_maintenance_due has passed and are not decommissioned.
    Writes a structured audit log entry per overdue asset.
    Returns summary dict for the caller.
    """
    now = datetime.now(UTC).replace(tzinfo=None)

    overdue: list[Asset] = (
        db.query(Asset)
        .filter(
            Asset.next_maintenance_due.isnot(None),
            Asset.next_maintenance_due < now,
            Asset.status != "decommissioned",
        )
        .all()
    )

    for asset in overdue:
        days_overdue = (now - asset.next_maintenance_due).days  # type: ignore[operator]
        log.warning(
            "[MaintenanceAlert] Asset '%s' (%s) overdue by %d day(s) — due %s",
            asset.name,
            asset.asset_code,
            days_overdue,
            asset.next_maintenance_due,
        )
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            user_id=None,
            user_email="system@spacemind",
            action="maintenance.alert",
            resource_type="asset",
            resource_id=asset.id,
            details={
                "asset_name": asset.name,
                "asset_code": asset.asset_code,
                "category": asset.category,
                "days_overdue": days_overdue,
                "next_maintenance_due": str(asset.next_maintenance_due),
                "condition_score": asset.condition_score,
            },
        ))

    db.commit()
    log.info("[MaintenanceAlert] Check complete: %d overdue asset(s)", len(overdue))
    return {
        "checked_at": now.isoformat(),
        "overdue_count": len(overdue),
        "overdue_assets": [
            {
                "id": a.id,
                "name": a.name,
                "asset_code": a.asset_code,
                "days_overdue": (now - a.next_maintenance_due).days,  # type: ignore[operator]
            }
            for a in overdue
        ],
    }


def run_medical_expiry_check(db: Session, days_ahead: int = 30) -> dict[str, Any]:
    """
    Find medical items that have expired or will expire within `days_ahead` days.
    Writes a structured audit log entry per affected item.
    Returns summary dict for the caller.
    """
    today = date.today()
    threshold = today + timedelta(days=days_ahead)

    expiring: list[MedicalItem] = (
        db.query(MedicalItem)
        .filter(
            MedicalItem.expiry_date.isnot(None),
            MedicalItem.expiry_date <= threshold,
        )
        .order_by(MedicalItem.expiry_date)
        .all()
    )

    expired  = [i for i in expiring if i.expiry_date < today]   # type: ignore[operator]
    soon     = [i for i in expiring if i.expiry_date >= today]  # type: ignore[operator]

    for item in expiring:
        days_diff = (item.expiry_date - today).days              # type: ignore[operator]
        status = "EXPIRED" if days_diff < 0 else f"expiring in {days_diff}d"
        log.warning(
            "[MedicalExpiry] '%s' — %s (qty=%d, category=%s)",
            item.name, status, item.quantity, item.category,
        )
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            user_id=None,
            user_email="system@spacemind",
            action="medical.expiry_alert",
            resource_type="medical_item",
            resource_id=item.id,
            details={
                "item_name": item.name,
                "category": item.category,
                "expiry_date": str(item.expiry_date),
                "days_until_expiry": days_diff,
                "quantity": item.quantity,
                "unit": item.unit,
            },
        ))

    db.commit()
    log.info(
        "[MedicalExpiry] Check complete: %d expired, %d expiring within %d day(s)",
        len(expired), len(soon), days_ahead,
    )
    return {
        "checked_at": today.isoformat(),
        "days_ahead": days_ahead,
        "expired_count": len(expired),
        "expiring_soon_count": len(soon),
        "expired_items": [
            {"id": i.id, "name": i.name, "expiry_date": str(i.expiry_date), "quantity": i.quantity}
            for i in expired
        ],
        "expiring_soon_items": [
            {"id": i.id, "name": i.name, "expiry_date": str(i.expiry_date), "quantity": i.quantity}
            for i in soon
        ],
    }


# ─── Celery tasks (thin wrappers — open a session, call logic, close) ────────

@celery_app.task(
    name="spacemind.workers.tasks.check_maintenance_alerts",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def check_maintenance_alerts(self) -> dict[str, Any]:  # type: ignore[override]
    db = SessionLocal()
    try:
        return run_maintenance_check(db)
    except Exception as exc:
        log.error("[MaintenanceAlert] Task failed: %s — retrying", exc)
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(
    name="spacemind.workers.tasks.check_medical_expiry",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def check_medical_expiry(self, days_ahead: int = 30) -> dict[str, Any]:  # type: ignore[override]
    db = SessionLocal()
    try:
        return run_medical_expiry_check(db, days_ahead=days_ahead)
    except Exception as exc:
        log.error("[MedicalExpiry] Task failed: %s — retrying", exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
