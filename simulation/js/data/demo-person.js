/* ==========================================================================
   SYNTHETIC DEMO PERSON PROFILE — FRONTEND HACKATHON DEMONSTRATION ONLY
   All data is deterministic and hardcoded for demonstration purposes.
   ========================================================================== */

export const DEMO_PERSON = Object.freeze({
  name: 'Arjun Sharma',
  deviceId: 'FIELD-104',
  deviceModel: 'Tactical SatPhone 5G / BLE Mesh Node',
  role: 'Citizen / Field Operator',
  status: 'AT RISK', // 'SAFE' | 'AT RISK' | 'EVACUATING' | 'ASSISTED'
  bloodGroup: 'O+',
  emergencyContact: '+91 98765 43210 (Pooja Sharma - Spouse)',
  medicalAlert: 'Asthmatic (Carrying Inhaler)',
  initialLocation: {
    latitude: 20.2961,
    longitude: 85.8245,
    accuracy: 12, // meters
    altitude: 38,
    label: 'Sector B4 Inundation Zone (Near Daya River Basin)'
  },
  batteryLevel: 87,
  meshRelayHops: 3
});
