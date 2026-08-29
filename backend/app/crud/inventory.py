from sqlalchemy.orm import Session, joinedload

from app.models.inventory import Inventory
from app.models.menu import MenuItem
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
)


def create_inventory(
    db: Session,
    inventory_data: InventoryCreate,
):
    menu_item = (
        db.query(MenuItem)
        .filter(
            MenuItem.id
            == inventory_data.menu_item_id
        )
        .first()
    )

    if not menu_item:
        return None

    existing = (
        db.query(Inventory)
        .filter(
            Inventory.menu_item_id
            == inventory_data.menu_item_id
        )
        .first()
    )

    if existing:
        return None

    inventory = Inventory(
        menu_item_id=(
            inventory_data.menu_item_id
        ),
        quantity=(
            inventory_data.quantity
        ),
        unit=(
            inventory_data.unit.strip()
            or "units"
        ),
    )

    db.add(inventory)

    # Keep menu stock synchronized.
    menu_item.stock = (
        inventory_data.quantity
    )

    db.flush()

    return (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .filter(
            Inventory.id == inventory.id
        )
        .first()
    )


def get_inventory(
    db: Session,
):
    return (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .order_by(
            Inventory.id.desc()
        )
        .all()
    )


def get_inventory_by_id(
    db: Session,
    inventory_id: int,
):
    return (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .filter(
            Inventory.id == inventory_id
        )
        .first()
    )


def update_inventory(
    db: Session,
    inventory_id: int,
    inventory_data: InventoryUpdate,
):
    inventory = (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .filter(
            Inventory.id == inventory_id
        )
        .first()
    )

    if not inventory:
        return None

    if inventory_data.quantity is not None:
        inventory.quantity = (
            inventory_data.quantity
        )

        if inventory.menu_item:
            inventory.menu_item.stock = (
                inventory_data.quantity
            )

    if inventory_data.unit is not None:
        inventory.unit = (
            inventory_data.unit.strip()
            or "units"
        )

    db.flush()

    return (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .filter(
            Inventory.id == inventory.id
        )
        .first()
    )


def delete_inventory(
    db: Session,
    inventory_id: int,
):
    inventory = (
        db.query(Inventory)
        .options(
            joinedload(
                Inventory.menu_item
            )
        )
        .filter(
            Inventory.id == inventory_id
        )
        .first()
    )

    if not inventory:
        return None

    # When inventory is removed, menu item stock becomes 0.
    if inventory.menu_item:
        inventory.menu_item.stock = 0

    db.delete(inventory)
    db.flush()

    return inventory