from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_admin,
    get_current_staff_or_admin,
)
from app.crud.staff_attendance import (
    clock_in,
    clock_out,
    get_all,
    get_current,
    get_history,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.staff_attendance import (
    AttendanceResponse,
    AttendanceStatusResponse,
)


router = APIRouter(
    prefix="/staff/attendance",
    tags=["Staff Attendance"],
)


def calculate_worked_seconds(
    attendance,
) -> int:
    if not attendance:
        return 0

    end = (
        attendance.clock_out
        or datetime.now(timezone.utc)
    )

    start = attendance.clock_in

    if start.tzinfo is None:
        start = start.replace(
            tzinfo=timezone.utc
        )

    if end.tzinfo is None:
        end = end.replace(
            tzinfo=timezone.utc
        )

    return max(
        int(
            (
                end - start
            ).total_seconds()
        ),
        0,
    )


# ============================================================
# STAFF - CLOCK IN
# ============================================================

@router.post(
    "/clock-in",
    response_model=AttendanceResponse,
)
def staff_clock_in(
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    return clock_in(
        db=db,
        staff_id=current_user.id,
    )


# ============================================================
# STAFF - CLOCK OUT
# ============================================================

@router.post(
    "/clock-out",
    response_model=AttendanceResponse,
)
def staff_clock_out(
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    return clock_out(
        db=db,
        staff_id=current_user.id,
    )


# ============================================================
# STAFF - CURRENT STATUS
# ============================================================

@router.get(
    "/me",
    response_model=AttendanceStatusResponse,
)
def staff_current_status(
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    attendance = get_current(
        db=db,
        staff_id=current_user.id,
    )

    return AttendanceStatusResponse(
        is_clocked_in=attendance is not None,
        attendance=attendance,
        worked_seconds=calculate_worked_seconds(
            attendance
        ),
    )


# ============================================================
# STAFF - HISTORY
# ============================================================

@router.get(
    "/history",
    response_model=list[AttendanceResponse],
)
def staff_history(
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    return get_history(
        db=db,
        staff_id=current_user.id,
    )


# ============================================================
# ADMIN - ALL ATTENDANCE
# ============================================================

@router.get(
    "/",
)
def all_staff_attendance(
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    records = get_all(db=db)

    result = []

    for record in records:
        staff = (
            db.query(User)
            .filter(
                User.id == record.staff_id
            )
            .first()
        )

        result.append(
            {
                "id": record.id,
                "staff_id": record.staff_id,
                "staff_name": (
                    staff.name
                    if staff
                    else f"User #{record.staff_id}"
                ),
                "staff_email": (
                    staff.email
                    if staff
                    else None
                ),
                "clock_in": record.clock_in,
                "clock_out": record.clock_out,
                "worked_seconds": calculate_worked_seconds(
                    record
                ),
                "is_current": (
                    record.clock_out is None
                ),
            }
        )

    return result