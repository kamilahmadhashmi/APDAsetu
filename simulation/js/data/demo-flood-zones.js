/* ==========================================================================
   SYNTHETIC DEMO FLOOD ZONES — FRONTEND HACKATHON DEMO ONLY
   Deterministic hazard polygon overlays affecting road risk scores.
   ========================================================================== */

export const DEMO_FLOOD_ZONES = [
  {
    id: 'FLOOD-SECTOR-EAST',
    name: 'Daya River Primary Breach Basin',
    severity: 'EXTREME (Inundation Depth: 2.8m - 3.4m)',
    coords: [
      [20.2850, 85.8350],
      [20.3020, 85.8330],
      [20.3080, 85.8480],
      [20.2920, 85.8520],
      [20.2820, 85.8420]
    ],
    color: '#ef4444',
    fillOpacity: 0.35,
    impassableRoads: ['R17', 'R18']
  },
  {
    id: 'FLOOD-EXPANSION-ZONE',
    name: 'Sector B4 Lowland Inundation Overflow (Dynamic)',
    severity: 'HIGH (Expanding: 0.8m - 1.2m)',
    coords: [
      [20.2960, 85.8240],
      [20.3040, 85.8270],
      [20.3060, 85.8340],
      [20.2980, 85.8320]
    ],
    color: '#f97316',
    fillOpacity: 0.28,
    impassableRoads: ['R12'],
    isDynamicSurge: true
  }
];
