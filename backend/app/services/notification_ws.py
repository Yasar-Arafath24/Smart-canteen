from collections import defaultdict

from fastapi import WebSocket


class NotificationManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()
        self.active_connections[user_id].append(websocket)

    def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_to_user(
        self,
        user_id: int,
        message: dict,
    ):
        connections = self.active_connections.get(user_id, [])

        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(
                user_id=user_id,
                websocket=websocket,
            )


notification_manager = NotificationManager()