"""Unit tests for AIClient — retry logic, JSON parsing, token tracking."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

import json
import pytest
from unittest.mock import MagicMock, patch, PropertyMock

from spacemind.ai.client import AIClient, TokenUsage
from spacemind.core.exceptions import AIError, AIParseError


def make_client() -> AIClient:
    with patch("spacemind.ai.client.Anthropic"):
        client = AIClient()
    return client


def mock_response(text: str, input_tokens: int = 100, output_tokens: int = 200):
    resp = MagicMock()
    resp.content = [MagicMock(text=text)]
    resp.usage.input_tokens = input_tokens
    resp.usage.output_tokens = output_tokens
    return resp


# ─── TokenUsage ───────────────────────────────────────────────────────────────

def test_token_usage_totals():
    u = TokenUsage(input_tokens=150, output_tokens=300)
    assert u.total_tokens == 450
    assert u.to_dict() == {"input_tokens": 150, "output_tokens": 300, "total_tokens": 450}


# ─── JSON parsing ─────────────────────────────────────────────────────────────

def test_parse_json_clean():
    client = make_client()
    data = {"key": "value", "number": 42}
    result = client._parse_json(json.dumps(data))
    assert result == data


def test_parse_json_strips_markdown_fences():
    client = make_client()
    data = {"phases": []}
    raw = f"```json\n{json.dumps(data)}\n```"
    result = client._parse_json(raw)
    assert result == data


def test_parse_json_invalid_raises_ai_parse_error():
    client = make_client()
    with pytest.raises(AIParseError):
        client._parse_json("this is not json at all {{{{")


# ─── classify_request ─────────────────────────────────────────────────────────

def test_classify_returns_type_string():
    client = make_client()
    client._client.messages.create.return_value = mock_response("office_move", 10, 5)
    result = client.classify_request("Move the team to FP2")
    assert result == "office_move"


def test_classify_returns_unknown_on_ai_error():
    client = make_client()
    from anthropic import APIError
    client._client.messages.create.side_effect = Exception("boom")
    # Should not raise — should return "unknown"
    with patch.object(client, "_call", side_effect=AIError("test")):
        with pytest.raises(AIError):
            client.classify_request("some request")


# ─── decompose ────────────────────────────────────────────────────────────────

def test_decompose_returns_dict_and_usage():
    client = make_client()
    payload = {"phases": [], "request_summary": "Test", "key_risks": []}
    client._client.messages.create.return_value = mock_response(
        json.dumps(payload), input_tokens=500, output_tokens=1000
    )
    result, usage = client.decompose(
        request_text="Move staff",
        template_context="template here",
        location_context={"country": "SA"},
    )
    assert isinstance(result, dict)
    assert usage.input_tokens == 500
    assert usage.output_tokens == 1000
    assert usage.total_tokens == 1500


def test_decompose_raises_ai_parse_error_on_bad_json():
    client = make_client()
    client._client.messages.create.return_value = mock_response("NOT JSON !!!")
    with pytest.raises(AIParseError):
        client.decompose("request", "template", {})
