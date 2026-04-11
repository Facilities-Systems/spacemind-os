"""
SpaceMind OS — Centralised Validators
All incoming request validation lives here.
Adopted from UFM project pattern: validate at system boundaries, not scattered across routes.

Validators raise ValidationError (subclass of SpaceMindError → HTTP 422)
so they're automatically handled by the route exception handlers.
"""
from __future__ import annotations

import re
from datetime import datetime

from spacemind.core.constants import KNOWN_LOCATIONS, RequestType
from spacemind.core.exceptions import ValidationError

_VALID_PRIORITIES = {"low", "normal", "high", "urgent"}
_VALID_STATUSES   = {"pending", "in_progress", "completed", "blocked"}
_ISO_DATE_RE      = re.compile(r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?")


def validate_request_text(text: str) -> str:
    """
    Validate and normalise a facilities request text.
    Rules:
      - Must be at least 10 characters
      - Must not exceed 3000 characters
      - Must not be only whitespace
      - Stripped of leading/trailing whitespace
    """
    stripped = text.strip()
    if len(stripped) < 10:
        raise ValidationError(
            "Request text is too short. Please describe your facilities request in at least 10 characters."
        )
    if len(stripped) > 3000:
        raise ValidationError(
            "Request text is too long (max 3000 characters). Please be more concise."
        )
    return stripped


def validate_location_id(location_id: str) -> str:
    """
    Validate a location ID. Accepts any string (unknown locations are handled
    gracefully by the rules engine), but warns if not in KNOWN_LOCATIONS.
    Returns the validated location_id unchanged.
    """
    if not location_id or not location_id.strip():
        raise ValidationError("location_id cannot be empty.")
    if len(location_id) > 128:
        raise ValidationError("location_id is too long (max 128 characters).")
    return location_id.strip()


def validate_priority(priority: str | None) -> str:
    """Validate and normalise priority. Defaults to 'normal'."""
    if priority is None:
        return "normal"
    lower = priority.lower().strip()
    if lower not in _VALID_PRIORITIES:
        raise ValidationError(
            f"Invalid priority '{priority}'. Must be one of: {', '.join(sorted(_VALID_PRIORITIES))}."
        )
    return lower


def validate_date_filter(date_str: str | None, field_name: str = "date") -> str | None:
    """
    Validate an ISO 8601 date string used in history filters.
    Returns None if input is None/empty, or the validated date string.
    """
    if not date_str:
        return None
    if not _ISO_DATE_RE.match(date_str.strip()):
        raise ValidationError(
            f"Invalid {field_name} format '{date_str}'. Use ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS."
        )
    try:
        datetime.fromisoformat(date_str.strip())
    except ValueError:
        raise ValidationError(
            f"Invalid {field_name} value '{date_str}'. Please use a valid ISO 8601 date."
        )
    return date_str.strip()


def validate_task_status(status: str) -> str:
    """Validate a task status value."""
    lower = status.lower().strip()
    if lower not in _VALID_STATUSES:
        raise ValidationError(
            f"Invalid task status '{status}'. Must be one of: {', '.join(sorted(_VALID_STATUSES))}."
        )
    return lower


def validate_export_format(fmt: str) -> str:
    """Validate an export format string."""
    valid = {"pdf", "json", "markdown", "excel"}
    lower = fmt.lower().strip()
    if lower not in valid:
        raise ValidationError(
            f"Invalid export format '{fmt}'. Must be one of: {', '.join(sorted(valid))}."
        )
    return lower


def validate_decomposition_request(
    request_text: str,
    location_id: str,
    priority: str | None,
) -> tuple[str, str, str]:
    """
    Validate all fields of a DecompositionRequest at the service boundary.
    Returns (validated_text, validated_location_id, validated_priority).
    """
    text     = validate_request_text(request_text)
    loc      = validate_location_id(location_id)
    priority = validate_priority(priority)
    return text, loc, priority
