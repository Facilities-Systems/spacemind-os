"""
SpaceMind OS — Multi-Agent Orchestration Planner
Runs Supervisor + 3 parallel specialists + Synthesizer to produce
a richer, more nuanced execution plan than single-pass decomposition.

Pipeline:
  Request
    └─► Supervisor (fast, serial)  ──────────────────────────────────┐
          └─► [Operations Planner]  ─┐                               │
          └─► [Technical Specialist] ├─ Parallel (ThreadPoolExecutor)│
          └─► [Vendor Coordinator]  ─┘                               │
                    └─► Synthesizer (primary, serial) ◄──────────────┘
                              └─► DecompositionResult
"""
from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from spacemind.ai.client import AIClient, TokenUsage
from spacemind.ai.agents.operations_planner import OperationsPlannerAgent
from spacemind.ai.agents.supervisor import SupervisorAgent
from spacemind.ai.agents.synthesizer import SynthesizerAgent
from spacemind.ai.agents.technical_specialist import TechnicalSpecialistAgent
from spacemind.ai.agents.vendor_coordinator import VendorCoordinatorAgent
from spacemind.core.constants import RequestType, ResponsiblePartyType, RiskLevel
from spacemind.core.exceptions import DecompositionError
from spacemind.core.logging import log
from spacemind.domain.schemas import (
    DecompositionRequest,
    DecompositionResult,
    LocationContext,
    Phase,
    ResponsibleParty,
    TaskItem,
)
from spacemind.engine.classifier import RequestClassifier
from spacemind.engine.validator import ResultValidator
from spacemind.knowledge.base_templates import load_template, template_to_context_string
from spacemind.knowledge.rules import apply_location_rules, get_location_context


class MultiAgentPlanner:
    """
    Orchestrates the full multi-agent pipeline.
    Replaces single-pass Decomposer when enable_multi_agent=True.
    """

    def __init__(self):
        self._ai = AIClient()
        self._classifier = RequestClassifier(self._ai)
        self._validator = ResultValidator()

        self._supervisor      = SupervisorAgent(self._ai)
        self._ops_planner     = OperationsPlannerAgent(self._ai)
        self._tech_specialist = TechnicalSpecialistAgent(self._ai)
        self._vendor_coord    = VendorCoordinatorAgent(self._ai)
        self._synthesizer     = SynthesizerAgent(self._ai)

    def decompose(self, request: DecompositionRequest) -> DecompositionResult:
        log.info(f"[MultiAgent] Starting pipeline for location={request.location_id}")

        # ── Step 1: Classify ──────────────────────────────────────────────────
        request_type = self._classifier.classify(request.request_text)
        log.info(f"[MultiAgent] Type → {request_type}")

        # ── Step 2: Load context ──────────────────────────────────────────────
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

        base_context = self._build_base_context(request, template_context, location_data)

        # ── Step 3: Supervisor (serial — fast) ────────────────────────────────
        try:
            supervisor_output, sup_usage = self._supervisor.run(base_context)
            log.info(
                f"[MultiAgent] Supervisor → complexity={supervisor_output.get('complexity')} "
                f"flags={supervisor_output.get('priority_flags', [])}"
            )
        except Exception as e:
            log.warning(f"[MultiAgent] Supervisor failed ({e}), proceeding with defaults")
            supervisor_output = {"complexity": "moderate", "routing_notes": ""}
            sup_usage = TokenUsage()

        # ── Step 4: Parallel specialist calls ─────────────────────────────────
        specialist_context = self._build_specialist_context(
            base_context, supervisor_output
        )

        specialist_outputs: dict[str, dict] = {}
        total_usage = TokenUsage(
            input_tokens=sup_usage.input_tokens,
            output_tokens=sup_usage.output_tokens,
        )

        agents = {
            "operations":  (self._ops_planner,     specialist_context),
            "technical":   (self._tech_specialist,  specialist_context),
            "vendor":      (self._vendor_coord,     specialist_context),
        }

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {
                pool.submit(agent.run, ctx): name
                for name, (agent, ctx) in agents.items()
            }
            for future in as_completed(futures):
                agent_name = futures[future]
                try:
                    result_dict, usage = future.result()
                    specialist_outputs[agent_name] = result_dict
                    total_usage = TokenUsage(
                        input_tokens=total_usage.input_tokens + usage.input_tokens,
                        output_tokens=total_usage.output_tokens + usage.output_tokens,
                    )
                    log.info(f"[MultiAgent] {agent_name} specialist done ✓")
                except Exception as e:
                    log.warning(f"[MultiAgent] {agent_name} specialist failed ({e}), using empty output")
                    specialist_outputs[agent_name] = {}

        log.info(
            f"[MultiAgent] All specialists done — "
            f"ops={bool(specialist_outputs.get('operations'))}, "
            f"tech={bool(specialist_outputs.get('technical'))}, "
            f"vendor={bool(specialist_outputs.get('vendor'))}"
        )

        # ── Step 5: Synthesizer (serial — primary) ────────────────────────────
        synthesis_context = self._build_synthesis_context(
            base_context, supervisor_output, specialist_outputs
        )
        try:
            final_raw, synth_usage = self._synthesizer.run(
                synthesis_context, max_tokens=6000
            )
            total_usage = TokenUsage(
                input_tokens=total_usage.input_tokens + synth_usage.input_tokens,
                output_tokens=total_usage.output_tokens + synth_usage.output_tokens,
            )
        except Exception as e:
            raise DecompositionError(f"Synthesizer failed: {type(e).__name__}") from e

        # ── Step 6: Parse → domain schema ─────────────────────────────────────
        try:
            result = self._parse_final(final_raw, request, request_type, location_ctx, total_usage)
        except Exception as e:
            raise DecompositionError(f"Failed to parse synthesizer output: {type(e).__name__}") from e

        # ── Step 7: Business rules + validation ───────────────────────────────
        result = apply_location_rules(result)
        self._validator.validate(result)

        log.info(
            f"[MultiAgent] Pipeline complete — "
            f"{len(result.phases)} phases, {result.total_tasks} tasks, "
            f"~{result.total_estimated_duration_days}d | "
            f"total_tokens={total_usage.total_tokens}"
        )
        return result

    # ─── Context builders ─────────────────────────────────────────────────────

    def _build_base_context(
        self,
        request: DecompositionRequest,
        template_context: str,
        location_data: dict,
    ) -> str:
        return f"""FACILITIES REQUEST:
{request.request_text}

REQUESTER: {request.requester_name or 'Not specified'}
PRIORITY: {request.priority or 'normal'}
LOCATION:
{json.dumps(location_data, indent=2)}

KNOWLEDGE TEMPLATE (industry-standard starting point):
{template_context}
"""

    def _build_specialist_context(self, base: str, supervisor: dict) -> str:
        flags = supervisor.get("priority_flags", [])
        notes = supervisor.get("routing_notes", "")
        return f"""{base}

SUPERVISOR ROUTING:
Complexity: {supervisor.get('complexity', 'moderate')}
Priority flags: {', '.join(flags) if flags else 'none'}
Routing notes: {notes}
"""

    def _build_synthesis_context(
        self,
        base: str,
        supervisor: dict,
        specialists: dict[str, dict],
    ) -> str:
        return f"""{base}

SUPERVISOR ANALYSIS:
{json.dumps(supervisor, indent=2)}

OPERATIONS PLANNER OUTPUT:
{json.dumps(specialists.get('operations', {}), indent=2)}

TECHNICAL SPECIALIST OUTPUT:
{json.dumps(specialists.get('technical', {}), indent=2)}

VENDOR COORDINATOR OUTPUT:
{json.dumps(specialists.get('vendor', {}), indent=2)}

Synthesize all specialist inputs into a single, unified, correctly sequenced execution plan.
"""

    # ─── Output parsing ───────────────────────────────────────────────────────

    def _parse_final(
        self,
        raw: dict,
        request: DecompositionRequest,
        request_type: RequestType,
        location_ctx: LocationContext,
        token_usage: TokenUsage,
    ) -> DecompositionResult:
        phases = []
        for i, phase_data in enumerate(raw.get("phases", [])):
            tasks = []
            for task_data in phase_data.get("tasks", []):
                resp = task_data.get("responsible", {})
                try:
                    party = ResponsiblePartyType(resp.get("party", "other"))
                except ValueError:
                    party = ResponsiblePartyType.OTHER
                try:
                    risk_level = RiskLevel(task_data.get("risk_level", "low"))
                except ValueError:
                    risk_level = RiskLevel.LOW

                tasks.append(TaskItem(
                    id=task_data.get("id", f"t{i:02d}{len(tasks):02d}"),
                    name=task_data.get("name", ""),
                    description=task_data.get("description"),
                    responsible=ResponsibleParty(
                        party=party,
                        notes=resp.get("notes"),
                    ),
                    estimated_duration_hours=task_data.get("estimated_duration_hours"),
                    dependencies=task_data.get("dependencies", []),
                    risks=task_data.get("risks", []),
                    risk_level=risk_level,
                    landlord_approval_required=task_data.get("landlord_approval_required", False),
                    notes=task_data.get("notes"),
                ))

            phases.append(Phase(
                name=phase_data.get("name", f"Phase {i + 1}"),
                order=phase_data.get("order", i + 1),
                description=phase_data.get("description"),
                tasks=tasks,
            ))

        return DecompositionResult(
            request_summary=raw.get("request_summary", request.request_text[:100]),
            original_request=request.request_text,
            request_type=request_type,
            priority=request.priority or "normal",
            location_context=location_ctx,
            phases=phases,
            total_estimated_duration_days=raw.get("total_estimated_duration_days"),
            key_risks=raw.get("key_risks", []),
            recommendations=raw.get("recommendations", []),
            landlord_items=raw.get("landlord_items", []),
            compliance_notes=raw.get("compliance_notes", []),
            metadata={
                "token_usage": token_usage.to_dict(),
                "engine": "multi_agent",
                "agents": ["supervisor", "operations_planner", "technical_specialist", "vendor_coordinator", "synthesizer"],
            },
        )
