from fastapi import WebSocket


class AdminAnalyticsManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(
        self,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

    def disconnect(
        self,
        websocket: WebSocket,
    ):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(
        self,
        message: dict,
    ):
        connections = list(
            self.active_connections
        )

        if not connections:
            return

        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


admin_analytics_manager = AdminAnalyticsManager()