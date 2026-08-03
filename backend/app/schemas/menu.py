from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category_id: int
    is_available: bool = True
    stock: int = 0


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    stock: Optional[int] = None


class MenuItemResponse(MenuItemBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)