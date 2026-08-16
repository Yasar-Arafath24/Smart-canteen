from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    menu_item_id: int = Field(ge=1)
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    menu_item_id: int
    menu_item_name: Optional[str] = None
    quantity: int
    price: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    total: float
    created_at: datetime
    updated_at: Optional[datetime]
    items: List[OrderItemResponse]


class OrderStatusUpdate(BaseModel):
    status: Literal[
        "pending",
        "confirmed",
        "completed",
        "cancelled",
    ]