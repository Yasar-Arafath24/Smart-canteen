from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_menu_items: int
    total_categories: int
    total_inventory_items: int
    total_sales: float