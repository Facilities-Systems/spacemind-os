"""
SpaceMind OS — Template Loader
Reads YAML templates from disk and formats them for injection into AI prompts.
"""
import yaml
from pathlib import Path
from typing import Optional

from spacemind.core.constants import RequestType
from spacemind.core.logging import log

TEMPLATES_DIR = Path(__file__).parent / "templates"

_TEMPLATE_MAP: dict[str, str] = {
    RequestType.OFFICE_MOVE: "office_move.yaml",
    RequestType.FULL_FITOUT: "full_fitout.yaml",
    RequestType.FLOOR_RENOVATION: "floor_renovation.yaml",
    RequestType.CANTEEN_SETUP: "canteen_setup.yaml",
    RequestType.MAINTENANCE: "maintenance.yaml",
}


def load_template(request_type: str) -> Optional[dict]:
    """Load and parse a YAML template for a given request type."""
    filename = _TEMPLATE_MAP.get(request_type)
    if not filename:
        log.warning(f"No template found for request type: {request_type}")
        return None

    path = TEMPLATES_DIR / filename
    if not path.exists():
        log.error(f"Template file missing: {path}")
        return None

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def template_to_context_string(template: Optional[dict]) -> str:
    """Format template dict into a readable string for AI injection."""
    if not template:
        return "No specific template available. Use your expert FM knowledge."
    return yaml.dump(template, default_flow_style=False, allow_unicode=True)
