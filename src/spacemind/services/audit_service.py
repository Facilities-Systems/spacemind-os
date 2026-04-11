"""
SpaceMind OS — Audit Service
Records every write operation to the audit_log table.
Adopted from UFM project pattern: every state change is traceable.

Usage:
    AuditService(db).log(
        action="decomposition.created",
        resource_type="decomposition",
        resource_id=result.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={"request_type": result.request_type.value, "total_tasks": result.total_tasks},
    )
"""
from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from spacemind.core.logging import log
from spacemind.domain.models import AuditLog


class AuditService:
    def __init__(self, db: Session):
        self._db = db

    def log(
        self,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        user_id: str | None = None,
        user_email: str | None = None,
        details: dict | None = None,
    ) -> None:
        """
        Append an immutable audit record.
        Never raises — audit failures are logged but do not block the main operation.
        """
        try:
            entry = AuditLog(
                id=str(uuid4()),
                user_id=user_id,
                user_email=user_email,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details,
            )
            self._db.add(entry)
            self._db.commit()
            log.debug(
                f"[Audit] {action} resource={resource_id} user={user_email}"
            )
        except Exception as e:
            self._db.rollback()
            log.warning(f"[Audit] Failed to write audit log ({action}): {e}")
