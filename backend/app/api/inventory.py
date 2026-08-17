from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_current_admin,
    get_current_staff_or_admin,
)

from app.db.database import get_db
from app.models.user import User

from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
)

from app.crud.inventory import (
    create_inventory,
    get_inventory,
    get_inventory_by_id,
    update_inventory,
    delete_inventory,
)

from app.crud.activity import create_activity

from app.services.admin_ws import (
    admin_analytics_manager,
)

from app.services.notification_service import (
    notify_staff_low_stock,
    notify_staff_out_of_stock,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


# ============================================================
# CUSTOMER / STAFF / ADMIN
# GET ALL INVENTORY
# ============================================================

@router.get(
    "/",
    response_model=List[InventoryOut],
)
def list_inventory(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return get_inventory(db)


# ============================================================
# CUSTOMER / STAFF / ADMIN
# GET ONE INVENTORY
# ============================================================

@router.get(
    "/{inventory_id}",
    response_model=InventoryOut,
)
def get_one_inventory(
    inventory_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    return inventory


# ============================================================
# ADMIN ONLY
# CREATE INVENTORY
# ============================================================

@router.post(
    "/",
    response_model=InventoryOut,
    status_code=status.HTTP_201_CREATED,
)
def create(
    inventory_data: InventoryCreate,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    inventory = create_inventory(
        db=db,
        inventory_data=inventory_data,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create inventory.",
        )

    create_activity(
        db=db,
        actor=current_admin,
        action="inventory_created",
        entity_type="inventory",
        entity_id=inventory.menu_item_id,
        description=(
            f"Inventory for menu item "
            f"#{inventory.menu_item_id} "
            f"was created with quantity "
            f"{inventory.quantity}."
        ),
    )

    db.commit()
    db.refresh(inventory)

    return inventory


# ============================================================
# ADMIN ONLY
# FULL INVENTORY UPDATE
# ============================================================

@router.put(
    "/{inventory_id}",
    response_model=InventoryOut,
)
async def update(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    previous_quantity = int(
        inventory.quantity
    )

    updated_inventory = update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )

    if not updated_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    current_quantity = int(
        updated_inventory.quantity
    )

    menu_item_name = (
        getattr(
            updated_inventory,
            "menu_item_name",
            None,
        )
        or getattr(
            getattr(
                updated_inventory,
                "menu_item",
                None,
            ),
            "name",
            None,
        )
        or (
            f"Menu Item "
            f"#{updated_inventory.menu_item_id}"
        )
    )

    unit = getattr(
        updated_inventory,
        "unit",
        "units",
    )

    # --------------------------------------------------------
    # ACTIVITY LOG
    # --------------------------------------------------------

    create_activity(
        db=db,
        actor=current_admin,
        action="inventory_updated",
        entity_type="inventory",
        entity_id=updated_inventory.menu_item_id,
        description=(
            f"{menu_item_name} inventory "
            f"changed from "
            f"{previous_quantity} "
            f"to "
            f"{current_quantity} "
            f"{unit}."
        ),
    )

    # --------------------------------------------------------
    # LOW / OUT OF STOCK NOTIFICATIONS
    # --------------------------------------------------------

    if (
        previous_quantity > 0
        and current_quantity == 0
    ):
        await notify_staff_out_of_stock(
            db=db,
            menu_item_name=menu_item_name,
        )

        create_activity(
            db=db,
            actor=current_admin,
            action="inventory_out_of_stock",
            entity_type="inventory",
            entity_id=updated_inventory.menu_item_id,
            description=(
                f"{menu_item_name} "
                f"is now out of stock."
            ),
        )

    elif (
        previous_quantity > 5
        and 0 < current_quantity <= 5
    ):
        await notify_staff_low_stock(
            db=db,
            menu_item_name=menu_item_name,
            quantity=current_quantity,
            unit=unit,
        )

        create_activity(
            db=db,
            actor=current_admin,
            action="inventory_low_stock",
            entity_type="inventory",
            entity_id=updated_inventory.menu_item_id,
            description=(
                f"{menu_item_name} "
                f"is now low stock with "
                f"{current_quantity} "
                f"{unit} remaining."
            ),
        )

    # --------------------------------------------------------
    # REAL-TIME ADMIN ANALYTICS
    # --------------------------------------------------------

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_UPDATED",
            "menu_item_id": (
                updated_inventory.menu_item_id
            ),
            "quantity": (
                updated_inventory.quantity
            ),
        }
    )

    db.commit()
    db.refresh(updated_inventory)

    return updated_inventory


# ============================================================
# STAFF + ADMIN
# STOCK / OPERATIONAL UPDATE
# ============================================================

@router.patch(
    "/{inventory_id}",
    response_model=InventoryOut,
)
async def patch(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    previous_quantity = int(
        inventory.quantity
    )

    updated_inventory = update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )

    if not updated_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    current_quantity = int(
        updated_inventory.quantity
    )

    # --------------------------------------------------------
    # MENU ITEM NAME
    # --------------------------------------------------------

    menu_item_name = (
        getattr(
            updated_inventory,
            "menu_item_name",
            None,
        )
        or getattr(
            getattr(
                updated_inventory,
                "menu_item",
                None,
            ),
            "name",
            None,
        )
        or (
            f"Menu Item "
            f"#{updated_inventory.menu_item_id}"
        )
    )

    unit = getattr(
        updated_inventory,
        "unit",
        "units",
    )

    # --------------------------------------------------------
    # ACTIVITY LOG
    # --------------------------------------------------------

    create_activity(
        db=db,
        actor=current_user,
        action="inventory_updated",
        entity_type="inventory",
        entity_id=updated_inventory.menu_item_id,
        description=(
            f"{menu_item_name} inventory "
            f"changed from "
            f"{previous_quantity} "
            f"to "
            f"{current_quantity} "
            f"{unit}."
        ),
    )

    # --------------------------------------------------------
    # OUT OF STOCK
    # ONLY WHEN CROSSING INTO ZERO
    # --------------------------------------------------------

    if (
        previous_quantity > 0
        and current_quantity == 0
    ):
        await notify_staff_out_of_stock(
            db=db,
            menu_item_name=menu_item_name,
        )

        create_activity(
            db=db,
            actor=current_user,
            action="inventory_out_of_stock",
            entity_type="inventory",
            entity_id=updated_inventory.menu_item_id,
            description=(
                f"{menu_item_name} "
                f"is now out of stock."
            ),
        )

    # --------------------------------------------------------
    # LOW STOCK
    # ONLY WHEN CROSSING FROM >5 TO <=5
    # --------------------------------------------------------

    elif (
        previous_quantity > 5
        and 0 < current_quantity <= 5
    ):
        await notify_staff_low_stock(
            db=db,
            menu_item_name=menu_item_name,
            quantity=current_quantity,
            unit=unit,
        )

        create_activity(
            db=db,
            actor=current_user,
            action="inventory_low_stock",
            entity_type="inventory",
            entity_id=updated_inventory.menu_item_id,
            description=(
                f"{menu_item_name} "
                f"is now low stock with "
                f"{current_quantity} "
                f"{unit} remaining."
            ),
        )

    # --------------------------------------------------------
    # REAL-TIME ADMIN ANALYTICS
    # --------------------------------------------------------

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_UPDATED",
            "menu_item_id": (
                updated_inventory.menu_item_id
            ),
            "quantity": (
                updated_inventory.quantity
            ),
        }
    )

    db.commit()
    db.refresh(updated_inventory)

    return updated_inventory


# ============================================================
# ADMIN ONLY
# DELETE INVENTORY
# ============================================================

@router.delete(
    "/{inventory_id}",
)
def delete(
    inventory_id: int,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    menu_item_id = (
        inventory.menu_item_id
    )

    menu_item_name = (
        getattr(
            inventory,
            "menu_item_name",
            None,
        )
        or getattr(
            getattr(
                inventory,
                "menu_item",
                None,
            ),
            "name",
            None,
        )
        or (
            f"Menu Item "
            f"#{menu_item_id}"
        )
    )

    delete_inventory(
        db=db,
        inventory_id=inventory_id,
    )

    create_activity(
        db=db,
        actor=current_admin,
        action="inventory_deleted",
        entity_type="inventory",
        entity_id=menu_item_id,
        description=(
            f"Inventory for "
            f"{menu_item_name} "
            f"was deleted."
        ),
    )

    db.commit()

    return {
        "message": (
            "Inventory deleted successfully"
        )
    }