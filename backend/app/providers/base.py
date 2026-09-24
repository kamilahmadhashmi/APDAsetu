"""
==========================================================================
AAPDASETU - DATA PROVIDER ABSTRACT BASE INTERFACE
==========================================================================
Defines the normalized application contract for both Real Data Mode
and Simulated Data Mode.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

class DataProvider(ABC):
    @property
    @abstractmethod
    def mode_name(self) -> str:
        """Returns 'real' or 'simulated'."""
        pass

    @property
    @abstractmethod
    def mode_label(self) -> str:
        """Returns human-readable label: 'LIVE DATA' or 'SIMULATION MODE'."""
        pass

    @abstractmethod
    def initialize_database(self, db: Session) -> None:
        """Initializes tables and optionally seeds baseline records."""
        pass

    @abstractmethod
    def get_hospitals(self, db: Session, lat: float = 20.2961, lng: float = 85.8245) -> List[Dict[str, Any]]:
        """Returns normalized hospital resources."""
        pass

    @abstractmethod
    def get_fleet(self, db: Session) -> List[Dict[str, Any]]:
        """Returns operational rescue fleet units."""
        pass

    @abstractmethod
    def get_road_hazards(self, db: Session, lat: float = 20.2961, lng: float = 85.8245) -> List[Dict[str, Any]]:
        """Returns live or simulated road segment hazards."""
        pass

    @abstractmethod
    def get_incidents(self, db: Session, triage_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns active emergency incidents."""
        pass

    @abstractmethod
    def get_weather_telemetry(self, lat: float = 20.2961, lng: float = 85.8245) -> Dict[str, Any]:
        """Returns meteorological and hydrological telemetry."""
        pass

    @abstractmethod
    def get_active_alerts(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Returns OASIS CAP emergency alerts."""
        pass

    @property
    def is_simulated(self) -> bool:
        """Returns True if running in simulated mode, False if real."""
        return self.mode_name == "simulated"

    @abstractmethod
    def get_mesh_topology(self, db: Session) -> Dict[str, Any]:
        """Returns mesh network node graph and telemetry."""
        pass

    @abstractmethod
    def get_road_network(self, current_flood_depth_m: float = 1.5) -> Dict[str, Any]:
        """Returns topological road network with clearance and flood status."""
        pass

    @abstractmethod
    def calculate_route(
        self,
        origin_node: str,
        destination_node: str,
        flood_threshold: float = 0.8,
        vehicle_type: str = "AMBULANCE"
    ) -> Dict[str, Any]:
        """Calculates optimal evacuation corridor."""
        pass

    @abstractmethod
    def solve_routing(
        self,
        db: Session,
        origin_lat: float,
        origin_lng: float,
        flood_depth_m: float,
        bed_priority_weight: float,
        storm_risk_factor: float
    ) -> Dict[str, Any]:
        """Calculates multi-objective Dijkstra evacuation paths."""
        pass
