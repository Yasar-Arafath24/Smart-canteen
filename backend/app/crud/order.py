from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from app.crud.notification import create_notification
from app.models.inventory import Inventory
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.email_service import (
    send_order_cancelled_email,
    send_order_completed_email,
)
from app.services.notification_service import (
    create_and_send_notification,
)
from app.services.admin_ws import (
    admin_analytics_manager,
)
from app.utils.time import utcnow


VALID_ORDER_STATUSES = {
    "pending",
    "confirmed",
    "completed",
    "cancelled",
}


async def create_order(
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
                    detail=(
                        f"Menu item "
                        f"{item.menu_item_id} not found"
                    ),
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
                        f"{inventory.unit} left for "
                        f"{menu.name}"
                    ),
                )

            # Reduce inventory
            inventory.quantity -= item.quantity
            inventory.last_updated = utcnow()

            # Synchronize menu stock
            menu.stock = inventory.quantity

            # Create order item
            order_item = OrderItem(
                order_id=db_order.id,
                menu_item_id=menu.id,
                quantity=item.quantity,
                price=menu.price,
            )

            db.add(order_item)

            total += menu.price * item.quantity

        # Set total
        db_order.total = total

        # Database notification
        create_notification(
            db=db,
            user_id=user_id,
            title="Order placed",
            message=(
                f"Your order #{db_order.id} "
                f"has been placed successfully."
            ),
            notification_type="order_created",
        )

        db.commit()
        db.refresh(db_order)

        await admin_analytics_manager.broadcast(
            {
                "type": "ORDER_CREATED",
                "order_id": db_order.id,
                "user_id": db_order.user_id,
                "status": db_order.status,
                "total": float(db_order.total),
            }
        )

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
        .options(
            selectinload(Order.items).selectinload(
                OrderItem.menu_item
            ),
        )
        .all()
    )


def get_order(
    db: Session,
    order_id: int,
):
    return (
        db.query(Order)
        .filter(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(
                OrderItem.menu_item
            ),
        )
        .first()
    )


async def update_order_status(
    db: Session,
    order_id: int,
    status: str,
):
    status = status.lower().strip()

    # ---------------------------------------------------------
    # VALID STATUS VALUES
    # ---------------------------------------------------------

    if status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status '{status}'. "
                "Allowed statuses: "
                "pending, confirmed, completed, cancelled"
            ),
        )

    order = get_order(db, order_id)

    if not order:
        return None

    current_status = order.status.lower().strip()

    # ---------------------------------------------------------
    # VALID STATUS TRANSITIONS
    # ---------------------------------------------------------

    valid_transitions = {
        "pending": {
            "confirmed",
            "cancelled",
        },
        "confirmed": {
            "completed",
            "cancelled",
        },
        "completed": set(),
        "cancelled": set(),
    }

    allowed_next_statuses = valid_transitions.get(
        current_status,
        set(),
    )

    # Same status
    if status == current_status:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order is already '{current_status}'."
            ),
        )

    # Invalid transition
    if status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid order status transition: "
                f"{current_status} -> {status}. "
                f"Allowed next statuses: "
                f"{', '.join(sorted(allowed_next_statuses))}"
                if allowed_next_statuses
                else (
                    f"Order '{current_status}' "
                    "cannot change status."
                )
            ),
        )

    # ---------------------------------------------------------
    # UPDATE STATUS
    # ---------------------------------------------------------

    order.status = status
    order.updated_at = utcnow()

    # ---------------------------------------------------------
    # COMPLETED NOTIFICATION
    # ---------------------------------------------------------

    if status == "completed":

        await create_and_send_notification(
            db=db,
            user_id=order.user_id,
            title="Order completed",
            message=(
                f"Your order #{order.id} "
                "has been completed."
            ),
            notification_type="order_completed",
        )

    # ---------------------------------------------------------
    # GET CUSTOMER
    # ---------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == order.user_id)
        .first()
    )

    # ---------------------------------------------------------
    # COMMIT
    # ---------------------------------------------------------

    db.commit()
    db.refresh(order)

    await admin_analytics_manager.broadcast(
        {
            "type": "ORDER_STATUS_CHANGED",
            "order_id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "total": float(order.total),
        }
    )

    # ---------------------------------------------------------
    # COMPLETED EMAIL
    # ---------------------------------------------------------

    if status == "completed" and user and user.email:

        try:
            await send_order_completed_email(
                recipient=user.email,
                order_id=order.id,
                amount=float(order.total),
            )

        except Exception as email_error:
            print(
                "Order completed email failed:",
                email_error,
            )

    return order


async def cancel_order(
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

    # --------------------------------
    # Restore inventory
    # --------------------------------

    for item in order.items:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.menu_item_id
                == item.menu_item_id
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

    # --------------------------------
    # Change order status
    # --------------------------------

    order.status = "cancelled"
    order.updated_at = utcnow()

    # --------------------------------
    # Database notification
    # --------------------------------

    await create_and_send_notification(
        db=db,
        user_id=order.user_id,
        title="Order cancelled",
        message=(
            f"Your order #{order.id} "
            f"has been cancelled."
        ),
        notification_type="order_cancelled",
    )

    # Get customer
    user = (
        db.query(User)
        .filter(User.id == order.user_id)
        .first()
    )

    # --------------------------------
    # Commit database first
    # --------------------------------

    db.commit()
    db.refresh(order)

    await admin_analytics_manager.broadcast(
        {
            "type": "ORDER_CANCELLED",
            "order_id": order.id,
            "user_id": order.user_id,
            "status": "cancelled",
            "total": float(order.total),
        }
    )

    # --------------------------------
    # Send cancellation email
    # --------------------------------

    if user and user.email:

        try:
            await send_order_cancelled_email(
                recipient=user.email,
                order_id=order.id,
                amount=float(order.total),
            )

        except Exception as email_error:
            # Do not undo cancellation
            print(
                "Order cancellation email failed:",
                email_error,
            )

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

    # --------------------------------
    # Restore inventory
    # --------------------------------

    for item in order.items:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.menu_item_id
                == item.menu_item_id
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

    db.delete(order)
    db.commit()

    return True