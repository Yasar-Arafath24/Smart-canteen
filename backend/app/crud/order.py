from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.utils.time import utcnow


VALID_ORDER_STATUSES = {
    "pending",
    "confirmed",
    "completed",
    "cancelled",
}


def create_order(
    db: Session,
    user_id: int,
    order: OrderCreate,
):
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

            if item.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Quantity must be greater than zero",
                )

            menu = (
                db.query(MenuItem)
                .filter(MenuItem.id == item.menu_item_id)
                .first()
            )

            if not menu:
                raise HTTPException(
                    status_code=404,
                    detail=f"Menu item {item.menu_item_id} not found",
                )

            if not menu.is_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"{menu.name} is unavailable",
                )

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.menu_item_id == menu.id
                )
                .first()
            )

            if not inventory:
                raise HTTPException(
                    status_code=404,
                    detail=f"No inventory for {menu.name}",
                )

            if inventory.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only {inventory.quantity} "
                        f"{inventory.unit} left for {menu.name}"
                    ),
                )

            inventory.quantity -= item.quantity
            inventory.last_updated = utcnow()

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

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def get_orders(
    db: Session,
    user_id: int,
):
    return (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.id.desc())
        .all()
    )


def get_order(
    db: Session,
    order_id: int,
):
    return (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
):
    status = status.lower().strip()

    if status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status '{status}'. "
                f"Allowed: {', '.join(sorted(VALID_ORDER_STATUSES))}"
            ),
        )

    order = get_order(db, order_id)

    if not order:
        return None

    # Prevent changing a cancelled order
    if order.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled orders cannot change status",
        )

    # Prevent changing a completed order
    if order.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed orders cannot change status",
        )

    order.status = status

    db.commit()
    db.refresh(order)

    return order


def cancel_order(
    db: Session,
    order_id: int,
    user_id: int,
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == user_id,
        )
        .first()
    )

    if not order:
        return None

    if order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be cancelled",
        )

    # Restore inventory
    for item in order.items:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.menu_item_id == item.menu_item_id
            )
            .first()
        )

        menu_item = (
            db.query(MenuItem)
            .filter(
                MenuItem.id == item.menu_item_id
            )
            .first()
        )

        if inventory:
            inventory.quantity += item.quantity
            inventory.last_updated = utcnow()

        if menu_item:
            menu_item.stock = (
                inventory.quantity
                if inventory
                else menu_item.stock + item.quantity
            )

    order.status = "cancelled"

    db.commit()
    db.refresh(order)

    return order


def delete_order(
    db: Session,
    order_id: int,
):
    order = get_order(db, order_id)

    if not order:
        return False

    if order.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed orders cannot be deleted",
        )

    db.delete(order)
    db.commit()

    return True