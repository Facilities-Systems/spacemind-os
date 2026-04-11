"""
SpaceMind OS — Inventory Service
Orchestrates storeroom operations: items, sign-out transactions, requisitions.
Every write is audit-logged.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from spacemind.domain.models import InventoryItem, InventoryTransaction, InventoryRequisition
from spacemind.domain.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    TransactionCreate,
    RequisitionCreate,
)
from spacemind.services.audit_service import AuditService
from spacemind.storage.repository import InventoryRepository


class InventoryService:
    def __init__(self, db: Session):
        self._repo = InventoryRepository(db)
        self._audit = AuditService(db)

    # ── Items ──────────────────────────────────────────────────────────────────

    def create_item(self, data: InventoryItemCreate, user_id: str | None = None,
                    user_email: str | None = None) -> InventoryItem:
        item = self._repo.create_item(data)
        self._audit.log(
            action="inventory.item.created",
            resource_type="inventory_item",
            resource_id=item.id,
            user_id=user_id,
            user_email=user_email,
            details={"name": item.name, "code": item.code, "category": item.category},
        )
        return item

    def get_item(self, item_id: str) -> InventoryItem | None:
        return self._repo.get_item(item_id)

    def list_items(self, category: str | None = None, stock_filter: str | None = None):
        return self._repo.list_items(category=category, stock_filter=stock_filter)

    def update_item(self, item_id: str, data: InventoryItemUpdate,
                    user_id: str | None = None, user_email: str | None = None) -> InventoryItem | None:
        item = self._repo.update_item(item_id, data)
        if item:
            self._audit.log(
                action="inventory.item.updated",
                resource_type="inventory_item",
                resource_id=item_id,
                user_id=user_id,
                user_email=user_email,
                details=data.model_dump(exclude_none=True),
            )
        return item

    def delete_item(self, item_id: str, user_id: str | None = None,
                    user_email: str | None = None) -> bool:
        deleted = self._repo.delete_item(item_id)
        if deleted:
            self._audit.log(
                action="inventory.item.deleted",
                resource_type="inventory_item",
                resource_id=item_id,
                user_id=user_id,
                user_email=user_email,
            )
        return deleted

    # ── Transactions ───────────────────────────────────────────────────────────

    def sign_out(self, data: TransactionCreate, user_id: str | None = None,
                 user_email: str | None = None) -> InventoryTransaction | None:
        tx = self._repo.create_transaction(data)
        if tx:
            self._audit.log(
                action="inventory.transaction.signed_out",
                resource_type="inventory_transaction",
                resource_id=tx.id,
                user_id=user_id,
                user_email=user_email,
                details={"item_code": tx.item_code, "qty": tx.quantity, "borrower": tx.borrower},
            )
        return tx

    def return_item(self, tx_id: str, user_id: str | None = None,
                    user_email: str | None = None) -> InventoryTransaction | None:
        tx = self._repo.return_item(tx_id)
        if tx:
            self._audit.log(
                action="inventory.transaction.returned",
                resource_type="inventory_transaction",
                resource_id=tx_id,
                user_id=user_id,
                user_email=user_email,
                details={"item_code": tx.item_code, "qty": tx.quantity},
            )
        return tx

    def list_transactions(self, status: str | None = None, department: str | None = None):
        return self._repo.list_transactions(status=status, department=department)

    # ── Requisitions ───────────────────────────────────────────────────────────

    def create_requisition(self, data: RequisitionCreate, user_id: str | None = None,
                           user_email: str | None = None) -> InventoryRequisition:
        req = self._repo.create_requisition(data)
        self._audit.log(
            action="inventory.requisition.created",
            resource_type="inventory_requisition",
            resource_id=req.id,
            user_id=user_id,
            user_email=user_email,
            details={"requester": req.requester, "priority": req.priority},
        )
        return req

    def list_requisitions(self, status: str | None = None):
        return self._repo.list_requisitions(status=status)

    def update_requisition_status(self, req_id: str, status: str,
                                   user_id: str | None = None,
                                   user_email: str | None = None) -> InventoryRequisition | None:
        req = self._repo.update_requisition_status(req_id, status)
        if req:
            self._audit.log(
                action=f"inventory.requisition.{status.lower()}",
                resource_type="inventory_requisition",
                resource_id=req_id,
                user_id=user_id,
                user_email=user_email,
                details={"new_status": status},
            )
        return req

    # ── Analytics ─────────────────────────────────────────────────────────────

    def get_analytics(self) -> dict:
        return self._repo.get_analytics()
