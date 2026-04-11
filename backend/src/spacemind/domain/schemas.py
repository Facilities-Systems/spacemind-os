"""
SpaceMind OS — Domain Schemas (Pydantic v2)
The contract between the AI engine and the outside world.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from spacemind.core.constants import (
    PhaseStatus,
    RequestType,
    ResponsiblePartyType,
    RiskLevel,
    TenureType,
)


# ─── Input ────────────────────────────────────────────────────────────────────

class DecompositionRequest(BaseModel):
    request_text: str = Field(
        ...,
        min_length=10,
        description="Natural language facilities request",
        examples=["Move 40 staff from FP1 to FP2 within the next 6 weeks"],
    )
    location_id: str = Field(
        default="FP1_HQ_SouthAfrica",
        description="Location identifier from KNOWN_LOCATIONS",
    )
    priority: Optional[str] = Field(
        default="normal",
        pattern="^(low|normal|high|urgent)$",
    )
    requester_name: Optional[str] = None
    target_completion_date: Optional[datetime] = None
    additional_context: Optional[str] = None


# ─── Output building blocks ────────────────────────────────────────────────────

class ResponsibleParty(BaseModel):
    party: ResponsiblePartyType
    name: Optional[str] = None        # Specific vendor / person
    notes: Optional[str] = None


class TaskItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4())[:8])
    name: str
    description: Optional[str] = None
    responsible: ResponsibleParty
    estimated_duration_hours: Optional[float] = None
    dependencies: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    risk_level: RiskLevel = RiskLevel.LOW
    status: PhaseStatus = PhaseStatus.PENDING
    landlord_approval_required: bool = False
    notes: Optional[str] = None


class Phase(BaseModel):
    name: str
    order: int
    description: Optional[str] = None
    tasks: List[TaskItem] = Field(default_factory=list)
    status: PhaseStatus = PhaseStatus.PENDING

    @property
    def total_estimated_hours(self) -> float:
        return sum(t.estimated_duration_hours or 0 for t in self.tasks)


class LocationContext(BaseModel):
    location_id: str
    tenure: TenureType
    country: str
    landlord_approval_required: bool
    notes: Optional[str] = None


# ─── Final decomposition result ────────────────────────────────────────────────

class DecompositionResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # What was asked
    request_summary: str
    original_request: str
    request_type: RequestType
    priority: str = "normal"

    # Where
    location_context: LocationContext

    # The plan
    phases: List[Phase] = Field(default_factory=list)

    # Totals & meta
    total_estimated_duration_days: Optional[int] = None
    total_tasks: int = 0
    key_risks: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    landlord_items: List[str] = Field(default_factory=list)   # Things needing landlord sign-off
    compliance_notes: List[str] = Field(default_factory=list)

    metadata: dict[str, Any] = Field(default_factory=dict)

    def model_post_init(self, __context: Any) -> None:
        self.total_tasks = sum(len(p.tasks) for p in self.phases)


# ─── History / list responses ─────────────────────────────────────────────────

class DecompositionSummary(BaseModel):
    id: str
    created_at: datetime
    request_type: str
    request_summary: str
    location_id: str
    total_tasks: int
    priority: str


class HistoryResponse(BaseModel):
    items: List[DecompositionSummary]
    total: int
