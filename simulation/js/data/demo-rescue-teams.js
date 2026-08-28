/* ==========================================================================
   SYNTHETIC DEMO RESCUE TEAMS — FRONTEND HACKATHON DEMO ONLY
   ========================================================================== */

export const DEMO_RESCUE_TEAMS = [
  {
    id: 'RESCUE-ALPHA',
    name: 'Rescue Team Alpha (NDRF Boat Squad)',
    callsign: 'ALPHA-1',
    lat: 20.3020,
    lng: 85.8290,
    status: 'AVAILABLE', // 'AVAILABLE' | 'DEPLOYED' | 'DISPATCHED' | 'EN_ROUTE'
    specialization: 'FLOOD & WATER EXTRACTION',
    equipment: '40HP Zodiac Rigid-Inflatable Boat + Thermal Scanner',
    crewCount: 4,
    leader: 'Capt. R. Deshmukh',
    etaMinutes: 4,
    contactFreq: 'VHF Ch 12 (Direct Relay)',
    icon: 'directions_boat',
    color: '#0284c7'
  },
  {
    id: 'RESCUE-BRAVO',
    name: 'Paramedic Ambulance Unit Bravo',
    callsign: 'BRAVO-2',
    lat: 20.2850,
    lng: 85.8150,
    status: 'DEPLOYED',
    specialization: 'ADVANCED TRAUMA & TRIAGE',
    equipment: 'All-Terrain 4x4 Medical Ambulance + Oxygen',
    crewCount: 3,
    leader: 'Dr. Ananya Ray',
    etaMinutes: 11,
    contactFreq: 'BLE Mesh Hop #2',
    icon: 'emergency',
    color: '#f59e0b'
  },
  {
    id: 'RESCUE-CHARLIE',
    name: 'Air Rescue Chopper 02',
    callsign: 'CHARLIE-AIR',
    lat: 20.3150,
    lng: 85.8200,
    status: 'AIRBORNE PATROL',
    specialization: 'AERIAL WINCH EXTRACTION',
    equipment: 'ALH Dhruv Helicopter + 150m Rescue Hoist',
    crewCount: 4,
    leader: 'Sqn Ldr. K. Sen',
    etaMinutes: 6,
    contactFreq: 'Aviation Band 121.5 MHz',
    icon: 'helicopter',
    color: '#a855f7'
  }
];
