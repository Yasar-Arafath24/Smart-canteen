from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    order_id: int

    payment_method: str = Field(
        default="razorpay",
        min_length=1,
        max_length=30,
    )


class PaymentVerify(BaseModel):
    razorpay_payment_id: str = Field(
        min_length=1,
        max_length=100,
    )

    razorpay_order_id: str = Field(
        min_length=1,
        max_length=100,
    )

    razorpay_signature: str = Field(
        min_length=1,
        max_length=255,
    )


class PaymentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    order_id: int
    user_id: int
    amount: float
    status: str
    payment_method: str

    transaction_id: Optional[str] = None

    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

    razorpay_key_id: Optional[str] = None

    created_at: datetime
    updated_at: datetime