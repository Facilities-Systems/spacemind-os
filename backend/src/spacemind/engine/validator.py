"""
SpaceMind OS — Result Validator
Quality gate — ensures AI output meets minimum standards before delivery.
"""
from spacemind.core.exceptions import ValidationError
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionResult

MAX_PHASES = 8
MAX_TASKS_PER_PHASE = 20


class ResultValidator:
    def validate(self, result: DecompositionResult) -> None:
        # Hard constraints: silently trim AI overproduction rather than failing the request
        if len(result.phases) > MAX_PHASES:
            log.warning(
                "[Guardrails] AI returned %d phases — trimming to %d",
                len(result.phases),
                MAX_PHASES,
            )
            result.phases = result.phases[:MAX_PHASES]

        for phase in result.phases:
            if len(phase.tasks) > MAX_TASKS_PER_PHASE:
                log.warning(
                    "[Guardrails] Phase '%s' has %d tasks — trimming to %d",
                    phase.name,
                    len(phase.tasks),
                    MAX_TASKS_PER_PHASE,
                )
                phase.tasks = phase.tasks[:MAX_TASKS_PER_PHASE]

        # Recalculate total_tasks after any trimming
        result.total_tasks = sum(len(p.tasks) for p in result.phases)

        errors = []

        if not result.phases:
            errors.append("No phases generated — AI returned an empty plan")
        if not result.request_summary:
            errors.append("Missing request_summary")
        if result.total_tasks == 0:
            errors.append("Plan has zero tasks — AI output likely malformed")

        for phase in result.phases:
            if not phase.tasks:
                log.warning(f"Phase '{phase.name}' has no tasks — may be incomplete")
            for task in phase.tasks:
                if not task.name:
                    errors.append(f"Task id={task.id} has no name")
                if task.estimated_duration_hours is not None and task.estimated_duration_hours < 0:
                    errors.append(f"Task '{task.name}' has a negative duration")

        if errors:
            log.error(f"Validation failed: {'; '.join(errors)}")
            raise ValidationError(
                f"The generated plan did not pass quality checks: {'; '.join(errors)}"
            )

        log.info(f"Validation passed — {result.total_tasks} tasks across {len(result.phases)} phases")
