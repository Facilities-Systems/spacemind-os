"""
SpaceMind OS — FastAPI Routes
All API endpoints live here. Clean, documented, versioned under /api/v1.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.core.constants import KNOWN_LOCATIONS
from spacemind.domain.schemas import (
    DecompositionRequest,
    DecompositionResult,
    HistoryResponse,
)
from spacemind.services.decomposition_service import DecompositionService
from spacemind.storage.database import get_db
from spacemind.utils.location_context import list_locations

router = APIRouter(prefix="/api/v1", tags=["SpaceMind OS"])


def get_service(db: Session = Depends(get_db)) -> DecompositionService:
    return DecompositionService(db)


@router.get("/health", summary="Health check")
def health():
    return {"status": "operational", "system": "SpaceMind OS"}


@router.get("/locations", summary="List all known office locations")
def get_locations():
    return {"locations": list_locations()}


@router.post(
    "/decompose",
    response_model=DecompositionResult,
    summary="Decompose a facilities request into an execution plan",
    description=(
        "Submit a natural language facilities request. "
        "SpaceMind OS classifies it, loads the matching knowledge template, "
        "enriches it with Claude AI, and returns a fully structured execution plan."
    ),
)
def decompose(
    request: DecompositionRequest,
    service: DecompositionService = Depends(get_service),
) -> DecompositionResult:
    try:
        return service.run(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decomposition failed: {e}")


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get history of all decomposition requests",
)
def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    service: DecompositionService = Depends(get_service),
) -> HistoryResponse:
    return service.get_history(limit=limit, offset=offset)


@router.get(
    "/history/{decomposition_id}",
    response_model=DecompositionResult,
    summary="Retrieve a specific decomposition by ID",
)
def get_decomposition(
    decomposition_id: str,
    service: DecompositionService = Depends(get_service),
) -> DecompositionResult:
    result = service.get_by_id(decomposition_id)
    if not result:
        raise HTTPException(status_code=404, detail="Decomposition not found")
    return result
