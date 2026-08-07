from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.menu import Category, MenuItem
from app.schemas.menu import (
    MenuItemCreate,
    MenuItemUpdate,
)


def create_menu_item(db: Session, item: MenuItemCreate):
    # Check category exists
    category = (
        db.query(Category)
        .filter(Category.id == item.category_id)
        .first()
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    menu_item = MenuItem(
        name=item.name,
        description=item.description,
        price=item.price,
        image_url=item.image_url,
        category_id=item.category_id,
        is_available=item.is_available,
        stock=item.stock,
    )

    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)

    return menu_item


def get_menu_items(db: Session):
    return (
        db.query(MenuItem)
        .order_by(MenuItem.id)
        .all()
    )


def get_menu_item(db: Session, item_id: int):
    menu_item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .first()
    )

    if menu_item is None:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found",
        )

    return menu_item


def update_menu_item(
    db: Session,
    item_id: int,
    updated_item: MenuItemUpdate,
):
    menu_item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .first()
    )

    if menu_item is None:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found",
        )

    update_data = updated_item.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        category = (
            db.query(Category)
            .filter(Category.id == update_data["category_id"])
            .first()
        )

        if category is None:
            raise HTTPException(
                status_code=404,
                detail="Category not found",
            )

    for key, value in update_data.items():
        setattr(menu_item, key, value)

    db.commit()
    db.refresh(menu_item)

    return menu_item


def delete_menu_item(db: Session, item_id: int):
    menu_item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .first()
    )

    if menu_item is None:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found",
        )

    db.delete(menu_item)
    db.commit()

    return {
        "message": "Menu item deleted successfully"
    }