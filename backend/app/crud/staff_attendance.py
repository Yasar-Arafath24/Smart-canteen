from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.staff_attendance import StaffAttendance
from app.utils.time import utcnow


def get_current(
    db: Session,
    staff_id: int,
):
    return (
        db.query(StaffAttendance)
        .filter(
            StaffAttendance.staff_id == staff_id,
            StaffAttendance.clock_out.is_(None),
        )
        .order_by(StaffAttendance.clock_in.desc())
        .first()
    )


def clock_in(
    db: Session,
    staff_id: int,
):
    existing = get_current(
        db=db,
        staff_id=staff_id,
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Already clocked in",
        )

    attendance = StaffAttendance(
        staff_id=staff_id,
        clock_in=utcnow(),
        clock_out=None,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


def clock_out(
    db: Session,
    staff_id: int,
):
    attendance = get_current(
        db=db,
        staff_id=staff_id,
    )

    if not attendance:
        raise HTTPException(
            status_code=400,
            detail="Not clocked in",
        )

    attendance.clock_out = utcnow()

    db.commit()
    db.refresh(attendance)

    return attendance


def get_history(
    db: Session,
    staff_id: int,
):
    return (
        db.query(StaffAttendance)
        .filter(StaffAttendance.staff_id == staff_id)
        .order_by(StaffAttendance.clock_in.desc())
        .all()
    )


def get_all(
    db: Session,
):
    return (
        db.query(StaffAttendance)
        .order_by(StaffAttendance.clock_in.desc())
        .all()
    )