"""Integration tests — Search API (GET /api/v1/search)."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def seed_data(client: TestClient, auth_headers: dict):
    """Seed inventory and medical items before each test."""
    client.post("/api/v1/inventory/items", json={
        "name": "Copper Pipe 15mm",
        "code": "PLB-001",
        "category": "Plumbing",
        "quantity": 25.0,
        "unit": "metres",
        "min_level": 5.0,
    }, headers=auth_headers)

    client.post("/api/v1/inventory/items", json={
        "name": "Electrical Conduit 20mm",
        "code": "ELC-001",
        "category": "Electrical",
        "quantity": 50.0,
        "unit": "metres",
        "min_level": 10.0,
    }, headers=auth_headers)

    client.post("/api/v1/medical/items", json={
        "name": "Latex Gloves",
        "category": "PPE",
        "quantity": 100,
        "unit": "pairs",
        "min_level": 20,
    }, headers=auth_headers)


def test_search_requires_auth(client: TestClient):
    resp = client.get("/api/v1/search", params={"q": "pipe"})
    assert resp.status_code == 401


def test_search_q_too_short_returns_422(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "a"}, headers=auth_headers)
    assert resp.status_code == 422


def test_search_returns_inventory_result(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "copper"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "copper"
    assert any(r["domain"] == "inventory" for r in data["results"])


def test_search_returns_inventory_result_by_category(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "electrical"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert any(r["domain"] == "inventory" for r in data["results"])


def test_search_returns_medical_result(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "latex gloves"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert any(r["domain"] == "medical" for r in data["results"])


def test_search_domain_filter(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "pipe", "domains": "inventory"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert all(r["domain"] == "inventory" for r in data["results"])


def test_search_result_shape(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "copper"}, headers=auth_headers)
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert results
    r = results[0]
    for field in ("id", "domain", "title", "subtitle", "url", "score"):
        assert field in r, f"Missing field: {field}"


def test_search_no_match_returns_empty_list(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "xyznotfound"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["results"] == []
    assert resp.json()["total"] == 0


def test_search_limit_param(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/search", params={"q": "copper pipe", "limit": 1}, headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["results"]) <= 1
