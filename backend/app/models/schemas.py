"""
==========================================================================
AEGIS-MESH / AAPDASETU - PRODUCTION PYDANTIC V2 VALIDATION SCHEMAS
==========================================================================
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class EncryptedEnvelope(BaseModel):
    iv: str = Field(..., description="Base64 encoded 12-byte initialization vector")
    ciphertext: str = Field(..., description="Base64 encoded AES-256-GCM ciphertext")
    tag: Optional[str] = Field(None, description="Base64 encoded authentication tag if separate")
    algorithm: str = Field("AES-256-GCM", description="Cryptographic algorithm")

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="Distress situation summary")
    desc: Optional[str] = Field("Emergency distress transmitted via field network", max_length=2000)
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate")
    priority: Optional[str] = Field("Priority 1", description="Priority level string")
    triage: Optional[str] = Field("CRITICAL", description="Triage category: CRITICAL, URGENT, MODERATE")
    caller_name: Optional[str] = Field(None, max_length=100)
    battery: Optional[str] = Field("85%", max_length=10)
    tags: Optional[List[str]] = Field(default_factory=lambda: ["Emergency SOS", "Immediate Evac"])
    encrypted_envelope: Optional[EncryptedEnvelope] = Field(None, description="Optional AES-256-GCM encrypted payload")

class IncidentResponse(BaseModel):
    id: str
    title: str
    priority: str
    prio_type: str
    time: str
    desc: str
    tags: List[str]
    lat: float
    lng: float
    triage: str
    mesh_hop: str
    battery: str
    packet_hash: Optional[str] = None
    created_at: Optional[str] = None

class HospitalResponse(BaseModel):
    id: str
    name: str
    occupied: int
    total: int
    pct: int
    free: int
    lat: float
    lng: float
    status: str
    color: str

class FleetUnitResponse(BaseModel):
    id: str
    name: str
    type: str
    crew: str
    status: str
    lat: float
    lng: float
    color: str
    icon: str

class RoadHazardResponse(BaseModel):
    id: str
    name: str
    status: str
    type: str
    threshold_m: float
    lat_lngs: List[List[float]]

class VisionDetectRequest(BaseModel):
    image_base64: Optional[str] = Field(None, description="Optional Base64-encoded image for real YOLOv8 inference")
    feed_id: Optional[str] = Field("drone_alpha", description="Pre-loaded feed key if no image uploaded")
    conf_threshold: float = Field(0.35, ge=0.01, le=1.0, description="Confidence detection cutoff")

class BoundingBox(BaseModel):
    label: str
    conf: float
    x: int
    y: int
    w: int
    h: int
    color: str

class VisionDetectResponse(BaseModel):
    status: str
    feed_id: str
    feed_name: str
    resolution: str
    detections: List[BoundingBox]
    flood_coverage_pct: float
    mAP_score: float
    latency_ms: float
    vram_usage: str

class RoutingSolverRequest(BaseModel):
    origin_lat: float = Field(20.2961, ge=-90.0, le=90.0)
    origin_lng: float = Field(85.8245, ge=-180.0, le=180.0)
    flood_depth_m: float = Field(1.8, ge=0.0, le=15.0)
    bed_priority_weight: float = Field(0.75, ge=0.0, le=1.0)
    storm_risk_factor: float = Field(3.0, ge=1.0, le=10.0)

class RoutingAssignmentResponse(BaseModel):
    victim_id: str
    unit_id: str
    hospital_id: str
    est_eta_mins: float
    status: str
    route_waypoints: List[List[float]]

class RoutingSolverResponse(BaseModel):
    status: str
    delay_reduction_pct: float
    naive_avg_mins: float
    solver_avg_mins: float
    supply_hoard_prevented_pct: float
    assignments: List[RoutingAssignmentResponse]
    chart_comparison: Dict[str, Any]
    target_hospital: HospitalResponse
    avoided_flooded_roads: List[str]
