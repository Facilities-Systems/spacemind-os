"""
SpaceMind OS — Search Router
GET /api/v1/search?q=&domains=&limit=
"""
from __future__ import annotations

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.domain.models import User
from spacemind.services.search_service import SearchService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


class SearchResultOut(BaseModel):
    id: str
    domain: str
    title: str
    subtitle: str
    url: str
    score: float = 0.0

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultOut]


@router.get("", response_model=SearchResponse, summary="Unified cross-domain search")
def search(
    q: str = Query(min_length=2, max_length=200, description="Search query"),
    domains: Optional[str] = Query(
        default=None,
        description="Comma-separated domains: inventory,assets,medical,history",
    ),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    domain_list = [d.strip() for d in domains.split(",")] if domains else None
    svc = SearchService(db)
    results = svc.search(q=q, domains=domain_list, limit=limit)
    return SearchResponse(
        query=q,
        total=len(results),
        results=[SearchResultOut(**r) for r in results],
    )
