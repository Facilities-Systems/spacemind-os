"""
SpaceMind OS — Floor Plans Router
GET  /api/v1/floor-plans            list all (optionally filter by building_id)
GET  /api/v1/floor-plans/{id}       single floor plan
POST /api/v1/floor-plans            create (facilities_manager+)
PATCH /api/v1/floor-plans/{id}      update (facilities_manager+)
DELETE /api/v1/floor-plans/{id}     delete (admin only)
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.core.exceptions import StorageError
from spacemind.domain.models import User
from spacemind.domain.schemas import FloorPlanCreate, FloorPlanOut, FloorPlanUpdate
from spacemind.storage.database import get_db
from spacemind.storage.repository import FloorPlanRepository

router = APIRouter(prefix="/api/v1/floor-plans", tags=["floor-plans"])


def _repo(db: Session = Depends(get_db)) -> FloorPlanRepository:
    return FloorPlanRepository(db)


@router.get("", response_model=List[FloorPlanOut])
def list_floor_plans(
    building_id: Optional[str] = Query(default=None),
    repo: FloorPlanRepository = Depends(_repo),
    _: User = Depends(get_current_user),
) -> List[FloorPlanOut]:
    return repo.list_floor_plans(building_id=building_id)


@router.get("/{floor_plan_id}", response_model=FloorPlanOut)
def get_floor_plan(
    floor_plan_id: str,
    repo: FloorPlanRepository = Depends(_repo),
    _: User = Depends(get_current_user),
) -> FloorPlanOut:
    fp = repo.get_floor_plan(floor_plan_id)
    if not fp:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
    return fp


@router.post("", response_model=FloorPlanOut, status_code=201)
def create_floor_plan(
    payload: FloorPlanCreate,
    repo: FloorPlanRepository = Depends(_repo),
    _: User = Depends(require_role("facilities_manager", "admin")),
) -> FloorPlanOut:
    try:
        return repo.create_floor_plan(payload)
    except StorageError as e:
        raise HTTPException(status_code=500, detail="Failed to create floor plan.") from e


@router.patch("/{floor_plan_id}", response_model=FloorPlanOut)
def update_floor_plan(
    floor_plan_id: str,
    payload: FloorPlanUpdate,
    repo: FloorPlanRepository = Depends(_repo),
    _: User = Depends(require_role("facilities_manager", "admin")),
) -> FloorPlanOut:
    fp = repo.update_floor_plan(floor_plan_id, payload)
    if not fp:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
    return fp


@router.delete("/{floor_plan_id}", status_code=204)
def delete_floor_plan(
    floor_plan_id: str,
    repo: FloorPlanRepository = Depends(_repo),
    _: User = Depends(require_role("admin")),
) -> None:
    deleted = repo.delete_floor_plan(floor_plan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
