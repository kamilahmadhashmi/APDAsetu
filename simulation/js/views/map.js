/* ==========================================================================
   SMARTPHONE SIMULATOR — EMERGENCY EVACUATION MAP VIEW
   Deterministic, frontend-only emergency navigation for Arjun Sharma (FIELD-104).
   Displays person position, safehouse destination, rescue teams, road network,
   safest corridor, turn-by-turn HUD, and dynamic hazard recalculation.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_RESCUE_TEAMS } from '../data/demo-rescue-teams.js';
import { routeEngine } from '../services/route-engine.js';
import { locationService } from '../services/location-service.js';

let simMap = null;
let userMarker = null;
let accuracyCircle = null;
let safehouseMarker = null;
let rescueTeamMarkers = [];
let roadPolylines = [];
let activeRoutePolyline = null;
let floodZoneLayers = [];

let evacuationState = {
  isActive: false,
  isPaused: false,
  stepIndex: 0,
  progress: 0,
  animInterval: null,
  simPersonLoc: { ...DEMO_PERSON.initialLocation }
};

let routeUnsubscribe = null;
let isLegendExpanded = false;

export function renderMapView(container, actions) {
  const currentRouteState = routeEngine.getRouteState();
  const activeRoute = currentRouteState.activeRoute;
  const primarySafehouse = DEMO_SAFEHOUSES[0];
  const nearestRescue = DEMO_RESCUE_TEAMS[0];

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-950 text-slate-100 relative select-none font-sans overflow-hidden">
      
      <!-- TOP COMPACT EMERGENCY HEADER BAR -->
      <div class="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <span class="material-symbols-outlined text-sm font-bold">navigation</span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h2 class="text-xs font-black text-white tracking-tight uppercase">${DEMO_PERSON.name}</h2>
              <span class="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 font-bold">${DEMO_PERSON.deviceId}</span>
            </div>
            <p class="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span id="map-status-pill">${evacuationState.isActive ? 'EVACUATING • ACTIVE ROUTE' : 'EMERGENCY EVACUATION MODE'}</span>
            </p>
          </div>
        </div>

        <!-- Mode Badge & Recalculate Simulation Trigger -->
        <div class="flex items-center gap-1.5">
          <button id="btn-toggle-flood-event" class="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded text-[9px] font-mono font-bold uppercase transition-all shadow active:scale-95" title="Simulate Flood Breach on Road R12">
            ${currentRouteState.isR12Flooded ? '🌊 RECEDE R12' : '🌊 SIM FLOOD R12'}
          </button>
          <span class="text-[8px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-1 rounded font-bold">
            DEMO
          </span>
        </div>
      </div>

      <!-- RECALCULATION NOTIFICATION TOAST (Hidden by default) -->
      <div id="route-recalc-toast" class="hidden absolute top-12 left-3 right-3 z-40 bg-slate-900/95 border-2 border-amber-500 p-2.5 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 transform">
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-amber-400 text-base shrink-0 animate-bounce">warning</span>
          <div class="flex-1 text-[11px] leading-tight">
            <div class="font-black text-amber-400 uppercase tracking-wide">ROUTE UPDATED</div>
            <div class="text-slate-300 font-mono text-[10px] mt-0.5" id="route-recalc-reason">Road R12 Flooded (Depth: 0.95m). Recalculated safest high-ground corridor.</div>
          </div>
          <button id="btn-dismiss-toast" class="text-slate-400 hover:text-white p-0.5">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>

      <!-- MAIN LEAFLET MAP CONTAINER -->
      <div class="flex-1 relative w-full h-full" id="sim-map-wrap">
        <div id="sim-leaflet-map" class="w-full h-full bg-slate-950"></div>

        <!-- FLOATING MAP CONTROLS -->
        <div class="absolute right-3 top-3 z-[400] flex flex-col gap-1.5">
          <!-- Center on Me -->
          <button id="btn-sim-center-me" class="w-8 h-8 rounded-xl bg-slate-900/90 text-sky-400 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="Center on Me">
            <span class="material-symbols-outlined text-base">my_location</span>
          </button>
          <!-- Fit Entire Route -->
          <button id="btn-sim-fit-route" class="w-8 h-8 rounded-xl bg-slate-900/90 text-emerald-400 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="Fit Evacuation Route">
            <span class="material-symbols-outlined text-base">route</span>
          </button>
          <!-- Toggle Legend -->
          <button id="btn-sim-toggle-legend" class="w-8 h-8 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="Toggle Map Legend">
            <span class="material-symbols-outlined text-base">layers</span>
          </button>
        </div>

        <!-- COLLAPSIBLE MOBILE MAP LEGEND (Top-Left) -->
        <div id="sim-map-legend" class="absolute top-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl text-[9px] font-mono shadow-xl transition-all ${isLegendExpanded ? '' : 'hidden'}">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1 mb-1 font-bold text-slate-300">
            <span>MAP LEGEND</span>
            <button id="btn-close-legend" class="text-slate-400 hover:text-white ml-2">&times;</button>
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white inline-block"></span> 👤 You (Arjun Sharma)</div>
            <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-emerald-500 rounded inline-block"></span> 🟢 Safe Road (High Ground)</div>
            <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-red-600 rounded inline-block"></span> 🔴 Unsafe / Submerged Road</div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 🏠 Safehouse (${primarySafehouse.name.split(' ')[0]})</div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 🚑 Rescue Team (Alpha)</div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-red-900/60 border border-red-500 inline-block"></span> 🌊 Flood Hazard Basin</div>
          </div>
        </div>

        <!-- QUICK RESCUE TEAM FLOAT BADGE (Top Center) -->
        <div id="badge-nearby-rescue" class="absolute top-3 left-1/2 -translate-x-1/2 z-[390] bg-slate-900/90 border border-blue-500/50 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-all">
          <span class="material-symbols-outlined text-blue-400 text-xs font-bold animate-pulse">directions_boat</span>
          <span class="text-[9px] font-mono font-bold text-slate-200">NDRF Alpha: <strong class="text-sky-300">0.7 km (4m)</strong></span>
        </div>

        <!-- BOTTOM INTERACTIVE EVACUATION DRAWER -->
        <div id="sim-bottom-drawer" class="absolute bottom-2 left-2 right-2 z-[400] bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl space-y-2.5">
          
          <!-- Route Overview Summary Bar -->
          <div class="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase" style="background:${activeRoute.riskColor}22; color:${activeRoute.riskColor}; border:1px solid ${activeRoute.riskColor};">
                  ${activeRoute.type}: ${activeRoute.riskScore}
                </span>
                <span class="text-[10px] font-bold text-slate-300 truncate max-w-[130px]">${primarySafehouse.name}</span>
              </div>
              <div class="text-xs font-black text-white mt-0.5 flex items-center gap-2">
                <span class="text-emerald-400">${activeRoute.formattedDistance}</span>
                <span class="text-slate-400">&bull;</span>
                <span>${activeRoute.formattedTime} ETA</span>
              </div>
            </div>

            <!-- Route Mode Switcher Pill (Safest vs Fastest) -->
            <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
              <button id="btn-sel-safest" class="px-2 py-1 rounded-md transition-all ${currentRouteState.activeRouteType === 'SAFEST' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                SAFEST
              </button>
              <button id="btn-sel-fastest" class="px-2 py-1 rounded-md transition-all ${currentRouteState.activeRouteType === 'FASTEST' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                FASTEST
              </button>
            </div>
          </div>

          <!-- TURN-BY-TURN GUIDANCE HUD (Active during Evacuation) -->
          <div id="nav-step-banner" class="${evacuationState.isActive ? 'block' : 'hidden'} bg-slate-900 p-2.5 rounded-xl border border-emerald-500/40 text-[10px] font-mono space-y-1">
            <div class="flex justify-between items-center text-emerald-400 font-bold">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">turn_right</span> NEXT TURN
              </span>
              <span class="text-slate-400" id="nav-step-counter">STEP 1 OF 4</span>
            </div>
            <p class="text-white text-[11px] font-sans font-bold leading-tight" id="nav-step-text">
              ${activeRoute.navSteps[0]?.text || 'Proceed along marked green corridor'}
            </p>
            <div class="flex justify-between text-[9px] text-slate-400 pt-0.5">
              <span>Remaining: <strong class="text-emerald-300" id="nav-dist-remain">${activeRoute.formattedDistance}</strong></span>
              <span>Elevation: <strong class="text-sky-300">46m (Safe High-Ground)</strong></span>
            </div>
          </div>

          <!-- PRIMARY ACTION BUTTONS -->
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-start-evacuation" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">${evacuationState.isActive ? (evacuationState.isPaused ? 'play_arrow' : 'pause') : 'directions_run'}</span>
              <span id="btn-start-text">${evacuationState.isActive ? (evacuationState.isPaused ? 'RESUME' : 'PAUSE') : 'START EVACUATION'}</span>
            </button>

            <button id="btn-send-distress-mini" class="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">sos</span>
              <span>SEND DISTRESS</span>
            </button>
          </div>

        </div>

        <!-- DETAILS MODAL BOTTOM SHEET FOR SAFEHOUSE / RESCUE TEAM (Hidden by default) -->
        <div id="sim-inspector-sheet" class="hidden absolute inset-x-2 bottom-2 z-[450] bg-slate-950/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl space-y-3">
          <div class="flex justify-between items-start border-b border-slate-800 pb-2">
            <div class="flex items-center gap-2">
              <div id="sheet-icon-wrap" class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                <span class="material-symbols-outlined text-lg" id="sheet-icon">night_shelter</span>
              </div>
              <div>
                <h4 class="text-xs font-black text-white uppercase" id="sheet-title">Central Community Shelter</h4>
                <span class="text-[9px] font-mono text-emerald-400" id="sheet-subtitle">SAFEHOUSE &bull; SAFE STATUS</span>
              </div>
            </div>
            <button id="btn-close-sheet" class="text-slate-400 hover:text-white p-1">&times;</button>
          </div>

          <div class="space-y-1.5 text-[10px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800" id="sheet-details-content">
            <!-- Dynamically populated -->
          </div>

          <div class="flex gap-2">
            <button id="btn-sheet-primary-action" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
              NAVIGATE
            </button>
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    initSimLeafletMap();
    attachMapEvents(actions);
    subscribeToRouteUpdates();
  }, 100);
}

/* --------------------------------------------------------------------------
   LEAFLET MAP INITIALIZATION & LAYER RENDERING
   -------------------------------------------------------------------------- */
function initSimLeafletMap() {
  const mapEl = document.getElementById('sim-leaflet-map');
  if (!mapEl) return;

  const initialPersonLoc = evacuationState.simPersonLoc;

  simMap = L.map('sim-leaflet-map', {
    center: [initialPersonLoc.latitude, initialPersonLoc.longitude],
    zoom: 14,
    zoomControl: false,
    attributionControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(simMap);

  renderFloodZones();
  renderRoadNetwork();
  renderSafehouseMarker();
  renderRescueTeamMarkers();
  renderActiveEvacuationRoute();
  renderUserPersonMarker(initialPersonLoc);

  setTimeout(() => {
    if (simMap) simMap.invalidateSize();
  }, 200);
}

function renderUserPersonMarker(loc) {
  if (!simMap) return;

  const lat = loc.latitude;
  const lng = loc.longitude;
  const accuracy = loc.accuracy || 12;

  // Custom User Marker
  const userHtml = `
    <div class="relative w-8 h-8 flex items-center justify-center">
      <!-- Subtle Pulsing Beacon Aura -->
      <div class="absolute inset-0 rounded-full bg-sky-500/30 animate-ping"></div>
      <!-- Core Halo -->
      <div class="relative w-6 h-6 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center shadow-lg">
        <div class="w-2.5 h-2.5 rounded-full bg-sky-600"></div>
      </div>
    </div>
  `;

  const userIcon = L.divIcon({
    className: 'sim-user-gps-marker',
    html: userHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  if (accuracyCircle) simMap.removeLayer(accuracyCircle);
  accuracyCircle = L.circle([lat, lng], {
    radius: accuracy,
    color: '#0284c7',
    fillColor: '#38bdf8',
    fillOpacity: 0.12,
    weight: 1.5,
    dashArray: '3, 3'
  }).addTo(simMap);

  if (userMarker) simMap.removeLayer(userMarker);
  userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(simMap);

  userMarker.bindTooltip('YOU (ARJUN SHARMA)', {
    permanent: true,
    direction: 'top',
    className: 'user-marker-tooltip',
    offset: [0, -16]
  });
}

function renderSafehouseMarker() {
  if (!simMap) return;
  const safehouse = DEMO_SAFEHOUSES[0];

  const html = `
    <div class="relative w-9 h-9 flex items-center justify-center">
      <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white border-2 border-white flex items-center justify-center shadow-lg font-black">
        <span class="material-symbols-outlined text-base">night_shelter</span>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'sim-safehouse-marker',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  if (safehouseMarker) simMap.removeLayer(safehouseMarker);
  safehouseMarker = L.marker([safehouse.lat, safehouse.lng], { icon }).addTo(simMap);

  safehouseMarker.bindTooltip(`🟢 SAFEHOUSE (${safehouse.available} AVAIL)`, {
    permanent: true,
    direction: 'top',
    className: 'user-marker-tooltip',
    offset: [0, -18]
  });

  safehouseMarker.on('click', () => showSafehouseSheet(safehouse));
}

function renderRescueTeamMarkers() {
  if (!simMap) return;
  rescueTeamMarkers.forEach(m => simMap.removeLayer(m));
  rescueTeamMarkers = [];

  DEMO_RESCUE_TEAMS.forEach(team => {
    const html = `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="w-7 h-7 rounded-full bg-blue-600 text-white border-2 border-white flex items-center justify-center shadow-lg">
          <span class="material-symbols-outlined text-xs font-bold">${team.icon}</span>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'sim-rescue-marker',
      html,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([team.lat, team.lng], { icon }).addTo(simMap);
    marker.bindTooltip(`🚑 ${team.callsign} (${team.status})`, {
      permanent: false,
      direction: 'top',
      className: 'user-marker-tooltip',
      offset: [0, -14]
    });

    marker.on('click', () => showRescueTeamSheet(team));
    rescueTeamMarkers.push(marker);
  });
}

function renderRoadNetwork() {
  if (!simMap) return;
  roadPolylines.forEach(p => simMap.removeLayer(p));
  roadPolylines = [];

  const roads = routeEngine.getRoads();

  roads.forEach(road => {
    const isSafe = road.status === 'SAFE';
    const color = isSafe ? '#10b981' : '#ef4444';
    const dashArray = isSafe ? null : '6, 6';

    const polyline = L.polyline(road.coords, {
      color,
      weight: isSafe ? 4 : 5,
      opacity: isSafe ? 0.75 : 0.9,
      dashArray
    }).addTo(simMap);

    polyline.bindPopup(`
      <div class="font-sans text-xs p-1 text-slate-900">
        <strong>${road.name} (${road.id})</strong><br>
        Status: <strong style="color:${color};">${road.status}</strong><br>
        Flood Depth: <strong>${road.floodDepthMeters}m</strong><br>
        Risk Level: <strong>${road.riskLevel}</strong>
      </div>
    `);

    roadPolylines.push(polyline);
  });
}

function renderFloodZones() {
  if (!simMap) return;
  floodZoneLayers.forEach(l => simMap.removeLayer(l));
  floodZoneLayers = [];

  const floodZones = routeEngine.getRouteState().floodZones;

  floodZones.forEach(zone => {
    const polygon = L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: zone.fillOpacity,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(simMap);

    polygon.bindPopup(`
      <div class="font-sans text-xs p-1 text-slate-900">
        <strong style="color:#ef4444;">${zone.name}</strong><br>
        Severity: <strong>${zone.severity}</strong>
      </div>
    `);

    floodZoneLayers.push(polygon);
  });
}

function renderActiveEvacuationRoute() {
  if (!simMap) return;
  if (activeRoutePolyline) simMap.removeLayer(activeRoutePolyline);

  const activeRoute = routeEngine.getRouteState().activeRoute;
  if (!activeRoute || !activeRoute.waypoints) return;

  activeRoutePolyline = L.polyline(activeRoute.waypoints, {
    color: '#059669',
    weight: 6,
    opacity: 0.95,
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(simMap);
}

/* --------------------------------------------------------------------------
   EVACUATION SIMULATION & TURN-BY-TURN MOTION
   -------------------------------------------------------------------------- */
function startEvacuationSimulation() {
  if (evacuationState.isActive && !evacuationState.isPaused) {
    // Pause
    evacuationState.isPaused = true;
    clearInterval(evacuationState.animInterval);
    updateEvacUIState();
    return;
  }

  if (evacuationState.isPaused) {
    // Resume
    evacuationState.isPaused = false;
    resumeEvacuationLoop();
    updateEvacUIState();
    return;
  }

  // Start fresh
  evacuationState.isActive = true;
  evacuationState.isPaused = false;
  evacuationState.stepIndex = 0;
  evacuationState.progress = 0;
  updateEvacUIState();

  const activeRoute = routeEngine.getRouteState().activeRoute;
  if (simMap && activeRoute.waypoints) {
    simMap.fitBounds(activeRoutePolyline.getBounds(), { padding: [40, 40] });
  }

  resumeEvacuationLoop();
}

function resumeEvacuationLoop() {
  const activeRoute = routeEngine.getRouteState().activeRoute;
  const waypoints = activeRoute.waypoints;
  const totalSteps = waypoints.length - 1;

  evacuationState.animInterval = setInterval(() => {
    evacuationState.progress += 0.05;

    if (evacuationState.progress >= 1) {
      evacuationState.progress = 0;
      evacuationState.stepIndex++;

      if (evacuationState.stepIndex >= totalSteps) {
        // Arrived at Safehouse!
        clearInterval(evacuationState.animInterval);
        evacuationState.isActive = false;
        evacuationState.isPaused = false;
        updateEvacUIState();
        showArrivalToast();
        return;
      }
    }

    const currentWp = waypoints[evacuationState.stepIndex];
    const nextWp = waypoints[evacuationState.stepIndex + 1];

    const lat = currentWp[0] + (nextWp[0] - currentWp[0]) * evacuationState.progress;
    const lng = currentWp[1] + (nextWp[1] - currentWp[1]) * evacuationState.progress;

    evacuationState.simPersonLoc = {
      ...evacuationState.simPersonLoc,
      latitude: lat,
      longitude: lng
    };

    renderUserPersonMarker(evacuationState.simPersonLoc);
    locationService.applyExternalState(evacuationState.simPersonLoc);
    updateLiveNavigationMetrics();
  }, 300);
}

function updateEvacUIState() {
  const btnText = document.getElementById('btn-start-text');
  const navBanner = document.getElementById('nav-step-banner');
  const statusPill = document.getElementById('map-status-pill');

  if (btnText) {
    btnText.textContent = evacuationState.isActive
      ? (evacuationState.isPaused ? 'RESUME' : 'PAUSE')
      : 'START EVACUATION';
  }

  if (navBanner) {
    navBanner.className = evacuationState.isActive
      ? 'block bg-slate-900 p-2.5 rounded-xl border border-emerald-500/40 text-[10px] font-mono space-y-1'
      : 'hidden';
  }

  if (statusPill) {
    statusPill.textContent = evacuationState.isActive
      ? (evacuationState.isPaused ? 'EVACUATION PAUSED' : 'EVACUATING • ACTIVE CORRIDOR')
      : 'EMERGENCY EVACUATION MODE';
  }
}

function updateLiveNavigationMetrics() {
  const activeRoute = routeEngine.getRouteState().activeRoute;
  const navStepText = document.getElementById('nav-step-text');
  const navCounter = document.getElementById('nav-step-counter');
  const navDistRemain = document.getElementById('nav-dist-remain');

  const currentNavIndex = Math.min(activeRoute.navSteps.length - 1, Math.floor(evacuationState.stepIndex / 2));
  const currentStep = activeRoute.navSteps[currentNavIndex];

  if (navStepText && currentStep) {
    navStepText.textContent = currentStep.text;
  }
  if (navCounter) {
    navCounter.textContent = `STEP ${currentNavIndex + 1} OF ${activeRoute.navSteps.length}`;
  }

  const remainingFraction = 1 - (evacuationState.stepIndex / (activeRoute.waypoints.length - 1));
  const remainingKm = Math.max(0.1, (activeRoute.distanceKm * remainingFraction)).toFixed(1);
  if (navDistRemain) {
    navDistRemain.textContent = `${remainingKm} km`;
  }
}

function showArrivalToast() {
  const toast = document.getElementById('route-recalc-toast');
  const reason = document.getElementById('route-recalc-reason');
  if (toast && reason) {
    reason.innerHTML = '<strong class="text-emerald-400">🎉 ARRIVED SAFELY AT CENTRAL COMMUNITY SHELTER!</strong><br>Check-in confirmed with Shelter Registry.';
    toast.classList.remove('hidden');
  }
}

/* --------------------------------------------------------------------------
   INTERACTION SHEETS (SAFEHOUSE & RESCUE TEAMS)
   -------------------------------------------------------------------------- */
function showSafehouseSheet(safehouse) {
  const sheet = document.getElementById('sim-inspector-sheet');
  const title = document.getElementById('sheet-title');
  const sub = document.getElementById('sheet-subtitle');
  const details = document.getElementById('sheet-details-content');
  const actionBtn = document.getElementById('btn-sheet-primary-action');

  if (!sheet) return;

  title.textContent = safehouse.name;
  sub.textContent = `${safehouse.type} • ${safehouse.status}`;
  sub.className = 'text-[9px] font-mono text-emerald-400 font-bold';

  details.innerHTML = `
    <div class="flex justify-between"><span>CAPACITY:</span><strong class="text-white">${safehouse.occupied} / ${safehouse.capacity} (${safehouse.available} Available)</strong></div>
    <div class="flex justify-between"><span>ELEVATION:</span><strong class="text-sky-400">${safehouse.elevationMeters}m (Above Inundation Zone)</strong></div>
    <div class="flex justify-between"><span>MEDICAL AID:</span><strong class="text-emerald-400">${safehouse.medicalSupport}</strong></div>
    <div class="flex justify-between"><span>SUPPLIES:</span><strong class="text-white">${safehouse.foodWaterSupply}</strong></div>
    <div class="flex justify-between"><span>POWER BACKUP:</span><strong class="text-amber-400">${safehouse.powerBackup}</strong></div>
    <div class="flex justify-between"><span>COMMS CHANNEL:</span><strong class="text-purple-400">${safehouse.contactChannel}</strong></div>
  `;

  actionBtn.textContent = 'START EVACUATION ROUTE';
  actionBtn.className = 'flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all';
  actionBtn.onclick = () => {
    sheet.classList.add('hidden');
    startEvacuationSimulation();
  };

  sheet.classList.remove('hidden');
}

function showRescueTeamSheet(team) {
  const sheet = document.getElementById('sim-inspector-sheet');
  const title = document.getElementById('sheet-title');
  const sub = document.getElementById('sheet-subtitle');
  const details = document.getElementById('sheet-details-content');
  const actionBtn = document.getElementById('btn-sheet-primary-action');

  if (!sheet) return;

  title.textContent = team.name;
  sub.textContent = `CALLSIGN: ${team.callsign} • ${team.status}`;
  sub.className = 'text-[9px] font-mono text-sky-400 font-bold';

  details.innerHTML = `
    <div class="flex justify-between"><span>STATUS:</span><strong class="text-emerald-400">${team.status}</strong></div>
    <div class="flex justify-between"><span>SPECIALIZATION:</span><strong class="text-white">${team.specialization}</strong></div>
    <div class="flex justify-between"><span>EQUIPMENT:</span><strong class="text-sky-300">${team.equipment}</strong></div>
    <div class="flex justify-between"><span>CREW LEADER:</span><strong class="text-white">${team.leader} (${team.crewCount} Crew)</strong></div>
    <div class="flex justify-between"><span>DISTANCE:</span><strong class="text-amber-400">0.7 km (ETA: ${team.etaMinutes} min)</strong></div>
    <div class="flex justify-between"><span>DIRECT RELAY:</span><strong class="text-purple-400">${team.contactFreq}</strong></div>
  `;

  actionBtn.textContent = team.status === 'AVAILABLE' ? 'REQUEST IMMEDIATE ASSISTANCE' : 'TEAM DEPLOYED';
  actionBtn.className = 'flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all';
  actionBtn.onclick = () => {
    team.status = 'DISPATCHED (Assisting Arjun)';
    showRescueTeamSheet(team);
    renderRescueTeamMarkers();
    locationService.transmitDistressPacket({
      situation: `Direct Rescue Request from Arjun Sharma (${DEMO_PERSON.deviceId})`,
      notes: `Assigned unit: ${team.name}. Coords: ${evacuationState.simPersonLoc.latitude}, ${evacuationState.simPersonLoc.longitude}`
    });
  };

  sheet.classList.remove('hidden');
}

/* --------------------------------------------------------------------------
   EVENT ATTACHMENTS & ROUTE OBSERVER
   -------------------------------------------------------------------------- */
function attachMapEvents(actions) {
  document.getElementById('btn-start-evacuation')?.addEventListener('click', startEvacuationSimulation);
  document.getElementById('btn-send-distress-mini')?.addEventListener('click', actions.openSosModal);

  document.getElementById('btn-sel-safest')?.addEventListener('click', () => {
    routeEngine.setRouteType('SAFEST');
  });

  document.getElementById('btn-sel-fastest')?.addEventListener('click', () => {
    routeEngine.setRouteType('FASTEST');
  });

  document.getElementById('btn-toggle-flood-event')?.addEventListener('click', () => {
    routeEngine.triggerRoadFloodEvent('R12');
  });

  document.getElementById('btn-sim-center-me')?.addEventListener('click', () => {
    if (simMap) {
      simMap.flyTo([evacuationState.simPersonLoc.latitude, evacuationState.simPersonLoc.longitude], 15, { duration: 1.0 });
    }
  });

  document.getElementById('btn-sim-fit-route')?.addEventListener('click', () => {
    if (simMap && activeRoutePolyline) {
      simMap.fitBounds(activeRoutePolyline.getBounds(), { padding: [40, 40] });
    }
  });

  document.getElementById('btn-sim-toggle-legend')?.addEventListener('click', () => {
    isLegendExpanded = !isLegendExpanded;
    const legend = document.getElementById('sim-map-legend');
    if (legend) legend.classList.toggle('hidden', !isLegendExpanded);
  });

  document.getElementById('btn-close-legend')?.addEventListener('click', () => {
    isLegendExpanded = false;
    document.getElementById('sim-map-legend')?.classList.add('hidden');
  });

  document.getElementById('btn-close-sheet')?.addEventListener('click', () => {
    document.getElementById('sim-inspector-sheet')?.classList.add('hidden');
  });

  document.getElementById('btn-dismiss-toast')?.addEventListener('click', () => {
    document.getElementById('route-recalc-toast')?.classList.add('hidden');
  });

  document.getElementById('badge-nearby-rescue')?.addEventListener('click', () => {
    showRescueTeamSheet(DEMO_RESCUE_TEAMS[0]);
  });
}

function subscribeToRouteUpdates() {
  if (routeUnsubscribe) routeUnsubscribe();

  routeUnsubscribe = routeEngine.subscribe((state) => {
    renderRoadNetwork();
    renderActiveEvacuationRoute();

    const floodBtn = document.getElementById('btn-toggle-flood-event');
    if (floodBtn) {
      floodBtn.textContent = state.isR12Flooded ? '🌊 RECEDE R12' : '🌊 SIM FLOOD R12';
    }

    if (state.lastChangeReason) {
      const toast = document.getElementById('route-recalc-toast');
      const reason = document.getElementById('route-recalc-reason');
      if (toast && reason) {
        reason.textContent = state.lastChangeReason;
        toast.classList.remove('hidden');
      }
    }
  });
}
