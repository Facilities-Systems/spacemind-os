"""
SpaceMind OS — Insights Summary Router
GET /api/v1/insights/summary — aggregates inventory + medical + decomposition analytics
into a single payload for the SmartInsights dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.domain.models import (
    DecompositionRecord,
    InventoryItem,
    InventoryTransaction,
    MedicalIncident,
    MedicalItem,
    User,
)
from spacemind.services.decomposition_service import DecompositionService
from spacemind.services.inventory_service import InventoryService
from spacemind.services.medical_service import MedicalService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


@router.get("/summary", summary="Aggregated cross-module insights for the SmartInsights dashboard")
def get_insights_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Returns a single JSON payload combining:
    - Decomposition analytics (total plans, breakdown by type)
    - Inventory health (total items, low-stock count, outstanding sign-outs)
    - Medical health (open incidents, low-stock medical items)
    Used by SmartInsightsPage.tsx to replace hardcoded STRATEGIC_KPIS.
    """
    # ── Decompositions ────────────────────────────────────────────────────────
    decomp_total: int = db.query(func.count(DecompositionRecord.id)).scalar() or 0
    decomp_by_type: list[dict] = [
        {"type": row[0], "count": row[1]}
        for row in db.query(
            DecompositionRecord.request_type,
            func.count(DecompositionRecord.id),
        ).group_by(DecompositionRecord.request_type).all()
    ]

    # ── Inventory ─────────────────────────────────────────────────────────────
    inv_svc = InventoryService(db)
    inv_analytics = inv_svc.get_analytics()

    total_items: int = inv_analytics.get("total_items", 0)
    low_stock_count: int = len(inv_analytics.get("low_stock_items", []))
    critical_count: int = len(inv_analytics.get("critical_items", []))
    outstanding_signouts: int = (
        db.query(func.count(InventoryTransaction.id))
        .filter(InventoryTransaction.status == "Outstanding")
        .scalar()
        or 0
    )
    # Compliance rate: returned / total * 100
    total_tx: int = db.query(func.count(InventoryTransaction.id)).scalar() or 0
    returned_tx: int = (
        db.query(func.count(InventoryTransaction.id))
        .filter(InventoryTransaction.status == "Returned")
        .scalar()
        or 0
    )
    compliance_rate: float = round((returned_tx / total_tx * 100), 1) if total_tx > 0 else 100.0

    # ── Medical ───────────────────────────────────────────────────────────────
    med_svc = MedicalService(db)
    med_analytics = med_svc.get_analytics()

    open_incidents: int = med_analytics.get("open_incidents", 0)
    critical_incidents: int = med_analytics.get("critical_incidents", 0)
    med_low_stock: int = (
        db.query(func.count(MedicalItem.id))
        .filter(MedicalItem.quantity <= MedicalItem.min_level)
        .scalar()
        or 0
    )

    return {
        "decompositions": {
            "total": decomp_total,
            "by_type": decomp_by_type,
        },
        "inventory": {
            "total_items": total_items,
            "low_stock_count": low_stock_count,
            "critical_count": critical_count,
            "outstanding_signouts": outstanding_signouts,
            "compliance_rate": compliance_rate,
        },
        "medical": {
            "open_incidents": open_incidents,
            "critical_incidents": critical_incidents,
            "low_stock_items": med_low_stock,
        },
        "kpis": [
            {
                "label": "Plan Compliance",
                "value": f"{compliance_rate}%",
                "description": "Equipment return compliance rate",
                "trend": "up" if compliance_rate >= 90 else "down",
            },
            {
                "label": "Active Incidents",
                "value": str(open_incidents),
                "description": "Open medical incidents",
                "trend": "up" if open_incidents == 0 else "down",
            },
            {
                "label": "Stock Health",
                "value": f"{max(0, 100 - (critical_count * 10))}%",
                "description": f"{critical_count} critical, {low_stock_count} low stock",
                "trend": "up" if critical_count == 0 else "down",
            },
            {
                "label": "Execution Plans",
                "value": str(decomp_total),
                "description": "AI-generated facility plans",
                "trend": "up",
            },
        ],
    }
