from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_admin,
    get_current_staff_or_admin,
    get_current_user,
)

from app.crud.activity import (
    create_activity,
)

from app.crud.inventory import (
    create_inventory,
    delete_inventory,
    get_inventory,
    get_inventory_by_id,
    update_inventory,
)

from app.db.database import get_db

from app.models.user import User

from app.schemas.inventory import (
    InventoryCreate,
    InventoryOut,
    InventoryUpdate,
)

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
# GET ALL
# CUSTOMER / STAFF / ADMIN
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
# GET ONE
# CUSTOMER / STAFF / ADMIN
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
# CREATE
# ADMIN ONLY
# ============================================================

@router.post(
    "/",
    response_model=InventoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    inventory_data: InventoryCreate,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    existing = (
        get_inventory(db)
    )

    for item in existing:
        if (
            item.menu_item_id
            == inventory_data.menu_item_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Inventory already exists "
                    "for this menu item."
                ),
            )

    inventory = create_inventory(
        db=db,
        inventory_data=inventory_data,
    )

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unable to create inventory. "
                "Check the menu item."
            ),
        )

    create_activity(
        db=db,
        actor=current_admin,
        action="inventory_created",
        entity_type="inventory",
        entity_id=inventory.menu_item_id,
        description=(
            f"{inventory.menu_item_name} "
            f"inventory was created with "
            f"{inventory.quantity} "
            f"{inventory.unit}."
        ),
    )

    db.commit()
    db.refresh(inventory)

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_CREATED",
            "menu_item_id": inventory.menu_item_id,
            "quantity": inventory.quantity,
        }
    )

    return inventory


# ============================================================
# FULL UPDATE
# ADMIN ONLY
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

    quantity = int(
        updated_inventory.quantity
    )

    menu_item_name = (
        updated_inventory.menu_item_name
    )

    unit = updated_inventory.unit

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
            f"{quantity} "
            f"{unit}."
        ),
    )

    if (
        previous_quantity > 5
        and 0 < quantity <= 5
    ):
        await notify_staff_low_stock(
            db=db,
            menu_item_name=menu_item_name,
            quantity=quantity,
            unit=unit,
        )

        create_activity(
            db=db,
            actor=current_admin,
            action="inventory_low_stock",
            entity_type="inventory",
            entity_id=updated_inventory.menu_item_id,
            description=(
                f"{menu_item_name} is now "
                f"low stock with "
                f"{quantity} "
                f"{unit} remaining."
            ),
        )

    elif (
        previous_quantity > 0
        and quantity == 0
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

    db.commit()
    db.refresh(updated_inventory)

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

    return updated_inventory


# ============================================================
# PARTIAL UPDATE
# STAFF + ADMIN
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

    quantity = int(
        updated_inventory.quantity
    )

    menu_item_name = (
        updated_inventory.menu_item_name
    )

    unit = updated_inventory.unit

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
            f"{quantity} "
            f"{unit}."
        ),
    )

    if (
        previous_quantity > 5
        and 0 < quantity <= 5
    ):
        await notify_staff_low_stock(
            db=db,
            menu_item_name=menu_item_name,
            quantity=quantity,
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
                f"{quantity} "
                f"{unit} remaining."
            ),
        )

    elif (
        previous_quantity > 0
        and quantity == 0
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

    db.commit()
    db.refresh(updated_inventory)

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

    return updated_inventory


# ============================================================
# DELETE
# ADMIN ONLY
# ============================================================

@router.delete(
    "/{inventory_id}",
)
async def delete(
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
        inventory.menu_item_name
    )

    deleted = delete_inventory(
        db=db,
        inventory_id=inventory_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
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

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_DELETED",
            "menu_item_id": menu_item_id,
            "quantity": 0,
        }
    )

    return {
        "message": (
            "Inventory deleted successfully"
        )
    }