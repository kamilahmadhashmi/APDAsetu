"""
==========================================================================
AEGIS-MESH / AAPDASETU - RELATIONAL DATABASE SCHEMAS (SQLALCHEMY)
==========================================================================
"""

from datetime import datetime, timezone
import json
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from .database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    priority = Column(String(50), default="Priority 1")
    prio_type = Column(String(20), default="red")
    time = Column(String(50), default="Just now")
    desc = Column(Text, default="")
    tags_json = Column(Text, default="[]")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    triage = Column(String(50), default="CRITICAL")
    mesh_hop = Column(String(50), default="BLE Hop #1")
    battery = Column(String(20), default="85%")
    caller_name = Column(String(100), nullable=True)
    encrypted_payload = Column(Text, nullable=True)
    packet_hash = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        tags = []
        try:
            tags = json.loads(self.tags_json) if self.tags_json else []
        except Exception:
            tags = []
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "prio_type": self.prio_type,
            "time": self.time,
            "desc": self.desc,
            "tags": tags,
            "lat": self.lat,
            "lng": self.lng,
            "triage": self.triage,
            "mesh_hop": self.mesh_hop,
            "battery": self.battery,
            "packet_hash": self.packet_hash,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    occupied = Column(Integer, default=0)
    total = Column(Integer, default=100)
    pct = Column(Integer, default=0)
    free = Column(Integer, default=0)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String(50), default="OPERATIONAL")
    color = Column(String(20), default="#10b981")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "occupied": self.occupied,
            "total": self.total,
            "pct": self.pct,
            "free": self.free,
            "lat": self.lat,
            "lng": self.lng,
            "status": self.status,
            "color": self.color
        }

class FleetUnit(Base):
    __tablename__ = "fleet_units"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(100), nullable=False)
    crew = Column(String(100), default="")
    status = Column(String(50), default="AVAILABLE")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    color = Column(String(20), default="#0ea5e9")
    icon = Column(String(50), default="directions_boat")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "crew": self.crew,
            "status": self.status,
            "lat": self.lat,
            "lng": self.lng,
            "color": self.color,
            "icon": self.icon
        }

class RoadHazard(Base):
    __tablename__ = "road_hazards"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    status = Column(String(50), default="SAFE_CORRIDOR")
    type = Column(String(100), default="Passable")
    threshold_m = Column(Float, default=1.5)
    lat_lngs_json = Column(Text, default="[]")

    def to_dict(self):
        coords = []
        try:
            coords = json.loads(self.lat_lngs_json) if self.lat_lngs_json else []
        except Exception:
            coords = []
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "type": self.type,
            "threshold_m": self.threshold_m,
            "lat_lngs": coords
        }
