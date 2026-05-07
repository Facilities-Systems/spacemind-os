"""Unit tests for ResultValidator."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

import pytest
from unittest.mock import MagicMock

from spacemind.engine.validator import ResultValidator, MAX_PHASES, MAX_TASKS_PER_PHASE
from spacemind.core.exceptions import ValidationError
from spacemind.domain.schemas import DecompositionResult, Phase, TaskItem, ResponsibleParty, LocationContext
from spacemind.core.constants import RequestType, TenureType, ResponsiblePartyType, RiskLevel, PhaseStatus


def make_task(name="Fix HVAC", task_id="t01", hours=4.0) -> TaskItem:
    return TaskItem(
        id=task_id,
        name=name,
        responsible=ResponsibleParty(party=ResponsiblePartyType.VENDOR),
        estimated_duration_hours=hours,
        risk_level=RiskLevel.LOW,
        status=PhaseStatus.PENDING,
        landlord_approval_required=False,
    )


def make_result(phases=None, summary="Move staff") -> DecompositionResult:
    if phases is None:
        phases = [Phase(name="Phase 1", order=1, tasks=[make_task()])]
    return DecompositionResult(
        request_summary=summary,
        original_request="Move 40 staff",
        request_type=RequestType.OFFICE_MOVE,
        location_context=LocationContext(
            location_id="FP1_HQ_SouthAfrica",
            tenure=TenureType.OWNED,
            country="South Africa",
            landlord_approval_required=False,
        ),
        phases=phases,
    )


def test_valid_result_passes():
    validator = ResultValidator()
    result = make_result()
    validator.validate(result)  # Should not raise


def test_empty_phases_raises():
    validator = ResultValidator()
    result = make_result(phases=[])
    with pytest.raises(ValidationError, match="No phases"):
        validator.validate(result)


def test_zero_tasks_raises():
    validator = ResultValidator()
    result = make_result(phases=[Phase(name="Phase 1", order=1, tasks=[])])
    with pytest.raises(ValidationError, match="zero tasks"):
        validator.validate(result)


def test_missing_summary_raises():
    validator = ResultValidator()
    result = make_result(summary="")
    with pytest.raises(ValidationError, match="request_summary"):
        validator.validate(result)


def test_task_with_no_name_raises():
    validator = ResultValidator()
    task = make_task(name="")
    result = make_result(phases=[Phase(name="P1", order=1, tasks=[task])])
    with pytest.raises(ValidationError, match="no name"):
        validator.validate(result)


def test_negative_duration_raises():
    validator = ResultValidator()
    task = make_task(hours=-2.0)
    result = make_result(phases=[Phase(name="P1", order=1, tasks=[task])])
    with pytest.raises(ValidationError, match="negative duration"):
        validator.validate(result)


# ─── Hard constraint: max phases ──────────────────────────────────────────────

def test_excess_phases_trimmed_silently():
    validator = ResultValidator()
    phases = [Phase(name=f"Phase {i}", order=i, tasks=[make_task(task_id=f"t{i:02d}")]) for i in range(1, MAX_PHASES + 3)]
    result = make_result(phases=phases)
    validator.validate(result)
    assert len(result.phases) == MAX_PHASES


def test_exactly_max_phases_passes():
    validator = ResultValidator()
    phases = [Phase(name=f"Phase {i}", order=i, tasks=[make_task(task_id=f"t{i:02d}")]) for i in range(1, MAX_PHASES + 1)]
    result = make_result(phases=phases)
    validator.validate(result)
    assert len(result.phases) == MAX_PHASES


# ─── Hard constraint: max tasks per phase ─────────────────────────────────────

def test_excess_tasks_trimmed_silently():
    validator = ResultValidator()
    tasks = [make_task(name=f"Task {i}", task_id=f"t{i:02d}") for i in range(MAX_TASKS_PER_PHASE + 5)]
    result = make_result(phases=[Phase(name="Big Phase", order=1, tasks=tasks)])
    validator.validate(result)
    assert len(result.phases[0].tasks) == MAX_TASKS_PER_PHASE


def test_total_tasks_recalculated_after_trim():
    validator = ResultValidator()
    tasks = [make_task(name=f"Task {i}", task_id=f"t{i:02d}") for i in range(MAX_TASKS_PER_PHASE + 5)]
    result = make_result(phases=[Phase(name="Big Phase", order=1, tasks=tasks)])
    validator.validate(result)
    assert result.total_tasks == MAX_TASKS_PER_PHASE
