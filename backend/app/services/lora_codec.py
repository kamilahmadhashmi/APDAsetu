"""
==========================================================================
AEGIS-MESH / AAPDASETU - LORA AEGIS FRAME (LAF v1) BINARY CODEC (PYTHON)
==========================================================================
High-efficiency binary serialization matching the JavaScript and embedded
firmware (ESP32/Arduino) implementations.
Header overhead: 20 bytes with microdegree GPS coordinates & CRC16-CCITT.
"""

import struct
from typing import Dict, Any, Tuple, Optional
import json

from enum import IntEnum

MAGIC_BYTES = 0xAE61
PROTOCOL_VERSION = 0x01

class PacketType(IntEnum):
    SOS_BEACON = 0x01
    RELAY_TELEMETRY = 0x02
    DISPATCH_ACK = 0x03
    PING_HEARTBEAT = 0x04

class TriageLevel(IntEnum):
    NORMAL = 0x00
    URGENT = 0x01
    CRITICAL = 0x02
    EMERGENCY_SOS = 0x03

PACKET_TYPES = {
    PacketType.SOS_BEACON: "SOS_BEACON",
    PacketType.RELAY_TELEMETRY: "RELAY_TELEMETRY",
    PacketType.DISPATCH_ACK: "DISPATCH_ACK",
    PacketType.PING_HEARTBEAT: "PING_HEARTBEAT"
}

TRIAGE_LEVELS = {
    TriageLevel.NORMAL: "NORMAL",
    TriageLevel.URGENT: "URGENT",
    TriageLevel.CRITICAL: "CRITICAL",
    TriageLevel.EMERGENCY_SOS: "EMERGENCY_SOS"
}

def crc16_ccitt(data: bytes) -> int:
    """Calculates standard CRC16-CCITT (poly 0x1021, init 0xFFFF)."""
    crc = 0xFFFF
    for byte in data:
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return crc & 0xFFFF

def encode_packet(
    packet_type: int = 0x01,
    seq_num: int = 1,
    hop_count: int = 0,
    sender_node_id: int = 0x38AF12C0,
    lat: float = 20.2961,
    lng: float = 85.8245,
    triage: int = 0x02,
    battery_pct: int = 88,
    payload: bytes = b""
) -> bytes:
    """
    Packs incident/telemetry data into a compact binary LAF v1 frame.
    Format:
      >H (2B magic)
      B  (1B version)
      B  (1B type)
      H  (2B seq_and_hop)
      I  (4B node_id)
      i  (4B lat_micro)
      i  (4B lng_micro)
      B  (1B flags: triage & battery)
      B  (1B payload_len)
      + payload (N bytes)
      + >H (2B CRC16)
    """
    lat_micro = int(round(lat * 1_000_000))
    lng_micro = int(round(lng * 1_000_000))

    seq_and_hop = ((seq_num & 0x0FFF) << 4) | (hop_count & 0x0F)
    battery_nibble = int(round(max(0, min(100, battery_pct)) / 6.666)) & 0x0F
    flags = ((triage & 0x0F) << 4) | battery_nibble

    payload_bytes = payload if isinstance(payload, bytes) else str(payload).encode("utf-8")
    payload_len = min(235, len(payload_bytes))
    payload_trimmed = payload_bytes[:payload_len]

    # Pack 20-byte header
    header = struct.pack(
        ">HBBHIiiBB",
        MAGIC_BYTES,
        PROTOCOL_VERSION,
        packet_type,
        seq_and_hop,
        sender_node_id,
        lat_micro,
        lng_micro,
        flags,
        payload_len
    )

    frame_without_crc = header + payload_trimmed
    crc = crc16_ccitt(frame_without_crc)
    full_frame = frame_without_crc + struct.pack(">H", crc)

    return full_frame

def decode_packet(frame: bytes) -> Dict[str, Any]:
    """
    Unpacks and validates a binary LAF v1 frame.
    Raises ValueError if frame is corrupted, truncated, or invalid magic.
    """
    if len(frame) < 22:
        raise ValueError(f"Packet too short ({len(frame)} bytes, minimum 22 required)")

    # Unpack 20-byte header
    header_data = frame[:20]
    magic, version, pkt_type, seq_and_hop, node_id, lat_micro, lng_micro, flags, payload_len = struct.unpack(
        ">HBBHIiiBB", header_data
    )

    if magic != MAGIC_BYTES:
        raise ValueError(f"Invalid magic: 0x{magic:04X} (expected 0xAE61)")

    if len(frame) < 20 + payload_len + 2:
        raise ValueError(f"Truncated frame: expected {20 + payload_len + 2} bytes, got {len(frame)}")

    payload_bytes = frame[20 : 20 + payload_len]
    (received_crc,) = struct.unpack(">H", frame[20 + payload_len : 22 + payload_len])

    computed_crc = crc16_ccitt(frame[: 20 + payload_len])
    crc_valid = (received_crc == computed_crc)

    if not crc_valid:
        raise ValueError(f"CRC16 validation failed: received 0x{received_crc:04X}, computed 0x{computed_crc:04X}")

    seq_num = (seq_and_hop >> 4) & 0x0FFF
    hop_count = seq_and_hop & 0x0F

    triage = (flags >> 4) & 0x0F
    battery_nibble = flags & 0x0F
    battery_pct = int(round(battery_nibble * 6.666))

    payload_text = ""
    payload_json = None
    try:
        payload_text = payload_bytes.decode("utf-8")
        if payload_text.startswith("{") or payload_text.startswith("["):
            payload_json = json.loads(payload_text)
    except Exception:
        payload_text = f"[{len(payload_bytes)} bytes binary]"

    return {
        "magic": hex(magic),
        "version": version,
        "packet_type": pkt_type,
        "packet_type_name": PACKET_TYPES.get(pkt_type, "UNKNOWN"),
        "seq_num": seq_num,
        "hop_count": hop_count,
        "sender_node_id": f"0x{node_id:08X}",
        "lat": round(lat_micro / 1_000_000.0, 6),
        "lng": round(lng_micro / 1_000_000.0, 6),
        "triage": triage,
        "triage_name": TRIAGE_LEVELS.get(triage, "UNKNOWN"),
        "battery_pct": battery_pct,
        "payload_bytes_len": payload_len,
        "payload": payload_text,
        "payload_text": payload_text,
        "payload_json": payload_json,
        "crc": hex(received_crc),
        "crc_valid": crc_valid
    }

lora_codec_service = {
    "encode": encode_packet,
    "decode": decode_packet,
    "crc16": crc16_ccitt
}
