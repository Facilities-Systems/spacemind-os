"""
Integration test fixtures — FastAPI TestClient with in-memory SQLite.

Key design decisions:
1. DATABASE_URL env var must be set BEFORE pydantic-settings is imported,
   otherwise it reads the .env at project root (which points to PostgreSQL).
2. StaticPool is required for in-memory SQLite — without it, each new
   engine connection gets an empty database, so tables created by init_db()
   are invisible to the session used by routes.
3. The module-level `engine` and `SessionLocal` in database.py are patched
   after import so that init_db() (called by lifespan) uses the test engine.
"""
import os
import sys
from pathlib import Path

# ── 1. Override DATABASE_URL BEFORE any spacemind import ───────────────────
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"

# ── 2. Put src/ on the path ─────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

# ── 3. Clear pydantic-settings lru_cache so it picks up the patched env ────
from spacemind.core.config import get_settings  # noqa: E402
get_settings.cache_clear()

# ── 4. Now import everything (engine is built from SQLite URL) ──────────────
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker, Session  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import spacemind.storage.database as _db_module  # noqa: E402
from spacemind.domain.models import Base  # noqa: E402
from spacemind.main import app  # noqa: E402
from spacemind.storage.database import get_db  # noqa: E402


# ── Single shared engine for the test suite (StaticPool = one connection) ──
_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Patch module globals immediately so lifespan's init_db() uses the test DB
_db_module.engine = _test_engine
_db_module.SessionLocal = _TestSession


@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables between tests — guaranteed isolation."""
    Base.metadata.drop_all(_test_engine)
    Base.metadata.create_all(_test_engine)
    yield
    Base.metadata.drop_all(_test_engine)


@pytest.fixture(scope="function")
def db_session(reset_db):
    """Fresh session backed by the shared in-memory engine."""
    session = _TestSession()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(db_session: Session):
    """TestClient with dependency override pointing to the test session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client: TestClient) -> str:
    """Register a facilities_manager user and return a valid JWT."""
    resp = client.post("/auth/register", json={
        "email": "admin@test.com",
        "full_name": "Test Admin",
        "password": "Admin@1234!",
        "role": "facilities_manager",
    })
    assert resp.status_code == 201, f"Register failed: {resp.text}"

    resp = client.post("/auth/login", data={
        "username": "admin@test.com",
        "password": "Admin@1234!",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}
