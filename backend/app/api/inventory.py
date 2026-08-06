from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.inventory import (
    create_inventory,
    delete_inventory,
    get_inventory,
    get_inventory_by_id,
    get_inventory_by_menu_item,
    update_inventory,
)
from app.db.database import get_db
from app.schemas.inventory import InventoryCreate, InventoryOut, InventoryUpdate

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.get("/", response_model=list[InventoryOut])
def get_all(db: Session = Depends(get_db)):
    return get_inventory(db)


@router.get("/{inventory_id}", response_model=InventoryOut)
def get_one(
    inventory_id: int,
    db: Session = Depends(get_db),
):
    inventory = get_inventory_by_id(db, inventory_id)

    if not inventory:
        raise HTTPException(404, "Inventory not found")

    return inventory


@router.post("/", response_model=InventoryOut, status_code=201)
def create(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
):
    return create_inventory(db, inventory)


@router.patch("/menu-item/{menu_item_id}", response_model=InventoryOut)
def update_by_menu_item(
    menu_item_id: int,
    inventory: InventoryUpdate,
    db: Session = Depends(get_db),
):
    return update_inventory(db, menu_item_id, inventory)


@router.put("/{inventory_id}", response_model=InventoryOut)
def update_by_id(
    inventory_id: int,
    inventory: InventoryUpdate,
    db: Session = Depends(get_db),
):
    existing = get_inventory_by_id(db, inventory_id)

    if not existing:
        raise HTTPException(404, "Inventory not found")

    return update_inventory(db, existing.menu_item_id, inventory)


@router.delete("/menu-item/{menu_item_id}")
def delete_by_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_inventory(db, menu_item_id)

    if not deleted:
        raise HTTPException(404, "Inventory not found")

    return {"message": "Inventory deleted successfully"}
