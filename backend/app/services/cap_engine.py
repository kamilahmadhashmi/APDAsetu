"""
==========================================================================
AEGIS-MESH / AAPDASETU - OASIS CAP v1.2 COMMON ALERTING PROTOCOL ENGINE
==========================================================================
Generates and validates standards-compliant CAP v1.2 XML (ITU-T X.1303)
compatible with NDMA SACHET (India), FEMA IPAWS (USA), and UN WMO alerting.
"""

from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import Dict, Any, List, Optional
import uuid

CAP_NAMESPACE = "urn:oasis:names:tc:emergency:cap:1.2"

class CapAlertEngine:
    def __init__(self):
        self.default_sender = "ops@aapda-setu.gov.in"
        self.default_source = "AAPDASETU-COMMAND-DISPATCH"

    def build_cap_xml(
        self,
        identifier: Optional[str] = None,
        event: str = "Flash Flood Emergency & Evacuation Order",
        urgency: str = "Immediate",
        severity: str = "Severe",
        certainty: str = "Observed",
        headline: str = "URGENT: Flash Flood Inundation Warning for Low-Lying Sectors",
        description: str = "Rapidly rising water levels detected by IoT hydrometric sensors and aerial UAV reconnaissance.",
        instruction: str = "Evacuate immediately to designated high-ground trauma shelters via green corridors.",
        area_desc: str = "Bhubaneswar & Cuttack Mahanadi River Basin Sector B4",
        circle: Optional[str] = "20.2961,85.8245,6.0",
        polygon: Optional[str] = None,
        sender: Optional[str] = None,
        status: str = "Actual",
        msg_type: str = "Alert",
        scope: str = "Public"
    ) -> str:
        """
        Builds a strictly compliant OASIS CAP v1.2 XML document string.
        """
        alert_id = identifier or f"IN-OD-AAPDA-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        sent_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        sender_id = sender or self.default_sender

        root = ET.Element("alert", xmlns=CAP_NAMESPACE)
        ET.SubElement(root, "identifier").text = alert_id
        ET.SubElement(root, "sender").text = sender_id
        ET.SubElement(root, "sent").text = sent_iso
        ET.SubElement(root, "status").text = status
        ET.SubElement(root, "msgType").text = msg_type
        ET.SubElement(root, "source").text = self.default_source
        ET.SubElement(root, "scope").text = scope
        ET.SubElement(root, "code").text = "IPAWS-CAP-1.2"

        info = ET.SubElement(root, "info")
        ET.SubElement(info, "language").text = "en-IN"
        ET.SubElement(info, "category").text = "Safety"
        ET.SubElement(info, "event").text = event
        ET.SubElement(info, "urgency").text = urgency
        ET.SubElement(info, "severity").text = severity
        ET.SubElement(info, "certainty").text = certainty
        ET.SubElement(info, "eventCode").text = "FLW"
        ET.SubElement(info, "expires").text = (datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        ET.SubElement(info, "senderName").text = "District Disaster Management Authority (DDMA)"
        ET.SubElement(info, "headline").text = headline
        ET.SubElement(info, "description").text = description
        ET.SubElement(info, "instruction").text = instruction
        ET.SubElement(info, "web").text = "https://aapda-setu.gov.in"

        # Parameter tags for siren / cell broadcast
        param_cbs = ET.SubElement(info, "parameter")
        ET.SubElement(param_cbs, "valueName").text = "CellBroadcastChannel"
        ET.SubElement(param_cbs, "value").text = "4370"

        param_siren = ET.SubElement(info, "parameter")
        ET.SubElement(param_siren, "valueName").text = "SirenTrigger"
        ET.SubElement(param_siren, "value").text = "EVAC_SIREN_HIGH_LOW_WARBLE"

        # Geographic Target Area
        area = ET.SubElement(info, "area")
        ET.SubElement(area, "areaDesc").text = area_desc
        if circle:
            ET.SubElement(area, "circle").text = circle
        if polygon:
            ET.SubElement(area, "polygon").text = polygon

        # Convert to pretty XML string
        xml_bytes = ET.tostring(root, encoding="utf-8")
        parsed = minidom.parseString(xml_bytes)
        return parsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")

    def parse_cap_xml(self, xml_str: str) -> Dict[str, Any]:
        """
        Parses a CAP v1.2 XML string into structured disaster fields.
        """
        root = ET.fromstring(xml_str)
        ns = {"cap": CAP_NAMESPACE}

        def get_text(xpath, parent=root):
            el = parent.find(xpath, ns)
            if el is None:
                # Fallback without namespace
                clean_tag = xpath.split(":")[-1].replace(".//", "").replace("/", "")
                el = parent.find(f".//{clean_tag}")
            return el.text if el is not None and el.text else ""

        identifier = get_text("cap:identifier")
        sender = get_text("cap:sender")
        sent = get_text("cap:sent")
        status = get_text("cap:status")
        msg_type = get_text("cap:msgType")

        info_el = root.find("cap:info", ns)
        if info_el is None:
            info_el = root.find(".//info")

        headline = ""
        event = ""
        urgency = ""
        severity = ""
        instruction = ""
        circle = ""
        area_desc = ""

        if info_el is not None:
            headline = get_text("cap:headline", info_el)
            event = get_text("cap:event", info_el)
            urgency = get_text("cap:urgency", info_el)
            severity = get_text("cap:severity", info_el)
            instruction = get_text("cap:instruction", info_el)
            circle = get_text("circle", info_el)
            area_desc = get_text("areaDesc", info_el)

        return {
            "identifier": identifier,
            "sender": sender,
            "sent": sent,
            "status": status,
            "msg_type": msg_type,
            "event": event,
            "urgency": urgency,
            "severity": severity,
            "headline": headline,
            "instruction": instruction,
            "area_desc": area_desc,
            "circle": circle,
            "cap_version": "1.2"
        }

cap_engine_service = CapAlertEngine()
