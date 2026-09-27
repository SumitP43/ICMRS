import json
import asyncio
from typing import Set, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.redis.pubsub import subscribe_event, unsubscribe_event
from backend.app.core.logging import logger

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)

    async def broadcast(self, message: dict):
        dead_conns = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead_conns.append(connection)
        for dc in dead_conns:
            self.active_connections.discard(dc)

    async def send_personal(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            dead_conns = []
            for connection in list(self.user_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_conns.append(connection)
            for dc in dead_conns:
                self.user_connections[user_id].discard(dc)

ws_manager = ConnectionManager()

# Hook into pubsub for real-time broadcasts
def _on_new_complaint(msg_str):
    try:
        data = json.loads(msg_str) if isinstance(msg_str, str) else msg_str
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(ws_manager.broadcast({"type": "NEW_COMPLAINT", "payload": data}))
        except RuntimeError:
            pass
    except Exception:
        pass

subscribe_event("complaints:new", _on_new_complaint)

@router.websocket("/ws/complaints")
async def websocket_complaints_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming ping / messages
            await websocket.send_json({"status": "received", "echo": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id=user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"status": "received"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id=user_id)
