"""
SpaceMind OS — Result Validator
Quality gate — ensures AI output meets minimum standards before delivery.
"""
from spacemind.core.logging import log
from spacemind.domain.schemas import DecompositionResult


class ResultValidator:
    def validate(self, result: DecompositionResult) -> None:
        errors = []

        if not result.phases:
            errors.append("No phases generated — AI returned empty plan")
        if not result.request_summary:
            errors.append("Missing request_summary")
        if result.total_tasks == 0:
            errors.append("Plan has zero tasks — AI output likely malformed")

        for phase in result.phases:
            if not phase.tasks:
                log.warning(f"Phase '{phase.name}' has no tasks — may be incomplete")
            for task in phase.tasks:
                if not task.name:
                    errors.append(f"Task with id={task.id} has no name")

        if errors:
            error_list = "; ".join(errors)
            log.error(f"Validation failed: {error_list}")
            raise ValueError(f"Decomposition validation failed: {error_list}")

        log.info(f"Validation passed — {result.total_tasks} tasks across {len(result.phases)} phases")
