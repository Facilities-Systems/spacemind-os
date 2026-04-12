"""
Integration tests — Inventory API.
Covers: create item → sign-out → return → analytics → compliance.
"""
import pytest
from fastapi.testclient import TestClient


ITEM_PAYLOAD = {
    "name": "Cordless Drill 18V",
    "code": "TOOL-001",
    "category": "Tools",
    "quantity": 5.0,
    "unit": "units",
    "min_level": 2.0,
    "location": "Shelf A1",
}


def test_create_item(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/inventory/items", json=ITEM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "TOOL-001"
    assert data["quantity"] == 5.0


def test_create_duplicate_item_returns_409(client: TestClient, auth_headers: dict):
    client.post("/api/v1/inventory/items", json=ITEM_PAYLOAD, headers=auth_headers)
    resp = client.post("/api/v1/inventory/items", json=ITEM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 409


def test_list_items(client: TestClient, auth_headers: dict):
    client.post("/api/v1/inventory/items", json=ITEM_PAYLOAD, headers=auth_headers)
    resp = client.get("/api/v1/inventory/items", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_list_items_requires_auth(client: TestClient):
    resp = client.get("/api/v1/inventory/items")
    assert resp.status_code == 401


def test_sign_out_and_return(client: TestClient, auth_headers: dict):
    # Create item
    item_resp = client.post("/api/v1/inventory/items", json=ITEM_PAYLOAD, headers=auth_headers)
    item_id = item_resp.json()["id"]

    # Sign out
    tx_resp = client.post("/api/v1/inventory/transactions", json={
        "item_id": item_id,
        "quantity": 1.0,
        "borrower": "John Doe",
        "department": "Maintenance",
        "work_order": "WO-2026-001",
    }, headers=auth_headers)
    assert tx_resp.status_code == 201
    tx = tx_resp.json()
    assert tx["status"] == "Outstanding"
    tx_id = tx["id"]

    # Return
    return_resp = client.patch(
        f"/api/v1/inventory/transactions/{tx_id}/return",
        headers=auth_headers,
    )
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "Returned"


def test_inventory_analytics(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/inventory/analytics", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_items" in data


def test_create_requisition(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/inventory/requisitions", json={
        "requester": "Jane Smith",
        "role": "Technician",
        "department": "Electrical",
        "items_description": "Need 10x LED bulbs 9W",
        "priority": "High",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["status"] == "Pending"
