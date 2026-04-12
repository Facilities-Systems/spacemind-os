"""
SpaceMind OS — Inventory Router
REST API for storeroom items, sign-out transactions, and requisitions.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.domain.models import User
from spacemind.domain.schemas import (
    InventoryAnalytics,
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
    RequisitionCreate,
    RequisitionOut,
    RequisitionStatusUpdate,
    TransactionCreate,
    TransactionOut,
)
from spacemind.services.inventory_service import InventoryService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory"])


# ─── Items ────────────────────────────────────────────────────────────────────

@router.get("/items", response_model=List[InventoryItemOut], summary="List inventory items")
def list_items(
    category: Optional[str] = Query(default=None),
    stock_filter: Optional[str] = Query(default=None, pattern="^(low|critical)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc.list_items(category=category, stock_filter=stock_filter)


@router.post("/items", response_model=InventoryItemOut, status_code=201,
             summary="Create an inventory item")
def create_item(
    body: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = InventoryService(db)
    existing = svc._repo.get_item_by_code(body.code)
    if existing:
        raise HTTPException(status_code=409, detail=f"Item with code '{body.code}' already exists.")
    return svc.create_item(body, user_id=current_user.id, user_email=current_user.email)


@router.patch("/items/{item_id}", response_model=InventoryItemOut, summary="Update an inventory item")
def update_item(
    item_id: str,
    body: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = InventoryService(db)
    item = svc.update_item(item_id, body, user_id=current_user.id, user_email=current_user.email)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    return item


@router.delete("/items/{item_id}", status_code=204, summary="Delete an inventory item")
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = InventoryService(db)
    deleted = svc.delete_item(item_id, user_id=current_user.id, user_email=current_user.email)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found.")


# ─── Transactions ─────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=List[TransactionOut], summary="List sign-out transactions")
def list_transactions(
    status: Optional[str] = Query(default=None),
    department: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc.list_transactions(status=status, department=department)


@router.post("/transactions", response_model=TransactionOut, status_code=201,
             summary="Sign out an item")
def sign_out(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    tx = svc.sign_out(body, user_id=current_user.id, user_email=current_user.email)
    if not tx:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    return tx


@router.patch("/transactions/{tx_id}/return", response_model=TransactionOut,
              summary="Return a signed-out item")
def return_item(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    tx = svc.return_item(tx_id, user_id=current_user.id, user_email=current_user.email)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return tx


# ─── Requisitions ─────────────────────────────────────────────────────────────

@router.get("/requisitions", response_model=List[RequisitionOut], summary="List requisitions")
def list_requisitions(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc.list_requisitions(status=status)


@router.post("/requisitions", response_model=RequisitionOut, status_code=201,
             summary="Submit a requisition")
def create_requisition(
    body: RequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc.create_requisition(body, user_id=current_user.id, user_email=current_user.email)


@router.patch("/requisitions/{req_id}/status", response_model=RequisitionOut,
              summary="Approve, reject, or issue a requisition")
def update_requisition_status(
    req_id: str,
    body: RequisitionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = InventoryService(db)
    req = svc.update_requisition_status(
        req_id, body.status.value,
        user_id=current_user.id, user_email=current_user.email,
    )
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found.")
    return req


# ─── QR Code ──────────────────────────────────────────────────────────────────

@router.get("/items/{item_id}/qr", summary="Generate QR code for an inventory item")
def get_item_qr(
    item_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    data = svc._repo.get_item_qr_data(item_id)
    if data is None:
        # qrcode library not installed — return helpful error
        raise HTTPException(
            status_code=501,
            detail="QR generation unavailable. Install qrcode[pil]: pip install qrcode[pil]",
        )
    if "item_id" not in data:
        raise HTTPException(status_code=404, detail="Item not found.")
    return data


# ─── Compliance ────────────────────────────────────────────────────────────────

@router.get("/compliance", summary="Sign-out compliance analytics")
def get_compliance(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc._repo.get_compliance_analytics()


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=InventoryAnalytics, summary="Inventory dashboard stats")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return svc.get_analytics()
