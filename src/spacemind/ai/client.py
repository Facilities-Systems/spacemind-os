"""
SpaceMind OS — Anthropic AI Client
Handles all Claude interactions: retry logic, model fallback, structured output.
"""
import json
from typing import Any

from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from spacemind.ai.prompts import CLASSIFIER_PROMPT, DECOMPOSER_SYSTEM_PROMPT
from spacemind.core.config import settings
from spacemind.core.logging import log


class AIClient:
    """
    Thin wrapper around Anthropic SDK.
    - Primary model: claude-sonnet-4-6 (deep reasoning)
    - Fast model: claude-haiku-4-5-20251001 (classification)
    - Auto-retry with exponential backoff on transient errors
    """

    def __init__(self):
        self._client = Anthropic(api_key=settings.anthropic_api_key)

    @retry(
        retry=retry_if_exception_type((APITimeoutError, RateLimitError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
    )
    def _call(
        self,
        system: str,
        user_message: str,
        model: str,
        max_tokens: int = None,
    ) -> str:
        max_tokens = max_tokens or settings.max_tokens
        response = self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=settings.ai_temperature,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text.strip()

    def classify_request(self, request_text: str) -> str:
        """Fast classification using Haiku. Returns a RequestType string."""
        try:
            result = self._call(
                system=CLASSIFIER_PROMPT,
                user_message=request_text,
                model=settings.fast_model,
                max_tokens=20,
            )
            return result.strip().lower()
        except Exception as e:
            log.warning(f"Classification failed, defaulting to 'unknown': {e}")
            return "unknown"

    def decompose(
        self,
        request_text: str,
        template_context: str,
        location_context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Full decomposition using the primary Sonnet model.
        Injects template knowledge + location context into the prompt.
        """
        user_message = self._build_decomposer_message(
            request_text, template_context, location_context
        )

        log.info(f"Calling {settings.primary_model} for decomposition...")
        raw = self._call(
            system=DECOMPOSER_SYSTEM_PROMPT,
            user_message=user_message,
            model=settings.primary_model,
        )

        return self._parse_json(raw)

    def _build_decomposer_message(
        self,
        request_text: str,
        template_context: str,
        location_context: dict[str, Any],
    ) -> str:
        return f"""
FACILITIES REQUEST:
{request_text}

LOCATION CONTEXT:
{json.dumps(location_context, indent=2)}

KNOWLEDGE TEMPLATE (use this as your structured starting point, enrich with AI reasoning):
{template_context}

Decompose this into a complete, sequenced execution plan following your expert FM knowledge.
Remember: For fit-outs/renovations, sequence is CEILING → WALLS → FLOOR.
Return only valid JSON.
"""

    def _parse_json(self, raw: str) -> dict[str, Any]:
        """Parse JSON from model output, handling common formatting issues."""
        text = raw.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            log.error(f"JSON parse error: {e}\nRaw output:\n{raw[:500]}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e
