"""
==========================================================================
AEGIS-MESH / AAPDASETU - BLE MESH TELEMETRY & AES-256-GCM CRYPTO SERVICE
==========================================================================
Provides genuine AES-256-GCM encryption/decryption, SHA-256 integrity checks,
and persistent database operations for disaster incidents, hospitals, and fleet.
"""

import os
import json
import base64
import hashlib
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy.orm import Session

from app.db.models import Incident, Hospital, FleetUnit, RoadHazard

# Operational Master Key for field mesh units (256-bit AES key)
# In production, this can be provisioned via hardware secure enclave or env var
DEFAULT_SECRET = os.environ.get("AEGIS_MESH_SECRET", "AEGIS-RESQNET-DISASTER-EMERGENCY-2026-KEY")
MASTER_AES_KEY = hashlib.sha256(DEFAULT_SECRET.encode("utf-8")).digest()

class MeshEngine:
    def __init__(self):
        self.master_key = MASTER_AES_KEY

    # ----------------------------------------------------------------------
    # REAL AES-256-GCM CRYPTOGRAPHY
    # ----------------------------------------------------------------------
    def encrypt_payload(self, data: Dict[str, Any], key: Optional[bytes] = None) -> Dict[str, str]:
        """Encrypts dictionary payload using real AES-256-GCM."""
        aes_key = key or self.master_key
        aesgcm = AESGCM(aes_key)
        
        # 12-byte (96-bit) cryptographically random IV as recommended by NIST SP 800-38D
        iv = os.urandom(12)
        plaintext = json.dumps(data).encode("utf-8")
        
        # AESGCM.encrypt appends 16-byte authentication tag to ciphertext
        ciphertext_and_tag = aesgcm.encrypt(iv, plaintext, None)
        
        return {
            "iv": base64.b64encode(iv).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext_and_tag).decode("ascii"),
            "algorithm": "AES-256-GCM"
        }

    def decrypt_payload(self, iv_b64: str, ciphertext_b64: str, key: Optional[bytes] = None) -> Dict[str, Any]:
        """Decrypts and authenticates AES-256-GCM payload."""
        aes_key = key or self.master_key
        aesgcm = AESGCM(aes_key)
        
        iv = base64.b64decode(iv_b64)
        ciphertext_and_tag = base64.b64decode(ciphertext_b64)
        
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_and_tag, None)
        return json.loads(decrypted_bytes.decode("utf-8"))

    # ----------------------------------------------------------------------
    # DATABASE SEEDING & CRUD
    # ----------------------------------------------------------------------
    def seed_initial_data_if_empty(self, db: Session):
        """Pre-populates sample relief hospitals, fleet units, roads and incidents."""
        from app.db.database import Base, engine
        Base.metadata.create_all(bind=engine)

        if db.query(Hospital).count() == 0:
            hospitals = [
                Hospital(id="HOSP-01", name="Apex General Trauma Center", occupied=102, total=120, pct=85, free=18, lat=20.3200, lng=85.8100, status="HIGH_LOAD", color="#f59e0b"),
                Hospital(id="HOSP-02", name="St. Jude Emergency Relief Hub", occupied=76, total=80, pct=95, free=4, lat=20.2700, lng=85.8000, status="CRITICAL_CAPACITY", color="#ef4444"),
                Hospital(id="HOSP-03", name="NDRF Mobile Field Hospital", occupied=15, total=50, pct=30, free=35, lat=20.3300, lng=85.8500, status="OPERATIONAL_FREE", color="#10b981")
            ]
            db.add_all(hospitals)

        if db.query(FleetUnit).count() == 0:
            fleet = [
                FleetUnit(id="FLEET-BOAT-1", name="NDRF Rescue Boat Alpha", type="Rescue Boat", crew="4 Rescue Specialists", status="DISPATCHED", lat=20.2920, lng=85.8200, color="#0ea5e9", icon="directions_boat"),
                FleetUnit(id="FLEET-CHOP-2", name="Air Force Chopper 2", type="Rescue Chopper", crew="3 Air Crew + Winch", status="PATROLLING", lat=20.3100, lng=85.8250, color="#a855f7", icon="helicopter"),
                FleetUnit(id="FLEET-AMPH-1", name="Coast Guard Amphibious-1", type="Amphibious Vehicle", crew="6 Crew", status="AVAILABLE", lat=20.2750, lng=85.8100, color="#10b981", icon="directions_car"),
                FleetUnit(id="FLEET-PUMP-4", name="High Capacity Pumper Truck 04", type="Utility Pumper", crew="5000L/min Pump", status="DEPLOYED", lat=20.2880, lng=85.8180, color="#f59e0b", icon="fire_truck"),
                FleetUnit(id="FLEET-GEN-02", name="Mobile Generator Truck 250kW", type="Utility Power", crew="Emergency Substation", status="EN_ROUTE", lat=20.2820, lng=85.8120, color="#eab308", icon="bolt")
            ]
            db.add_all(fleet)

        if db.query(RoadHazard).count() == 0:
            roads = [
                RoadHazard(id="ROAD-01", name="Jan Path Elevated Highway", status="SAFE_CORRIDOR", type="Elevated Highway", threshold_m=4.5, lat_lngs_json=json.dumps([[20.2790, 85.8390], [20.3200, 85.8100]])),
                RoadHazard(id="ROAD-02", name="Riverbed Flyover Approach", status="DANGEROUS_SUBMERGED", type="Low-lying Bridge", threshold_m=2.0, lat_lngs_json=json.dumps([[20.2900, 85.8480], [20.3015, 85.8310]])),
                RoadHazard(id="ROAD-03", name="Main Street Sector B4", status="SUBMERGED", type="Arterial Corridor", threshold_m=1.5, lat_lngs_json=json.dumps([[20.2920, 85.8200], [20.2961, 85.8245]])),
                RoadHazard(id="ROAD-04", name="School Zone Connector Road", status="SUBMERGED", type="Residential", threshold_m=1.2, lat_lngs_json=json.dumps([[20.2880, 85.8150], [20.3010, 85.8220]]))
            ]
            db.add_all(roads)

        if db.query(Incident).count() == 0:
            incidents = [
                Incident(id="INC-442", title="Multi-Vehicle Flood Trapping", priority="Priority 1", prio_type="red", time="2m ago", desc="Intersection of 5th and Main. 4 people trapped on roof.", tags_json=json.dumps(["Medical", "Boat Squad"]), lat=20.2961, lng=85.8245, triage="CRITICAL", mesh_hop="BLE Hop #3", battery="14%", packet_hash="0x" + hashlib.sha256(b"INC-442").hexdigest()[:24]),
                Incident(id="INC-9042", title="Submerged Bus (12 Passengers)", priority="Priority 1", prio_type="red", time="6m ago", desc="Sector 4 Avenue. Water depth 3.1m. Offline Wi-Fi Direct.", tags_json=json.dumps(["Mass Rescue", "Airlift"]), lat=20.3015, lng=85.8310, triage="CRITICAL", mesh_hop="Wi-Fi Direct", battery="28%", packet_hash="0x" + hashlib.sha256(b"INC-9042").hexdigest()[:24]),
                Incident(id="INC-9043", title="Elderly Resident Trauma", priority="Priority 2", prio_type="amber", time="14m ago", desc="Substation 12 district. Oxygen concentrator power fail.", tags_json=json.dumps(["Medical", "Generator"]), lat=20.2880, lng=85.8150, triage="URGENT", mesh_hop="BLE Hop #1", battery="52%", packet_hash="0x" + hashlib.sha256(b"INC-9043").hexdigest()[:24]),
                Incident(id="INC-9044", title="Isolated Shelter (8 Refugees)", priority="Priority 3", prio_type="emerald", time="45m ago", desc="High ground school auditorium. Clean water refill.", tags_json=json.dumps(["Logistics", "Supplies"]), lat=20.3150, lng=85.8420, triage="MODERATE", mesh_hop="LoRa Gateway", battery="76%", packet_hash="0x" + hashlib.sha256(b"INC-9044").hexdigest()[:24])
            ]
            db.add_all(incidents)

        db.commit()

    def get_incidents(self, db: Session, triage_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(Incident).order_by(Incident.created_at.desc())
        if triage_filter and triage_filter != "all":
            query = query.filter(Incident.prio_type == triage_filter)
        return [inc.to_dict() for inc in query.all()]

    def get_hospitals(self, db: Session) -> List[Dict[str, Any]]:
        return [h.to_dict() for h in db.query(Hospital).all()]

    def get_fleet(self, db: Session) -> List[Dict[str, Any]]:
        return [f.to_dict() for f in db.query(FleetUnit).all()]

    def get_road_hazards(self, db: Session) -> List[Dict[str, Any]]:
        return [r.to_dict() for r in db.query(RoadHazard).all()]

    def ingest_distress_packet(self, db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ingests a verified/decrypted distress signal and stores it in database."""
        # 1. Check if encrypted envelope is present
        raw_payload = data
        encrypted_raw = None
        if "encrypted_envelope" in data and data["encrypted_envelope"]:
            env = data["encrypted_envelope"]
            try:
                decrypted = self.decrypt_payload(env["iv"], env["ciphertext"])
                raw_payload = {**data, **decrypted}
                encrypted_raw = json.dumps(env)
            except Exception as e:
                # If decryption fails (tampered payload or bad key), raise security error
                raise ValueError(f"AES-256-GCM Decryption/Authentication failed: {str(e)}")

        inc_id = raw_payload.get("id") or f"INC-{uuid.uuid4().hex[:6].upper()}"
        
        tags = raw_payload.get("tags", ["Emergency SOS", "Immediate Evac"])
        if isinstance(tags, str):
            tags = [tags]

        # Authentic cryptographic packet SHA-256 signature
        sig_base = f"{inc_id}:{raw_payload.get('lat')}:{raw_payload.get('lng')}:{datetime.now(timezone.utc).isoformat()}"
        packet_hash = "0x" + hashlib.sha256(sig_base.encode("utf-8")).hexdigest()[:28]

        prio_type = raw_payload.get("prio_type")
        if not prio_type:
            triage_val = str(raw_payload.get("triage", "CRITICAL")).upper()
            priority_val = str(raw_payload.get("priority", "Priority 1")).lower()
            if "CRITICAL" in triage_val or "1" in priority_val:
                prio_type = "red"
            elif "URGENT" in triage_val or "2" in priority_val:
                prio_type = "amber"
            else:
                prio_type = "emerald"

        new_inc = Incident(
            id=inc_id,
            title=raw_payload.get("title", "Emergency SOS Alert"),
            priority=raw_payload.get("priority", "Priority 1"),
            prio_type=prio_type,
            time="Just now",
            desc=raw_payload.get("desc", "Distress signal transmitted via field network"),
            tags_json=json.dumps(tags),
            lat=float(raw_payload.get("lat", 20.2961)),
            lng=float(raw_payload.get("lng", 85.8245)),
            triage=raw_payload.get("triage", "CRITICAL"),
            mesh_hop="BLE Mesh Hop #1",
            battery=raw_payload.get("battery", "88%"),
            caller_name=raw_payload.get("caller_name"),
            encrypted_payload=encrypted_raw,
            packet_hash=packet_hash,
            created_at=datetime.now(timezone.utc)
        )
        existing = db.query(Incident).filter(Incident.id == inc_id).first()
        if existing:
            new_inc = db.merge(new_inc)
        else:
            db.add(new_inc)
        db.commit()
        db.refresh(new_inc)

        return {
            "status": "INGESTED_SUCCESSFULLY",
            "incident": new_inc.to_dict(),
            "packet_hash": packet_hash,
            "mesh_ack": True,
            "encryption_verified": bool(encrypted_raw)
        }

    def get_mesh_topology(self, db: Session) -> Dict[str, Any]:
        fleet_units = db.query(FleetUnit).all()
        nodes = [
            {"id": "NODE-VIC-01", "name": "Citizen SOS Beacon (You)", "type": "victim", "battery": "42%", "status": "ISOLATED", "lat": 20.2961, "lng": 85.8245},
            {"id": "NODE-HOP-A", "name": "Field Phone Mesh Relay (Hop #1)", "type": "relay", "battery": "68%", "status": "RELAYING", "lat": 20.2920, "lng": 85.8200},
            {"id": "NODE-HOP-B", "name": "Substation Repeater (Hop #2)", "type": "relay", "battery": "85%", "status": "RELAYING", "lat": 20.2880, "lng": 85.8150},
        ]
        
        # Include database fleet units as mesh nodes
        for u in fleet_units[:2]:
            nodes.append({
                "id": u.id,
                "name": u.name,
                "type": "volunteer",
                "battery": "94%",
                "status": u.status,
                "lat": u.lat,
                "lng": u.lng
            })
            
        nodes.append({
            "id": "NODE-UPLINK",
            "name": "Command Satellite Gateway",
            "type": "uplink",
            "battery": "100%",
            "status": "COMMAND_CENTER",
            "lat": 20.3200,
            "lng": 85.8100
        })
        
        fleet_hop_id = nodes[3]["id"] if len(nodes) > 3 else "NODE-HOP-B"
        
        return {
            "protocol": "AEGIS BLE 5.3 / Wi-Fi Direct Mesh (AES-256-GCM)",
            "active_nodes_count": len(nodes),
            "delivery_success_pct": 99.8,
            "avg_rssi_dbm": -68,
            "crypto_cipher": "AES-256-GCM (NIST SP 800-38D)",
            "nodes": nodes,
            "links": [
                {"source": "NODE-VIC-01", "target": "NODE-HOP-A", "rssi": -65, "loss_pct": 0.1},
                {"source": "NODE-HOP-A", "target": "NODE-HOP-B", "rssi": -72, "loss_pct": 0.2},
                {"source": "NODE-HOP-B", "target": fleet_hop_id, "rssi": -68, "loss_pct": 0.0},
                {"source": fleet_hop_id, "target": "NODE-UPLINK", "rssi": -58, "loss_pct": 0.0}
            ]
        }

mesh_engine_service = MeshEngine()
