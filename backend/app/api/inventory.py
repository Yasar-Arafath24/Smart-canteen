from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
)
from app.crud.inventory import (
    create_inventory,
    get_all_inventory,
    get_inventory,
    update_inventory,
    delete_inventory,
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.post("/", response_model=InventoryResponse, status_code=201)
def create(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
):
    return create_inventory(db, inventory)


@router.get("/", response_model=list[InventoryResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_inventory(db)


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_one(
    inventory_id: int,
    db: Session = Depends(get_db),
):
    inventory = get_inventory(db, inventory_id)

    if not inventory:
        raise HTTPException(404, "Inventory not found")

    return inventory


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update(
    inventory_id: int,
    inventory: InventoryUpdate,
    db: Session = Depends(get_db),
):
    updated = update_inventory(
        db,
        inventory_id,
        inventory,
    )

    if not updated:
        raise HTTPException(404, "Inventory not found")

    return updated


@router.delete("/{inventory_id}")
def delete(
    inventory_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_inventory(db, inventory_id)

    if not deleted:
        raise HTTPException(404, "Inventory not found")

    return {"message": "Inventory deleted successfully"}