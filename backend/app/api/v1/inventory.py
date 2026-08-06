from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.inventory import (
    create_inventory,
    get_inventory,
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


@router.post("/", response_model=InventoryOut, status_code=201)
def create(
    data: InventoryCreate,
    db: Session = Depends(get_db),
):
    return create_inventory(db, data)


@router.patch("/{menu_item_id}", response_model=InventoryOut)
def update(
    menu_item_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
):
    return update_inventory(db, menu_item_id, data)
