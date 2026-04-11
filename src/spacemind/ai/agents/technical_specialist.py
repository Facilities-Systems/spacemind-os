"""
SpaceMind OS — Technical Specialist Agent
Specialist in M&E, structural, IT infrastructure, and compliance.
"""
from spacemind.ai.agents.base import BaseAgent
from spacemind.ai.prompts import TECHNICAL_SPECIALIST_PROMPT


class TechnicalSpecialistAgent(BaseAgent):
    name = "technical_specialist"
    system_prompt = TECHNICAL_SPECIALIST_PROMPT
    model_key = "primary"
