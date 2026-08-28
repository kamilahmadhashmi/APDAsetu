"""
==========================================================================
AEGIS-MESH BACKEND - DATA MODELS & SCHEMAS
==========================================================================
"""

from typing import List, Optional
from dataclasses import dataclass, asdict

@dataclass
class IncidentModel:
    id: str
    title: str
    priority: str
    prio_type: str  # 'red', 'amber', 'emerald'
    time: str
    desc: str
    tags: List[str]
    lat: float
    lng: float
    triage: str
    mesh_hop: str
    battery: str = "65%"

    def to_dict(self):
        return asdict(self)

@dataclass
class HospitalModel:
    id: str
    name: str
    beds_available: int
    total_beds: int
    lat: float
    lng: float
    status: str

    def to_dict(self):
        return asdict(self)

@dataclass
class RescueUnitModel:
    id: str
    name: str
    status: str
    lat: float
    lng: float
    target: str

    def to_dict(self):
        return asdict(self)

@dataclass
class BoundingBoxDetection:
    label: str
    confidence: float
    x: int
    y: int
    w: int
    h: int
    color: str

    def to_dict(self):
        return asdict(self)

@dataclass
class VisionAnalysisResponse:
    feed_id: str
    feed_name: str
    resolution: str
    detections: List[dict]
    flood_coverage_pct: float
    mAP_score: float
    latency_ms: float
    vram_usage_gb: str

@dataclass
class RoutingAssignment:
    victim_id: str
    unit_id: str
    hospital_id: str
    est_eta_mins: float
    status: str

    def to_dict(self):
        return asdict(self)
