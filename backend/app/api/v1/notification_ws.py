from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from app.core.config import settings
from app.services.notification_ws import notification_manager


router = APIRouter()


@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

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

        user_id = int(user_id)

    except (JWTError, ValueError, TypeError):
        await websocket.close(code=1008)
        return

    await notification_manager.connect(
        user_id=user_id,
        websocket=websocket,
    )

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        notification_manager.disconnect(
            user_id=user_id,
            websocket=websocket,
        )

    except Exception:
        notification_manager.disconnect(
            user_id=user_id,
            websocket=websocket,
        )