from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from app.models.inference import engine

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            state = engine.get_full_state()
            await websocket.send_json(state)
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
