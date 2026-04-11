"""
SpaceMind OS — Supervisor Agent
Routes the request and sets flags for downstream specialists.
"""
from spacemind.ai.agents.base import BaseAgent
from spacemind.ai.prompts import SUPERVISOR_PROMPT


class SupervisorAgent(BaseAgent):
    name = "supervisor"
    system_prompt = SUPERVISOR_PROMPT
    model_key = "fast"   # Classification — Haiku is sufficient
