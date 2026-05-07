"""Unit tests for SearchService — SQLite mode (dev database)."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))

import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from spacemind.domain.models import Base, InventoryItem, Asset, MedicalItem, DecompositionRecord
from spacemind.services.search_service import SearchService


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    engine.dispose()


def _add_inventory(db, name="Test Compressor", code="CMP-001", category="Electrical", notes="HVAC unit"):
    item = InventoryItem(
        id=str(uuid.uuid4()), name=name, code=code, category=category,
        quantity=5, unit="units", min_level=1, notes=notes,
    )
    db.add(item)
    db.commit()
    return item


def _add_asset(db, name="Air Handling Unit", asset_code="AHU-01", category="HVAC"):
    asset = Asset(
        id=str(uuid.uuid4()), name=name, asset_code=asset_code, category=category,
        status="active", condition_score=8.5, depreciation_method="straight_line",
    )
    db.add(asset)
    db.commit()
    return asset


def _add_medical(db, name="Bandage Roll", category="First Aid"):
    item = MedicalItem(
        id=str(uuid.uuid4()), name=name, category=category,
        quantity=20, unit="units", min_level=5,
    )
    db.add(item)
    db.commit()
    return item


def _add_history(db, text="Move 40 staff from FP1 to FP2"):
    record = DecompositionRecord(
        id=str(uuid.uuid4()), request_text=text, request_type="office_move",
        location_id="JNB-01", priority="normal", request_summary="Office relocation",
        total_tasks=10, result_json={},
    )
    db.add(record)
    db.commit()
    return record


class TestSearchServiceSQLite:
    def test_query_too_short_returns_empty(self, db):
        svc = SearchService(db)
        assert svc.search("a") == []

    def test_empty_query_returns_empty(self, db):
        svc = SearchService(db)
        assert svc.search("") == []

    def test_inventory_name_match(self, db):
        _add_inventory(db, name="Air Compressor", code="CMP-001")
        svc = SearchService(db)
        results = svc.search("compressor")
        assert any(r["domain"] == "inventory" and "Compressor" in r["title"] for r in results)

    def test_inventory_code_match(self, db):
        _add_inventory(db, name="Wrench Set", code="WRN-042")
        svc = SearchService(db)
        results = svc.search("WRN-042")
        assert any(r["domain"] == "inventory" for r in results)

    def test_asset_name_match(self, db):
        _add_asset(db, name="Chiller Unit", asset_code="CHI-01")
        svc = SearchService(db)
        results = svc.search("chiller")
        assert any(r["domain"] == "assets" for r in results)

    def test_medical_name_match(self, db):
        _add_medical(db, name="Antiseptic Wipes")
        svc = SearchService(db)
        results = svc.search("antiseptic")
        assert any(r["domain"] == "medical" for r in results)

    def test_history_text_match(self, db):
        _add_history(db, text="Full renovation of canteen kitchen area")
        svc = SearchService(db)
        results = svc.search("renovation")
        assert any(r["domain"] == "history" for r in results)

    def test_domain_filter_limits_scope(self, db):
        _add_inventory(db, name="Pipe Wrench")
        _add_asset(db, name="Pipe Pump", asset_code="PP-01")
        svc = SearchService(db)
        results = svc.search("pipe", domains=["inventory"])
        assert all(r["domain"] == "inventory" for r in results)

    def test_no_match_returns_empty(self, db):
        _add_inventory(db, name="Hammer")
        svc = SearchService(db)
        results = svc.search("xyznonexistentterm")
        assert results == []

    def test_limit_respected(self, db):
        for i in range(10):
            _add_inventory(db, name=f"Widget {i}", code=f"WGT-{i:03d}")
        svc = SearchService(db)
        results = svc.search("widget", limit=3)
        assert len(results) <= 3

    def test_result_has_required_fields(self, db):
        _add_inventory(db, name="Test Item")
        svc = SearchService(db)
        results = svc.search("test")
        assert results, "Expected at least one result"
        r = results[0]
        for field in ("id", "domain", "title", "subtitle", "url", "score"):
            assert field in r, f"Missing field: {field}"

    def test_result_url_correct_for_inventory(self, db):
        _add_inventory(db, name="Condenser Coil")
        svc = SearchService(db)
        results = svc.search("condenser")
        inv = [r for r in results if r["domain"] == "inventory"]
        assert inv and inv[0]["url"] == "/storeroom"

    def test_result_url_correct_for_assets(self, db):
        _add_asset(db, name="Generator Unit", asset_code="GEN-01")
        svc = SearchService(db)
        results = svc.search("generator")
        assets = [r for r in results if r["domain"] == "assets"]
        assert assets and assets[0]["url"] == "/assets"

    def test_result_url_correct_for_medical(self, db):
        _add_medical(db, name="Eye Wash Station")
        svc = SearchService(db)
        results = svc.search("eye wash")
        med = [r for r in results if r["domain"] == "medical"]
        assert med and med[0]["url"] == "/medical"

    def test_history_url_contains_id(self, db):
        rec = _add_history(db, text="Emergency roof repair required urgently")
        svc = SearchService(db)
        results = svc.search("emergency roof")
        hist = [r for r in results if r["domain"] == "history"]
        assert hist and hist[0]["url"] == f"/history/{rec.id}"
