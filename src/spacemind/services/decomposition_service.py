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
    DecompositionSummary,
    HistoryResponse,
)
from spacemind.engine.decomposer import Decomposer
from spacemind.storage.repository import DecompositionRepository


class DecompositionService:
    def __init__(self, db: Session):
        self._decomposer = Decomposer()
        self._repo = DecompositionRepository(db)
        self._db = db

    def run(self, request: DecompositionRequest) -> DecompositionResult:
        result = self._decomposer.decompose(request)

        if settings.enable_history:
            try:
                self._repo.save(result, request_text=request.request_text)
            except Exception as e:
                log.warning(f"Failed to persist result: {e} (returning result anyway)")

        return result

    def get_history(self, limit: int = 20, offset: int = 0) -> HistoryResponse:
        records = self._repo.list_recent(limit=limit, offset=offset)
        total = self._repo.count()
        items = [self._repo.to_summary(r) for r in records]
        return HistoryResponse(items=items, total=total)

    def get_by_id(self, decomposition_id: str) -> DecompositionResult | None:
        record = self._repo.get_by_id(decomposition_id)
        if not record:
            return None
        return DecompositionResult.model_validate(record.result_json)
