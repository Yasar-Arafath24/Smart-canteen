from fastapi import APIRouter

from app.api.v1 import auth, users
from app.api import category, menu, inventory

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(category.router)
api_router.include_router(menu.router)
api_router.include_router(inventory.router)