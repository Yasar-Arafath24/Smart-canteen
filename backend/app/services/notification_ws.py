from fastapi import WebSocket


class NotificationConnectionManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

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
            del self.active_connections[user_id]

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
            self.disconnect(user_id, websocket)


notification_manager = NotificationConnectionManager()