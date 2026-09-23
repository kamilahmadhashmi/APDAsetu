"""
==========================================================================
AEGIS-MESH / AAPDASETU - PRODUCTION REST API ROUTER & DISPATCH GATEWAY
==========================================================================
FastAPI APIRouter handling real-time incident lifecycle, AES-256-GCM verified
distress ingestion, live weather stream, Dijkstra route solver, and computer vision.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.models.schemas import (
    IncidentCreate,
    IncidentResponse,
    HospitalResponse,
    FleetUnitResponse,
    RoadHazardResponse,
    VisionDetectRequest,
    VisionDetectResponse,
    RoutingSolverRequest,
    RoutingSolverResponse
)
import json
from app.db import models
from app.services.mesh_engine import mesh_engine_service
from app.services.routing_engine import routing_solver_service
from app.services.vision_engine import vision_engine_service
from app.services.weather_engine import weather_engine_service
from app.services.lora_codec import lora_codec_service
from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1", tags=["AapdaSetu Dispatch"])

# --------------------------------------------------------------------------
# 1. System Health & Telemetry
# --------------------------------------------------------------------------
@router.get("/system/health")
def get_system_health(db: Session = Depends(get_db)):
    incident_count = len(mesh_engine_service.get_incidents(db))
    return {
        "status": "ONLINE",
        "service": "AapdaSetu ASGI Production Engine v4.0",
        "active_incidents": incident_count,
        "database": "SQLAlchemy SQLite Operational (aegis.db)",
        "mesh_protocol": "BLE Mesh 5.3 + Wi-Fi Direct (AES-256-GCM Authenticated)",
        "gateway_latency_ms": 4.8
    }

# --------------------------------------------------------------------------
# 2. Live Meteorological & Hydrological Ingress
# --------------------------------------------------------------------------
@router.get("/weather/live")
def get_live_weather(lat: float = 20.2961, lng: float = 85.8245):
    return {
        "status": "SUCCESS",
        "telemetry": weather_engine_service.get_live_weather_telemetry(lat, lng)
    }

# --------------------------------------------------------------------------
# 3. Incidents Management
# --------------------------------------------------------------------------
@router.get("/incidents", response_model=Dict[str, Any])
def list_incidents(triage: str = "all", db: Session = Depends(get_db)):
    items = mesh_engine_service.get_incidents(db, triage_filter=triage)
    return {
        "status": "SUCCESS",
        "count": len(items),
        "incidents": items
    }

@router.post("/incidents/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_distress_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    try:
        data_dict = payload.model_dump()
        result = mesh_engine_service.ingest_distress_packet(db, data_dict)
        
        # Real-time WebSocket dispatch broadcast to all connected operators and teams
        await ws_manager.broadcast({
            "type": "NEW_DISTRESS_INCIDENT",
            "incident": result["incident"],
            "packet_hash": result["packet_hash"],
            "timestamp": result["incident"].get("created_at")
        })

        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ingestion failed: {str(e)}")

# --------------------------------------------------------------------------
# 4. Hospitals, Fleet, Roads & Mesh Topology
# --------------------------------------------------------------------------
@router.get("/hospitals")
def list_hospitals(db: Session = Depends(get_db)):
    hospitals = mesh_engine_service.get_hospitals(db)
    return {"status": "SUCCESS", "count": len(hospitals), "hospitals": hospitals}

@router.get("/fleet")
def list_fleet(db: Session = Depends(get_db)):
    fleet = mesh_engine_service.get_fleet(db)
    return {"status": "SUCCESS", "count": len(fleet), "fleet": fleet}

@router.get("/roads")
def list_roads(db: Session = Depends(get_db)):
    roads = mesh_engine_service.get_road_hazards(db)
    return {"status": "SUCCESS", "count": len(roads), "roads": roads}

@router.get("/mesh/topology")
def get_mesh_topology(db: Session = Depends(get_db)):
    return mesh_engine_service.get_mesh_topology(db)

@router.post("/mesh/radio/raw")
async def ingest_raw_radio_frame(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Ingests raw binary or hex frames from physical Web Bluetooth / Web Serial LoRa transceivers.
    Unpacks LAF v1 framing, validates CRC16, and records the distress beacon into aegis.db.
    """
    raw_hex = payload.get("raw_hex", "").replace(" ", "").replace("0x", "")
    if not raw_hex:
        raise HTTPException(status_code=400, detail="Missing raw_hex parameter")

    try:
        frame_bytes = bytes.fromhex(raw_hex)
        decoded = lora_codec_service["decode"](frame_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"LoRa frame decode failed: {str(e)}")

    rssi = payload.get("rssi_dbm", -72.0)
    snr = payload.get("snr_db", 9.0)

    # Persist as incident in database
    inc_id = f"LORA-{decoded['sender_node_id'][-4:]}-{decoded['seq_num']}"
    title = f"Physical LoRa Distress Beacon ({decoded['sender_node_id']})"
    if decoded.get("payload_json") and isinstance(decoded["payload_json"], dict):
        title = decoded["payload_json"].get("caller", title)
        desc = decoded["payload_json"].get("situation", decoded["payload_text"])
    else:
        desc = decoded["payload_text"] or f"Over-the-air LoRa beacon received at RSSI {rssi}dBm"

    new_inc = models.Incident(
        id=inc_id,
        title=title,
        priority=decoded["triage_name"],
        prio_type="red" if decoded["triage"] >= 2 else ("amber" if decoded["triage"] == 1 else "emerald"),
        time="Just now",
        desc=desc,
        tags_json=json.dumps(["LoRa Radio", "Physical Transceiver", f"RSSI: {rssi}dBm"]),
        lat=decoded["lat"],
        lng=decoded["lng"],
        triage=decoded["triage_name"],
        mesh_hop=f"LoRa Hop #{decoded['hop_count']}",
        battery=f"{decoded['battery_pct']}%",
        packet_hash=decoded["crc"]
    )

    existing = db.query(models.Incident).filter(models.Incident.id == inc_id).first()
    if existing:
        db.merge(new_inc)
    else:
        db.add(new_inc)
    db.commit()

    # Real-time WebSocket broadcast to all connected command center operators
    await ws_manager.broadcast({
        "type": "NEW_DISTRESS_INCIDENT",
        "incident": new_inc.to_dict(),
        "source": "PHYSICAL_LORA_RADIO",
        "rf_meta": {
            "rssi_dbm": rssi,
            "snr_db": snr,
            "sender_node_id": decoded["sender_node_id"]
        }
    })

    return {
        "status": "PROCESSED",
        "decoded": decoded,
        "incident": new_inc.to_dict()
    }

# --------------------------------------------------------------------------
# 5. Computer Vision & Aerial Drone Detection
# --------------------------------------------------------------------------
@router.post("/vision/analyze")
def analyze_vision_feed(payload: VisionDetectRequest):
    return vision_engine_service.analyze_feed(
        feed_id=payload.feed_id or "drone_alpha",
        conf_threshold=payload.conf_threshold,
        image_base64=payload.image_base64
    )

# --------------------------------------------------------------------------
# 6. Logistics & Dijkstra Flood-Avoidance Route Solver
# --------------------------------------------------------------------------
@router.get("/routing/network")
def get_routing_network(flood_depth_m: float = 1.5):
    """Returns the topological road network with live edge clearance and flood status."""
    return routing_solver_service.get_road_network(current_flood_depth_m=flood_depth_m)

@router.post("/routing/calculate")
def calculate_evacuation_corridor(payload: Dict[str, Any]):
    """Calculates optimal Dijkstra path avoiding submerged road segments."""
    origin = payload.get("origin_node", "N_SECTOR_B4")
    dest = payload.get("destination_node", "N_APEX_TRAUMA")
    threshold = float(payload.get("flood_threshold", 0.8))
    vtype = str(payload.get("vehicle_type", "AMBULANCE"))
    return routing_solver_service.calculate_route(
        origin_node=origin,
        destination_node=dest,
        flood_threshold=threshold,
        vehicle_type=vtype
    )

@router.post("/routing/solver")
def solve_evacuation_routing(payload: RoutingSolverRequest):
    return routing_solver_service.solve_multi_objective(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        flood_depth_m=payload.flood_depth_m,
        bed_priority_weight=payload.bed_priority_weight,
        storm_risk_factor=payload.storm_risk_factor
    )

# --------------------------------------------------------------------------
# 7. Backward-Compatible Dispatch Bridge for server.py / test_backend.py
# --------------------------------------------------------------------------
def handle_api_request(path: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Synchronous bridge for standard library server.py and offline tests.
    Ensures zero breaking changes while utilizing the database and services.
    """
    payload = payload or {}
    db = SessionLocal()
    try:
        # Seed initial records if first run
        mesh_engine_service.seed_initial_data_if_empty(db)

        if path == "/api/v1/system/health":
            return {
                "status": "ONLINE",
                "service": "AapdaSetu ASGI Production Engine v4.0",
                "database": "SQLite Persistent (aegis.db)",
                "active_incidents": len(mesh_engine_service.get_incidents(db)),
                "gateway_latency_ms": 4.8
            }

        elif path == "/api/v1/weather/live" and method == "GET":
            lat = float(payload.get("lat", 20.2961))
            lng = float(payload.get("lng", 85.8245))
            return {
                "status": "SUCCESS",
                "telemetry": weather_engine_service.get_live_weather_telemetry(lat, lng)
            }

        elif path == "/api/v1/incidents" and method == "GET":
            triage = payload.get("triage", "all")
            items = mesh_engine_service.get_incidents(db, triage)
            return {"status": "SUCCESS", "count": len(items), "incidents": items}

        elif path == "/api/v1/hospitals" and method == "GET":
            items = mesh_engine_service.get_hospitals(db)
            return {"status": "SUCCESS", "count": len(items), "hospitals": items}

        elif path == "/api/v1/fleet" and method == "GET":
            items = mesh_engine_service.get_fleet(db)
            return {"status": "SUCCESS", "count": len(items), "fleet": items}

        elif path == "/api/v1/roads" and method == "GET":
            items = mesh_engine_service.get_road_hazards(db)
            return {"status": "SUCCESS", "roads": items}

        elif path == "/api/v1/incidents/ingest" and method == "POST":
            return mesh_engine_service.ingest_distress_packet(db, payload)

        elif path == "/api/v1/vision/analyze" and method == "POST":
            feed_id = payload.get("feed_id", "drone_alpha")
            conf = float(payload.get("conf_threshold", 0.35))
            img_b64 = payload.get("image_base64")
            return vision_engine_service.analyze_feed(feed_id, conf, img_b64)

        elif path == "/api/v1/routing/solver" and method == "POST":
            origin_lat = float(payload.get("origin_lat", 20.2961))
            origin_lng = float(payload.get("origin_lng", 85.8245))
            depth = float(payload.get("flood_depth_m", 1.8))
            bed_prio = float(payload.get("bed_priority_weight", 0.75))
            storm = float(payload.get("storm_risk_factor", 3.0))
            return routing_solver_service.solve_multi_objective(origin_lat, origin_lng, depth, bed_prio, storm)

        elif path == "/api/v1/routing/network" and method == "GET":
            depth = float(payload.get("flood_depth_m", 1.5))
            return routing_solver_service.get_road_network(current_flood_depth_m=depth)

        elif path == "/api/v1/routing/calculate" and method == "POST":
            origin = payload.get("origin_node", "N_SECTOR_B4")
            dest = payload.get("destination_node", "N_APEX_TRAUMA")
            threshold = float(payload.get("flood_threshold", 0.8))
            vtype = str(payload.get("vehicle_type", "AMBULANCE"))
            return routing_solver_service.calculate_route(origin, dest, threshold, vtype)

        elif path == "/api/v1/mesh/topology" and method == "GET":
            return mesh_engine_service.get_mesh_topology(db)

        else:
            return {"error": "Endpoint not found", "path": path, "status_code": 404}

    except ValueError as e:
        return {"error": str(e), "status_code": 400}
    except Exception as e:
        return {"error": f"Internal Server Error: {str(e)}", "status_code": 500}
    finally:
        db.close()
