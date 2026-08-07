from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.order import Order
from app.models.menu import MenuItem
from app.models.menu import Category
from app.models.inventory import Inventory


def get_dashboard_stats(db: Session):
    return {
        "total_users": db.query(User).count(),
        "total_orders": db.query(Order).count(),
        "total_menu_items": db.query(MenuItem).count(),
        "total_categories": db.query(Category).count(),
        "total_inventory_items": db.query(Inventory).count(),
        "total_sales": (
            db.query(func.coalesce(func.sum(Order.total), 0.0))
            .scalar()
        ),
    }