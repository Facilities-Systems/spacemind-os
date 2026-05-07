"""
SpaceMind OS — AI Guardrails
Prompt injection detection and user input sanitisation.
All user-supplied text that flows into AI calls must pass through these guards.
"""
from __future__ import annotations

import re

from spacemind.core.exceptions import ValidationError
from spacemind.core.logging import log

# Patterns that indicate likely prompt injection / jailbreak attempts
_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"ignore\s+(all\s+)?(previous|above|prior|my)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|above|prior)\s+instructions?", re.IGNORECASE),
    re.compile(r"forget\s+(everything|all)\s+(you('ve|\s+have)\s+been\s+told|above|previous)", re.IGNORECASE),
    re.compile(r"\byou\s+are\s+now\s+(a|an)\b", re.IGNORECASE),
    re.compile(r"\bact\s+as\s+(a|an|if)\b", re.IGNORECASE),
    re.compile(r"\bpretend\s+(you\s+are|to\s+be)\b", re.IGNORECASE),
    re.compile(r"\bsystem\s+prompt\b", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
    re.compile(r"\bDAN\s+mode\b", re.IGNORECASE),
    re.compile(r"\bdo\s+anything\s+now\b", re.IGNORECASE),
    re.compile(r"override\s+(your\s+)?(instructions?|programming|constraints?)", re.IGNORECASE),
    re.compile(r"\bno\s+restrictions?\b", re.IGNORECASE),
    re.compile(r"\bunfiltered\s+(mode|response|output)\b", re.IGNORECASE),
]

# Hard length cap applied before passing any text to the AI
_MAX_SAFE_LENGTH = 3000


def scan_for_injection(text: str, context: str = "input") -> None:
    """
    Scan user-supplied text for prompt injection patterns.
    Raises ValidationError if any pattern matches.
    `context` is used only in log messages (e.g. 'chat message', 'request text').
    """
    if not text:
        return
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            log.warning(
                "[Guardrails] Injection pattern detected in %s: pattern=%r text_prefix=%r",
                context,
                pattern.pattern,
                text[:80],
            )
            raise ValidationError(
                "Your input contains patterns that are not permitted. "
                "Please describe your facilities request in plain language."
            )


def sanitise_for_ai(text: str) -> str:
    """
    Belt-and-suspenders layer: strip injection markers and enforce a hard length cap.
    Call this in addition to scan_for_injection for defence-in-depth.
    """
    cleaned = text
    for pattern in _INJECTION_PATTERNS:
        cleaned = pattern.sub("[redacted]", cleaned)
    return cleaned[:_MAX_SAFE_LENGTH]
