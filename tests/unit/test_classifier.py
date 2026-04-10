"""Unit tests for the keyword classifier (no AI calls needed)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from unittest.mock import MagicMock
from spacemind.engine.classifier import RequestClassifier
from spacemind.core.constants import RequestType


def make_classifier():
    ai = MagicMock()
    return RequestClassifier(ai_client=ai)


def test_office_move_keyword():
    clf = make_classifier()
    result = clf.classify("Move 40 staff from FP1 to FP2")
    assert result == RequestType.OFFICE_MOVE


def test_fitout_keyword():
    clf = make_classifier()
    result = clf.classify("Full fit-out of the vacant 2nd floor")
    assert result == RequestType.FULL_FITOUT


def test_canteen_keyword():
    clf = make_classifier()
    result = clf.classify("Set up a new canteen area on the 3rd floor")
    assert result == RequestType.CANTEEN_SETUP


def test_maintenance_keyword():
    clf = make_classifier()
    result = clf.classify("The HVAC is broken and needs repair")
    assert result == RequestType.MAINTENANCE


def test_renovation_keyword():
    clf = make_classifier()
    result = clf.classify("Renovate the open-plan floor")
    assert result == RequestType.FLOOR_RENOVATION


def test_unknown_falls_back_to_ai():
    clf = make_classifier()
    clf._ai.classify_request.return_value = "maintenance"
    result = clf.classify("Organize a team lunch next week")
    clf._ai.classify_request.assert_called_once()
    assert result == RequestType.MAINTENANCE
