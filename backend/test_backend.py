"""
==========================================================================
AEGIS-MESH / AAPDASETU - PRODUCTION TEST SUITE & VERIFICATION HARNESS
==========================================================================
Verifies:
1. Windows-safe UTF-8 console output.
2. Real AES-256-GCM cryptographic encryption & decryption roundtrip.
3. Persistent SQLite database operations and seeding.
4. Real Dijkstra flood-avoidance pathfinding algorithm.
5. Real computer vision image buffer decoding & water analysis.
6. Live meteorological ingress.
7. FastAPI ASGI endpoint test client.
"""

import sys
import os
import io

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from main import app
from app.db.database import SessionLocal, Base, engine
from app.services.mesh_engine import mesh_engine_service
from app.services.routing_engine import routing_solver_service
from app.services.vision_engine import vision_engine_service
from app.services.weather_engine import weather_engine_service

client = TestClient(app)

def test_crypto_roundtrip():
    print("[1/7] Testing Real AES-256-GCM Cryptographic Pipeline...")
    original_distress = {
        "caller": "Unit Commander 104",
        "situation": "Submerged Rooftop Rescue",
        "victims": 4,
        "vital_priority": "CRITICAL"
    }

    envelope = mesh_engine_service.encrypt_payload(original_distress)
    assert "iv" in envelope and "ciphertext" in envelope
    assert envelope["algorithm"] == "AES-256-GCM"

    # Decrypt and authenticate
    decrypted = mesh_engine_service.decrypt_payload(envelope["iv"], envelope["ciphertext"])
    assert decrypted["situation"] == original_distress["situation"]
    assert decrypted["victims"] == 4
    print("  [PASS] AES-256-GCM encryption and authentication verified successfully.")

def test_database_persistence():
    print("[2/7] Testing SQLAlchemy SQLite Persistent Storage...")
    db = SessionLocal()
    try:
        mesh_engine_service.seed_initial_data_if_empty(db)
        incidents = mesh_engine_service.get_incidents(db)
        hospitals = mesh_engine_service.get_hospitals(db)
        fleet = mesh_engine_service.get_fleet(db)
        roads = mesh_engine_service.get_road_hazards(db)

        assert len(incidents) >= 4, "Incidents failed to seed"
        assert len(hospitals) == 3, "Hospitals failed to seed"
        assert len(fleet) >= 5, "Fleet failed to seed"
        assert len(roads) >= 4, "Roads failed to seed"
        print(f"  [PASS] Seeded and verified {len(incidents)} incidents, {len(hospitals)} hospitals, {len(fleet)} fleet units.")
    finally:
        db.close()

def test_dijkstra_routing_solver():
    print("[3/7] Testing Dijkstra Graph Solver Flood-Avoidance Algorithm...")
    # At flood depth 1.0m, low flyover might be passable; at 3.5m, it must be avoided
    result = routing_solver_service.solve_multi_objective(
        origin_lat=20.2961,
        origin_lng=85.8245,
        flood_depth_m=3.5,
        bed_priority_weight=0.75,
        storm_risk_factor=3.0
    )

    assert result["status"] == "OPTIMAL_SOLUTION_FOUND"
    assert result["delay_reduction_pct"] > 30.0
    assert len(result["assignments"]) > 0
    assert len(result["avoided_flooded_roads"]) > 0
    print(f"  [PASS] Dijkstra solver routed around {len(result['avoided_flooded_roads'])} flooded links (Delay reduced: {result['delay_reduction_pct']}%).")

def test_computer_vision_analysis():
    print("[4/7] Testing Computer Vision & Real Image Buffer Processing...")
    # Create a synthetic 400x300 flood disaster image buffer
    img_array = np.zeros((300, 400, 3), dtype=np.uint8)
    # Fill 60% with bluish-cyan flood water
    img_array[100:, :] = [40, 140, 200]
    img = Image.fromarray(img_array)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    result = vision_engine_service.analyze_image_buffer(raw_bytes, conf_threshold=0.35)
    assert result["status"] == "ANALYSIS_COMPLETE"
    assert result["resolution"] == "400x300"
    assert result["flood_coverage_pct"] > 40.0
    assert len(result["detections"]) > 0
    print(f"  [PASS] Vision pipeline analyzed {result['resolution']} image, flood ratio: {result['flood_coverage_pct']}%, detections: {len(result['detections'])}.")

def test_live_weather_ingress():
    print("[5/7] Testing Live Meteorological & Hydrological Telemetry...")
    telemetry = weather_engine_service.get_live_weather_telemetry(20.2961, 85.8245)
    assert "current_water_level_m" in telemetry
    assert "rainfall_intensity_mmhr" in telemetry
    assert "trend" in telemetry
    print(f"  [PASS] Weather Ingress: Rain {telemetry['rainfall_intensity_mmhr']} mm/hr, Water Depth {telemetry['current_water_level_m']}m ({telemetry['trend']}).")

def test_fastapi_rest_endpoints():
    print("[6/7] Testing FastAPI ASGI HTTP REST Endpoints...")
    # Health check
    res_health = client.get("/api/v1/system/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ONLINE"

    # Ingest distress incident with real encrypted envelope
    plain = {"title": "Stranded On Island", "desc": "3 children and 1 elder", "lat": 20.298, "lng": 85.828}
    envelope = mesh_engine_service.encrypt_payload(plain)

    res_post = client.post("/api/v1/incidents/ingest", json={
        "title": "Encrypted Distress Call",
        "desc": "Transmitted via BLE mesh",
        "lat": 20.298,
        "lng": 85.828,
        "priority": "Priority 1",
        "triage": "CRITICAL",
        "encrypted_envelope": envelope
    })
    assert res_post.status_code == 201
    post_data = res_post.json()
    assert post_data["encryption_verified"] is True
    print(f"  [PASS] Encrypted distress packet ingested and verified: ID {post_data['incident']['id']}.")

    # Query incidents list
    res_list = client.get("/api/v1/incidents")
    assert res_list.status_code == 200
    assert res_list.json()["count"] > 0
    print(f"  [PASS] Successfully retrieved {res_list.json()['count']} active persistent incidents.")

def test_security_hardening():
    print("[7/7] Testing Security Headers & HTTP Status Validation...")
    res = client.get("/api/v1/system/health")
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "SAMEORIGIN"

    # Non-existent route
    res_404 = client.get("/api/v1/nonexistent_route")
    assert res_404.status_code == 404
    print("  [PASS] Security headers and HTTP 404 response validated.")

def test_routing_network_and_calculation():
    print("[8/9] Testing Live Dijkstra Routing Network & Calculation API...")
    # Test network discovery
    res_net = client.get("/api/v1/routing/network")
    assert res_net.status_code == 200
    net_data = res_net.json()
    assert "network" in net_data
    assert len(net_data["network"]["nodes"]) >= 5
    assert len(net_data["network"]["edges"]) >= 5
    print(f"  [PASS] Network graph contains {len(net_data['network']['nodes'])} nodes and {len(net_data['network']['edges'])} edges.")

    # Test route calculation
    res_calc = client.post("/api/v1/routing/calculate", json={
        "origin_node": "NODE_SHELTER_SOUTH",
        "destination_node": "NODE_HOSP_CENTRAL",
        "vehicle_type": "AMBULANCE",
        "flood_threshold": 0.8
    })
    assert res_calc.status_code == 200
    calc_data = res_calc.json()
    assert calc_data["success"] is True
    assert len(calc_data["path_coordinates"]) >= 2
    assert calc_data["total_distance_km"] > 0
    print(f"  [PASS] Dijkstra path computed: {calc_data['total_distance_km']} km, ETA {calc_data['estimated_transit_minutes']} min, avoided {calc_data['flooded_segments_avoided']} flooded links.")

def test_offline_vendor_assets():
    print("[9/9] Testing 100% Offline Air-Gapped Vendor Bundles & PWA Shell...")
    # Test HTML shell
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "AapdaSetu" in res_root.text

    # Test PWA Service Worker
    res_sw = client.get("/sw.js")
    assert res_sw.status_code == 200
    assert "Service-Worker-Allowed" in res_sw.headers

    # Test vendor assets
    for asset in ["/src/vendor/leaflet.js", "/src/vendor/leaflet.css", "/src/vendor/lucide.min.js", "/src/vendor/chart.umd.min.js", "/src/vendor/tailwind.js"]:
        res_asset = client.get(asset)
        assert res_asset.status_code == 200, f"Failed to load {asset}"
        assert len(res_asset.content) > 1000, f"Asset {asset} too small"

    print("  [PASS] All air-gapped vendor scripts, stylesheets, and PWA shell served with 200 OK.")

def run_all():
    print("\n==========================================================================")
    print("AAPDASETU PRODUCTION SYSTEM VERIFICATION TEST SUITE")
    print("==========================================================================\n")
    test_crypto_roundtrip()
    test_database_persistence()
    test_dijkstra_routing_solver()
    test_computer_vision_analysis()
    test_live_weather_ingress()
    test_fastapi_rest_endpoints()
    test_security_hardening()
    test_routing_network_and_calculation()
    test_offline_vendor_assets()
    print("\nALL 9 PRODUCTION SYSTEM TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    run_all()
