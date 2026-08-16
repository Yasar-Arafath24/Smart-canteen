from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.deps import get_current_admin
from app.db.database import SessionLocal
from app.models.user import User
from app.services.admin_ws import admin_analytics_manager


router = APIRouter(
    tags=["Admin Realtime"],
)


@router.websocket("/ws/admin")
async def admin_websocket(
    websocket: WebSocket,
):
    db = SessionLocal()

    try:
        # -----------------------------------------------------
        # Authenticate admin from the existing Authorization
        # token sent by the frontend.
        # -----------------------------------------------------

        authorization = websocket.headers.get(
            "authorization"
        )

        if not authorization:
            await websocket.close(code=1008)
            return

        if not authorization.lower().startswith(
            "bearer "
        ):
            await websocket.close(code=1008)
            return

        token = authorization.split(
            " ",
            1,
        )[1]

        # get_current_admin normally expects a FastAPI
        # dependency rather than a raw token, so the easiest
        # safe approach is to validate the token directly here.
        from jose import JWTError, jwt
        from app.core.config import settings

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )

            user_id = payload.get("sub")

            if not user_id:
                await websocket.close(code=1008)
                return

        except JWTError:
            await websocket.close(code=1008)
            return

        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )

        if not user or not user.is_active:
            await websocket.close(code=1008)
            return

        if user.role != "admin":
            await websocket.close(code=1008)
            return

        # -----------------------------------------------------
        # Connect admin
        # -----------------------------------------------------

        await admin_analytics_manager.connect(
            websocket
        )

        await websocket.send_json(
            {
                "type": "CONNECTED",
                "message": "Admin realtime connection established",
            }
        )

        while True:
            # Keep connection alive and detect disconnects.
            await websocket.receive_text()

    except WebSocketDisconnect:
        admin_analytics_manager.disconnect(
            websocket
        )

    except Exception:
        admin_analytics_manager.disconnect(
            websocket
        )

    finally:
        db.close()