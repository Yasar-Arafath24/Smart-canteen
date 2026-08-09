from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.order import Order
from app.models.menu import MenuItem
from app.models.inventory import Inventory


def get_dashboard_stats(db: Session):

    total_users = (
        db.query(User).count()
    )

    total_orders = (
        db.query(Order).count()
    )

    pending_orders = (
        db.query(Order)
        .filter(Order.status == "pending")
        .count()
    )

    confirmed_orders = (
        db.query(Order)
        .filter(Order.status == "confirmed")
        .count()
    )

    completed_orders = (
        db.query(Order)
        .filter(Order.status == "completed")
        .count()
    )

    cancelled_orders = (
        db.query(Order)
        .filter(Order.status == "cancelled")
        .count()
    )

    total_menu_items = (
        db.query(MenuItem).count()
    )

    low_stock_items = (
        db.query(Inventory)
        .filter(Inventory.quantity <= 5)
        .count()
    )

    revenue = (
        db.query(
            func.coalesce(
                func.sum(Order.total),
                0,
            )
        )
        .filter(Order.status == "completed")
        .scalar()
    )

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_menu_items": total_menu_items,
        "low_stock_items": low_stock_items,
        "revenue": float(revenue or 0),
    }