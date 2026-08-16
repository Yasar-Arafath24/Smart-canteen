from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.security import hash_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import StaffCreate, UserOut


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


# ============================================================
# CREATE STAFF
# ADMIN ONLY
# ============================================================

@router.post(
    "/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def create_staff(
    staff: StaffCreate,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    # Check duplicate email
    existing_user = (
        db.query(User)
        .filter(
            User.email == staff.email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A user with this email "
                "already exists"
            ),
        )

    # Create staff account
    new_staff = User(
        name=staff.name.strip(),
        email=staff.email,
        hashed_password=hash_password(
            staff.password
        ),
        role="staff",
        is_active=True,
    )

    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    return new_staff