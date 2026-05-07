"""
Unit tests for background task business logic.
No Celery, no Redis, no FastAPI — pure functions with in-memory SQLite.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from spacemind.domain.models import Asset, AuditLog, Base, MedicalItem
from spacemind.workers.tasks import run_maintenance_check, run_medical_expiry_check


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    engine.dispose()


def _asset(db, name="Pump", code="PMP-01", status="active", days_overdue=None, days_ahead=None):
    """Helper: create an asset. days_overdue → already past due; days_ahead → future due."""
    if days_overdue is not None:
        due = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days_overdue)
    elif days_ahead is not None:
        due = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=days_ahead)
    else:
        due = None
    asset = Asset(
        id=str(uuid.uuid4()), name=name, asset_code=code, category="HVAC",
        status=status, condition_score=7.0, depreciation_method="straight_line",
        next_maintenance_due=due,
    )
    db.add(asset)
    db.commit()
    return asset


def _medical(db, name="Bandage", category="First Aid", days_until_expiry=None):
    """Helper: create a medical item. Negative days_until_expiry → already expired."""
    if days_until_expiry is not None:
        expiry = date.today() + timedelta(days=days_until_expiry)
    else:
        expiry = None
    item = MedicalItem(
        id=str(uuid.uuid4()), name=name, category=category,
        quantity=10, unit="units", min_level=2, expiry_date=expiry,
    )
    db.add(item)
    db.commit()
    return item


# ── Maintenance check ─────────────────────────────────────────────────────────

class TestMaintenanceCheck:
    def test_no_assets_returns_zero(self, db):
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 0
        assert result["overdue_assets"] == []

    def test_overdue_asset_detected(self, db):
        _asset(db, name="Chiller", code="CHL-01", days_overdue=5)
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 1
        assert result["overdue_assets"][0]["name"] == "Chiller"
        assert result["overdue_assets"][0]["days_overdue"] >= 5

    def test_future_due_asset_not_flagged(self, db):
        _asset(db, name="Generator", code="GEN-01", days_ahead=30)
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 0

    def test_no_due_date_not_flagged(self, db):
        _asset(db, name="Ladder", code="LAD-01")
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 0

    def test_decommissioned_asset_excluded(self, db):
        _asset(db, name="Old Unit", code="OLD-01", status="decommissioned", days_overdue=10)
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 0

    def test_multiple_overdue_assets(self, db):
        _asset(db, name="Pump A", code="PA-01", days_overdue=2)
        _asset(db, name="Pump B", code="PB-01", days_overdue=10)
        _asset(db, name="Future", code="FT-01", days_ahead=7)
        result = run_maintenance_check(db)
        assert result["overdue_count"] == 2

    def test_audit_log_written_per_overdue_asset(self, db):
        _asset(db, name="Fan Unit", code="FAN-01", days_overdue=3)
        run_maintenance_check(db)
        logs = db.query(AuditLog).filter(AuditLog.action == "maintenance.alert").all()
        assert len(logs) == 1
        assert logs[0].resource_type == "asset"
        assert logs[0].details["asset_name"] == "Fan Unit"

    def test_result_contains_checked_at(self, db):
        result = run_maintenance_check(db)
        assert "checked_at" in result

    def test_running_twice_writes_two_sets_of_audit_logs(self, db):
        _asset(db, name="Boiler", code="BLR-01", days_overdue=1)
        run_maintenance_check(db)
        run_maintenance_check(db)
        logs = db.query(AuditLog).filter(AuditLog.action == "maintenance.alert").all()
        assert len(logs) == 2


# ── Medical expiry check ──────────────────────────────────────────────────────

class TestMedicalExpiryCheck:
    def test_no_items_returns_zero(self, db):
        result = run_medical_expiry_check(db)
        assert result["expired_count"] == 0
        assert result["expiring_soon_count"] == 0

    def test_expired_item_detected(self, db):
        _medical(db, name="Old Gauze", days_until_expiry=-5)
        result = run_medical_expiry_check(db)
        assert result["expired_count"] == 1
        assert result["expiring_soon_count"] == 0

    def test_expiring_soon_detected(self, db):
        _medical(db, name="Bandage", days_until_expiry=10)
        result = run_medical_expiry_check(db, days_ahead=30)
        assert result["expiring_soon_count"] == 1
        assert result["expired_count"] == 0

    def test_item_far_in_future_not_flagged(self, db):
        _medical(db, name="Fresh Gloves", days_until_expiry=90)
        result = run_medical_expiry_check(db, days_ahead=30)
        assert result["expired_count"] == 0
        assert result["expiring_soon_count"] == 0

    def test_no_expiry_date_not_flagged(self, db):
        _medical(db, name="No Date Item")
        result = run_medical_expiry_check(db)
        assert result["expired_count"] == 0
        assert result["expiring_soon_count"] == 0

    def test_days_ahead_boundary(self, db):
        _medical(db, name="On Boundary", days_until_expiry=30)
        result = run_medical_expiry_check(db, days_ahead=30)
        assert result["expiring_soon_count"] == 1

    def test_days_ahead_just_outside_boundary(self, db):
        _medical(db, name="Just Outside", days_until_expiry=31)
        result = run_medical_expiry_check(db, days_ahead=30)
        assert result["expiring_soon_count"] == 0

    def test_audit_log_written_per_expiring_item(self, db):
        _medical(db, name="Ibuprofen", days_until_expiry=5)
        run_medical_expiry_check(db)
        logs = db.query(AuditLog).filter(AuditLog.action == "medical.expiry_alert").all()
        assert len(logs) == 1
        assert logs[0].details["item_name"] == "Ibuprofen"

    def test_mixed_expired_and_expiring(self, db):
        _medical(db, name="Expired", days_until_expiry=-10)
        _medical(db, name="Soon", days_until_expiry=15)
        _medical(db, name="Fine", days_until_expiry=60)
        result = run_medical_expiry_check(db, days_ahead=30)
        assert result["expired_count"] == 1
        assert result["expiring_soon_count"] == 1

    def test_result_shape(self, db):
        _medical(db, name="Test Item", days_until_expiry=-1)
        result = run_medical_expiry_check(db)
        for key in ("checked_at", "days_ahead", "expired_count", "expiring_soon_count",
                    "expired_items", "expiring_soon_items"):
            assert key in result
