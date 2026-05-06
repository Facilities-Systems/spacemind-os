"""
SpaceMind OS — Executive Reports Router
GET /api/v1/reports/executive-brief — AI-generated executive summary
GET /api/v1/reports/kpi-summary     — Structured KPI snapshot
POST /api/v1/reports/generate       — Trigger a named report (returns AI narrative)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.core.exceptions import AIError
from spacemind.domain.models import User
from spacemind.services.report_service import ReportService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


class GenerateRequest(BaseModel):
    report_type: str  # executive_brief | kpi_summary | inventory | compliance | medical | sustainability


@router.get("/executive-brief", summary="AI-generated executive facility brief")
def get_executive_brief(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    try:
        text = ReportService(db).generate_executive_brief()
    except AIError as e:
        raise HTTPException(status_code=503, detail=str(e.message))
    return {"report_type": "executive_brief", "content": text}


@router.get("/kpi-summary", summary="Structured KPI snapshot (no AI)")
def get_kpi_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    return ReportService(db).get_kpi_summary()


@router.post("/generate", summary="Generate a named FM report")
def generate_report(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    svc = ReportService(db)
    try:
        if body.report_type == "executive_brief":
            content = svc.generate_executive_brief()
        elif body.report_type == "kpi_summary":
            content = str(svc.get_kpi_summary())
        else:
            content = f"Report type '{body.report_type}' generation is scheduled for a future release."
    except AIError as e:
        raise HTTPException(status_code=503, detail=str(e.message))
    return {"report_type": body.report_type, "content": content}
