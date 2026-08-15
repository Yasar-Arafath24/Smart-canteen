from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.utils.time import utcnow


if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.notification import Notification


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="customer",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utcnow,
    )

    # Orders belonging to this user
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Notifications belonging to this user
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )