"""
SpaceMind OS — Decomposition Service
Application-level orchestration: decompose + optionally persist.
"""
from sqlalchemy.orm import Session

from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.domain.schemas import (
    DecompositionRequest,
    DecompositionResult,
    HistoryResponse,
)
from spacemind.engine.decomposer import Decomposer
from spacemind.storage.repository import DecompositionRepository


class DecompositionService:
    def __init__(self, db: Session):
        self._decomposer = Decomposer()
        self._repo = DecompositionRepository(db)

    def run(self, request: DecompositionRequest) -> DecompositionResult:
        result = self._decomposer.decompose(request)

        if settings.enable_history:
            try:
                self._repo.save(result, request_text=request.request_text)
            except Exception as e:
                log.warning(f"Failed to persist result {result.id}: {e} (returning result anyway)")

        return result

    def get_history(
        self,
        limit: int = 20,
        offset: int = 0,
        request_type: str | None = None,
        location_id: str | None = None,
        priority: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> HistoryResponse:
        records = self._repo.list_filtered(
            limit=limit,
            offset=offset,
            request_type=request_type,
            location_id=location_id,
            priority=priority,
            from_date=from_date,
            to_date=to_date,
        )
        total = self._repo.count_filtered(
            request_type=request_type,
            location_id=location_id,
            priority=priority,
            from_date=from_date,
            to_date=to_date,
        )
        return HistoryResponse(items=[self._repo.to_summary(r) for r in records], total=total)

    def get_by_id(self, decomposition_id: str) -> DecompositionResult | None:
        record = self._repo.get_by_id(decomposition_id)
        if not record:
            return None
        return DecompositionResult.model_validate(record.result_json)
