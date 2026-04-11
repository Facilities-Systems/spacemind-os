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


def _get_engine(force_multi_agent: bool = False):
    """Return the appropriate decomposition engine based on settings."""
    if force_multi_agent or settings.enable_multi_agent:
        from spacemind.engine.planner import MultiAgentPlanner
        return MultiAgentPlanner()
    return Decomposer()


class DecompositionService:
    def __init__(self, db: Session):
        self._repo = DecompositionRepository(db)

    def run(self, request: DecompositionRequest, multi_agent: bool = False) -> DecompositionResult:
        # Validate at service boundary (UFM pattern — centralised validators)
        from spacemind.core.validators import validate_decomposition_request
        validated_text, validated_loc, validated_priority = validate_decomposition_request(
            request.request_text, request.location_id, request.priority
        )
        request = request.model_copy(update={
            "request_text": validated_text,
            "location_id": validated_loc,
            "priority": validated_priority,
        })

        engine = _get_engine(force_multi_agent=multi_agent)

        # Inject similar past cases if vector memory is enabled
        if settings.enable_vector_memory:
            request = self._inject_similar_cases(request)

        result = engine.decompose(request)

        if settings.enable_history:
            try:
                self._repo.save(result, request_text=request.request_text)
            except Exception as e:
                log.warning(f"Failed to persist result {result.id}: {e} (returning result anyway)")

        if settings.enable_vector_memory:
            self._embed_result(result, request.request_text)

        return result

    def _inject_similar_cases(self, request: DecompositionRequest) -> DecompositionRequest:
        try:
            from spacemind.storage.vector_store import VectorStore
            cases = VectorStore.get_instance().query(request.request_text, n_results=3)
            if not cases:
                return request
            lines = ["Similar past cases (for context):"]
            for c in cases:
                lines.append(f"  - {c.get('summary', '')} ({c.get('request_type', '')} · {c.get('duration_days', 0)}d)")
            extra = "\n".join(lines)
            return request.model_copy(
                update={"additional_context": (request.additional_context or "") + "\n\n" + extra}
            )
        except Exception as e:
            log.debug(f"Vector memory inject skipped: {e}")
            return request

    def _embed_result(self, result: DecompositionResult, request_text: str) -> None:
        try:
            from spacemind.storage.vector_store import VectorStore
            VectorStore.get_instance().upsert(
                doc_id=result.id,
                text=request_text + " " + result.request_summary,
                metadata={
                    "summary": result.request_summary,
                    "request_type": result.request_type.value,
                    "duration_days": result.total_estimated_duration_days or 0,
                    "location_id": result.location_context.location_id,
                },
            )
        except Exception as e:
            log.debug(f"Vector memory embed skipped: {e}")

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

    def update_task_status(
        self,
        decomposition_id: str,
        task_id: str,
        status: str,
    ) -> bool:
        record = self._repo.get_by_id(decomposition_id)
        if not record:
            return False

        result_data: dict = record.result_json
        found = False
        for phase in result_data.get("phases", []):
            for task in phase.get("tasks", []):
                if task.get("id") == task_id:
                    task["status"] = status
                    found = True
                    break
            if found:
                break

        if not found:
            return False

        self._repo.update_result_json(decomposition_id, result_data)
        log.info(f"Task {task_id} in {decomposition_id} → {status}")
        return True

    def get_analytics(self) -> dict:
        from spacemind.utils.cache import analytics_cache
        cached = analytics_cache.get("analytics")
        if cached is not None:
            return cached
        data = self._repo.get_analytics()
        analytics_cache.set("analytics", data)
        return data
