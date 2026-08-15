from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import (
    get_current_user,
    get_current_admin,
)
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate


router = APIRouter(
    prefix="/users",
    tags=["users"],
)


# =========================================================
# CURRENT USER - GET PROFILE
# =========================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# =========================================================
# CURRENT USER - UPDATE PROFILE
# =========================================================

@router.patch(
    "/me",
    response_model=UserOut,
)
def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = user_update.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Customers should only be able to update their
    # personal information, not their role.
    # -----------------------------------------------------

    update_data.pop("role", None)

    # Do not allow a customer to change their email
    # through the profile page.
    update_data.pop("email", None)

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return current_user


# =========================================================
# ADMIN - LIST ALL USERS
# =========================================================

@router.get(
    "/",
    response_model=List[UserOut],
)
def list_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )


# =========================================================
# ADMIN - GET ONE USER
# =========================================================

@router.get(
    "/{user_id}",
    response_model=UserOut,
)
def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


# =========================================================
# ADMIN - UPDATE ONE USER
# =========================================================

@router.patch(
    "/{user_id}",
    response_model=UserOut,
)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = user_update.model_dump(
        exclude_unset=True
    )

    if "email" in update_data:
        existing_user = (
            db.query(User)
            .filter(
                User.email == update_data["email"],
                User.id != user_id,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user