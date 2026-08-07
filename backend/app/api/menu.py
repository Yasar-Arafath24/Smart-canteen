from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin  # Added for admin verification
from app.crud.menu import (
    create_menu_item,
    delete_menu_item,
    get_menu_item,
    get_menu_items,
    update_menu_item,
)
from app.db.database import get_db
from app.schemas.menu import (
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
)

router = APIRouter(
    prefix="/menu",
    tags=["Menu"]
)


@router.post("/", response_model=MenuItemResponse, status_code=201)
def create(
    item: MenuItemCreate, 
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)  # Guarded: Admin only
):
    return create_menu_item(db, item)


@router.get("/", response_model=List[MenuItemResponse])
def read_all(db: Session = Depends(get_db)):
    # Public endpoint: Customers and guests can browse the full menu
    return get_menu_items(db)


@router.get("/{item_id}", response_model=MenuItemResponse)
def read(item_id: int, db: Session = Depends(get_db)):
    # Public endpoint: Anyone can view a specific item
    return get_menu_item(db, item_id)


@router.put("/{item_id}", response_model=MenuItemResponse)
def update(
    item_id: int,
    item: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)  # Guarded: Admin only
):
    return update_menu_item(db, item_id, item)


@router.delete("/{item_id}")
def delete(
    item_id: int, 
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)  # Guarded: Admin only
):
    return delete_menu_item(db, item_id)
