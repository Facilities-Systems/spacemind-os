"""
SpaceMind OS — Domain Schemas (Pydantic v2)
The contract between the AI engine and the outside world.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from spacemind.core.constants import (
    IncidentSeverity,
    IncidentStatus,
    ItemCategory,
    MedicalItemCategory,
    PhaseStatus,
    RequestType,
    RequisitionStatus,
    ResponsiblePartyType,
    RiskLevel,
    TenureType,
    TransactionStatus,
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

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


# ─── Inventory schemas ────────────────────────────────────────────────────────

class InventoryItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    category: ItemCategory
    quantity: float = Field(default=0, ge=0)
    unit: str = Field(default="units", max_length=20)
    min_level: float = Field(default=0, ge=0)
    location: Optional[str] = None
    notes: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ItemCategory] = None
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = None
    min_level: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = None
    notes: Optional[str] = None


class InventoryItemOut(BaseModel):
    id: str
    name: str
    code: str
    category: str
    quantity: float
    unit: str
    min_level: float
    location: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    item_id: str
    quantity: float = Field(..., gt=0)
    borrower: str = Field(..., min_length=1)
    department: Optional[str] = None
    work_order: Optional[str] = None
    expected_return: Optional[datetime] = None
    notes: Optional[str] = None


class TransactionOut(BaseModel):
    id: str
    item_id: str
    item_name: str
    item_code: str
    quantity: float
    borrower: str
    department: Optional[str]
    work_order: Optional[str]
    date_out: datetime
    expected_return: Optional[datetime]
    date_returned: Optional[datetime]
    status: str
    notes: Optional[str]

    model_config = {"from_attributes": True}


class RequisitionCreate(BaseModel):
    requester: str = Field(..., min_length=1)
    role: Optional[str] = None
    department: Optional[str] = None
    work_order: Optional[str] = None
    priority: str = Field(default="Medium", pattern="^(High|Medium|Low)$")
    items_description: str = Field(..., min_length=1)
    notes: Optional[str] = None


class RequisitionStatusUpdate(BaseModel):
    status: RequisitionStatus


class RequisitionOut(BaseModel):
    id: str
    requester: str
    role: Optional[str]
    department: Optional[str]
    work_order: Optional[str]
    priority: str
    items_description: str
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryAnalytics(BaseModel):
    total_items: int
    low_stock_count: int
    critical_count: int
    outstanding_transactions: int
    pending_requisitions: int


# ─── Medical schemas ──────────────────────────────────────────────────────────

class MedicalItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: MedicalItemCategory
    quantity: int = Field(default=0, ge=0)
    unit: str = Field(default="units", max_length=20)
    min_level: int = Field(default=0, ge=0)
    expiry_date: Optional[str] = None   # ISO date string YYYY-MM-DD
    equipment_serial_number: Optional[str] = None
    last_service_date: Optional[str] = None   # ISO datetime string
    location: Optional[str] = None
    notes: Optional[str] = None


class MedicalItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[MedicalItemCategory] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = None
    min_level: Optional[int] = Field(default=None, ge=0)
    expiry_date: Optional[str] = None
    equipment_serial_number: Optional[str] = None
    last_service_date: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class MedicalItemOut(BaseModel):
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    min_level: int
    expiry_date: Optional[str]
    equipment_serial_number: Optional[str]
    last_service_date: Optional[datetime]
    location: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentCreate(BaseModel):
    incident_type: str = Field(..., min_length=1)
    severity: IncidentSeverity
    employee_name: Optional[str] = None
    department: Optional[str] = None
    description: str = Field(..., min_length=1)
    treatment: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class IncidentOut(BaseModel):
    id: str
    incident_type: str
    severity: str
    employee_name: Optional[str]
    department: Optional[str]
    description: str
    treatment: Optional[str]
    status: str
    reported_at: datetime
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MedicalAnalytics(BaseModel):
    total_items: int
    low_stock_count: int
    expiring_soon_count: int
    open_incidents: int
    critical_incidents: int


class MedicalAlerts(BaseModel):
    expired: List[MedicalItemOut]
    expiring_soon: List[MedicalItemOut]
    low_stock: List[MedicalItemOut]


# ─── Supplier schemas ─────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category: Optional[str] = None
    lead_time_days: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category: Optional[str] = None
    lead_time_days: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierOut(BaseModel):
    id: str
    name: str
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    category: Optional[str]
    lead_time_days: Optional[int]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Floor Plan schemas ───────────────────────────────────────────────────────

class FloorPlanCreate(BaseModel):
    building_id:    str = Field(..., min_length=1, max_length=20)
    building_name:  str = Field(..., min_length=1, max_length=200)
    floor_name:     str = Field(..., min_length=1, max_length=100)
    floor_order:    int = Field(default=0, ge=0)
    total_area_sqm: int = Field(default=800, ge=0)
    capacity_pax:   int = Field(default=60,  ge=0)
    total_desks:    int = Field(default=0,   ge=0)
    occupied_desks: int = Field(default=0,   ge=0)
    meeting_rooms:  int = Field(default=0,   ge=0)
    status:         str = Field(default="active")


class FloorPlanUpdate(BaseModel):
    building_name:  Optional[str] = Field(default=None, min_length=1, max_length=200)
    floor_name:     Optional[str] = Field(default=None, min_length=1, max_length=100)
    floor_order:    Optional[int] = Field(default=None, ge=0)
    total_area_sqm: Optional[int] = Field(default=None, ge=0)
    capacity_pax:   Optional[int] = Field(default=None, ge=0)
    total_desks:    Optional[int] = Field(default=None, ge=0)
    occupied_desks: Optional[int] = Field(default=None, ge=0)
    meeting_rooms:  Optional[int] = Field(default=None, ge=0)
    status:         Optional[str] = None


class FloorPlanOut(BaseModel):
    id:             str
    building_id:    str
    building_name:  str
    floor_name:     str
    floor_order:    int
    total_area_sqm: int
    capacity_pax:   int
    total_desks:    int
    occupied_desks: int
    meeting_rooms:  int
    status:         str
    created_at:     datetime
    updated_at:     datetime

    model_config = {"from_attributes": True}


# ─── Asset schemas ────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    asset_code: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=50)
    location_id: Optional[str] = None
    floor_plan_id: Optional[str] = None
    purchase_date: Optional[str] = None      # ISO datetime
    purchase_cost: Optional[float] = Field(default=None, ge=0)
    useful_life_years: Optional[int] = Field(default=None, ge=1)
    condition_score: float = Field(default=10.0, ge=0.0, le=10.0)
    depreciation_method: str = "straight_line"
    supplier_id: Optional[str] = None
    notes: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    location_id: Optional[str] = None
    floor_plan_id: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = Field(default=None, ge=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    useful_life_years: Optional[int] = Field(default=None, ge=1)
    condition_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    last_maintained_at: Optional[str] = None
    next_maintenance_due: Optional[str] = None
    supplier_id: Optional[str] = None
    notes: Optional[str] = None


class AssetOut(BaseModel):
    id: str
    name: str
    asset_code: str
    category: str
    location_id: Optional[str]
    floor_plan_id: Optional[str]
    status: str
    purchase_date: Optional[datetime]
    purchase_cost: Optional[float]
    current_value: Optional[float]
    depreciation_method: str
    useful_life_years: Optional[int]
    condition_score: float
    last_maintained_at: Optional[datetime]
    next_maintenance_due: Optional[datetime]
    supplier_id: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MaintenanceLogCreate(BaseModel):
    maintenance_type: str = Field(..., pattern="^(preventive|corrective|inspection)$")
    description: str = Field(..., min_length=1)
    cost: Optional[float] = Field(default=None, ge=0)
    performed_by: Optional[str] = None
    performed_at: str   # ISO datetime
    condition_before: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    condition_after: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    notes: Optional[str] = None


class MaintenanceLogOut(BaseModel):
    id: str
    asset_id: str
    maintenance_type: str
    description: str
    cost: Optional[float]
    performed_by: Optional[str]
    performed_at: datetime
    condition_before: Optional[float]
    condition_after: Optional[float]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class AssetAnalytics(BaseModel):
    total_assets: int
    active_count: int
    under_maintenance_count: int
    decommissioned_count: int
    avg_condition_score: float
    total_portfolio_value: float
    overdue_maintenance_count: int
    low_condition_count: int   # condition_score < 5


# ─── IoT Sensors ──────────────────────────────────────────────────────────────

class SensorIngest(BaseModel):
    """Payload posted by a physical/simulated sensor device."""
    sensor_type: str = Field(..., pattern="^(temperature|humidity|occupancy|air_quality|noise|security)$")
    location_id: str = Field(..., min_length=1)
    zone_name: Optional[str] = None
    value: float
    unit: str = Field(..., min_length=1, max_length=20)
    recorded_at: Optional[str] = None   # ISO datetime; defaults to server time if omitted


class SensorReadingOut(BaseModel):
    id: str
    sensor_id: str
    sensor_type: str
    location_id: Optional[str]
    zone_name: Optional[str]
    value: float
    unit: str
    recorded_at: datetime
    is_anomaly: bool

    model_config = {"from_attributes": True}


class SensorDeviceOut(BaseModel):
    id: str
    name: str
    location_id: Optional[str]
    zone_name: Optional[str]
    sensor_type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LatestSensorReading(BaseModel):
    """Latest reading per sensor type per location."""
    sensor_type: str
    location_id: Optional[str]
    zone_name: Optional[str]
    value: float
    unit: str
    recorded_at: datetime
    is_anomaly: bool
    sensor_name: str


class SensorSummary(BaseModel):
    """Aggregated overview returned by GET /sensors/latest."""
    readings: List[LatestSensorReading]
    anomaly_count: int
    total_sensors: int
