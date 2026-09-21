"""
==========================================================================
AEGIS-MESH / AAPDASETU - WEBSOCKET REAL-TIME DISPATCH BROADCASTER
==========================================================================
Manages active WebSocket connections across Command Center dashboards,
smartphones, and field rescue teams.
"""

from typing import List, Dict, Any
import json
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON-serializable message to all active WebSocket clients."""
        payload_str = json.dumps(message)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

ws_manager = ConnectionManager()
