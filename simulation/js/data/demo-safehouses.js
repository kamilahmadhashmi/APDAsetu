/* ==========================================================================
   SYNTHETIC DEMO SAFEHOUSE DESTINATIONS — FRONTEND HACKATHON DEMO ONLY
   Deterministic hardcoded shelter data.
   ========================================================================== */

export const DEMO_SAFEHOUSES = [
  {
    id: 'SAFEHOUSE-01',
    name: 'Central Community Shelter',
    type: 'Primary Elevated Safehouse',
    lat: 20.3100,
    lng: 85.8380,
    capacity: 240,
    occupied: 117,
    available: 123,
    status: 'SAFE', // 'SAFE' | 'FULL' | 'AT_CAPACITY'
    medicalSupport: 'AVAILABLE',
    foodWaterSupply: 'ADEQUATE (72h Reserve)',
    powerBackup: 'Solar + 120kVA Diesel Generator',
    elevationMeters: 45,
    contactChannel: 'VHF Ch 16 / BLE Gateway #08',
    amenities: ['First Aid Clinic', 'Ration Packs', 'Device Charging Hub', 'Bedding Area'],
    isPrimary: true
  },
  {
    id: 'SAFEHOUSE-02',
    name: 'St. Jude Elevated High-School',
    type: 'Secondary Neighborhood Shelter',
    lat: 20.2850,
    lng: 85.8120,
    capacity: 80,
    occupied: 76,
    available: 4,
    status: 'HIGH_LOAD',
    medicalSupport: 'BASIC FIRST AID',
    foodWaterSupply: 'LIMITED (12h Reserve)',
    powerBackup: 'Battery Inverter',
    elevationMeters: 38,
    contactChannel: 'BLE Relay Node 0x4F2A',
    amenities: ['Emergency Shelter', 'Clean Water Refill'],
    isPrimary: false
  },
  {
    id: 'SAFEHOUSE-03',
    name: 'Apex Kalinga Stadium Complex',
    type: 'NDRF Regional Evacuation Center',
    lat: 20.3300,
    lng: 85.8500,
    capacity: 500,
    occupied: 150,
    available: 350,
    status: 'SAFE',
    medicalSupport: 'FULL TRAUMA HOSPITAL',
    foodWaterSupply: 'EXCELLENT (5 Days)',
    powerBackup: 'Dedicated Grid Substation',
    elevationMeters: 52,
    contactChannel: 'Satellite Uplink Ch 02',
    amenities: ['Helipad', 'Surgical Ward', 'Kitchen Complex', 'Family Tents'],
    isPrimary: false
  }
];
