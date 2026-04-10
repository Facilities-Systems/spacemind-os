"""Unit tests for DecompositionRepository — using in-memory SQLite."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from spacemind.domain.models import Base
from spacemind.domain.schemas import DecompositionResult, LocationContext, Phase, TaskItem, ResponsibleParty
from spacemind.core.constants import RequestType, TenureType, ResponsiblePartyType, RiskLevel, PhaseStatus
from spacemind.storage.repository import DecompositionRepository


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def make_result() -> DecompositionResult:
    return DecompositionResult(
        request_summary="Move 40 staff from FP1 to FP2",
        original_request="Move 40 staff from FP1 to FP2",
        request_type=RequestType.OFFICE_MOVE,
        priority="high",
        location_context=LocationContext(
            location_id="FP2_SouthAfrica",
            tenure=TenureType.RENTED,
            country="South Africa",
            landlord_approval_required=True,
        ),
        phases=[
            Phase(
                name="Preparation",
                order=1,
                tasks=[
                    TaskItem(
                        id="t01",
                        name="Survey target space",
                        responsible=ResponsibleParty(party=ResponsiblePartyType.INTERNAL),
                        estimated_duration_hours=4.0,
                        risk_level=RiskLevel.LOW,
                        status=PhaseStatus.PENDING,
                        landlord_approval_required=False,
                    )
                ],
            )
        ],
    )


def test_save_and_get_by_id(db):
    repo = DecompositionRepository(db)
    result = make_result()
    repo.save(result, request_text=result.original_request)

    fetched = repo.get_by_id(result.id)
    assert fetched is not None
    assert fetched.request_type == "office_move"
    assert fetched.location_id == "FP2_SouthAfrica"
    assert fetched.total_tasks == 1


def test_get_by_id_returns_none_for_unknown(db):
    repo = DecompositionRepository(db)
    assert repo.get_by_id("nonexistent-id") is None


def test_list_filtered_returns_all(db):
    repo = DecompositionRepository(db)
    repo.save(make_result(), "request one")
    repo.save(make_result(), "request two")
    records = repo.list_filtered(limit=10)
    assert len(records) == 2


def test_list_filtered_by_request_type(db):
    repo = DecompositionRepository(db)
    repo.save(make_result(), "move request")
    records = repo.list_filtered(request_type="office_move")
    assert len(records) == 1
    records_none = repo.list_filtered(request_type="maintenance")
    assert len(records_none) == 0


def test_list_filtered_by_priority(db):
    repo = DecompositionRepository(db)
    repo.save(make_result(), "high priority move")
    assert len(repo.list_filtered(priority="high")) == 1
    assert len(repo.list_filtered(priority="low")) == 0


def test_count_filtered(db):
    repo = DecompositionRepository(db)
    repo.save(make_result(), "one")
    repo.save(make_result(), "two")
    assert repo.count_filtered() == 2
    assert repo.count_filtered(request_type="office_move") == 2
    assert repo.count_filtered(request_type="maintenance") == 0


def test_to_summary(db):
    repo = DecompositionRepository(db)
    result = make_result()
    record = repo.save(result, "move request")
    summary = repo.to_summary(record)
    assert summary.request_type == "office_move"
    assert summary.total_tasks == 1
    assert summary.priority == "high"
