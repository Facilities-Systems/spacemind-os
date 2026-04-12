"""
SpaceMind OS — Repository
All database reads/writes go through here. Never touch ORM models outside this file.
Thread-safe task status updates via per-decomposition RLock (UFM pattern).
"""
import threading
from datetime import datetime, UTC
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from spacemind.core.exceptions import StorageError
from spacemind.core.logging import log
from spacemind.domain.models import (
    DecompositionRecord,
    FloorPlan,
    InventoryItem,
    InventoryRequisition,
    InventoryTransaction,
    MedicalIncident,
    MedicalItem,
    Supplier,
)
from spacemind.domain.schemas import (
    DecompositionResult,
    DecompositionSummary,
    FloorPlanCreate,
    FloorPlanUpdate,
    IncidentCreate,
    IncidentStatusUpdate,
    InventoryItemCreate,
    InventoryItemUpdate,
    MedicalItemCreate,
    SupplierCreate,
    SupplierUpdate,
    MedicalItemUpdate,
    RequisitionCreate,
    TransactionCreate,
)

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


# ─── Inventory Repository ─────────────────────────────────────────────────────

class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_item(self, data: InventoryItemCreate) -> InventoryItem:
        from uuid import uuid4
        item = InventoryItem(
            id=str(uuid4()),
            name=data.name,
            code=data.code,
            category=data.category.value,
            quantity=data.quantity,
            unit=data.unit,
            min_level=data.min_level,
            location=data.location,
            notes=data.notes,
        )
        try:
            self.db.add(item)
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def get_item(self, item_id: str) -> Optional[InventoryItem]:
        return self.db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

    def get_item_by_code(self, code: str) -> Optional[InventoryItem]:
        return self.db.query(InventoryItem).filter(InventoryItem.code == code).first()

    def list_items(
        self,
        category: str | None = None,
        stock_filter: str | None = None,   # "low" | "critical"
    ) -> List[InventoryItem]:
        q = self.db.query(InventoryItem)
        if category:
            q = q.filter(InventoryItem.category == category)
        items = q.order_by(InventoryItem.name).all()
        if stock_filter == "critical":
            items = [i for i in items if i.quantity == 0]
        elif stock_filter == "low":
            items = [i for i in items if 0 < i.quantity <= i.min_level]
        return items

    def update_item(self, item_id: str, data: InventoryItemUpdate) -> Optional[InventoryItem]:
        item = self.get_item(item_id)
        if not item:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(item, field, value)
        try:
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def delete_item(self, item_id: str) -> bool:
        item = self.get_item(item_id)
        if not item:
            return False
        try:
            self.db.delete(item)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def create_transaction(self, data: TransactionCreate) -> Optional[InventoryTransaction]:
        from uuid import uuid4
        item = self.get_item(data.item_id)
        if not item:
            return None
        tx = InventoryTransaction(
            id=str(uuid4()),
            item_id=item.id,
            item_name=item.name,
            item_code=item.code,
            quantity=data.quantity,
            borrower=data.borrower,
            department=data.department,
            work_order=data.work_order,
            expected_return=data.expected_return,
            notes=data.notes,
            status="Outstanding",
        )
        item.quantity = max(0, item.quantity - data.quantity)
        try:
            self.db.add(tx)
            self.db.commit()
            self.db.refresh(tx)
            return tx
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def return_item(self, tx_id: str) -> Optional[InventoryTransaction]:
        tx = self.db.query(InventoryTransaction).filter(InventoryTransaction.id == tx_id).first()
        if not tx or tx.status == "Returned":
            return tx
        item = self.get_item(tx.item_id)
        if item:
            item.quantity += tx.quantity
        tx.status = "Returned"
        tx.date_returned = datetime.now(UTC)
        try:
            self.db.commit()
            self.db.refresh(tx)
            return tx
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def list_transactions(
        self,
        status: str | None = None,
        department: str | None = None,
    ) -> List[InventoryTransaction]:
        q = self.db.query(InventoryTransaction)
        if status:
            q = q.filter(InventoryTransaction.status == status)
        if department:
            q = q.filter(InventoryTransaction.department == department)
        return q.order_by(InventoryTransaction.date_out.desc()).all()

    def create_requisition(self, data: RequisitionCreate) -> InventoryRequisition:
        from uuid import uuid4
        req = InventoryRequisition(
            id=str(uuid4()),
            requester=data.requester,
            role=data.role,
            department=data.department,
            work_order=data.work_order,
            priority=data.priority,
            items_description=data.items_description,
            notes=data.notes,
            status="Pending",
        )
        try:
            self.db.add(req)
            self.db.commit()
            self.db.refresh(req)
            return req
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def list_requisitions(self, status: str | None = None) -> List[InventoryRequisition]:
        q = self.db.query(InventoryRequisition)
        if status:
            q = q.filter(InventoryRequisition.status == status)
        return q.order_by(InventoryRequisition.created_at.desc()).all()

    def update_requisition_status(self, req_id: str, status: str) -> Optional[InventoryRequisition]:
        req = self.db.query(InventoryRequisition).filter(InventoryRequisition.id == req_id).first()
        if not req:
            return None
        req.status = status
        try:
            self.db.commit()
            self.db.refresh(req)
            return req
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def get_analytics(self) -> dict:
        from sqlalchemy import func
        total = self.db.query(func.count(InventoryItem.id)).scalar() or 0
        all_items = self.db.query(InventoryItem).all()
        low_stock_items = [
            i for i in all_items if i.min_level > 0 and 0 < i.quantity <= i.min_level
        ]
        critical_items = [i for i in all_items if i.quantity == 0]
        outstanding = self.db.query(func.count(InventoryTransaction.id)).filter(
            InventoryTransaction.status == "Outstanding"
        ).scalar() or 0
        pending_reqs = self.db.query(func.count(InventoryRequisition.id)).filter(
            InventoryRequisition.status == "Pending"
        ).scalar() or 0

        def _reorder(item: InventoryItem) -> dict:
            suggested = max(1, (item.min_level * 2) - item.quantity)
            return {
                "item_id":      item.id,
                "item_name":    item.name,
                "item_code":    item.code,
                "current_qty":  item.quantity,
                "min_level":    item.min_level,
                "deficit":      max(0, item.min_level - item.quantity),
                "suggested_reorder_qty": suggested,
            }

        return {
            "total_items":             total,
            "low_stock_count":         len(low_stock_items),
            "critical_count":          len(critical_items),
            "outstanding_transactions": outstanding,
            "pending_requisitions":    pending_reqs,
            "low_stock_items":         [_reorder(i) for i in low_stock_items],
            "critical_items":          [_reorder(i) for i in critical_items],
            "reorder_recommendations": [_reorder(i) for i in critical_items + low_stock_items],
        }

    def get_compliance_analytics(self) -> dict:
        """Sign-out compliance: return rates, overdue items, department breakdown."""
        from sqlalchemy import func
        all_tx = self.db.query(InventoryTransaction).all()
        total       = len(all_tx)
        returned    = sum(1 for t in all_tx if t.status == "Returned")
        outstanding = [t for t in all_tx if t.status == "Outstanding"]
        overdue     = [t for t in all_tx if t.status == "Overdue"]

        rate = round((returned / total * 100), 1) if total > 0 else 100.0

        dept_map: dict[str, dict] = {}
        for t in all_tx:
            dept = t.department or "Unknown"
            d = dept_map.setdefault(dept, {"department": dept, "total": 0, "returned": 0, "outstanding": 0, "overdue": 0})
            d["total"] += 1
            if t.status == "Returned":    d["returned"] += 1
            if t.status == "Outstanding": d["outstanding"] += 1
            if t.status == "Overdue":     d["overdue"] += 1
        for d in dept_map.values():
            d["compliance_rate"] = round(d["returned"] / d["total"] * 100, 1) if d["total"] > 0 else 100.0

        # Top borrowers with outstanding items
        borrower_map: dict[str, dict] = {}
        for t in outstanding + overdue:
            b = borrower_map.setdefault(t.borrower, {"borrower": t.borrower, "department": t.department, "outstanding": 0})
            b["outstanding"] += 1

        return {
            "total_transactions":    total,
            "returned":              returned,
            "outstanding":           len(outstanding),
            "overdue":               len(overdue),
            "compliance_rate":       rate,
            "by_department":         sorted(dept_map.values(), key=lambda x: x["compliance_rate"]),
            "top_outstanding_borrowers": sorted(borrower_map.values(), key=lambda x: -x["outstanding"])[:10],
        }

    def get_item_qr_data(self, item_id: str) -> Optional[dict]:
        """Return base64-encoded QR PNG + item metadata for the given item."""
        import base64
        import io
        try:
            import qrcode
            from qrcode.image.pure import PyPNGImage
        except ImportError:
            return None

        item = self.get_item(item_id)
        if not item:
            return None

        payload = f"spacemind://item/{item.id}?code={item.code}&name={item.name}"
        qr = qrcode.QRCode(version=1, box_size=8, border=3)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(image_factory=PyPNGImage)
        buf = io.BytesIO()
        img.save(buf)
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        return {
            "item_id":   item.id,
            "item_code": item.code,
            "item_name": item.name,
            "qr_base64": qr_b64,
            "payload":   payload,
        }


# ─── Medical Repository ───────────────────────────────────────────────────────

class MedicalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_item(self, data: MedicalItemCreate) -> MedicalItem:
        from uuid import uuid4
        from datetime import date
        expiry = None
        if data.expiry_date:
            expiry = date.fromisoformat(data.expiry_date)
        item = MedicalItem(
            id=str(uuid4()),
            name=data.name,
            category=data.category.value,
            quantity=data.quantity,
            unit=data.unit,
            min_level=data.min_level,
            expiry_date=expiry,
            location=data.location,
            notes=data.notes,
        )
        try:
            self.db.add(item)
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def get_item(self, item_id: str) -> Optional[MedicalItem]:
        return self.db.query(MedicalItem).filter(MedicalItem.id == item_id).first()

    def list_items(self, category: str | None = None) -> List[MedicalItem]:
        q = self.db.query(MedicalItem)
        if category:
            q = q.filter(MedicalItem.category == category)
        return q.order_by(MedicalItem.name).all()

    def update_item(self, item_id: str, data: MedicalItemUpdate) -> Optional[MedicalItem]:
        from datetime import date
        item = self.get_item(item_id)
        if not item:
            return None
        update_data = data.model_dump(exclude_none=True)
        if "expiry_date" in update_data and update_data["expiry_date"]:
            update_data["expiry_date"] = date.fromisoformat(update_data["expiry_date"])
        for field, value in update_data.items():
            setattr(item, field, value)
        try:
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def delete_item(self, item_id: str) -> bool:
        item = self.get_item(item_id)
        if not item:
            return False
        try:
            self.db.delete(item)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def create_incident(self, data: IncidentCreate) -> MedicalIncident:
        from uuid import uuid4
        incident = MedicalIncident(
            id=str(uuid4()),
            incident_type=data.incident_type,
            severity=data.severity.value,
            employee_name=data.employee_name,
            department=data.department,
            description=data.description,
            treatment=data.treatment,
            status="Open",
        )
        try:
            self.db.add(incident)
            self.db.commit()
            self.db.refresh(incident)
            return incident
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def list_incidents(self, status: str | None = None) -> List[MedicalIncident]:
        q = self.db.query(MedicalIncident)
        if status:
            q = q.filter(MedicalIncident.status == status)
        return q.order_by(MedicalIncident.reported_at.desc()).all()

    def update_incident_status(self, incident_id: str, status: str) -> Optional[MedicalIncident]:
        incident = self.db.query(MedicalIncident).filter(MedicalIncident.id == incident_id).first()
        if not incident:
            return None
        incident.status = status
        if status in ("Resolved", "Referred"):
            incident.resolved_at = datetime.now(UTC)
        try:
            self.db.commit()
            self.db.refresh(incident)
            return incident
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def get_analytics(self) -> dict:
        from datetime import date, timedelta
        from sqlalchemy import func
        total = self.db.query(func.count(MedicalItem.id)).scalar() or 0
        all_items = self.db.query(MedicalItem).all()
        low_stock = sum(1 for i in all_items if i.quantity <= i.min_level)
        today = date.today()
        soon = today + timedelta(days=30)
        expiring_soon = sum(
            1 for i in all_items
            if i.expiry_date and today <= i.expiry_date <= soon
        )
        open_incidents = self.db.query(func.count(MedicalIncident.id)).filter(
            MedicalIncident.status == "Open"
        ).scalar() or 0
        critical_incidents = self.db.query(func.count(MedicalIncident.id)).filter(
            MedicalIncident.status == "Open",
            MedicalIncident.severity == "Critical",
        ).scalar() or 0
        return {
            "total_items": total,
            "low_stock_count": low_stock,
            "expiring_soon_count": expiring_soon,
            "open_incidents": open_incidents,
            "critical_incidents": critical_incidents,
        }


# ─── Supplier Repository ──────────────────────────────────────────────────────

class SupplierRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_suppliers(self, active_only: bool = False) -> List[Supplier]:
        q = self.db.query(Supplier)
        if active_only:
            q = q.filter(Supplier.is_active == True)  # noqa: E712
        return q.order_by(Supplier.name).all()

    def get_supplier(self, supplier_id: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def get_supplier_by_name(self, name: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.name == name).first()

    def create_supplier(self, data: SupplierCreate) -> Supplier:
        from uuid import uuid4
        supplier = Supplier(
            id=str(uuid4()),
            name=data.name,
            contact_name=data.contact_name,
            contact_email=data.contact_email,
            contact_phone=data.contact_phone,
            category=data.category,
            lead_time_days=data.lead_time_days,
            notes=data.notes,
            is_active=True,
        )
        try:
            self.db.add(supplier)
            self.db.commit()
            self.db.refresh(supplier)
            return supplier
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def update_supplier(self, supplier_id: str, data: SupplierUpdate) -> Optional[Supplier]:
        supplier = self.get_supplier(supplier_id)
        if not supplier:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(supplier, field, value)
        try:
            self.db.commit()
            self.db.refresh(supplier)
            return supplier
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def delete_supplier(self, supplier_id: str) -> bool:
        supplier = self.get_supplier(supplier_id)
        if not supplier:
            return False
        try:
            self.db.delete(supplier)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

class FloorPlanRepository:
    """CRUD for floor plan records."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_floor_plans(self, building_id: Optional[str] = None) -> List[FloorPlan]:
        q = self.db.query(FloorPlan)
        if building_id:
            q = q.filter(FloorPlan.building_id == building_id)
        return q.order_by(FloorPlan.building_id, FloorPlan.floor_order).all()

    def get_floor_plan(self, floor_plan_id: str) -> Optional[FloorPlan]:
        return self.db.query(FloorPlan).filter(FloorPlan.id == floor_plan_id).first()

    def create_floor_plan(self, data: FloorPlanCreate) -> FloorPlan:
        import uuid
        fp = FloorPlan(id=str(uuid.uuid4()), **data.model_dump())
        self.db.add(fp)
        try:
            self.db.commit()
            self.db.refresh(fp)
            return fp
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def update_floor_plan(self, floor_plan_id: str, data: FloorPlanUpdate) -> Optional[FloorPlan]:
        fp = self.get_floor_plan(floor_plan_id)
        if not fp:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(fp, field, value)
        try:
            self.db.commit()
            self.db.refresh(fp)
            return fp
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e

    def delete_floor_plan(self, floor_plan_id: str) -> bool:
        fp = self.get_floor_plan(floor_plan_id)
        if not fp:
            return False
        try:
            self.db.delete(fp)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            raise StorageError() from e
