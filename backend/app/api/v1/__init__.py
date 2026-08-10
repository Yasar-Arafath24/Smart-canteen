from fastapi import APIRouter

from app.api import (
    category,
    inventory,
    menu,
    order,
    dashboard,
    payment,
    notification,
)

from app.api.v1 import (
    auth,
    users,
)


api_router = APIRouter()


api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(order.router)
api_router.include_router(category.router)
api_router.include_router(menu.router)
api_router.include_router(inventory.router)
api_router.include_router(dashboard.router)
api_router.include_router(payment.router)
api_router.include_router(notification.router)