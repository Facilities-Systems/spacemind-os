"""
SpaceMind OS — Vendor Coordinator Agent
Specialist in procurement, SLA structuring, and contractor management.
"""
from spacemind.ai.agents.base import BaseAgent
from spacemind.ai.prompts import VENDOR_COORDINATOR_PROMPT


class VendorCoordinatorAgent(BaseAgent):
    name = "vendor_coordinator"
    system_prompt = VENDOR_COORDINATOR_PROMPT
    model_key = "fast"   # Vendor coordination context is well-structured — Haiku handles it
