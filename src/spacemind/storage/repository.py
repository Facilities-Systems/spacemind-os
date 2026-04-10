"""
SpaceMind OS — Repository
All database reads/writes go through here. Never touch ORM models outside this file.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from spacemind.core.logging import log
from spacemind.domain.models import DecompositionRecord
from spacemind.domain.schemas import DecompositionResult, DecompositionSummary


class DecompositionRepository:
    def __init__(self, db: Session):
        self.db = db

    def save(self, result: DecompositionResult, request_text: str) -> DecompositionRecord:
        record = DecompositionRecord(
            id=result.id,
            created_at=result.created_at,
            request_text=request_text,
            request_type=result.request_type.value,
            location_id=result.location_context.location_id,
            priority=result.priority,
            request_summary=result.request_summary,
            total_tasks=result.total_tasks,
            total_estimated_days=result.total_estimated_duration_days,
            result_json=result.model_dump(mode="json"),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        log.info(f"Saved decomposition {record.id} ({record.request_type})")
        return record

    def get_by_id(self, decomposition_id: str) -> Optional[DecompositionRecord]:
        return self.db.query(DecompositionRecord).filter(
            DecompositionRecord.id == decomposition_id
        ).first()

    def list_recent(self, limit: int = 20, offset: int = 0) -> List[DecompositionRecord]:
        return (
            self.db.query(DecompositionRecord)
            .order_by(DecompositionRecord.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count(self) -> int:
        return self.db.query(DecompositionRecord).count()

    def to_summary(self, record: DecompositionRecord) -> DecompositionSummary:
        return DecompositionSummary(
            id=record.id,
            created_at=record.created_at,
            request_type=record.request_type,
            request_summary=record.request_summary or "",
            location_id=record.location_id,
            total_tasks=record.total_tasks or 0,
            priority=record.priority or "normal",
        )
