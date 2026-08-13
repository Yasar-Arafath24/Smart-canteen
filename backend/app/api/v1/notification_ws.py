from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.notification_ws import notification_manager


router = APIRouter()


@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket):
    user_id = websocket.query_params.get("user_id")

    if not user_id:
        await websocket.close(code=1008)
        return

    try:
        user_id = int(user_id)
    except ValueError:
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