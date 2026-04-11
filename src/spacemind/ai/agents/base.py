"""
SpaceMind OS — Base Agent
All specialist agents inherit from here.
"""
from __future__ import annotations

import json
from typing import Any

from spacemind.ai.client import AIClient, TokenUsage
from spacemind.core.exceptions import AIError, AIParseError
from spacemind.core.logging import log


class BaseAgent:
    """
    Lightweight agent wrapper around AIClient.
    Each agent has a fixed system prompt (its specialist identity)
    and a `run()` method that accepts a user-facing context string.
    """

    name: str = "base"
    system_prompt: str = ""
    model_key: str = "primary"  # "primary" or "fast"

    def __init__(self, client: AIClient):
        self._client = client

    def run(self, context: str, max_tokens: int | None = None) -> tuple[dict[str, Any], TokenUsage]:
        """
        Execute this agent with the given context.
        Returns (parsed_dict, token_usage).
        """
        from spacemind.core.config import settings
        model = settings.primary_model if self.model_key == "primary" else settings.fast_model

        log.info(f"[Agent:{self.name}] Calling {model}...")
        try:
            raw, usage = self._client._call(
                system=self.system_prompt,
                user_message=context,
                model=model,
                max_tokens=max_tokens,
            )
        except AIError:
            raise
        except Exception as e:
            raise AIError(f"Agent {self.name} failed: {type(e).__name__}") from e

        log.info(f"[Agent:{self.name}] Done — {usage.total_tokens} tokens")
        return self._parse(raw), usage

    def _parse(self, raw: str) -> dict[str, Any]:
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            log.error(f"[Agent:{self.name}] JSON parse error: {e}")
            raise AIParseError(f"Agent {self.name} returned invalid JSON") from e
