"""
==========================================================================
AEGIS-MESH / AAPDASETU - PRODUCTION FASTAPI ASGI APPLICATION & WEBSOCKET HUB
==========================================================================
Dual-mode production gateway:
1. High-concurrency ASGI server via Uvicorn with WebSocket real-time dispatch.
2. Direct CLI launcher with automatic database table creation & seeding.
"""

import os
import sys
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.db.database import Base, engine, SessionLocal
from app.db import models
from app.services.mesh_engine import mesh_engine_service
from app.api.endpoints import router, handle_api_request
from app.core.websocket_manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifespan startup: initialize database tables and seed records
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        mesh_engine_service.seed_initial_data_if_empty(db)
    finally:
        db.close()
    yield
    # Lifespan shutdown

app = FastAPI(
    title="AapdaSetu Emergency Dispatch & Evacuation API",
    description="Offline-resilient disaster response, AES-256-GCM mesh telemetry, and Dijkstra routing gateway",
    version="4.0.0",
    lifespan=lifespan
)

# Robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount REST API Router
app.include_router(router)

# Real-Time WebSocket Dispatch Channel
@app.websocket("/ws/dispatch")
async def websocket_dispatch_endpoint(websocket: WebSocket):
    """
    Bi-directional real-time telemetry channel for emergency dispatchers,
    field rescue units, and smartphone clients.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial confirmation
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to AapdaSetu Real-Time Dispatch Hub",
            "active_nodes": len(ws_manager.active_connections)
        })
        while True:
            # Keep connection open and listen for client messages / pings
            text = await websocket.receive_text()
            # Respond to heartbeat pings
            if text == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "service": "AapdaSetu Production Gateway",
        "docs_url": "/docs",
        "api_prefix": "/api/v1",
        "websocket_url": "/ws/dispatch"
    }

def run_server(host="0.0.0.0", port=8000):
    print(f"🚀 [AAPDASETU] Starting Production FastAPI Server on http://{host}:{port}")
    print(f"👉 Interactive OpenAPI Docs: http://localhost:{port}/docs")
    print(f"👉 Real-time WebSocket: ws://localhost:{port}/ws/dispatch")
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port=port)
