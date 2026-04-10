"""
SpaceMind OS — Result Validator
Quality gate — ensures AI output meets minimum standards before delivery.
"""
from spacemind.core.exceptions import ValidationError
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionResult


class ResultValidator:
    def validate(self, result: DecompositionResult) -> None:
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
