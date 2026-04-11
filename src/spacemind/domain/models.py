"""
SpaceMind OS — SQLAlchemy ORM Models
Persistence layer — keeps every decomposition in history and manages users.
"""
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    """System user — facilities managers, technicians, admins."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
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
