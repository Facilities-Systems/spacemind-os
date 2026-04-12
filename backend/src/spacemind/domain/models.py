"""
SpaceMind OS — SQLAlchemy ORM Models
Persistence layer — keeps every decomposition in history and manages users.
"""
from datetime import datetime, UTC

from sqlalchemy import JSON, Boolean, Column, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    """System user — facilities managers, technicians, admins."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="viewer", nullable=False)   # admin, facilities_manager, viewer
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"


class AuditLog(Base):
    """
    Immutable audit trail — every write action tracked with user, timestamp, and payload.
    Adopted from UFM project pattern: accountability for every state change.
    """

    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)   # None = system action
    user_email = Column(String(255), nullable=True)
    action = Column(String(64), nullable=False, index=True)   # e.g. "decomposition.created"
    resource_type = Column(String(64), nullable=False)         # e.g. "decomposition", "task"
    resource_id = Column(String(36), nullable=True, index=True)
    details = Column(JSON, nullable=True)                      # before/after state or summary

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} resource={self.resource_id} user={self.user_email}>"


class DecompositionRecord(Base):
    """One row per decomposition request, full result stored as JSON."""

    __tablename__ = "decompositions"

    id = Column(String(36), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    request_text = Column(Text, nullable=False)
    request_type = Column(String(64), nullable=False)
    location_id = Column(String(128), nullable=False)
    priority = Column(String(16), default="normal")
    requester_name = Column(String(256), nullable=True)
    created_by = Column(String(36), nullable=True)   # User.id FK (soft — no FK constraint for SQLite compat)

    # Denormalized for fast listing
    request_summary = Column(Text, nullable=True)
    total_tasks = Column(Integer, default=0)
    total_estimated_days = Column(Integer, nullable=True)

    # Full result blob (includes task statuses)
    result_json = Column(JSON, nullable=False)

    def __repr__(self) -> str:
        return f"<Decomposition id={self.id} type={self.request_type} loc={self.location_id}>"


# ─── Inventory ────────────────────────────────────────────────────────────────

class InventoryItem(Base):
    """Storeroom stock — tools, materials, consumables, and assets."""

    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)   # ItemCategory values
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default="units")
    min_level = Column(Float, nullable=False, default=0)
    location = Column(String(200), nullable=True)               # shelf / bin reference
    notes = Column(Text, nullable=True)
    supplier_id   = Column(String(36), nullable=True)    # soft FK → suppliers.id
    supplier_name = Column(String(200), nullable=True)   # denormalized for fast listing
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<InventoryItem code={self.code} qty={self.quantity}>"


class InventoryTransaction(Base):
    """Sign-out and return log for storeroom items."""

    __tablename__ = "inventory_transactions"

    id = Column(String(36), primary_key=True)
    item_id = Column(String(36), nullable=False, index=True)    # soft FK → inventory_items.id
    item_name = Column(String(200), nullable=False)             # denormalized for fast listing
    item_code = Column(String(50), nullable=False)
    quantity = Column(Float, nullable=False)
    borrower = Column(String(200), nullable=False)
    department = Column(String(100), nullable=True)
    work_order = Column(String(100), nullable=True)
    date_out = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    expected_return = Column(DateTime, nullable=True)
    date_returned = Column(DateTime, nullable=True)
    status = Column(String(20), default="Outstanding", nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=True)              # soft FK → users.id

    def __repr__(self) -> str:
        return f"<InventoryTransaction item={self.item_code} borrower={self.borrower} status={self.status}>"


class InventoryRequisition(Base):
    """Purchase / issue requisition raised by staff."""

    __tablename__ = "inventory_requisitions"

    id = Column(String(36), primary_key=True)
    requester = Column(String(200), nullable=False)
    role = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    work_order = Column(String(100), nullable=True)
    priority = Column(String(20), default="Medium", nullable=False)
    items_description = Column(Text, nullable=False)
    status = Column(String(20), default="Pending", nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    created_by = Column(String(36), nullable=True)              # soft FK → users.id

    def __repr__(self) -> str:
        return f"<InventoryRequisition id={self.id} status={self.status} requester={self.requester}>"


# ─── Medical ──────────────────────────────────────────────────────────────────

class MedicalItem(Base):
    """Medical supply or equipment in the first-aid / medical room."""

    __tablename__ = "medical_items"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)   # MedicalItemCategory values
    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default="units")
    min_level = Column(Integer, nullable=False, default=0)
    expiry_date = Column(Date, nullable=True)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<MedicalItem name={self.name} qty={self.quantity}>"


class MedicalIncident(Base):
    """Workplace medical incident or first-aid event."""

    __tablename__ = "medical_incidents"

    id = Column(String(36), primary_key=True)
    incident_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False, index=True)   # IncidentSeverity values
    employee_name = Column(String(200), nullable=True)
    department = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    treatment = Column(Text, nullable=True)
    status = Column(String(20), default="Open", nullable=False, index=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_by = Column(String(36), nullable=True)              # soft FK → users.id

    def __repr__(self) -> str:
        return f"<MedicalIncident type={self.incident_type} severity={self.severity} status={self.status}>"


# ─── Suppliers ────────────────────────────────────────────────────────────────

class Supplier(Base):
    """
    Supplier / vendor directory.
    Linked to InventoryItem via soft FK (supplier_id + denormalised supplier_name).
    """

    __tablename__ = "suppliers"

    id            = Column(String(36), primary_key=True)
    name          = Column(String(200), unique=True, nullable=False, index=True)
    contact_name  = Column(String(200), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50),  nullable=True)
    category      = Column(String(100), nullable=True)   # item categories they supply
    lead_time_days = Column(Integer, nullable=True)
    notes         = Column(Text, nullable=True)
    is_active     = Column(Boolean, default=True, nullable=False)
    created_at    = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<Supplier name={self.name} active={self.is_active}>"


# ─── Floor Plans ──────────────────────────────────────────────────────────────

class FloorPlan(Base):
    """
    One row per building + floor combination.
    Stores space statistics; SVG rendering is handled client-side.
    """

    __tablename__ = "floor_plans"

    id             = Column(String(36), primary_key=True)
    building_id    = Column(String(20),  nullable=False, index=True)
    building_name  = Column(String(200), nullable=False)
    floor_name     = Column(String(100), nullable=False)
    floor_order    = Column(Integer,     nullable=False, default=0)
    total_area_sqm = Column(Integer,     nullable=False, default=800)
    capacity_pax   = Column(Integer,     nullable=False, default=60)
    total_desks    = Column(Integer,     nullable=False, default=0)
    occupied_desks = Column(Integer,     nullable=False, default=0)
    meeting_rooms  = Column(Integer,     nullable=False, default=0)
    status         = Column(String(30),  nullable=False, default="active")  # active | under_renovation | inactive
    created_at     = Column(DateTime,    default=lambda: datetime.now(UTC), nullable=False)
    updated_at     = Column(DateTime,    default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<FloorPlan {self.building_id} / {self.floor_name}>"
