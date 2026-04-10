"""
SpaceMind OS — Anthropic AI Client
Handles all Claude interactions: retry logic, model fallback, structured output, token tracking.
"""
import json
from typing import Any

from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError as AnthropicRateLimitError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from spacemind.ai.prompts import CLASSIFIER_PROMPT, DECOMPOSER_SYSTEM_PROMPT
from spacemind.core.config import settings
from spacemind.core.exceptions import AIError, AIParseError
from spacemind.core.logging import log


class TokenUsage:
    """Tracks token consumption for a single AI call."""
    def __init__(self, input_tokens: int = 0, output_tokens: int = 0):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.total_tokens = input_tokens + output_tokens

    def to_dict(self) -> dict[str, int]:
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
        }


class AIClient:
    """
    Thin wrapper around Anthropic SDK.
    - Primary model: claude-sonnet-4-6 (deep reasoning)
    - Fast model: claude-haiku-4-5-20251001 (classification)
    - Auto-retry with exponential backoff on transient errors
    - Token usage tracked on every call
    """

    def __init__(self):
        self._client = Anthropic(api_key=settings.anthropic_api_key)

    @retry(
        retry=retry_if_exception_type((APITimeoutError, AnthropicRateLimitError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
    )
    def _call(
        self,
        system: str,
        user_message: str,
        model: str,
        max_tokens: int | None = None,
    ) -> tuple[str, TokenUsage]:
        """Raw call to Anthropic API. Returns (text, token_usage)."""
        max_tokens = max_tokens or settings.max_tokens
        try:
            response = self._client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=settings.ai_temperature,
                system=system,
                messages=[{"role": "user", "content": user_message}],
            )
        except (APITimeoutError, AnthropicRateLimitError):
            raise  # Let tenacity retry these
        except APIError as e:
            raise AIError(f"Claude API error ({e.status_code}): contact support if this persists.") from e
        except Exception as e:
            raise AIError(f"Unexpected AI error: {type(e).__name__}") from e

        usage = TokenUsage(
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )
        log.info(
            f"[AI] model={model} in={usage.input_tokens} out={usage.output_tokens} total={usage.total_tokens}"
        )
        return response.content[0].text.strip(), usage

    def classify_request(self, request_text: str) -> str:
        """Fast classification using Haiku. Returns a RequestType string."""
        try:
            text, _ = self._call(
                system=CLASSIFIER_PROMPT,
                user_message=request_text,
                model=settings.fast_model,
                max_tokens=20,
            )
            return text.strip().lower()
        except AIError:
            raise
        except Exception as e:
            log.warning(f"Classification failed, defaulting to 'unknown': {e}")
            return "unknown"

    def decompose(
        self,
        request_text: str,
        template_context: str,
        location_context: dict[str, Any],
    ) -> tuple[dict[str, Any], TokenUsage]:
        """
        Full decomposition using the primary Sonnet model.
        Returns (parsed_dict, token_usage).
        """
        user_message = self._build_decomposer_message(
            request_text, template_context, location_context
        )

        log.info(f"Calling {settings.primary_model} for decomposition...")
        try:
            raw, usage = self._call(
                system=DECOMPOSER_SYSTEM_PROMPT,
                user_message=user_message,
                model=settings.primary_model,
            )
        except AIError:
            raise
        except Exception as e:
            raise AIError() from e

        return self._parse_json(raw), usage

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
            log.error(f"JSON parse error: {e}")
            raise AIParseError() from e
