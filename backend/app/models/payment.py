from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.utils.time import utcnow


if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import User


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey(
            "orders.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="razorpay",
    )

    # ========================================================
    # RAZORPAY NORMAL CHECKOUT
    # ========================================================

    razorpay_order_id: Mapped[
        Optional[str]
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True,
    )

    razorpay_payment_id: Mapped[
        Optional[str]
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True,
    )

    razorpay_signature: Mapped[
        Optional[str]
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    # ========================================================
    # UPI QR
    # ========================================================

    razorpay_qr_id: Mapped[
        Optional[str]
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True,
    )

    # UPI URI returned by Razorpay.
    # Example:
    # upi://pay?pa=...&pn=...&am=...&cu=INR
    razorpay_qr_content: Mapped[
        Optional[str]
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # Razorpay hosted QR/payment URL.
    razorpay_qr_image_url: Mapped[
        Optional[str]
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    # ========================================================
    # GENERAL TRANSACTION DATA
    # ========================================================

    transaction_id: Mapped[
        Optional[str]
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="payment",
    )

    user: Mapped["User"] = relationship(
        "User",
    )