from datetime import datetime
from pydantic import BaseModel


class InventoryCreate(BaseModel):
    menu_item_id: int
    quantity: int
    unit: str


class InventoryUpdate(BaseModel):
    quantity: int
    unit: str


class InventoryResponse(InventoryCreate):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True