"""
SpaceMind OS — Orchestration Service
Application-level wrapper around the multi-agent planner.
Handles persistence + optional vector memory injection.
"""
from sqlalchemy.orm import Session

from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionRequest, DecompositionResult
from spacemind.engine.planner import MultiAgentPlanner
from spacemind.storage.repository import DecompositionRepository


class OrchestrationService:
    def __init__(self, db: Session):
        self._planner = MultiAgentPlanner()
        self._repo = DecompositionRepository(db)

    def run(self, request: DecompositionRequest) -> DecompositionResult:
        # Optionally inject similar past cases into context via vector memory
        similar_cases_context = ""
        if settings.enable_vector_memory:
            similar_cases_context = self._fetch_similar_cases(request.request_text)
            if similar_cases_context:
                # Append to request additional_context so planner picks it up
                extra = f"\n\nSIMILAR PAST CASES (for reference):\n{similar_cases_context}"
                request = request.model_copy(
                    update={"additional_context": (request.additional_context or "") + extra}
                )

        result = self._planner.decompose(request)

        if settings.enable_history:
            try:
                self._repo.save(result, request_text=request.request_text)
            except Exception as e:
                log.warning(f"Failed to persist result {result.id}: {e}")

        # Async-safe: embed + store in vector memory after persisting
        if settings.enable_vector_memory:
            self._embed_and_store(result, request.request_text)

        return result

    def _fetch_similar_cases(self, request_text: str) -> str:
        try:
            from spacemind.storage.vector_store import VectorStore
            vs = VectorStore.get_instance()
            cases = vs.query(request_text, n_results=3)
            if not cases:
                return ""
            lines = []
            for case in cases:
                lines.append(f"- {case['summary']} (type: {case['request_type']}, ~{case['duration_days']}d)")
            return "\n".join(lines)
        except Exception as e:
            log.debug(f"Vector memory fetch skipped: {e}")
            return ""

    def _embed_and_store(self, result: DecompositionResult, request_text: str) -> None:
        try:
            from spacemind.storage.vector_store import VectorStore
            vs = VectorStore.get_instance()
            vs.upsert(
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
            log.debug(f"Vector memory store skipped: {e}")
