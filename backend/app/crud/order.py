from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate


def create_order(db: Session, user_id: int, order: OrderCreate):

    try:

        db_order = Order(
            user_id=user_id,
            status="pending",
            total=0,
        )

        db.add(db_order)
        db.flush()

        total = 0

        for item in order.items:

            # Find menu item
            menu = (
                db.query(MenuItem)
                .filter(MenuItem.id == item.menu_item_id)
                .first()
            )

            if not menu:
                raise HTTPException(
                    status_code=404,
                    detail=f"Menu item {item.menu_item_id} not found"
                )

            # Check availability
            if not menu.is_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"{menu.name} is unavailable"
                )

            # Find inventory
            inventory = (
                db.query(Inventory)
                .filter(Inventory.menu_item_id == menu.id)
                .first()
            )

            if not inventory:
                raise HTTPException(
                    status_code=404,
                    detail=f"No inventory for {menu.name}"
                )

            # Check stock
            if inventory.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {inventory.quantity} {inventory.unit} left for {menu.name}"
                )

            # Reduce stock
            inventory.quantity -= item.quantity

            # Keep menu_items.stock synchronized
            menu.stock = inventory.quantity

            order_item = OrderItem(
                order_id=db_order.id,
                menu_item_id=menu.id,
                quantity=item.quantity,
                price=menu.price,
            )

            db.add(order_item)

            total += menu.price * item.quantity

        db_order.total = total

        db.commit()
        db.refresh(db_order)

        return db_order

    except Exception:
        db.rollback()
        raise


def get_orders(db: Session, user_id: int):
    return (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .all()
    )


def get_order(db: Session, order_id: int):
    return (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )


VALID_ORDER_STATUSES = {"pending", "confirmed", "completed", "cancelled"}


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
):
    if status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Allowed: {', '.join(sorted(VALID_ORDER_STATUSES))}",
        )

    order = get_order(db, order_id)

    if not order:
        return None

    order.status = status

    db.commit()
    db.refresh(order)

    return order


def delete_order(db: Session, order_id: int):
    order = get_order(db, order_id)

    if not order:
        return False

    db.delete(order)
    db.commit()

    return True
