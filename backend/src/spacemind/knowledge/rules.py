"""
SpaceMind OS — Business Rules Engine
Encodes FM domain rules that are always true, regardless of AI output.
These rules are applied as a post-processing layer over AI results.
"""
from spacemind.core.constants import KNOWN_LOCATIONS, RequestType, TenureType
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionResult, TaskItem


def get_location_context(location_id: str) -> dict:
    """
    Return enriched location context for a given location ID.
    Falls back gracefully for unknown locations.
    """
    if location_id in KNOWN_LOCATIONS:
        ctx = dict(KNOWN_LOCATIONS[location_id])
        ctx["location_id"] = location_id
        ctx["tenure"] = ctx["tenure"].value
        return ctx

    log.warning(f"Unknown location_id: {location_id} — using rented defaults")
    return {
        "location_id": location_id,
        "tenure": TenureType.RENTED.value,
        "country": "Unknown",
        "timezone": "UTC",
        "currency": "USD",
        "landlord_approval_required": True,
        "notes": "Unknown location — treating as rented. Verify tenure before proceeding.",
    }


def apply_location_rules(result: DecompositionResult) -> DecompositionResult:
    """
    Apply mandatory business rules based on location tenure and country compliance.
    Rules override AI output where needed.
    """
    tenure = result.location_context.tenure
    landlord_required = result.location_context.landlord_approval_required

    if tenure == TenureType.RENTED and landlord_required:
        _flag_landlord_tasks(result)

    _enforce_fitout_sequencing(result)
    _inject_compliance_notes(result)
    return result


def _flag_landlord_tasks(result: DecompositionResult) -> None:
    """
    In rented buildings, flag all structural, M&E, and ceiling/wall/floor tasks
    as potentially requiring landlord approval.
    """
    landlord_keywords = [
        "ceiling", "partition", "wall", "structural", "sprinkler", "electrical",
        "duct", "hvac", "extraction", "gas", "plumbing", "floor", "penetr",
        "demolish", "strip", "fit-out", "fitout", "fit out",
    ]
    for phase in result.phases:
        for task in phase.tasks:
            task_lower = task.name.lower() + " " + (task.description or "").lower()
            if any(kw in task_lower for kw in landlord_keywords):
                task.landlord_approval_required = True


def _inject_compliance_notes(result: DecompositionResult) -> None:
    """
    Inject country-specific regulatory compliance notes from the compliance engine.
    Merges with any notes already returned by the AI (deduplication by text prefix).
    """
    from spacemind.knowledge.compliance import get_compliance_notes
    try:
        country = result.location_context.country
        request_type = result.request_type
        tenure = result.location_context.tenure

        new_notes = get_compliance_notes(country, request_type, tenure)
        existing = {n[:60] for n in result.compliance_notes}

        for note in new_notes:
            if note[:60] not in existing:
                result.compliance_notes.append(note)

        if new_notes:
            log.debug(f"[Compliance] Injected {len(new_notes)} notes for {country}/{request_type.value}")
    except Exception as e:
        log.warning(f"[Compliance] Rules injection failed: {e}")


def _enforce_fitout_sequencing(result: DecompositionResult) -> None:
    """
    Validate that fit-out / renovation plans follow Ceiling → Walls → Floor order.
    Log a warning if the AI returned an incorrect sequence.
    """
    if result.request_type not in (RequestType.FULL_FITOUT, RequestType.FLOOR_RENOVATION):
        return

    phase_names = [p.name.lower() for p in result.phases]
    ceiling_idx = next((i for i, n in enumerate(phase_names) if "ceiling" in n), None)
    wall_idx = next((i for i, n in enumerate(phase_names) if "wall" in n or "partition" in n), None)
    floor_idx = next((i for i, n in enumerate(phase_names) if "floor" in n), None)

    if ceiling_idx is not None and wall_idx is not None and floor_idx is not None:
        if not (ceiling_idx < wall_idx < floor_idx):
            log.warning(
                "SEQUENCING RULE VIOLATION: Ceiling → Walls → Floor order not maintained. "
                "Review AI output before execution."
            )
            # Add a prominent recommendation
            result.recommendations.insert(
                0,
                "[CRITICAL] Verify phase sequencing: Ceiling works MUST precede Walls, "
                "and Walls MUST precede Floor. Re-sequence if needed."
            )
