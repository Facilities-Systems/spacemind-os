"""Integration test — rate limiting on /api/v1/decompose (10 req/min)."""
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from spacemind.domain.schemas import DecompositionResult, LocationContext, Phase, TaskItem, ResponsibleParty
from spacemind.core.constants import RequestType, TenureType, ResponsiblePartyType, RiskLevel, PhaseStatus


_MOCK_RESULT = DecompositionResult(
    request_summary="Move staff",
    original_request="Move 10 staff from A to B",
    request_type=RequestType.OFFICE_MOVE,
    priority="normal",
    location_context=LocationContext(
        location_id="FP2_SouthAfrica",
        tenure=TenureType.RENTED,
        country="South Africa",
        landlord_approval_required=False,
    ),
    phases=[
        Phase(
            name="Prep",
            order=1,
            tasks=[
                TaskItem(
                    id="t01",
                    name="Survey",
                    responsible=ResponsibleParty(party=ResponsiblePartyType.INTERNAL),
                    estimated_duration_hours=2.0,
                    risk_level=RiskLevel.LOW,
                    status=PhaseStatus.PENDING,
                    landlord_approval_required=False,
                )
            ],
        )
    ],
)

_PAYLOAD = {
    "request_text": "Move 10 staff from A to B",
    "location_id": "FP2_SouthAfrica",
    "priority": "normal",
}


def test_rate_limit_triggers_within_11_requests(client: TestClient, auth_headers: dict):
    """
    The decompose endpoint is limited to 10 req/min per IP.
    Across the full test suite, at least 1 decompose request is made before this test.
    Sending 11 more guarantees >= 12 total, so at least 1 must be 429.
    """
    status_codes = []
    with patch("spacemind.services.decomposition_service.Decomposer") as MockDecomposer:
        mock_instance = MagicMock()
        mock_instance.decompose.return_value = _MOCK_RESULT
        MockDecomposer.return_value = mock_instance

        for _ in range(11):
            resp = client.post("/api/v1/decompose", json=_PAYLOAD, headers=auth_headers)
            status_codes.append(resp.status_code)

    assert 429 in status_codes, (
        f"Expected rate limit (429) within 11 requests but got: {status_codes}"
    )
