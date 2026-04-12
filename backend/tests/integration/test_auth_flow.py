"""
Integration tests — Authentication flow.
Covers: register → login → /me → user management (admin).
"""
import pytest
from fastapi.testclient import TestClient


def test_register_returns_user(client: TestClient):
    resp = client.post("/auth/register", json={
        "email": "user@example.com",
        "full_name": "Alice FM",
        "password": "Secure@1234!",
        "role": "facilities_manager",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "user@example.com"
    assert data["role"] == "facilities_manager"
    assert data["is_active"] is True
    assert "hashed_password" not in data


def test_register_duplicate_email_returns_409(client: TestClient):
    payload = {"email": "dup@example.com", "full_name": "Bob", "password": "Pass@1234!", "role": "viewer"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_cannot_self_assign_admin(client: TestClient):
    """Security: self-registration with role=admin must be demoted to viewer."""
    resp = client.post("/auth/register", json={
        "email": "hacker@example.com",
        "full_name": "Hacker",
        "password": "Pass@1234!",
        "role": "admin",
    })
    assert resp.status_code == 201
    assert resp.json()["role"] == "viewer"


def test_login_returns_token(client: TestClient):
    client.post("/auth/register", json={
        "email": "login@test.com", "full_name": "Login User",
        "password": "Pass@1234!", "role": "viewer",
    })
    resp = client.post("/auth/login", data={"username": "login@test.com", "password": "Pass@1234!"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "login@test.com"


def test_login_wrong_password_returns_401(client: TestClient):
    client.post("/auth/register", json={
        "email": "badpass@test.com", "full_name": "Bad Pass",
        "password": "Correct@1234!", "role": "viewer",
    })
    resp = client.post("/auth/login", data={"username": "badpass@test.com", "password": "WRONG"})
    assert resp.status_code == 401


def test_me_returns_current_user(client: TestClient, auth_headers: dict):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"


def test_me_without_token_returns_401(client: TestClient):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_list_users_requires_admin(client: TestClient, auth_headers: dict):
    """facilities_manager role should NOT have access to /auth/users (admin only)."""
    resp = client.get("/auth/users", headers=auth_headers)
    # facilities_manager registered in conftest — should be 403
    assert resp.status_code == 403
