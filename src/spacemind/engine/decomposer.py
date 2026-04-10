"""
SpaceMind OS — Decomposer Engine
Orchestrates: classify → load template → call AI → validate → apply rules
"""
from spacemind.ai.client import AIClient
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


class Decomposer:
    def __init__(self):
        self._ai = AIClient()
        self._classifier = RequestClassifier(self._ai)
        self._validator = ResultValidator()

    def decompose(self, request: DecompositionRequest) -> DecompositionResult:
        log.info(f"[Decompose] Starting for location={request.location_id}")

        # 1. Classify
        request_type = self._classifier.classify(request.request_text)
        log.info(f"[Decompose] Type → {request_type}")

        # 2. Load knowledge template
        template = load_template(request_type)
        template_context = template_to_context_string(template)

        # 3. Get location context
        location_data = get_location_context(request.location_id)
        location_ctx = LocationContext(
            location_id=request.location_id,
            tenure=location_data["tenure"],
            country=location_data["country"],
            landlord_approval_required=location_data["landlord_approval_required"],
            notes=location_data.get("notes"),
        )

        # 4. Call AI — returns (parsed_dict, token_usage)
        try:
            raw, token_usage = self._ai.decompose(
                request_text=request.request_text,
                template_context=template_context,
                location_context=location_data,
            )
        except Exception:
            raise  # AIError / AIParseError already typed — let them propagate

        # 5. Parse into domain schema
        try:
            result = self._parse_ai_output(raw, request, request_type, location_ctx, token_usage)
        except Exception as e:
            raise DecompositionError(f"Failed to parse AI output into plan: {type(e).__name__}") from e

        # 6. Apply business rules
        result = apply_location_rules(result)

        # 7. Validate
        self._validator.validate(result)

        log.info(
            f"[Decompose] Done — {len(result.phases)} phases, "
            f"{result.total_tasks} tasks, ~{result.total_estimated_duration_days}d | "
            f"tokens={token_usage.total_tokens}"
        )
        return result

    def _parse_ai_output(
        self,
        raw: dict,
        request: DecompositionRequest,
        request_type: RequestType,
        location_ctx: LocationContext,
        token_usage,
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
            metadata={"token_usage": token_usage.to_dict()},
        )
