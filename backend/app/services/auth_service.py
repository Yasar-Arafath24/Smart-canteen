from fastapi import (
    HTTPException,
    status,
)

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

from app.schemas.user import (
    UserCreate,
)

from app.services.email_service import (
    send_password_reset_email,
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

        if self.repo.get_by_email(
            self.db,
            data.email,
        ):
            raise HTTPException(
                status_code=
                status.HTTP_409_CONFLICT,
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

        user = self.repo.get_by_email(
            self.db,
            email,
        )

        if (
            not user
            or not verify_password(
                password,
                user.hashed_password,
            )
        ):
            raise HTTPException(
                status_code=
                status.HTTP_401_UNAUTHORIZED,
                detail=
                "Invalid email or password",
                headers={
                    "WWW-Authenticate":
                    "Bearer"
                },
            )

        if not user.is_active:
            raise HTTPException(
                status_code=
                status.HTTP_403_FORBIDDEN,
                detail=
                "User account is disabled",
            )

        token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )

        return Token(
            access_token=token,
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
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "Current password is incorrect.",
            )

        if len(new_password) < 8:
            raise HTTPException(
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "New password must be at least 8 characters.",
            )

        if (
            current_password
            == new_password
        ):
            raise HTTPException(
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "New password must be different from the current password.",
            )

        user.hashed_password = (
            hash_password(
                new_password
            )
        )

        self.db.commit()

        return {
            "message":
            "Password changed successfully."
        }


    # ========================================================
    # FORGOT PASSWORD
    # ========================================================

    async def forgot_password(
        self,
        email: str,
    ) -> dict:

        user = (
            self.repo.get_by_email(
                self.db,
                email,
            )
        )

        # Don't reveal whether the
        # email exists.
        generic_response = {
            "message":
            "If an account exists for that email, a password reset link has been sent."
        }

        if not user:
            return generic_response

        if not user.is_active:
            return generic_response

        token = (
            create_password_reset_token(
                user.id
            )
        )

        reset_url = (
            f"{settings.FRONTEND_URL}"
            f"/reset-password"
            f"?token={token}"
        )

        try:
            await send_password_reset_email(
                recipient=user.email,
                reset_url=reset_url,
            )
        except Exception as exc:

            print(
                "Password reset email failed:",
                exc,
            )

            # Keep the public response
            # generic.
            return generic_response

        return generic_response


    # ========================================================
    # RESET PASSWORD
    # ========================================================

    def reset_password(
        self,
        token: str,
        new_password: str,
    ) -> dict:

        try:
            user_id = (
                decode_password_reset_token(
                    token
                )
            )
        except ValueError:

            raise HTTPException(
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "Invalid or expired password reset link.",
            )

        user = (
            self.db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "Invalid password reset link.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=
                status.HTTP_403_FORBIDDEN,
                detail=
                "User account is disabled.",
            )

        if len(new_password) < 8:
            raise HTTPException(
                status_code=
                status.HTTP_400_BAD_REQUEST,
                detail=
                "Password must be at least 8 characters.",
            )

        user.hashed_password = (
            hash_password(
                new_password
            )
        )

        self.db.commit()

        return {
            "message":
            "Password reset successfully."
        }