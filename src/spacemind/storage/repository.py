"""
SpaceMind OS — Repository
All database reads/writes go through here. Never touch ORM models outside this file.
Thread-safe task status updates via per-decomposition RLock (UFM pattern).
"""
import threading
from datetime import datetime
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from spacemind.core.exceptions import StorageError
from spacemind.core.logging import log
from spacemind.domain.models import DecompositionRecord
from spacemind.domain.schemas import DecompositionResult, DecompositionSummary

# Per-resource locks — prevents concurrent task status updates corrupting result_json
_resource_locks: dict[str, threading.RLock] = {}
_locks_meta = threading.Lock()


def _get_lock(resource_id: str) -> threading.RLock:
    """Return (or create) a per-decomposition reentrant lock."""
    with _locks_meta:
        if resource_id not in _resource_locks:
            _resource_locks[resource_id] = threading.RLock()
        return _resource_locks[resource_id]


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
        try:
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            log.info(f"Saved decomposition {record.id} ({record.request_type})")
            return record
        except SQLAlchemyError as e:
            self.db.rollback()
            log.error(f"Failed to save decomposition {result.id}: {type(e).__name__}")
            raise StorageError() from e

    def get_by_id(self, decomposition_id: str) -> Optional[DecompositionRecord]:
        try:
            return self.db.query(DecompositionRecord).filter(
                DecompositionRecord.id == decomposition_id
            ).first()
        except SQLAlchemyError as e:
            log.error(f"DB error fetching {decomposition_id}: {type(e).__name__}")
            raise StorageError() from e

    def list_filtered(
        self,
        limit: int = 20,
        offset: int = 0,
        request_type: str | None = None,
        location_id: str | None = None,
        priority: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> List[DecompositionRecord]:
        try:
            q = self.db.query(DecompositionRecord)
            if request_type:
                q = q.filter(DecompositionRecord.request_type == request_type)
            if location_id:
                q = q.filter(DecompositionRecord.location_id == location_id)
            if priority:
                q = q.filter(DecompositionRecord.priority == priority)
            if from_date:
                q = q.filter(DecompositionRecord.created_at >= datetime.fromisoformat(from_date))
            if to_date:
                q = q.filter(DecompositionRecord.created_at <= datetime.fromisoformat(to_date))
            return (
                q.order_by(DecompositionRecord.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )
        except SQLAlchemyError as e:
            log.error(f"DB error listing records: {type(e).__name__}")
            raise StorageError() from e

    def count_filtered(
        self,
        request_type: str | None = None,
        location_id: str | None = None,
        priority: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> int:
        try:
            q = self.db.query(DecompositionRecord)
            if request_type:
                q = q.filter(DecompositionRecord.request_type == request_type)
            if location_id:
                q = q.filter(DecompositionRecord.location_id == location_id)
            if priority:
                q = q.filter(DecompositionRecord.priority == priority)
            if from_date:
                q = q.filter(DecompositionRecord.created_at >= datetime.fromisoformat(from_date))
            if to_date:
                q = q.filter(DecompositionRecord.created_at <= datetime.fromisoformat(to_date))
            return q.count()
        except SQLAlchemyError as e:
            log.error(f"DB error counting records: {type(e).__name__}")
            raise StorageError() from e

    def update_result_json(self, decomposition_id: str, result_json: dict) -> None:
        """Thread-safe update of a decomposition's result JSON blob."""
        lock = _get_lock(decomposition_id)
        with lock:
            try:
                record = self.db.query(DecompositionRecord).filter(
                    DecompositionRecord.id == decomposition_id
                ).first()
                if record:
                    record.result_json = result_json
                    self.db.commit()
            except SQLAlchemyError as e:
                self.db.rollback()
                log.error(f"DB error updating result_json for {decomposition_id}: {type(e).__name__}")
                raise StorageError() from e

    def get_analytics(self) -> dict:
        from sqlalchemy import func
        try:
            total = self.db.query(func.count(DecompositionRecord.id)).scalar() or 0
            by_type = dict(
                self.db.query(DecompositionRecord.request_type, func.count(DecompositionRecord.id))
                .group_by(DecompositionRecord.request_type)
                .all()
            )
            by_priority = dict(
                self.db.query(DecompositionRecord.priority, func.count(DecompositionRecord.id))
                .group_by(DecompositionRecord.priority)
                .all()
            )
            avg_tasks = self.db.query(func.avg(DecompositionRecord.total_tasks)).scalar()
            avg_days = self.db.query(func.avg(DecompositionRecord.total_estimated_days)).scalar()
            return {
                "total_decompositions": total,
                "by_request_type": by_type,
                "by_priority": by_priority,
                "avg_tasks_per_request": round(float(avg_tasks or 0), 1),
                "avg_duration_days": round(float(avg_days or 0), 1),
            }
        except SQLAlchemyError as e:
            log.error(f"DB error computing analytics: {type(e).__name__}")
            raise StorageError() from e

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
