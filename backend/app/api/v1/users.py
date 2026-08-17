from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_admin,
    get_current_user,
)
from app.crud.activity import create_activity
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserOut,
    UserUpdate,
)


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
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    update_data = user_update.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Users cannot change their own role.
    # -----------------------------------------------------

    update_data.pop(
        "role",
        None,
    )

    # -----------------------------------------------------
    # Users cannot change their email here.
    # -----------------------------------------------------

    update_data.pop(
        "email",
        None,
    )

    previous_name = current_user.name
    previous_active = current_user.is_active

    # -----------------------------------------------------
    # Apply allowed changes
    # -----------------------------------------------------

    for key, value in update_data.items():
        setattr(
            current_user,
            key,
            value,
        )

    db.flush()

    # -----------------------------------------------------
    # Activity log for profile changes
    # -----------------------------------------------------

    if previous_name != current_user.name:
        create_activity(
            db=db,
            actor=current_user,
            action="user_profile_updated",
            entity_type="user",
            entity_id=current_user.id,
            description=(
                f"{previous_name} "
                f"updated their profile name "
                f"to {current_user.name}."
            ),
        )

    # -----------------------------------------------------
    # Do not allow a normal user to change their own
    # active status through this endpoint.
    #
    # This protects the role/security model even if an
    # unexpected is_active value is sent by the frontend.
    # -----------------------------------------------------

    if (
        "is_active" in update_data
        and update_data["is_active"]
        != previous_active
    ):
        current_user.is_active = (
            previous_active
        )

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
    current_admin: User = Depends(
        get_current_admin
    ),
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
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
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
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # -----------------------------------------------------
    # Prevent admin from deactivating their own account.
    # -----------------------------------------------------

    if (
        user.id == current_admin.id
        and user_update.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You cannot deactivate "
                "your own account."
            ),
        )

    update_data = user_update.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Email validation
    # -----------------------------------------------------

    if "email" in update_data:
        existing_user = (
            db.query(User)
            .filter(
                User.email
                == update_data["email"],
                User.id != user_id,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # -----------------------------------------------------
    # Capture old values before update
    # -----------------------------------------------------

    previous_name = user.name
    previous_active = user.is_active
    previous_email = user.email

    # -----------------------------------------------------
    # Apply changes
    # -----------------------------------------------------

    for key, value in update_data.items():
        setattr(
            user,
            key,
            value,
        )

    db.flush()

    # =====================================================
    # ACTIVITY LOGGING
    # =====================================================

    # -----------------------------------------------------
    # User activated
    # -----------------------------------------------------

    if (
        not previous_active
        and user.is_active
    ):
        create_activity(
            db=db,
            actor=current_admin,
            action="user_activated",
            entity_type="user",
            entity_id=user.id,
            description=(
                f"{user.name} "
                f"was activated by "
                f"{current_admin.name}."
            ),
        )

    # -----------------------------------------------------
    # User deactivated
    # -----------------------------------------------------

    elif (
        previous_active
        and not user.is_active
    ):
        create_activity(
            db=db,
            actor=current_admin,
            action="user_deactivated",
            entity_type="user",
            entity_id=user.id,
            description=(
                f"{user.name} "
                f"was deactivated by "
                f"{current_admin.name}."
            ),
        )

    # -----------------------------------------------------
    # Name changed
    # -----------------------------------------------------

    elif previous_name != user.name:
        create_activity(
            db=db,
            actor=current_admin,
            action="user_updated",
            entity_type="user",
            entity_id=user.id,
            description=(
                f"Admin "
                f"{current_admin.name} "
                f"changed the user name "
                f"from "
                f"{previous_name} "
                f"to "
                f"{user.name}."
            ),
        )

    # -----------------------------------------------------
    # Email changed
    # -----------------------------------------------------

    elif previous_email != user.email:
        create_activity(
            db=db,
            actor=current_admin,
            action="user_updated",
            entity_type="user",
            entity_id=user.id,
            description=(
                f"Admin "
                f"{current_admin.name} "
                f"changed the email for "
                f"{user.name}."
            ),
        )

    # -----------------------------------------------------
    # Other update
    # -----------------------------------------------------

    elif update_data:
        create_activity(
            db=db,
            actor=current_admin,
            action="user_updated",
            entity_type="user",
            entity_id=user.id,
            description=(
                f"Admin "
                f"{current_admin.name} "
                f"updated user "
                f"{user.name}."
            ),
        )

    db.commit()
    db.refresh(user)

    return user