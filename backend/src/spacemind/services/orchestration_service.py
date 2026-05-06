"""
SpaceMind OS — Orchestration Service
Application-level wrapper around the multi-agent planner.
Handles persistence + optional vector memory injection.
"""
import asyncio
import json
from collections.abc import AsyncGenerator

from sqlalchemy.orm import Session

from spacemind.ai.client import TokenUsage
from spacemind.core.config import settings
from spacemind.core.exceptions import AIError
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionRequest, DecompositionResult, LocationContext
from spacemind.engine.planner import MultiAgentPlanner
from spacemind.knowledge.base_templates import load_template, template_to_context_string
from spacemind.knowledge.rules import apply_location_rules, get_location_context
from spacemind.storage.repository import DecompositionRepository


def _sse(event: str, data: dict) -> str:
    """Format a single SSE message."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


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

    async def stream(self, request: DecompositionRequest) -> AsyncGenerator[str, None]:
        """
        Async generator that yields SSE events while running the multi-agent pipeline.
        Each agent runs in a thread via asyncio.to_thread so the event loop stays free.
        Events: supervisor_start, supervisor_done, agent_start, agent_done, synthesizer_start,
                synthesizer_done, complete, error
        """
        try:
            # ── Step 1: Classify ──────────────────────────────────────────────
            yield _sse("status", {"message": "Classifying request type..."})
            request_type = await asyncio.to_thread(
                self._planner._classifier.classify, request.request_text
            )

            # ── Step 2: Load context ──────────────────────────────────────────
            yield _sse("status", {"message": "Loading FM knowledge template..."})
            template = load_template(request_type)
            template_context = template_to_context_string(template)
            location_data = get_location_context(request.location_id)
            location_ctx = LocationContext(
                location_id=request.location_id,
                tenure=location_data["tenure"],
                country=location_data["country"],
                landlord_approval_required=location_data["landlord_approval_required"],
                notes=location_data.get("notes"),
            )
            base_context = self._planner._build_base_context(
                request, template_context, location_data
            )

            # ── Step 3: Supervisor ────────────────────────────────────────────
            yield _sse("agent_start", {"agent": "supervisor", "label": "Supervisor", "message": "Analysing complexity and routing..."})
            try:
                supervisor_output, sup_usage = await asyncio.to_thread(
                    self._planner._supervisor.run, base_context
                )
                complexity = supervisor_output.get("complexity", "moderate")
                flags = supervisor_output.get("priority_flags", [])
                yield _sse("agent_done", {
                    "agent": "supervisor",
                    "label": "Supervisor",
                    "content": f"Complexity: {complexity}" + (f" · Flags: {', '.join(flags)}" if flags else ""),
                })
            except Exception as e:
                log.warning(f"[Stream] Supervisor failed: {e}")
                supervisor_output = {"complexity": "moderate", "routing_notes": ""}
                sup_usage = TokenUsage()
                yield _sse("agent_done", {"agent": "supervisor", "label": "Supervisor", "content": "Complexity assessment complete"})

            # ── Step 4: Parallel specialists ──────────────────────────────────
            specialist_context = self._planner._build_specialist_context(base_context, supervisor_output)

            yield _sse("agent_start", {"agent": "operations", "label": "Operations Planner", "message": "Planning phase sequences..."})
            yield _sse("agent_start", {"agent": "technical", "label": "Technical Specialist", "message": "Assessing technical requirements..."})
            yield _sse("agent_start", {"agent": "vendor", "label": "Vendor Coordinator", "message": "Mapping vendor requirements..."})

            specialist_outputs: dict = {}
            total_usage = TokenUsage(
                input_tokens=sup_usage.input_tokens,
                output_tokens=sup_usage.output_tokens,
            )

            _AGENT_LABELS = {
                "operations": "Operations Planner",
                "technical": "Technical Specialist",
                "vendor": "Vendor Coordinator",
            }
            _agents = {
                "operations": self._planner._ops_planner,
                "technical": self._planner._tech_specialist,
                "vendor": self._planner._vendor_coord,
            }

            async def _run_specialist(name: str, agent):
                try:
                    result_dict, usage = await asyncio.to_thread(agent.run, specialist_context)
                    return name, result_dict, usage
                except Exception as e:
                    log.warning(f"[Stream] {name} specialist failed: {e}")
                    return name, {}, TokenUsage()

            tasks = [asyncio.create_task(_run_specialist(n, a)) for n, a in _agents.items()]

            for coro in asyncio.as_completed(tasks):
                name, output, usage = await coro
                specialist_outputs[name] = output
                total_usage = TokenUsage(
                    input_tokens=total_usage.input_tokens + usage.input_tokens,
                    output_tokens=total_usage.output_tokens + usage.output_tokens,
                )
                yield _sse("agent_done", {
                    "agent": name,
                    "label": _AGENT_LABELS[name],
                    "content": f"{_AGENT_LABELS[name]} analysis complete",
                })

            # ── Step 5: Synthesizer ───────────────────────────────────────────
            synthesis_context = self._planner._build_synthesis_context(
                base_context, supervisor_output, specialist_outputs
            )
            yield _sse("agent_start", {"agent": "synthesizer", "label": "Synthesizer", "message": "Building unified execution plan..."})
            try:
                final_raw, synth_usage = await asyncio.to_thread(
                    self._planner._synthesizer.run, synthesis_context, 6000
                )
                total_usage = TokenUsage(
                    input_tokens=total_usage.input_tokens + synth_usage.input_tokens,
                    output_tokens=total_usage.output_tokens + synth_usage.output_tokens,
                )
            except Exception as e:
                yield _sse("error", {"message": f"Synthesizer failed: {type(e).__name__}"})
                return
            yield _sse("agent_done", {"agent": "synthesizer", "label": "Synthesizer", "content": "Execution plan synthesized"})

            # ── Step 6: Parse + business rules + save ─────────────────────────
            yield _sse("status", {"message": "Applying compliance rules and saving..."})
            try:
                result = self._planner._parse_final(
                    final_raw, request, request_type, location_ctx, total_usage
                )
                result = apply_location_rules(result)
                self._planner._validator.validate(result)
            except Exception as e:
                yield _sse("error", {"message": f"Plan parsing failed: {type(e).__name__}"})
                return

            if settings.enable_history:
                try:
                    self._repo.save(result, request_text=request.request_text)
                except Exception as e:
                    log.warning(f"[Stream] Failed to persist result {result.id}: {e}")

            if settings.enable_vector_memory:
                self._embed_and_store(result, request.request_text)

            yield _sse("complete", {
                "decomposition_id": result.id,
                "total_tasks": result.total_tasks,
                "phases": len(result.phases),
                "total_tokens": total_usage.total_tokens,
            })

        except AIError as e:
            yield _sse("error", {"message": str(e.message)})
        except Exception as e:
            log.error(f"[Stream] Unexpected error: {e}")
            yield _sse("error", {"message": "An unexpected error occurred during analysis."})

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
