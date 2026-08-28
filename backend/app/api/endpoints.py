"""
==========================================================================
AEGIS-MESH BACKEND - REST API ENDPOINTS
==========================================================================
"""

from typing import Dict, Any
from app.services.vision_engine import vision_engine_service
from app.services.routing_engine import routing_solver_service
from app.services.mesh_engine import mesh_engine_service
from app.services.weather_engine import weather_engine_service

def handle_api_request(path: str, method: str = "GET", payload: Dict[str, Any] = None) -> Dict[str, Any]:
    payload = payload or {}

    if path == "/api/v1/system/health":
        return {
            "status": "ONLINE",
            "service": "AEGIS-MESH FastAPI Gateway v3.8",
            "gateway_latency_ms": 14.2,
            "rabbitmq_status": "BROKER_CONNECTED",
            "postgis_status": "SPATIAL_DB_ACTIVE"
        }

    elif path == "/api/v1/weather/live" and method == "GET":
        return {
            "status": "SUCCESS",
            "telemetry": weather_engine_service.get_live_weather_telemetry()
        }

    elif path == "/api/v1/incidents" and method == "GET":
        triage = payload.get("triage", "all")
        return {
            "status": "SUCCESS",
            "count": len(mesh_engine_service.get_incidents(triage)),
            "incidents": mesh_engine_service.get_incidents(triage)
        }

    elif path == "/api/v1/hospitals" and method == "GET":
        return {
            "status": "SUCCESS",
            "count": len(mesh_engine_service.get_hospitals()),
            "hospitals": mesh_engine_service.get_hospitals()
        }

    elif path == "/api/v1/fleet" and method == "GET":
        return {
            "status": "SUCCESS",
            "count": len(mesh_engine_service.get_fleet()),
            "fleet": mesh_engine_service.get_fleet()
        }

    elif path == "/api/v1/roads" and method == "GET":
        return {
            "status": "SUCCESS",
            "roads": mesh_engine_service.get_road_hazards()
        }

    elif path == "/api/v1/incidents/ingest" and method == "POST":
        return mesh_engine_service.ingest_distress_packet(payload)

    elif path == "/api/v1/vision/analyze" and method == "POST":
        feed_id = payload.get("feed_id", "drone_alpha")
        conf_thresh = float(payload.get("conf_threshold", 0.45))
        result = vision_engine_service.analyze_feed(feed_id, conf_thresh)
        return {
            "status": "ANALYSIS_COMPLETE",
            "feed_id": result.feed_id,
            "feed_name": result.feed_name,
            "resolution": result.resolution,
            "detections": result.detections,
            "flood_coverage_pct": result.flood_coverage_pct,
            "mAP_score": result.mAP_score,
            "latency_ms": result.latency_ms,
            "vram_usage": result.vram_usage_gb
        }

    elif path == "/api/v1/routing/solver" and method == "POST":
        flood_depth = float(payload.get("flood_depth_m", 1.8))
        bed_priority = float(payload.get("bed_priority_weight", 0.75))
        storm_risk = float(payload.get("storm_risk_factor", 3.0))
        return routing_solver_service.solve_multi_objective(flood_depth, bed_priority, storm_risk)

    elif path == "/api/v1/mesh/topology" and method == "GET":
        return mesh_engine_service.get_mesh_topology()

    else:
        return {"error": "Endpoint not found", "path": path, "status": 404}
