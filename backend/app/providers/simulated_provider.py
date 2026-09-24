"""
==========================================================================
AAPDASETU - SIMULATED DATA PROVIDER (BASELINE IMPLEMENTATION)
==========================================================================
Preserves 100% of the existing mock/simulated baseline without any alterations:
- Pre-seeds sample hospitals, fleet units, roads, and 4 mock incidents.
- Returns deterministic simulated weather, synthetic graph routing, and CAP alerts.
- Fully offline and reliable for automated testing and demonstrations.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.providers.base import DataProvider
from app.services.mesh_engine import mesh_engine_service
from app.services.routing_engine import routing_solver_service
from app.services.weather_engine import weather_engine_service

BASELINE_SIMULATED_ALERTS: List[Dict[str, Any]] = [
    {
        "identifier": "IN-OD-CAP-2026-FLOOD-01",
        "event": "Flash Flood Inundation & Severe Surge Warning",
        "urgency": "Immediate",
        "severity": "Severe",
        "certainty": "Observed",
        "headline": "URGENT EVACUATION: Rising Mahanadi Catchment Basin Breach",
        "instruction": "Evacuate low-lying river wards to Sector 4 Apex Trauma Safe Zone via Green Corridor.",
        "area_desc": "Bhubaneswar & Cuttack Riverfront Lowlands",
        "circle": "20.2961,85.8245,6.0",
        "sent": "2026-09-24T12:00:00+00:00"
    }
]

class SimulatedDataProvider(DataProvider):
    @property
    def mode_name(self) -> str:
        return "simulated"

    @property
    def mode_label(self) -> str:
        return "SIMULATION MODE"

    def initialize_database(self, db: Session) -> None:
        """Pre-seeds sample relief hospitals, fleet units, roads, and incidents if DB is empty."""
        mesh_engine_service.seed_initial_data_if_empty(db)

    def get_hospitals(self, db: Session, lat: float = 20.2961, lng: float = 85.8245) -> List[Dict[str, Any]]:
        return mesh_engine_service.get_hospitals(db)

    def get_fleet(self, db: Session) -> List[Dict[str, Any]]:
        return mesh_engine_service.get_fleet(db)

    def get_road_hazards(self, db: Session, lat: float = 20.2961, lng: float = 85.8245) -> List[Dict[str, Any]]:
        return mesh_engine_service.get_road_hazards(db)

    def get_incidents(self, db: Session, triage_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        return mesh_engine_service.get_incidents(db, triage_filter=triage_filter)

    def get_weather_telemetry(self, lat: float = 20.2961, lng: float = 85.8245) -> Dict[str, Any]:
        """Returns baseline simulated meteorological telemetry."""
        return weather_engine_service.cached_telemetry

    def get_active_alerts(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        return BASELINE_SIMULATED_ALERTS

    def get_mesh_topology(self, db: Session) -> Dict[str, Any]:
        return mesh_engine_service.get_mesh_topology(db)

    def get_road_network(self, current_flood_depth_m: float = 1.5) -> Dict[str, Any]:
        return routing_solver_service.get_road_network(current_flood_depth_m=current_flood_depth_m)

    def calculate_route(
        self,
        origin_node: str,
        destination_node: str,
        flood_threshold: float = 0.8,
        vehicle_type: str = "AMBULANCE"
    ) -> Dict[str, Any]:
        return routing_solver_service.calculate_route(
            origin_node=origin_node,
            destination_node=destination_node,
            flood_threshold=flood_threshold,
            vehicle_type=vehicle_type
        )

    def solve_routing(
        self,
        db: Session,
        origin_lat: float,
        origin_lng: float,
        flood_depth_m: float,
        bed_priority_weight: float,
        storm_risk_factor: float
    ) -> Dict[str, Any]:
        return routing_solver_service.solve_multi_objective(
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            flood_depth_m=flood_depth_m,
            bed_priority_weight=bed_priority_weight,
            storm_risk_factor=storm_risk_factor
        )

simulated_provider = SimulatedDataProvider()
