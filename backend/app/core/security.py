from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any, Optional

import bcrypt
from jose import (
    JWTError,
    jwt,
)

from app.core.config import settings


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(
    password: str,
) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        return False


# ============================================================
# ACCESS TOKEN
# ============================================================

def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[
        timedelta
    ] = None,
) -> str:

    now = datetime.now(
        timezone.utc
    )

    expire = now + (
        expires_delta
        or timedelta(
            minutes=
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": now,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

def create_password_reset_token(
    user_id: int,
) -> str:

    now = datetime.now(
        timezone.utc
    )

    # 15-minute reset token
    expire = now + timedelta(
        minutes=15
    )

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "type": "password_reset",
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_password_reset_token(
    token: str,
) -> int:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

        if (
            payload.get("type")
            != "password_reset"
        ):
            raise ValueError(
                "Invalid token type"
            )

        subject = payload.get("sub")

        if not subject:
            raise ValueError(
                "Missing token subject"
            )

        return int(subject)

    except (
        JWTError,
        ValueError,
        TypeError,
    ) as exc:

        raise ValueError(
            "Invalid or expired password reset token"
        ) from exc


# ============================================================
# ACCESS TOKEN DECODE
# ============================================================

def decode_access_token(
    token: str,
) -> dict[str, Any]:

    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[
            settings.ALGORITHM
        ],
    )


def is_token_expired_error(
    exc: JWTError,
) -> bool:
    return (
        "expired"
        in str(exc).lower()
    )