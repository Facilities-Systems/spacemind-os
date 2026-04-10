"""
SpaceMind OS — SQLAlchemy ORM Models
Persistence layer — keeps every decomposition in history.
"""
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


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

    # Denormalized for fast listing
    request_summary = Column(Text, nullable=True)
    total_tasks = Column(Integer, default=0)
    total_estimated_days = Column(Integer, nullable=True)

    # Full result blob
    result_json = Column(JSON, nullable=False)

    def __repr__(self) -> str:
        return f"<Decomposition id={self.id} type={self.request_type} loc={self.location_id}>"
