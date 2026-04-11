"""
SpaceMind OS — Decompose & Orchestrate Routes
POST /api/v1/decompose   — single-pass AI decomposition
POST /api/v1/orchestrate — multi-agent decomposition
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from spacemind.api.auth import require_role
from spacemind.core.config import settings
from spacemind.core.exceptions import SpaceMindError
from spacemind.domain.models import User
from spacemind.domain.schemas import DecompositionRequest, DecompositionResult
from spacemind.services.audit_service import AuditService
from spacemind.services.decomposition_service import DecompositionService
from spacemind.services.orchestration_service import OrchestrationService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Decompose"])
limiter = Limiter(key_func=get_remote_address)

DECOMPOSE_RATE = getattr(settings, "decompose_rate_limit", "10/minute")


def get_service(db: Session = Depends(get_db)) -> DecompositionService:
    return DecompositionService(db)


def get_orchestration_service(db: Session = Depends(get_db)) -> OrchestrationService:
    return OrchestrationService(db)


@router.post(
    "/decompose",
    response_model=DecompositionResult,
    summary="Decompose a facilities request into an execution plan",
)
@limiter.limit(DECOMPOSE_RATE)
def decompose(
    request: Request,
    body: DecompositionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
) -> DecompositionResult:
    service = DecompositionService(db)
    try:
        result = service.run(body)
    except SpaceMindError as e:
        raise HTTPException(status_code=e.http_status, detail=e.message)
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

    AuditService(db).log(
        action="decomposition.created",
        resource_type="decomposition",
        resource_id=result.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={
            "request_type": result.request_type.value,
            "location_id": result.location_context.location_id,
            "priority": result.priority,
            "total_tasks": result.total_tasks,
            "engine": "single",
        },
    )
    return result


@router.post(
    "/orchestrate",
    response_model=DecompositionResult,
    summary="Multi-agent decomposition — Supervisor + 3 parallel specialists + Synthesizer",
)
@limiter.limit(DECOMPOSE_RATE)
def orchestrate(
    request: Request,
    body: DecompositionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
) -> DecompositionResult:
    """
    Enhanced decomposition using parallel specialist AI agents.
    Produces richer, more nuanced plans than single-pass /decompose.
    Requires ENABLE_MULTI_AGENT=true OR call this endpoint directly.
    """
    service = OrchestrationService(db)
    try:
        result = service.run(body)
    except SpaceMindError as e:
        raise HTTPException(status_code=e.http_status, detail=e.message)
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

    AuditService(db).log(
        action="decomposition.created.multi_agent",
        resource_type="decomposition",
        resource_id=result.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={
            "request_type": result.request_type.value,
            "location_id": result.location_context.location_id,
            "priority": result.priority,
            "total_tasks": result.total_tasks,
            "engine": "multi_agent",
        },
    )
    return result
