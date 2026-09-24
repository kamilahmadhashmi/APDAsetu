"""
==========================================================================
AEGIS-MESH / AAPDASETU - ED25519 ANTI-SPOOFING & TACTICAL RBAC ENGINE
==========================================================================
1. Cryptographic device authentication via asymmetric Ed25519 keypairs.
2. Anti-spoofing beacon verification (prevents phantom SOS broadcast flooding).
3. Role-Based Access Control (RBAC):
   - CITIZEN (Level 1): Ingest SOS, view safe zones.
   - NDRF_RESPONDER (Level 2): Claim incidents, triage updates, fleet ops.
   - INCIDENT_COMMANDER (Level 3): Full dispatch, siren triggers, CAP alerts.
"""

from typing import Dict, Any, Optional
import time
import base64
import json
import hmac
import hashlib
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

# Role Hierarchy
ROLES = {
    "CITIZEN": {
        "level": 1,
        "name": "Citizen / Field Node",
        "permissions": ["sos:ingest", "evacuation:view", "mesh:ping"]
    },
    "NDRF_RESPONDER": {
        "level": 2,
        "name": "NDRF / SDRF Rescue Operator",
        "permissions": ["sos:ingest", "evacuation:view", "mesh:ping", "incident:claim", "incident:triage", "fleet:status"]
    },
    "INCIDENT_COMMANDER": {
        "level": 3,
        "name": "District Incident Commander (DM/NDRF HQ)",
        "permissions": ["sos:ingest", "evacuation:view", "mesh:ping", "incident:claim", "incident:triage", "fleet:status", "fleet:dispatch", "cap:broadcast", "zone:evacuate", "siren:trigger"]
    }
}

AUTH_SECRET = b"AEGIS-TACTICAL-SECURE-KEY-2026-DISASTER-DISPATCH"

class AuthEngine:
    def __init__(self):
        # Generate persistent demonstration master keys
        self._master_priv = ed25519.Ed25519PrivateKey.generate()
        self._master_pub = self._master_priv.public_key()

    def generate_ed25519_keypair(self) -> Dict[str, str]:
        """Generates a raw 32-byte Ed25519 keypair for an IoT node or field operator."""
        priv = ed25519.Ed25519PrivateKey.generate()
        pub = priv.public_key()
        priv_bytes = priv.private_bytes_raw()
        pub_bytes = pub.public_bytes_raw()
        return {
            "private_key_hex": priv_bytes.hex(),
            "public_key_hex": pub_bytes.hex()
        }

    def sign_payload(self, private_key_hex: str, message: bytes) -> str:
        """Signs raw message bytes using an Ed25519 private key."""
        priv_bytes = bytes.fromhex(private_key_hex)
        priv = ed25519.Ed25519PrivateKey.from_private_bytes(priv_bytes)
        sig = priv.sign(message)
        return sig.hex()

    def verify_ed25519_signature(self, public_key_hex: str, signature_hex: str, message: bytes) -> bool:
        """
        Verifies that an emergency beacon was signed by the holder of public_key_hex.
        Prevents malicious radio spoofing and phantom SOS injection.
        """
        try:
            pub_bytes = bytes.fromhex(public_key_hex)
            pub = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
            sig_bytes = bytes.fromhex(signature_hex)
            pub.verify(sig_bytes, message)
            return True
        except (InvalidSignature, ValueError, Exception):
            return False

    def create_jwt_token(self, role: str = "CITIZEN", node_id: str = "NODE-DEMO-01", expires_in_sec: int = 86400) -> str:
        """
        Issues an authenticated tactical JWT token with embedded RBAC permissions.
        """
        if role not in ROLES:
            role = "CITIZEN"

        header = {"alg": "HS256", "typ": "JWT"}
        now = int(time.time())
        payload = {
            "sub": node_id,
            "role": role,
            "role_level": ROLES[role]["level"],
            "role_name": ROLES[role]["name"],
            "permissions": ROLES[role]["permissions"],
            "iat": now,
            "exp": now + expires_in_sec
        }

        b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

        signing_input = f"{b64_header}.{b64_payload}".encode()
        sig = hmac.new(AUTH_SECRET, signing_input, hashlib.sha256).digest()
        b64_sig = base64.urlsafe_b64encode(sig).decode().rstrip("=")

        return f"{b64_header}.{b64_payload}.{b64_sig}"

    def verify_token(self, token: str, required_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates token signature, expiration, and ensures user meets required RBAC level.
        """
        if not token:
            raise ValueError("Authentication token missing")

        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token")

        b64_header, b64_payload, b64_sig = parts
        signing_input = f"{b64_header}.{b64_payload}".encode()

        # Recompute signature
        expected_sig = hmac.new(AUTH_SECRET, signing_input, hashlib.sha256).digest()
        actual_sig = base64.urlsafe_b64decode(b64_sig + "==")

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Cryptographic token signature validation failed")

        payload = json.loads(base64.urlsafe_b64decode(b64_payload + "==").decode())
        if time.time() > payload.get("exp", 0):
            raise ValueError("Tactical token has expired")

        if required_role:
            req_level = ROLES.get(required_role, {}).get("level", 99)
            user_level = payload.get("role_level", 0)
            if user_level < req_level:
                raise PermissionError(f"Insufficient privileges: requires {required_role} (Level {req_level}), current role is {payload.get('role')} (Level {user_level})")

        return payload

auth_engine_service = AuthEngine()
