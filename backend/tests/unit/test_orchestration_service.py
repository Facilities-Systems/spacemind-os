"""Unit tests for OrchestrationService and _sse helper."""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from spacemind.core.config import settings
from spacemind.core.constants import RequestType, TenureType, ResponsiblePartyType, RiskLevel, PhaseStatus
from spacemind.domain.models import Base
from spacemind.domain.schemas import (
    DecompositionRequest,
    DecompositionResult,
    LocationContext,
    Phase,
    ResponsibleParty,
    TaskItem,
)
from spacemind.services.orchestration_service import _sse, OrchestrationService


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def make_request() -> DecompositionRequest:
    return DecompositionRequest(
        request_text="Move 40 staff from FP1 to FP2 within 6 weeks",
        location_id="FP2_SouthAfrica",
        priority="high",
    )


def make_mock_result() -> DecompositionResult:
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


# ── _sse() helper ────────────────────────────────────────────────────────────

def test_sse_produces_correct_format():
    output = _sse("supervisor_start", {"message": "Analysing..."})
    assert output.startswith("event: supervisor_start\n")
    assert "data: " in output
    assert output.endswith("\n\n")


def test_sse_payload_is_valid_json():
    payload = {"agent": "Operations Planner", "content": "Draft plan..."}
    output = _sse("agent_operations", payload)
    lines = output.strip().split("\n")
    data_line = next(l for l in lines if l.startswith("data: "))
    parsed = json.loads(data_line[len("data: "):])
    assert parsed["agent"] == "Operations Planner"


def test_sse_event_name_is_preserved():
    for event_name in ["supervisor_start", "agent_done", "complete", "error"]:
        output = _sse(event_name, {})
        assert f"event: {event_name}" in output


# ── OrchestrationService.run() ───────────────────────────────────────────────

def test_run_returns_decomposition_result(db):
    mock_result = make_mock_result()
    with patch("spacemind.services.orchestration_service.MultiAgentPlanner") as MockPlanner:
        instance = MagicMock()
        instance.decompose.return_value = mock_result
        MockPlanner.return_value = instance

        service = OrchestrationService(db)
        result = service.run(make_request())

    assert result.id == mock_result.id
    instance.decompose.assert_called_once()


def test_run_persists_result_when_history_enabled(db, monkeypatch):
    monkeypatch.setattr(settings, "enable_history", True)
    mock_result = make_mock_result()

    with patch("spacemind.services.orchestration_service.MultiAgentPlanner") as MockPlanner:
        instance = MagicMock()
        instance.decompose.return_value = mock_result
        MockPlanner.return_value = instance

        service = OrchestrationService(db)
        service.run(make_request())

    from spacemind.storage.repository import DecompositionRepository
    repo = DecompositionRepository(db)
    assert repo.get_by_id(mock_result.id) is not None


def test_run_appends_vector_context_when_enabled(db, monkeypatch):
    monkeypatch.setattr(settings, "enable_vector_memory", True)
    mock_result = make_mock_result()

    with patch("spacemind.services.orchestration_service.MultiAgentPlanner") as MockPlanner, \
         patch("spacemind.services.orchestration_service.OrchestrationService._fetch_similar_cases") as mock_fetch, \
         patch("spacemind.services.orchestration_service.OrchestrationService._embed_and_store"):
        mock_fetch.return_value = "Past case: Office move FP1→FP2 completed in 18 days."
        instance = MagicMock()
        instance.decompose.return_value = mock_result
        MockPlanner.return_value = instance

        service = OrchestrationService(db)
        service.run(make_request())

        # The request passed to decompose should have the similar case appended
        call_arg: DecompositionRequest = instance.decompose.call_args[0][0]
        assert "SIMILAR PAST CASES" in (call_arg.additional_context or "")


def test_run_skips_vector_context_when_disabled(db, monkeypatch):
    monkeypatch.setattr(settings, "enable_vector_memory", False)
    mock_result = make_mock_result()

    with patch("spacemind.services.orchestration_service.MultiAgentPlanner") as MockPlanner, \
         patch("spacemind.services.orchestration_service.OrchestrationService._fetch_similar_cases") as mock_fetch:
        instance = MagicMock()
        instance.decompose.return_value = mock_result
        MockPlanner.return_value = instance

        service = OrchestrationService(db)
        service.run(make_request())

        mock_fetch.assert_not_called()
