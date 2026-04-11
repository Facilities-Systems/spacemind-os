"""Unit tests for location rules engine."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from spacemind.knowledge.rules import get_location_context
from spacemind.core.constants import TenureType


def test_known_owned_location():
    ctx = get_location_context("FP1_HQ_SouthAfrica")
    assert ctx["tenure"] == TenureType.OWNED.value
    assert ctx["landlord_approval_required"] is False
    assert ctx["country"] == "South Africa"


def test_known_rented_location():
    ctx = get_location_context("FP2_SouthAfrica")
    assert ctx["tenure"] == TenureType.RENTED.value
    assert ctx["landlord_approval_required"] is True


def test_unknown_location_defaults_rented():
    ctx = get_location_context("UNKNOWN_OFFICE_XYZ")
    assert ctx["tenure"] == TenureType.RENTED.value
    assert ctx["landlord_approval_required"] is True
