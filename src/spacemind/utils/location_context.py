"""
SpaceMind OS — Location Context Utilities
"""
from spacemind.core.constants import KNOWN_LOCATIONS
from spacemind.utils.cache import locations_cache


@locations_cache.cached("all_locations")
def list_locations() -> list[dict]:
    """Return all known locations as a list of dicts for UI display (TTL-cached)."""
    return [
        {
            "id": loc_id,
            "country": info["country"],
            "tenure": info["tenure"].value if hasattr(info["tenure"], "value") else info["tenure"],
            "landlord_required": info["landlord_approval_required"],
            "notes": info.get("notes", ""),
        }
        for loc_id, info in KNOWN_LOCATIONS.items()
    ]


def get_location_display_name(location_id: str) -> str:
    """Human-readable display name for a location."""
    if location_id in KNOWN_LOCATIONS:
        info = KNOWN_LOCATIONS[location_id]
        tenure = info["tenure"].value if hasattr(info["tenure"], "value") else info["tenure"]
        return f"{location_id} ({info['country']} — {tenure.upper()})"
    return location_id
