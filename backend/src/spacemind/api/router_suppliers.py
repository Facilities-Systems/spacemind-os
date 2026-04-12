"""
SpaceMind OS — Suppliers Router
REST API for the supplier / vendor directory.
Suppliers are linked to inventory items via soft FK (supplier_id + supplier_name).
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user, require_role
from spacemind.domain.models import User
from spacemind.domain.schemas import SupplierCreate, SupplierOut, SupplierUpdate
from spacemind.services.supplier_service import SupplierService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/suppliers", tags=["Suppliers"])


@router.get("", response_model=List[SupplierOut], summary="List suppliers")
def list_suppliers(
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = SupplierService(db)
    return svc.list_suppliers(active_only=active_only)


@router.get("/{supplier_id}", response_model=SupplierOut, summary="Get a supplier")
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = SupplierService(db)
    supplier = svc.get_supplier(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.post("", response_model=SupplierOut, status_code=201, summary="Create a supplier")
def create_supplier(
    body: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = SupplierService(db)
    if svc._repo.get_supplier_by_name(body.name):
        raise HTTPException(status_code=409, detail=f"Supplier '{body.name}' already exists.")
    return svc.create_supplier(body, user_id=current_user.id, user_email=current_user.email)


@router.patch("/{supplier_id}", response_model=SupplierOut, summary="Update a supplier")
def update_supplier(
    supplier_id: str,
    body: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("facilities_manager", "admin")),
):
    svc = SupplierService(db)
    supplier = svc.update_supplier(supplier_id, body, user_id=current_user.id, user_email=current_user.email)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.delete("/{supplier_id}", status_code=204, summary="Delete a supplier (admin only)")
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    svc = SupplierService(db)
    if not svc.delete_supplier(supplier_id, user_id=current_user.id, user_email=current_user.email):
        raise HTTPException(status_code=404, detail="Supplier not found.")
