"""
SpaceMind OS — Synthesizer Agent
Merges all specialist outputs into the final execution plan.
"""
from spacemind.ai.agents.base import BaseAgent
from spacemind.ai.prompts import SYNTHESIZER_PROMPT


class SynthesizerAgent(BaseAgent):
    name = "synthesizer"
    system_prompt = SYNTHESIZER_PROMPT
    model_key = "primary"
