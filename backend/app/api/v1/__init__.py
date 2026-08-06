from fastapi import APIRouter

from app.api import order
from app.api.v1 import auth, inventory, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(order.router)
api_router.include_router(inventory.router)
