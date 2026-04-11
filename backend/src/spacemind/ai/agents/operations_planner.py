"""
SpaceMind OS — Operations Planner Agent
Specialist in sequencing, timeline, and resource orchestration.
"""
from spacemind.ai.agents.base import BaseAgent
from spacemind.ai.prompts import OPERATIONS_PLANNER_PROMPT


class OperationsPlannerAgent(BaseAgent):
    name = "operations_planner"
    system_prompt = OPERATIONS_PLANNER_PROMPT
    model_key = "primary"
