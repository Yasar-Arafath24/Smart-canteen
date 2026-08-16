from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import (
    get_current_user,
    get_current_admin,
    get_current_staff_or_admin,
)
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
# CUSTOMER / ADMIN
# GET ALL INVENTORY
# ============================================================

@router.get(
    "/",
    response_model=List[InventoryOut],
)
def list_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_inventory(db)


# ============================================================
# CUSTOMER / ADMIN
# GET ONE INVENTORY
# ============================================================

@router.get(
    "/{inventory_id}",
    response_model=InventoryOut,
)
def get_one_inventory(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_inventory_by_id(
        db,
        inventory_id,
    )


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
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return create_inventory(
        db=db,
        inventory_data=inventory_data,
    )


# ============================================================
# ADMIN ONLY
# UPDATE INVENTORY
# ============================================================

@router.put(
    "/{inventory_id}",
    response_model=InventoryOut,
)
async def update(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    updated_inventory = update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_UPDATED",
            "menu_item_id": updated_inventory.menu_item_id,
            "quantity": updated_inventory.quantity,
        }
    )

    return updated_inventory


# ============================================================
# ADMIN ONLY
# PATCH INVENTORY
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
    updated_inventory = update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )

    if not updated_inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )

    quantity = int(
        updated_inventory.quantity
    )

    # Try to get the menu item name.
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
        or f"Menu Item #{updated_inventory.menu_item_id}"
    )

    unit = getattr(
        updated_inventory,
        "unit",
        "units",
    )

    if quantity == 0:
        await notify_staff_out_of_stock(
            db=db,
            menu_item_name=menu_item_name,
        )

    elif 0 < quantity <= 5:
        await notify_staff_low_stock(
            db=db,
            menu_item_name=menu_item_name,
            quantity=quantity,
            unit=unit,
        )

    db.commit()

    await admin_analytics_manager.broadcast(
        {
            "type": "INVENTORY_UPDATED",
            "menu_item_id": updated_inventory.menu_item_id,
            "quantity": updated_inventory.quantity,
        }
    )

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
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    delete_inventory(
        db=db,
        inventory_id=inventory_id,
    )

    return {
        "message": "Inventory deleted successfully"
    }