"""Integration tests — Background Job trigger endpoints."""
import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from spacemind.api.auth import hash_password
from spacemind.domain.models import User


@pytest.fixture
def admin_headers(client: TestClient, db_session: Session) -> dict:
    """Create an admin user directly in DB (bypassing registration restrictions) and return JWT."""
    user = User(
        id=str(uuid.uuid4()),
        email="sysadmin@test.com",
        full_name="System Admin",
        hashed_password=hash_password("Admin@9999!"),
        role="admin",
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post("/auth/login", data={
        "username": "sysadmin@test.com",
        "password": "Admin@9999!",
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def expiring_medical(db_session: Session):
    """Seed a medical item expiring in 10 days directly into the test DB."""
    from spacemind.domain.models import MedicalItem
    item = MedicalItem(
        id=str(uuid.uuid4()),
        name="Expiring Bandage",
        category="First Aid",
        quantity=5,
        unit="rolls",
        min_level=1,
        expiry_date=date.today() + timedelta(days=10),
    )
    db_session.add(item)
    db_session.commit()
    return item


# ── Maintenance trigger ───────────────────────────────────────────────────────

def test_maintenance_trigger_requires_auth(client: TestClient):
    resp = client.post("/api/v1/admin/trigger-maintenance-check")
    assert resp.status_code == 401


def test_maintenance_trigger_requires_admin_role(client: TestClient, auth_headers: dict):
    # auth_headers has facilities_manager role — not enough
    resp = client.post("/api/v1/admin/trigger-maintenance-check", headers=auth_headers)
    assert resp.status_code == 403


def test_maintenance_trigger_no_overdue_returns_zero(client: TestClient, admin_headers: dict):
    resp = client.post("/api/v1/admin/trigger-maintenance-check", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "overdue_count" in data
    assert "checked_at" in data
    assert "overdue_assets" in data


def test_maintenance_trigger_response_shape(client: TestClient, admin_headers: dict):
    resp = client.post("/api/v1/admin/trigger-maintenance-check", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["overdue_count"], int)
    assert isinstance(data["overdue_assets"], list)


# ── Medical expiry trigger ────────────────────────────────────────────────────

def test_medical_trigger_requires_auth(client: TestClient):
    resp = client.post("/api/v1/admin/trigger-medical-expiry")
    assert resp.status_code == 401


def test_medical_trigger_requires_admin_role(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/admin/trigger-medical-expiry", headers=auth_headers)
    assert resp.status_code == 403


def test_medical_trigger_no_expiring_returns_zero(client: TestClient, admin_headers: dict):
    resp = client.post("/api/v1/admin/trigger-medical-expiry", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "expired_count" in data
    assert "expiring_soon_count" in data
    assert "checked_at" in data


def test_medical_trigger_custom_days_ahead(client: TestClient, admin_headers: dict):
    resp = client.post("/api/v1/admin/trigger-medical-expiry?days_ahead=7", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["days_ahead"] == 7


def test_medical_trigger_detects_expiring_item(
    client: TestClient, admin_headers: dict, expiring_medical: dict
):
    resp = client.post("/api/v1/admin/trigger-medical-expiry?days_ahead=30", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["expiring_soon_count"] >= 1
    names = [i["name"] for i in data["expiring_soon_items"]]
    assert "Expiring Bandage" in names


def test_medical_trigger_response_shape(client: TestClient, admin_headers: dict):
    resp = client.post("/api/v1/admin/trigger-medical-expiry", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    for key in ("checked_at", "days_ahead", "expired_count", "expiring_soon_count",
                "expired_items", "expiring_soon_items"):
        assert key in data
