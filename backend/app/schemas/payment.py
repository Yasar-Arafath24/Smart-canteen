from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE PAYMENT
# ============================================================

class PaymentCreate(BaseModel):
    order_id: int = Field(
        gt=0,
    )

    payment_method: str = Field(
        default="razorpay",
        min_length=2,
        max_length=30,
    )


# ============================================================
# VERIFY NORMAL RAZORPAY CHECKOUT
# ============================================================

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


# ============================================================
# RESPONSE
# ============================================================

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

    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None

    razorpay_signature: str | None = None

    razorpay_qr_id: str | None = None
    razorpay_qr_content: str | None = None
    razorpay_qr_image_url: str | None = None

    transaction_id: str | None = None

    created_at: datetime
    updated_at: datetime

    razorpay_key_id: str | None = None


# ============================================================
# QR RESPONSE
# ============================================================

class PaymentQRResponse(BaseModel):
    payment_id: int
    order_id: int

    amount: float

    status: str

    payment_method: str

    qr_id: str

    qr_content: str | None = None

    qr_image_url: str | None = None

    razorpay_key_id: str | None = None