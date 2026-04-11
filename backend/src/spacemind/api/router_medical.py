"""
SpaceMind OS — Medical Router
REST API for medical supplies and workplace incident management.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.domain.models import User
from spacemind.domain.schemas import (
    IncidentCreate,
    IncidentOut,
    IncidentStatusUpdate,
    MedicalAnalytics,
    MedicalItemCreate,
    MedicalItemOut,
    MedicalItemUpdate,
)
from spacemind.services.medical_service import MedicalService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/medical", tags=["Medical"])


# ─── Medical Items ────────────────────────────────────────────────────────────

@router.get("/items", response_model=List[MedicalItemOut], summary="List medical supply items")
def list_items(
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = MedicalService(db)
    return svc.list_items(category=category)


@router.post("/items", response_model=MedicalItemOut, status_code=201,
             summary="Add a medical supply item")
def create_item(
    body: MedicalItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = MedicalService(db)
    return svc.create_item(body, user_id=current_user.id, user_email=current_user.email)


@router.patch("/items/{item_id}", response_model=MedicalItemOut,
              summary="Update a medical supply item")
def update_item(
    item_id: str,
    body: MedicalItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = MedicalService(db)
    item = svc.update_item(item_id, body, user_id=current_user.id, user_email=current_user.email)
    if not item:
        raise HTTPException(status_code=404, detail="Medical item not found.")
    return item


@router.delete("/items/{item_id}", status_code=204, summary="Remove a medical supply item")
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = MedicalService(db)
    deleted = svc.delete_item(item_id, user_id=current_user.id, user_email=current_user.email)
    if not deleted:
        raise HTTPException(status_code=404, detail="Medical item not found.")


# ─── Incidents ────────────────────────────────────────────────────────────────

@router.get("/incidents", response_model=List[IncidentOut], summary="List medical incidents")
def list_incidents(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = MedicalService(db)
    return svc.list_incidents(status=status)


@router.post("/incidents", response_model=IncidentOut, status_code=201,
             summary="Log a medical incident")
def log_incident(
    body: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicalService(db)
    return svc.log_incident(body, user_id=current_user.id, user_email=current_user.email)


@router.patch("/incidents/{incident_id}/status", response_model=IncidentOut,
              summary="Resolve or refer a medical incident")
def update_incident_status(
    incident_id: str,
    body: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = MedicalService(db)
    incident = svc.update_incident_status(
        incident_id, body.status.value,
        user_id=current_user.id, user_email=current_user.email,
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=MedicalAnalytics, summary="Medical dashboard stats")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = MedicalService(db)
    return svc.get_analytics()
