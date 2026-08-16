from sqlalchemy.orm import Session

from app.crud.notification import create_notification
from app.models.user import User
from app.services.notification_ws import notification_manager


async def create_and_send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
):
    notification = create_notification(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    db.flush()

    await notification_manager.send_to_user(
        user_id=user_id,
        message={
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
        },
    )

    return notification


# ============================================================
# STAFF NOTIFICATIONS
# ============================================================

async def notify_all_staff(
    db: Session,
    title: str,
    message: str,
    notification_type: str,
):
    """
    Send one notification to every active staff user.

    Admin users are intentionally excluded.
    Admin can still see the operational information
    through the admin dashboard.
    """

    staff_users = (
        db.query(User)
        .filter(
            User.role == "staff",
            User.is_active.is_(True),
        )
        .all()
    )

    notifications = []

    for staff_user in staff_users:
        notification = await create_and_send_notification(
            db=db,
            user_id=staff_user.id,
            title=title,
            message=message,
            notification_type=notification_type,
        )

        notifications.append(notification)

    return notifications


async def notify_staff_new_order(
    db: Session,
    order_id: int,
    total: float,
):
    return await notify_all_staff(
        db=db,
        title="New Order Received",
        message=(
            f"Order #{order_id} has been placed "
            f"for ₹{total:.2f}."
        ),
        notification_type="new_order",
    )


async def notify_staff_order_status(
    db: Session,
    order_id: int,
    new_status: str,
):
    status_label = new_status.capitalize()

    return await notify_all_staff(
        db=db,
        title=f"Order #{order_id} Updated",
        message=(
            f"Order #{order_id} is now "
            f"{status_label}."
        ),
        notification_type="order_status",
    )


async def notify_staff_low_stock(
    db: Session,
    menu_item_name: str,
    quantity: int,
    unit: str,
):
    return await notify_all_staff(
        db=db,
        title="Low Stock Alert",
        message=(
            f"{menu_item_name} has only "
            f"{quantity} {unit} remaining."
        ),
        notification_type="low_stock",
    )


async def notify_staff_out_of_stock(
    db: Session,
    menu_item_name: str,
):
    return await notify_all_staff(
        db=db,
        title="Out of Stock",
        message=(
            f"{menu_item_name} is now "
            "out of stock."
        ),
        notification_type="out_of_stock",
    )