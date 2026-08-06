from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InventoryCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=0)
    unit: str = Field(default="pcs", min_length=1, max_length=20)


class InventoryUpdate(BaseModel):
    quantity: int = Field(ge=0)
    unit: Optional[str] = Field(default=None, min_length=1, max_length=20)


class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    menu_item_id: int
    quantity: int
    unit: str
    last_updated: datetime
