"""
SpaceMind OS — FastAPI Routes
All API endpoints live here. Clean, documented, versioned under /api/v1.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from spacemind.core.config import settings
from spacemind.core.exceptions import SpaceMindError
from spacemind.domain.schemas import (
    DecompositionRequest,
    DecompositionResult,
    HistoryResponse,
)
from spacemind.services.decomposition_service import DecompositionService
from spacemind.storage.database import get_db
from spacemind.utils.location_context import list_locations

router = APIRouter(prefix="/api/v1", tags=["SpaceMind OS"])
limiter = Limiter(key_func=get_remote_address)

DECOMPOSE_RATE = getattr(settings, "decompose_rate_limit", "10/minute")


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
@limiter.limit(DECOMPOSE_RATE)
def decompose(
    request: Request,
    body: DecompositionRequest,
    service: DecompositionService = Depends(get_service),
) -> DecompositionResult:
    try:
        return service.run(body)
    except SpaceMindError as e:
        raise HTTPException(status_code=e.http_status, detail=e.message)
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get history of decomposition requests",
)
def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    request_type: str | None = Query(default=None, description="Filter by request type"),
    location_id: str | None = Query(default=None, description="Filter by location ID"),
    priority: str | None = Query(default=None, description="Filter by priority"),
    from_date: str | None = Query(default=None, description="ISO 8601 start date"),
    to_date: str | None = Query(default=None, description="ISO 8601 end date"),
    service: DecompositionService = Depends(get_service),
) -> HistoryResponse:
    return service.get_history(
        limit=limit,
        offset=offset,
        request_type=request_type,
        location_id=location_id,
        priority=priority,
        from_date=from_date,
        to_date=to_date,
    )


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
        raise HTTPException(status_code=404, detail="Decomposition not found.")
    return result
