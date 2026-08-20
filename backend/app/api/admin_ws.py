from fastapi import WebSocket


class AdminAnalyticsManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(
        self,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if websocket not in self.connections:
            self.connections.append(websocket)

    def disconnect(
        self,
        websocket: WebSocket,
    ):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(
        self,
        message: dict,
    ):
        connections = list(
            self.connections
        )

        if not connections:
            return

        disconnected: list[WebSocket] = []

        for websocket in connections:
            try:
                await websocket.send_json(
                    message
                )

            except Exception:
                disconnected.append(
                    websocket
                )

        for websocket in disconnected:
            self.disconnect(
                websocket
            )


admin_analytics_manager = AdminAnalyticsManager()