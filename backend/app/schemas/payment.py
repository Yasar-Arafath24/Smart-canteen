from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PaymentCreate(BaseModel):
    order_id: int
    payment_method: str = "simulated"


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    user_id: int
    amount: float
    status: str
    payment_method: str
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime