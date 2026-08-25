import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.models import User
from app.repositories.user_repository import (
    UserRepository,
)
from app.schemas.token import Token
from app.schemas.user import UserCreate
from app.services.email_service import (
    send_password_reset_email,
)


logger = logging.getLogger(
    "smartcanteen.auth"
)


class AuthService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db
        self.repo = UserRepository()

    # ========================================================
    # REGISTER
    # ========================================================

    def register(
        self,
        data: UserCreate,
    ) -> User:

        existing_user = (
            self.repo.get_by_email(
                self.db,
                data.email,
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        return self.repo.create(
            self.db,
            data,
            hash_password(
                data.password
            ),
        )

    # ========================================================
    # LOGIN
    # ========================================================

    def login(
        self,
        email: str,
        password: str,
    ) -> Token:

        user = (
            self.repo.get_by_email(
                self.db,
                email,
            )
        )

        if (
            not user
            or not verify_password(
                password,
                user.hashed_password,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )

        return Token(
            access_token=access_token,
            role=user.role,
        )

    # ========================================================
    # CHANGE PASSWORD
    # ========================================================

    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> dict:

        if not verify_password(
            current_password,
            user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "New password must be "
                    "at least 8 characters."
                ),
            )

        if current_password == new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "New password must be "
                    "different from the current password."
                ),
            )

        user.hashed_password = hash_password(
            new_password
        )

        self.db.commit()
        self.db.refresh(user)

        return {
            "message": (
                "Password changed successfully."
            )
        }

    # ========================================================
    # FORGOT PASSWORD
    # ========================================================

    async def forgot_password(
        self,
        email: str,
    ) -> dict:

        generic_response = {
            "message": (
                "If an account exists for that email, "
                "a password reset link has been sent."
            )
        }

        normalized_email = (
            email.strip().lower()
        )

        logger.info(
            "Password reset requested for %s",
            normalized_email,
        )

        user = (
            self.repo.get_by_email(
                self.db,
                normalized_email,
            )
        )

        # Do not reveal whether the account exists.
        if not user:
            logger.info(
                "Password reset requested for "
                "non-existent email."
            )

            return generic_response

        if not user.is_active:
            logger.info(
                "Password reset requested for "
                "inactive user id=%s",
                user.id,
            )

            return generic_response

        # ----------------------------------------------------
        # CREATE RESET TOKEN
        # ----------------------------------------------------

        try:
            token = create_password_reset_token(
                user.id
            )
        except Exception:
            logger.exception(
                "Unable to create password reset "
                "token for user id=%s",
                user.id,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Unable to create password "
                    "reset request."
                ),
            )

        # ----------------------------------------------------
        # CREATE FRONTEND RESET URL
        # ----------------------------------------------------

        frontend_url = (
            settings.FRONTEND_URL
            or "http://localhost:5173"
        ).rstrip("/")

        reset_url = (
            f"{frontend_url}"
            f"/reset-password"
            f"?token={token}"
        )

        logger.info(
            "Password reset URL created for user id=%s",
            user.id,
        )

        # ----------------------------------------------------
        # SEND EMAIL
        # ----------------------------------------------------

        try:
            await send_password_reset_email(
                recipient=user.email,
                reset_url=reset_url,
            )

            logger.info(
                "Password reset email sent successfully "
                "for user id=%s",
                user.id,
            )

        except Exception:
            logger.exception(
                "Password reset email FAILED "
                "for user id=%s",
                user.id,
            )

            # Important:
            # During development we want the real SMTP
            # error to reach the client/backend logs.
            #
            # Once SMTP is confirmed working, you can
            # change this back to generic_response only.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Password reset email could "
                    "not be sent. Please check the "
                    "email server configuration."
                ),
            )

        return generic_response

    # ========================================================
    # RESET PASSWORD
    # ========================================================

    def reset_password(
        self,
        token: str,
        new_password: str,
    ) -> dict:

        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Password must be at least "
                    "8 characters."
                ),
            )

        # ----------------------------------------------------
        # DECODE RESET TOKEN
        # ----------------------------------------------------

        try:
            user_id = (
                decode_password_reset_token(
                    token
                )
            )

        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid or expired password "
                    "reset link."
                ),
            )

        except Exception:
            logger.exception(
                "Unexpected error while decoding "
                "password reset token."
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid or expired password "
                    "reset link."
                ),
            )

        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        user = (
            self.db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid password reset link."
                ),
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "User account is disabled."
                ),
            )

        # ----------------------------------------------------
        # PREVENT SAME PASSWORD
        # ----------------------------------------------------

        if verify_password(
            new_password,
            user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "New password must be "
                    "different from the current password."
                ),
            )

        # ----------------------------------------------------
        # UPDATE PASSWORD
        # ----------------------------------------------------

        user.hashed_password = hash_password(
            new_password
        )

        self.db.commit()
        self.db.refresh(user)

        logger.info(
            "Password reset successfully for user id=%s",
            user.id,
        )

        return {
            "message": (
                "Password reset successfully."
            )
        }