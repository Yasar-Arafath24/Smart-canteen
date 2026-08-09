from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate


router = APIRouter(
    prefix="/users",
    tags=["users"],
)


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