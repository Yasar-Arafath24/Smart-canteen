from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.utils.time import utcnow


class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    clock_in: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utcnow,
    )

    clock_out: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    staff = relationship(
        "User",
        backref="attendance_records",
    )