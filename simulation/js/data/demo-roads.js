/* ==========================================================================
   SYNTHETIC DEMO ROAD NETWORK — FRONTEND HACKATHON DEMO ONLY
   Deterministic road segment model for emergency route risk scoring.
   ========================================================================== */

export const INITIAL_DEMO_ROADS = [
  {
    id: 'R1',
    name: 'Sector B4 South Bypass',
    start: [20.2961, 85.8245],
    end: [20.2940, 85.8200],
    coords: [[20.2961, 85.8245], [20.2952, 85.8220], [20.2940, 85.8200]],
    status: 'SAFE', // 'SAFE' | 'FLOODED' | 'BLOCKED' | 'CAUTION'
    riskLevel: 'LOW',
    floodDepthMeters: 0.05,
    travelTimeMinutes: 2.2,
    distanceKm: 0.52,
    passable: true,
    speedLimitKmh: 40,
    elevationMeters: 42
  },
  {
    id: 'R2',
    name: 'West Ridge High-Ground Avenue',
    start: [20.2940, 85.8200],
    end: [20.3010, 85.8230],
    coords: [[20.2940, 85.8200], [20.2975, 85.8212], [20.3010, 85.8230]],
    status: 'SAFE',
    riskLevel: 'LOW',
    floodDepthMeters: 0.0,
    travelTimeMinutes: 3.5,
    distanceKm: 0.81,
    passable: true,
    speedLimitKmh: 50,
    elevationMeters: 46
  },
  {
    id: 'R3',
    name: 'North High Ridge Link',
    start: [20.3010, 85.8230],
    end: [20.3080, 85.8320],
    coords: [[20.3010, 85.8230], [20.3045, 85.8270], [20.3080, 85.8320]],
    status: 'SAFE',
    riskLevel: 'LOW',
    floodDepthMeters: 0.0,
    travelTimeMinutes: 3.8,
    distanceKm: 0.95,
    passable: true,
    speedLimitKmh: 50,
    elevationMeters: 48
  },
  {
    id: 'R4',
    name: 'Central Safehouse Approach Way',
    start: [20.3080, 85.8320],
    end: [20.3100, 85.8380],
    coords: [[20.3080, 85.8320], [20.3090, 85.8350], [20.3100, 85.8380]],
    status: 'SAFE',
    riskLevel: 'LOW',
    floodDepthMeters: 0.0,
    travelTimeMinutes: 1.5,
    distanceKm: 0.65,
    passable: true,
    speedLimitKmh: 35,
    elevationMeters: 45
  },
  {
    id: 'R12',
    name: 'Direct Lowland Boulevard (Short Cut)',
    start: [20.2961, 85.8245],
    end: [20.3080, 85.8320],
    coords: [[20.2961, 85.8245], [20.3015, 85.8278], [20.3080, 85.8320]],
    status: 'SAFE', // Transitions to 'FLOODED' upon dynamic escalation
    riskLevel: 'MEDIUM',
    floodDepthMeters: 0.20,
    travelTimeMinutes: 5.0,
    distanceKm: 1.35,
    passable: true,
    speedLimitKmh: 30,
    elevationMeters: 29
  },
  {
    id: 'R17',
    name: 'Daya Riverbed Submerged Flyover',
    start: [20.2900, 85.8480],
    end: [20.2961, 85.8245],
    coords: [[20.2900, 85.8480], [20.2935, 85.8360], [20.2961, 85.8245]],
    status: 'BLOCKED',
    riskLevel: 'CRITICAL',
    floodDepthMeters: 1.85,
    travelTimeMinutes: 999,
    distanceKm: 2.1,
    passable: false,
    speedLimitKmh: 0,
    elevationMeters: 22
  },
  {
    id: 'R18',
    name: 'Canal Embankment Crossroad',
    start: [20.3015, 85.8310],
    end: [20.3070, 85.8420],
    coords: [[20.3015, 85.8310], [20.3040, 85.8365], [20.3070, 85.8420]],
    status: 'BLOCKED',
    riskLevel: 'CRITICAL',
    floodDepthMeters: 1.10,
    travelTimeMinutes: 999,
    distanceKm: 1.2,
    passable: false,
    speedLimitKmh: 0,
    elevationMeters: 25
  },
  {
    id: 'R5',
    name: 'Trauma Hospital Arterial Link',
    start: [20.3010, 85.8230],
    end: [20.3200, 85.8100],
    coords: [[20.3010, 85.8230], [20.3110, 85.8160], [20.3200, 85.8100]],
    status: 'SAFE',
    riskLevel: 'LOW',
    floodDepthMeters: 0.0,
    travelTimeMinutes: 4.5,
    distanceKm: 1.9,
    passable: true,
    speedLimitKmh: 45,
    elevationMeters: 47
  }
];
