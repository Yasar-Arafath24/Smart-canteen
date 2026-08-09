from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int

    total_orders: int
    pending_orders: int
    confirmed_orders: int
    completed_orders: int
    cancelled_orders: int

    total_menu_items: int
    low_stock_items: int

    revenue: float