from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InventoryCreate(BaseModel):
    menu_item_id: int = Field(
        ge=1,
    )

    quantity: int = Field(
        ge=0,
    )

    unit: str = Field(
        default="units",
        min_length=1,
        max_length=30,
    )


class InventoryUpdate(BaseModel):
    quantity: int | None = Field(
        default=None,
        ge=0,
    )

    unit: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )


class InventoryOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    menu_item_id: int
    menu_item_name: str
    quantity: int
    unit: str
    created_at: datetime
    updated_at: datetime