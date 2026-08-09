from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user, get_current_admin
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
def update(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )


# ============================================================
# ADMIN ONLY
# PATCH INVENTORY
# ============================================================

@router.patch(
    "/{inventory_id}",
    response_model=InventoryOut,
)
def patch(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_data=inventory_data,
    )


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