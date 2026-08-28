"""
==========================================================================
AEGIS-MESH BACKEND AUTOMATED UNIT TESTS
==========================================================================
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.endpoints import handle_api_request

def test_all_endpoints():
    print("⚡ [TEST-SUITE] Running AEGIS-MESH Backend Integration Tests...\n")
    
    # 1. Health Check
    res1 = handle_api_request("/api/v1/system/health")
    assert res1["status"] == "ONLINE", "Health check failed"
    print("✅ PASS: /api/v1/system/health ->", res1)

    # 2. Get Incidents
    res2 = handle_api_request("/api/v1/incidents", method="GET")
    assert res2["count"] > 0, "No incidents returned"
    print(f"✅ PASS: /api/v1/incidents -> {res2['count']} incidents loaded.")

    # 3. Ingest SOS Mesh Distress Packet
    res3 = handle_api_request("/api/v1/incidents/ingest", method="POST", payload={
        "type": "Airlift Needed - Submerged Roof",
        "details": "4 victims, device battery 12%",
        "lat": 20.2961,
        "lng": 85.8245
    })
    assert res3["status"] == "INGESTED_SUCCESSFULLY", "Ingestion failed"
    print("✅ PASS: /api/v1/incidents/ingest ->", res3["incident"]["id"], "Ingested successfully.")

    # 4. Vision Engine YOLOv8 Detection Pass
    res4 = handle_api_request("/api/v1/vision/analyze", method="POST", payload={
        "feed_id": "drone_alpha",
        "conf_threshold": 0.45
    })
    assert len(res4["detections"]) > 0, "Vision detections empty"
    print(f"✅ PASS: /api/v1/vision/analyze -> {len(res4['detections'])} objects detected (mAP {res4['mAP_score']}%).")

    # 5. Multi-Objective Resource Routing Solver Pass
    res5 = handle_api_request("/api/v1/routing/solver", method="POST", payload={
        "flood_depth_m": 1.8,
        "bed_priority_weight": 0.75,
        "storm_risk_factor": 3.0
    })
    assert res5["delay_reduction_pct"] > 35, "Routing solver efficiency too low"
    print(f"✅ PASS: /api/v1/routing/solver -> Delay reduction: {res5['delay_reduction_pct']}% ({res5['naive_avg_mins']} mins -> {res5['solver_avg_mins']} mins).")

    # 6. BLE Mesh Topology Query
    res6 = handle_api_request("/api/v1/mesh/topology", method="GET")
    assert res6["active_nodes_count"] == 5, "Mesh topology mismatch"
    print(f"✅ PASS: /api/v1/mesh/topology -> {res6['active_nodes_count']} nodes active ({res6['delivery_success_pct']}% delivery success).")

    print("\n🎉 ALL 6 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_all_endpoints()
