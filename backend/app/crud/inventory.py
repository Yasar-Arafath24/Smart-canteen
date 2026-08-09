from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.menu import MenuItem
from app.schemas.inventory import InventoryCreate, InventoryUpdate
from app.utils.time import utcnow


# ============================================================
# CREATE INVENTORY
# ============================================================

def create_inventory(
    db: Session,
    inventory_data: InventoryCreate,
):
    menu = (
        db.query(MenuItem)
        .filter(MenuItem.id == inventory_data.menu_item_id)
        .first()
    )

    if not menu:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found",
        )

    existing = (
        db.query(Inventory)
        .filter(
            Inventory.menu_item_id
            == inventory_data.menu_item_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Inventory already exists for this menu item",
        )

    inventory = Inventory(
        menu_item_id=menu.id,
        quantity=inventory_data.quantity,
        unit=inventory_data.unit,
        last_updated=utcnow(),
    )

    # Keep menu stock synchronized
    menu.stock = inventory_data.quantity

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory


# ============================================================
# GET ALL INVENTORY
# ============================================================

def get_inventory(db: Session):
    return (
        db.query(Inventory)
        .order_by(Inventory.menu_item_id)
        .all()
    )


# ============================================================
# GET ONE INVENTORY BY INVENTORY ID
# ============================================================

def get_inventory_by_id(
    db: Session,
    inventory_id: int,
):
    return (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )


# ============================================================
# GET INVENTORY BY MENU ITEM
# Useful internally
# ============================================================

def get_inventory_by_menu_item(
    db: Session,
    menu_item_id: int,
):
    return (
        db.query(Inventory)
        .filter(
            Inventory.menu_item_id == menu_item_id
        )
        .first()
    )


# ============================================================
# UPDATE INVENTORY BY INVENTORY ID
# ============================================================

def update_inventory(
    db: Session,
    inventory_id: int,
    inventory_data: InventoryUpdate,
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )

    inventory.quantity = inventory_data.quantity

    if inventory_data.unit is not None:
        inventory.unit = inventory_data.unit

    inventory.last_updated = utcnow()

    # Keep menu stock synchronized
    inventory.menu_item.stock = inventory.quantity

    db.commit()
    db.refresh(inventory)

    return inventory


# ============================================================
# DELETE INVENTORY BY INVENTORY ID
# ============================================================

def delete_inventory(
    db: Session,
    inventory_id: int,
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )

    # Reset menu stock before deleting inventory
    inventory.menu_item.stock = 0

    db.delete(inventory)
    db.commit()

    return inventory