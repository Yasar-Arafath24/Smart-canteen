from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.time import utcnow
from app.db.database import Base


if TYPE_CHECKING:
    from app.models.user import User
    from app.models.payment import Payment
    from app.models.menu import MenuItem


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending"
    )

    total: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utcnow
    )

    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        onupdate=utcnow
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="orders"
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    payment: Mapped[Optional["Payment"]] = relationship(
    "Payment",
    back_populates="order",
    uselist=False,
    cascade="all, delete-orphan",
)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items"
    )

    menu_item: Mapped["MenuItem"] = relationship(
        "MenuItem",
        back_populates="order_items"
    )

    @property
    def menu_item_name(self) -> Optional[str]:
        return self.menu_item.name if self.menu_item else None