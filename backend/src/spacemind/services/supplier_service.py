"""
SpaceMind OS — Supplier Service
Thin orchestration layer between the router and SupplierRepository.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from spacemind.domain.models import Supplier
from spacemind.domain.schemas import SupplierCreate, SupplierUpdate
from spacemind.services.audit_service import AuditService
from spacemind.storage.repository import SupplierRepository


class SupplierService:
    def __init__(self, db: Session) -> None:
        self._repo = SupplierRepository(db)
        self._audit = AuditService(db)

    def list_suppliers(self, active_only: bool = False) -> List[Supplier]:
        return self._repo.list_suppliers(active_only=active_only)

    def get_supplier(self, supplier_id: str) -> Optional[Supplier]:
        return self._repo.get_supplier(supplier_id)

    def create_supplier(
        self, data: SupplierCreate, user_id: str, user_email: str
    ) -> Supplier:
        supplier = self._repo.create_supplier(data)
        self._audit.log(
            action="supplier.created",
            resource_type="supplier",
            resource_id=supplier.id,
            user_id=user_id,
            user_email=user_email,
            details={"name": supplier.name},
        )
        return supplier

    def update_supplier(
        self, supplier_id: str, data: SupplierUpdate, user_id: str, user_email: str
    ) -> Optional[Supplier]:
        supplier = self._repo.update_supplier(supplier_id, data)
        if supplier:
            self._audit.log(
                action="supplier.updated",
                resource_type="supplier",
                resource_id=supplier_id,
                user_id=user_id,
                user_email=user_email,
                details=data.model_dump(exclude_unset=True),
            )
        return supplier

    def delete_supplier(
        self, supplier_id: str, user_id: str, user_email: str
    ) -> bool:
        deleted = self._repo.delete_supplier(supplier_id)
        if deleted:
            self._audit.log(
                action="supplier.deleted",
                resource_type="supplier",
                resource_id=supplier_id,
                user_id=user_id,
                user_email=user_email,
            )
        return deleted
