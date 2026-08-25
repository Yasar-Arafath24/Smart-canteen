from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import User

from app.schemas.token import Token

from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserOut,
)

from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
) -> User:
    return AuthService(db).register(data)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    return AuthService(db).login(
        email=form_data.username,
        password=form_data.password,
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def me(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    return current_user


# ============================================================
# CHANGE PASSWORD
# CUSTOMER / STAFF / ADMIN
# ============================================================

@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return AuthService(db).change_password(
        user=current_user,
        current_password=data.current_password,
        new_password=data.new_password,
    )


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    return await AuthService(db).forgot_password(
        email=str(data.email),
    )


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    return AuthService(db).reset_password(
        token=data.token,
        new_password=data.new_password,
    )