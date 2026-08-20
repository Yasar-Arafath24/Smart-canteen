from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.user import User
from app.services.admin_ws import (
    admin_analytics_manager,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard WebSocket"],
)


def get_admin_from_token(
    token: str,
) -> User | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        try:
            user_id = int(user_id)
        except (
            TypeError,
            ValueError,
        ):
            return None

        db: Session = SessionLocal()

        try:
            user = (
                db.query(User)
                .filter(
                    User.id == user_id
                )
                .first()
            )

            if not user:
                return None

            if not user.is_active:
                return None

            if user.role != "admin":
                return None

            return user

        finally:
            db.close()

    except JWTError:
        return None


@router.websocket("/ws")
async def dashboard_websocket(
    websocket: WebSocket,
):
    token = websocket.query_params.get(
        "token"
    )

    if not token:
        await websocket.close(
            code=1008
        )
        return

    admin = get_admin_from_token(
        token
    )

    if not admin:
        await websocket.close(
            code=1008
        )
        return

    await admin_analytics_manager.connect(
        websocket
    )

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        admin_analytics_manager.disconnect(
            websocket
        )

    except Exception:
        admin_analytics_manager.disconnect(
            websocket
        )