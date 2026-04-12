"""
Integration tests — Medical API.
Covers: create medical item → log incident → resolve incident → analytics.
"""
import pytest
from fastapi.testclient import TestClient


MEDICAL_ITEM = {
    "name": "Paracetamol 500mg",
    "category": "Medication",
    "quantity": 50,
    "unit": "tablets",
    "min_level": 20,
    "location": "First Aid Cabinet",
}


def test_create_medical_item(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/medical/items", json=MEDICAL_ITEM, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Paracetamol 500mg"
    assert data["quantity"] == 50


def test_list_medical_items(client: TestClient, auth_headers: dict):
    client.post("/api/v1/medical/items", json=MEDICAL_ITEM, headers=auth_headers)
    resp = client.get("/api/v1/medical/items", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_log_incident(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/medical/incidents", json={
        "incident_type": "Minor injury",
        "severity": "Low",
        "employee_name": "Bob Builder",
        "department": "Maintenance",
        "description": "Cut finger on sharp edge while installing shelving.",
        "treatment": "Applied antiseptic and bandage.",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "Open"
    return data["id"]


def test_resolve_incident(client: TestClient, auth_headers: dict):
    # Log
    inc_resp = client.post("/api/v1/medical/incidents", json={
        "incident_type": "Headache",
        "severity": "Low",
        "employee_name": "Alice",
        "department": "HR",
        "description": "Employee reported headache.",
        "treatment": "Administered paracetamol, rested 30 min.",
    }, headers=auth_headers)
    assert inc_resp.status_code == 201
    inc_id = inc_resp.json()["id"]

    # Resolve
    resp = client.patch(
        f"/api/v1/medical/incidents/{inc_id}/status",
        json={"status": "Resolved"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Resolved"


def test_medical_analytics(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/medical/analytics", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "open_incidents" in data
    assert "total_items" in data


def test_medical_requires_auth(client: TestClient):
    resp = client.get("/api/v1/medical/items")
    assert resp.status_code == 401
