"""
SpaceMind OS — Admin Router
GET  /api/v1/admin/dashboard                  — system overview (admin only)
GET  /api/v1/admin/audit-log                  — paginated audit trail (admin only)
POST /api/v1/admin/trigger-maintenance-check  — on-demand maintenance alert run
POST /api/v1/admin/trigger-medical-expiry     — on-demand medical expiry run
"""
from datetime import datetime, UTC, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from spacemind.api.auth import require_role
from spacemind.domain.models import AuditLog, DecompositionRecord, User
from spacemind.storage.database import get_db
from spacemind.workers.tasks import run_maintenance_check, run_medical_expiry_check

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ─── Response schemas ─────────────────────────────────────────────────────────

class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditEntry(BaseModel):
    id: str
    created_at: datetime
    user_email: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[dict]

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    items: List[AuditEntry]
    total: int


class AdminDashboard(BaseModel):
    total_users: int
    active_users: int
    total_decompositions: int
    decompositions_this_week: int
    decompositions_this_month: int
    users: List[UserSummary]
    recent_audit: List[AuditEntry]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=AdminDashboard)
def admin_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AdminDashboard:
    now = datetime.now(UTC).replace(tzinfo=None)
    week_ago  = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    users = db.query(User).order_by(User.created_at.desc()).all()

    total_decompositions    = db.query(DecompositionRecord).count()
    decomps_this_week  = db.query(DecompositionRecord).filter(
        DecompositionRecord.created_at >= week_ago
    ).count()
    decomps_this_month = db.query(DecompositionRecord).filter(
        DecompositionRecord.created_at >= month_ago
    ).count()

    recent_audit = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
        .all()
    )

    return AdminDashboard(
        total_users=len(users),
        active_users=sum(1 for u in users if u.is_active),
        total_decompositions=total_decompositions,
        decompositions_this_week=decomps_this_week,
        decompositions_this_month=decomps_this_month,
        users=[UserSummary.model_validate(u) for u in users],
        recent_audit=[AuditEntry.model_validate(e) for e in recent_audit],
    )


@router.post("/trigger-maintenance-check", summary="Run maintenance alert check now")
def trigger_maintenance_check(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Dict[str, Any]:
    return run_maintenance_check(db)


@router.post("/trigger-medical-expiry", summary="Run medical expiry check now")
def trigger_medical_expiry(
    days_ahead: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Dict[str, Any]:
    return run_medical_expiry_check(db, days_ahead=days_ahead)


@router.get("/audit-log", response_model=AuditLogResponse)
def audit_log(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = Query(default=None),
    user_email: Optional[str] = Query(default=None),
    resource_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AuditLogResponse:
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if user_email:
        q = q.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)

    total = q.count()
    items = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return AuditLogResponse(
        items=[AuditEntry.model_validate(e) for e in items],
        total=total,
    )
