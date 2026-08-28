"""
==========================================================================
AEGIS-MESH BACKEND - BLE MESH TELEMETRY, HOSPITAL & FLEET ENGINE
==========================================================================
"""

from typing import Dict, Any, List
from app.models.schemas import IncidentModel, HospitalModel

class MeshEngine:
    def __init__(self):
        self.incidents: List[IncidentModel] = [
            IncidentModel('INC-442', 'Multi-Vehicle Flood Trapping', 'Priority 1', 'red', '2m ago', 'Intersection of 5th and Main. 4 people trapped on roof.', ['Medical', 'Boat Squad'], 20.2961, 85.8245, 'CRITICAL', 'BLE Hop #3', '14%'),
            IncidentModel('INC-9042', 'Submerged Bus (12 Passengers)', 'Priority 1', 'red', '6m ago', 'Sector 4 Avenue. Water depth 3.1m. Offline Wi-Fi Direct.', ['Mass Rescue', 'Airlift'], 20.3015, 85.8310, 'CRITICAL', 'Wi-Fi Direct', '28%'),
            IncidentModel('INC-9043', 'Elderly Resident Trauma', 'Priority 2', 'amber', '14m ago', 'Substation 12 district. Oxygen concentrator power fail.', ['Medical', 'Generator'], 20.2880, 85.8150, 'URGENT', 'BLE Hop #1', '52%'),
            IncidentModel('INC-9044', 'Isolated Shelter (8 Refugees)', 'Priority 3', 'emerald', '45m ago', 'High ground school auditorium. Clean water refill.', ['Logistics', 'Supplies'], 20.3150, 85.8420, 'MODERATE', 'LoRa Gateway', '76%')
        ]

        self.hospitals = [
            {"id": "HOSP-01", "name": "Apex General Trauma Center", "occupied": 102, "total": 120, "pct": 85, "free": 18, "lat": 20.3200, "lng": 85.8100, "status": "HIGH_LOAD"},
            {"id": "HOSP-02", "name": "St. Jude Emergency Relief Hub", "occupied": 76, "total": 80, "pct": 95, "free": 4, "lat": 20.2700, "lng": 85.8000, "status": "CRITICAL_CAPACITY"},
            {"id": "HOSP-03", "name": "NDRF Mobile Field Hospital", "occupied": 15, "total": 50, "pct": 30, "free": 35, "lat": 20.3300, "lng": 85.8500, "status": "OPERATIONAL_FREE"}
        ]

        self.utility_fleet = [
            {"id": "FLEET-BOAT-1", "name": "NDRF Rescue Boat Alpha", "type": "Rescue Boat", "crew": "4 Rescue Specialists", "status": "DISPATCHED", "lat": 20.2920, "lng": 85.8200},
            {"id": "FLEET-CHOP-2", "name": "Air Force Chopper 2", "type": "Rescue Chopper", "crew": "3 Air Crew + Winch", "status": "PATROLLING", "lat": 20.3100, "lng": 85.8250},
            {"id": "FLEET-AMPH-1", "name": "Coast Guard Amphibious-1", "type": "Amphibious Vehicle", "crew": "6 Crew", "status": "AVAILABLE", "lat": 20.2750, "lng": 85.8100},
            {"id": "FLEET-PUMP-4", "name": "High Capacity Pumper Truck 04", "type": "Utility Pumper", "crew": "5000L/min Pump", "status": "DEPLOYED", "lat": 20.2880, "lng": 85.8180},
            {"id": "FLEET-GEN-02", "name": "Mobile Generator Truck 250kW", "type": "Utility Power", "crew": "Emergency Substation", "status": "EN_ROUTE", "lat": 20.2820, "lng": 85.8120}
        ]

        self.road_hazards = [
            {"id": "ROAD-01", "name": "Jan Path Elevated Highway", "status": "SAFE_CORRIDOR", "type": "Safe Passable", "lat_lngs": [[20.2790, 85.8390], [20.3200, 85.8100]]},
            {"id": "ROAD-02", "name": "Riverbed Flyover Approach", "status": "DANGEROUS_SUBMERGED", "type": "Deep Flood Water 3.1m", "lat_lngs": [[20.2900, 85.8480], [20.3015, 85.8310]]}
        ]

    def get_incidents(self, triage_filter: str = None) -> List[Dict[str, Any]]:
        if not triage_filter or triage_filter == 'all':
            return [inc.to_dict() for inc in self.incidents]
        return [inc.to_dict() for inc in self.incidents if inc.prio_type == triage_filter]

    def get_hospitals(self) -> List[Dict[str, Any]]:
        return self.hospitals

    def get_fleet(self) -> List[Dict[str, Any]]:
        return self.utility_fleet

    def get_road_hazards(self) -> List[Dict[str, Any]]:
        return self.road_hazards

    def ingest_distress_packet(self, data: Dict[str, Any]) -> Dict[str, Any]:
        inc_id = f"INC-{len(self.incidents) + 9045}"
        new_inc = IncidentModel(
            id=inc_id,
            title=data.get("type", "Emergency SOS Alert"),
            priority="Priority 1",
            prio_type="red",
            time="Just now",
            desc=data.get("details", "Distress signal transmitted via BLE Mesh"),
            tags=["Emergency", "BLE Mesh"],
            lat=data.get("lat", 20.2961),
            lng=data.get("lng", 85.8245),
            triage="CRITICAL",
            mesh_hop="BLE Mesh Hop #1",
            battery="88%"
        )
        self.incidents.insert(0, new_inc)
        return {
            "status": "INGESTED_SUCCESSFULLY",
            "incident": new_inc.to_dict(),
            "packet_hash": "0x8F4A...B93C_AEGIS_SECURE_PAYLOAD",
            "mesh_ack": True
        }

    def get_mesh_topology(self) -> Dict[str, Any]:
        return {
            "protocol": "AEGIS BLE / Wi-Fi Direct Mesh v2.4",
            "active_nodes_count": 5,
            "delivery_success_pct": 99.4,
            "avg_rssi_dbm": -74
        }

mesh_engine_service = MeshEngine()
