"""
SpaceMind OS — Utility Routes (open, no auth required)
GET /api/v1/health    — liveness probe
GET /api/v1/locations — known office locations

All domain routes live in their own modules:
  router_decompose.py  — /decompose, /orchestrate
  router_history.py    — /history, /history/{id}, /history/{id}/tasks/{task_id}
  router_export.py     — /history/{id}/export
  router_analytics.py  — /analytics
"""
from fastapi import APIRouter

from spacemind.utils.location_context import list_locations

router = APIRouter(prefix="/api/v1", tags=["Utility"])


@router.get("/health", summary="Health check")
def health():
    return {"status": "operational", "system": "SpaceMind OS"}


@router.get("/locations", summary="List all known office locations")
def get_locations():
    return {"locations": list_locations()}
