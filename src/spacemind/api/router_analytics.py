"""
SpaceMind OS — Analytics Routes
GET /api/v1/analytics — aggregated statistics across all decompositions
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.domain.models import User
from spacemind.services.decomposition_service import DecompositionService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Analytics"])


def get_service(db: Session = Depends(get_db)) -> DecompositionService:
    return DecompositionService(db)


@router.get("/analytics", summary="Aggregated analytics across all decompositions")
def get_analytics(
    service: DecompositionService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
):
    return service.get_analytics()
