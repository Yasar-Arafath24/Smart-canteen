from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.utils.time import utcnow


if TYPE_CHECKING:
    from app.models.menu import MenuItem


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey(
            "menu_items.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    unit: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="units",
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

    menu_item: Mapped["MenuItem"] = relationship(
        "MenuItem",
        back_populates="inventory",
    )

    @property
    def menu_item_name(self) -> str:
        if self.menu_item:
            return self.menu_item.name

        return f"Menu Item #{self.menu_item_id}"