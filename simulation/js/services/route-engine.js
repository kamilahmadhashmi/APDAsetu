/* ==========================================================================
   DETERMINISTIC FRONTEND ROUTE SELECTION & EVACUATION NAVIGATION ENGINE
   Calculates Safest vs Fastest synthetic evacuation routes based on road risk,
   elevation, and flood zone exposure. Supports dynamic road hazard triggers.
   ========================================================================== */

import { INITIAL_DEMO_ROADS } from '../data/demo-roads.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_FLOOD_ZONES } from '../data/demo-flood-zones.js';

class RouteEngine {
  constructor() {
    this.roads = JSON.parse(JSON.stringify(INITIAL_DEMO_ROADS));
    this.isR12Flooded = false;
    this.primarySafehouse = DEMO_SAFEHOUSES[0];
    this.activeRouteType = 'SAFEST'; // 'SAFEST' | 'FASTEST' | 'CUSTOM'
    this.subscribers = new Set();
  }

  getRoads() {
    return this.roads;
  }

  getSafehouse() {
    return this.primarySafehouse;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getRouteState());
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(changeReason = null) {
    const state = this.getRouteState(changeReason);
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('[RouteEngine] Subscriber error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resqnet-route-state-changed', { detail: state }));
    }
  }

  // Toggle dynamic flood escalation on Road R12
  triggerRoadFloodEvent(roadId = 'R12') {
    this.isR12Flooded = !this.isR12Flooded;

    const targetRoad = this.roads.find(r => r.id === roadId);
    if (targetRoad) {
      if (this.isR12Flooded) {
        targetRoad.status = 'FLOODED';
        targetRoad.riskLevel = 'CRITICAL';
        targetRoad.floodDepthMeters = 0.95;
        targetRoad.passable = false;
        targetRoad.travelTimeMinutes = 999;
        this.activeRouteType = 'SAFEST';
        this.notifySubscribers(`ROAD ${roadId} INUNDATED (Depth: 0.95m) — Fast route blocked, recalculated safest high-ground corridor.`);
      } else {
        targetRoad.status = 'SAFE';
        targetRoad.riskLevel = 'MEDIUM';
        targetRoad.floodDepthMeters = 0.15;
        targetRoad.passable = true;
        targetRoad.travelTimeMinutes = 5.0;
        this.notifySubscribers(`ROAD ${roadId} RECEDED — Short cut passable under caution.`);
      }
    }
  }

  setRouteType(type) {
    this.activeRouteType = type;
    this.notifySubscribers(`User selected ${type} routing profile.`);
  }

  // Calculate Safest vs Fastest routes deterministically
  calculateRoutes() {
    // 1. SAFEST ROUTE: High Ground Ridge Corridor (R1 -> R2 -> R3 -> R4)
    const safestWaypoints = [
      [20.2961, 85.8245], // User start
      [20.2952, 85.8220],
      [20.2940, 85.8200], // R1
      [20.2975, 85.8212],
      [20.3010, 85.8230], // R2
      [20.3045, 85.8270],
      [20.3080, 85.8320], // R3
      [20.3090, 85.8350],
      [20.3100, 85.8380]  // Safehouse R4
    ];

    const safestRoute = {
      id: 'ROUTE-SAFEST-RIDGE',
      type: 'SAFEST',
      name: 'Sector 4 High-Ground Ridge Corridor',
      distanceKm: 1.8,
      formattedDistance: '1.8 km',
      travelTimeMinutes: 12,
      formattedTime: '12 min',
      riskScore: 'LOW RISK',
      riskColor: '#10b981',
      roadSegmentIds: ['R1', 'R2', 'R3', 'R4'],
      elevationProfile: '42m - 48m (Above 100-yr Flood Level)',
      floodExposure: '0.0% (Zero Submerged Areas)',
      passable: true,
      waypoints: safestWaypoints,
      navSteps: [
        { id: 1, action: 'DEPART', text: 'Depart Sector B4 moving SOUTHWEST on Ridge Bypass (R1)', distance: '400m', time: '2 min', road: 'R1', safe: true },
        { id: 2, action: 'TURN_RIGHT', text: 'Turn RIGHT onto West Ridge High-Ground Avenue (R2)', distance: '600m', time: '4 min', road: 'R2', safe: true },
        { id: 3, action: 'CONTINUE', text: 'Continue NORTH on Elevated Ridge Link (R3). Elevation 48m', distance: '550m', time: '4 min', road: 'R3', safe: true },
        { id: 4, action: 'ARRIVE', text: 'Turn RIGHT onto Shelter Approach Way (R4) into Safehouse Gate', distance: '250m', time: '2 min', road: 'R4', safe: true }
      ]
    };

    // 2. FASTEST ROUTE: Lowland Direct Cut (R12 -> R4)
    const isFastestBlocked = this.isR12Flooded;
    const fastestWaypoints = [
      [20.2961, 85.8245],
      [20.3015, 85.8278],
      [20.3080, 85.8320],
      [20.3090, 85.8350],
      [20.3100, 85.8380]
    ];

    const fastestRoute = {
      id: 'ROUTE-FASTEST-LOWLAND',
      type: 'FASTEST',
      name: 'Direct Lowland Boulevard',
      distanceKm: 1.3,
      formattedDistance: '1.3 km',
      travelTimeMinutes: isFastestBlocked ? 999 : 8,
      formattedTime: isFastestBlocked ? 'IMPASSABLE' : '8 min',
      riskScore: isFastestBlocked ? 'CRITICAL (SUBMERGED)' : 'MEDIUM RISK (LOWLAND)',
      riskColor: isFastestBlocked ? '#ef4444' : '#f59e0b',
      roadSegmentIds: ['R12', 'R4'],
      elevationProfile: '29m (Low Basin)',
      floodExposure: isFastestBlocked ? 'HIGH (0.95m Submerged)' : 'MODERATE (0.15m Puddles)',
      passable: !isFastestBlocked,
      waypoints: fastestWaypoints,
      navSteps: [
        { id: 1, action: 'DEPART', text: isFastestBlocked ? '⚠️ ROAD BLOCKED — Water level 0.95m on Lowland Blvd' : 'Depart NORTH on Direct Lowland Boulevard (R12)', distance: '850m', time: '5 min', road: 'R12', safe: !isFastestBlocked },
        { id: 2, action: 'ARRIVE', text: 'Arrive at Central Community Shelter Gate', distance: '450m', time: '3 min', road: 'R4', safe: true }
      ]
    };

    return { safestRoute, fastestRoute };
  }

  getRouteState(changeReason = null) {
    const { safestRoute, fastestRoute } = this.calculateRoutes();
    const activeRoute = this.activeRouteType === 'FASTEST' && fastestRoute.passable ? fastestRoute : safestRoute;

    const safeCount = this.roads.filter(r => r.status === 'SAFE').length;
    const unsafeCount = this.roads.filter(r => r.status !== 'SAFE').length;

    return {
      activeRoute,
      safestRoute,
      fastestRoute,
      activeRouteType: this.activeRouteType,
      isR12Flooded: this.isR12Flooded,
      roads: this.roads,
      floodZones: DEMO_FLOOD_ZONES,
      safehouse: this.primarySafehouse,
      summary: {
        safeRoadsCount: safeCount,
        unsafeRoadsCount: unsafeCount,
        floodRisk: this.isR12Flooded ? 'CRITICAL SURGE' : 'HIGH INUNDATION'
      },
      lastChangeReason: changeReason,
      timestamp: Date.now()
    };
  }
}

export const routeEngine = new RouteEngine();
