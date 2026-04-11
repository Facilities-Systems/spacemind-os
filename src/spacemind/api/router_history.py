"""
SpaceMind OS — History Routes
GET  /api/v1/history                              — paginated, filterable list
GET  /api/v1/history/{id}                         — retrieve single plan
PATCH /api/v1/history/{id}/tasks/{task_id}        — update task status
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.core.validators import validate_date_filter, validate_task_status
from spacemind.domain.models import User
from spacemind.domain.schemas import DecompositionResult, HistoryResponse
from spacemind.services.audit_service import AuditService
from spacemind.services.decomposition_service import DecompositionService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1", tags=["History"])


def get_service(db: Session = Depends(get_db)) -> DecompositionService:
    return DecompositionService(db)


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get history of decomposition requests",
)
def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    request_type: str | None = Query(default=None),
    location_id: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    from_date: str | None = Query(default=None, description="ISO 8601 start date"),
    to_date: str | None = Query(default=None, description="ISO 8601 end date"),
    service: DecompositionService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> HistoryResponse:
    from spacemind.core.exceptions import ValidationError as SMValidationError
    from fastapi import HTTPException
    try:
        from_date = validate_date_filter(from_date, "from_date")
        to_date = validate_date_filter(to_date, "to_date")
    except SMValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)

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
    _current_user: User = Depends(get_current_user),
) -> DecompositionResult:
    result = service.get_by_id(decomposition_id)
    if not result:
        raise HTTPException(status_code=404, detail="Decomposition not found.")
    return result


@router.patch(
    "/history/{decomposition_id}/tasks/{task_id}",
    summary="Update task status within a decomposition",
)
def update_task_status(
    decomposition_id: str,
    task_id: str,
    status: str = Query(..., pattern="^(pending|in_progress|completed|blocked)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("technician", "facilities_manager", "admin")),
):
    from fastapi import HTTPException
    from spacemind.core.exceptions import ValidationError as SMValidationError
    try:
        validated_status = validate_task_status(status)
    except SMValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)

    service = DecompositionService(db)
    updated = service.update_task_status(decomposition_id, task_id, validated_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Decomposition or task not found.")

    AuditService(db).log(
        action="task.status.updated",
        resource_type="task",
        resource_id=task_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={
            "decomposition_id": decomposition_id,
            "new_status": validated_status,
        },
    )
    return {"message": "Task status updated", "task_id": task_id, "status": validated_status}
