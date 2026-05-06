"""
SpaceMind OS — IoT Sensor Router
Ingest endpoint authenticates via X-API-Key header (no JWT).
All read endpoints require JWT.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.domain.models import User
from spacemind.domain.schemas import (
    SensorIngest,
    SensorReadingOut,
    SensorSummary,
)
from spacemind.services.sensor_service import SensorService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/sensors", tags=["Sensors"])


def _resolve_device(x_api_key: str = Header(..., alias="X-API-Key"), db: Session = Depends(get_db)):
    """Dependency: authenticate sensor by API key, return SensorDevice."""
    svc = SensorService(db)
    device = svc.authenticate_device(x_api_key)
    if not device:
        raise HTTPException(status_code=401, detail="Invalid or inactive sensor API key.")
    return device


# ─── Ingest (API-key auth only) ───────────────────────────────────────────────

@router.post("/ingest", status_code=201, summary="Ingest a sensor reading (API-key auth)")
def ingest_reading(
    payload: SensorIngest,
    device=Depends(_resolve_device),
    db: Session = Depends(get_db),
) -> dict:
    svc = SensorService(db)
    return svc.ingest_with_device(device, payload)


# ─── Read endpoints (JWT auth) ────────────────────────────────────────────────

@router.get("/latest", response_model=SensorSummary, summary="Latest reading per sensor")
def get_latest(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return SensorService(db).get_latest_summary()


@router.get("/history", response_model=List[SensorReadingOut], summary="Sensor reading history")
def get_history(
    sensor_type: Optional[str] = Query(default=None),
    location_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return SensorService(db).get_history(
        sensor_type=sensor_type, location_id=location_id, limit=limit
    )


@router.get("/anomalies", response_model=List[SensorReadingOut], summary="Flagged anomalous readings")
def get_anomalies(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return SensorService(db).get_anomalies(limit=limit)


@router.post("/analyse", summary="AI narrative on current sensor environment")
def analyse(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    narrative = SensorService(db).analyse_sensors()
    return {"analysis": narrative}
