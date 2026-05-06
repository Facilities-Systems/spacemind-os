"""
SpaceMind OS — Asset Lifecycle Router
Full asset management: CRUD, maintenance logging, analytics, AI repair-vs-replace.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.domain.models import User
from spacemind.domain.schemas import (
    AssetAnalytics,
    AssetCreate,
    AssetOut,
    AssetUpdate,
    MaintenanceLogCreate,
    MaintenanceLogOut,
)
from spacemind.services.asset_service import AssetService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/assets", tags=["Assets"])


# ─── CRUD ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[AssetOut], summary="List assets")
def list_assets(
    category: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    location_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return AssetService(db).list_assets(category=category, status=status, location_id=location_id)


@router.post("", response_model=AssetOut, status_code=201, summary="Register a new asset")
def create_asset(
    body: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    return AssetService(db).create_asset(body, user_id=str(current_user.id), user_email=str(current_user.email))


@router.get("/analytics", response_model=AssetAnalytics, summary="Asset portfolio analytics")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return AssetService(db).get_analytics()


@router.get("/{asset_id}", response_model=AssetOut, summary="Get asset detail")
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    asset = AssetService(db).get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


@router.patch("/{asset_id}", response_model=AssetOut, summary="Update asset")
def update_asset(
    asset_id: str,
    body: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    asset = AssetService(db).update_asset(asset_id, body, user_id=str(current_user.id), user_email=str(current_user.email))
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


@router.delete("/{asset_id}", status_code=204, summary="Decommission asset (soft delete)")
def decommission_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    ok = AssetService(db).decommission_asset(asset_id, user_id=str(current_user.id), user_email=str(current_user.email))
    if not ok:
        raise HTTPException(status_code=404, detail="Asset not found.")


# ─── Maintenance ──────────────────────────────────────────────────────────────

@router.get("/{asset_id}/history", response_model=List[MaintenanceLogOut], summary="Maintenance history")
def get_history(
    asset_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = AssetService(db)
    if not svc.get_asset(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found.")
    return svc.get_maintenance_history(asset_id)


@router.post("/{asset_id}/maintenance", response_model=MaintenanceLogOut, status_code=201,
             summary="Log a maintenance event")
def log_maintenance(
    asset_id: str,
    body: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log_entry = AssetService(db).log_maintenance(
        asset_id, body,
        user_id=str(current_user.id),
        user_email=str(current_user.email),
    )
    if not log_entry:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return log_entry


# ─── AI Analysis ──────────────────────────────────────────────────────────────

@router.post("/{asset_id}/analyse", summary="AI repair-vs-replace recommendation")
def analyse_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    svc = AssetService(db)
    if not svc.get_asset(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found.")
    narrative = svc.analyse_with_ai(asset_id)
    return {"asset_id": asset_id, "analysis": narrative}
