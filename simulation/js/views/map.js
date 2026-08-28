/* ==========================================================================
   SMARTPHONE SIMULATOR — EMERGENCY EVACUATION MAP VIEW
   Deterministic, frontend-only emergency navigation for Arjun Sharma (FIELD-104).
   Fully integrated with the centralized global multilingual i18n engine.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_RESCUE_TEAMS } from '../data/demo-rescue-teams.js';
import { routeEngine } from '../services/route-engine.js';
import { locationService } from '../services/location-service.js';
import { i18nService, t } from '../services/i18n-service.js';

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
let i18nUnsubscribe = null;
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
              <h2 class="text-xs font-black text-white tracking-tight uppercase" data-i18n="person_name">${t('person_name')}</h2>
              <span class="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 font-bold">${DEMO_PERSON.deviceId}</span>
            </div>
            <p class="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span id="map-status-pill">${evacuationState.isActive ? t('evacuation_active') : t('status_at_risk')}</span>
            </p>
          </div>
        </div>

        <!-- Mode Badge & Recalculate Simulation Trigger -->
        <div class="flex items-center gap-1.5">
          <button id="btn-toggle-flood-event" class="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded text-[9px] font-mono font-bold uppercase transition-all shadow active:scale-95" title="Simulate Flood Breach on Road R12">
            ${currentRouteState.isR12Flooded ? '🌊 ' + t('recede_flood_btn') : '🌊 ' + t('sim_flood_btn')}
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
            <div class="font-black text-amber-400 uppercase tracking-wide" data-i18n="recalc_toast_title">${t('recalc_toast_title')}</div>
            <div class="text-slate-300 font-mono text-[10px] mt-0.5" id="route-recalc-reason">${t('recalc_toast_reason')}</div>
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
          <button id="btn-sim-center-me" class="w-8 h-8 rounded-xl bg-slate-900/90 text-sky-400 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="${t('center_on_me')}">
            <span class="material-symbols-outlined text-base">my_location</span>
          </button>
          <!-- Fit Entire Route -->
          <button id="btn-sim-fit-route" class="w-8 h-8 rounded-xl bg-slate-900/90 text-emerald-400 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="${t('safest_route')}">
            <span class="material-symbols-outlined text-base">route</span>
          </button>
          <!-- Toggle Legend -->
          <button id="btn-sim-toggle-legend" class="w-8 h-8 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-700 flex items-center justify-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all" title="${t('toggle_legend')}">
            <span class="material-symbols-outlined text-base">layers</span>
          </button>
        </div>

        <!-- COLLAPSIBLE MOBILE MAP LEGEND (Top-Left) -->
        <div id="sim-map-legend" class="absolute top-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl text-[9px] font-mono shadow-xl transition-all ${isLegendExpanded ? '' : 'hidden'}">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1 mb-1 font-bold text-slate-300">
            <span data-i18n="legend_title">${t('legend_title')}</span>
            <button id="btn-close-legend" class="text-slate-400 hover:text-white ml-2">&times;</button>
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white inline-block"></span> 👤 <span data-i18n="legend_you">${t('legend_you')}</span></div>
            <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-emerald-500 rounded inline-block"></span> 🟢 <span data-i18n="legend_safe_road">${t('legend_safe_road')}</span></div>
            <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-red-600 rounded inline-block"></span> 🔴 <span data-i18n="legend_unsafe_road">${t('legend_unsafe_road')}</span></div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 🏠 <span data-i18n="legend_safehouse">${t('legend_safehouse')}</span></div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 🚑 <span data-i18n="legend_rescue">${t('legend_rescue')}</span></div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-red-900/60 border border-red-500 inline-block"></span> 🌊 <span data-i18n="legend_flood">${t('legend_flood')}</span></div>
          </div>
        </div>

        <!-- QUICK RESCUE TEAM FLOAT BADGE (Top Center) -->
        <div id="badge-nearby-rescue" class="absolute top-3 left-1/2 -translate-x-1/2 z-[390] bg-slate-900/90 border border-blue-500/50 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-all">
          <span class="material-symbols-outlined text-blue-400 text-xs font-bold animate-pulse">directions_boat</span>
          <span class="text-[9px] font-mono font-bold text-slate-200">NDRF Alpha: <strong class="text-sky-300">${i18nService.formatDistance(0.7)} (${i18nService.formatTime(4)})</strong></span>
        </div>

        <!-- BOTTOM INTERACTIVE EVACUATION DRAWER -->
        <div id="sim-bottom-drawer" class="absolute bottom-2 left-2 right-2 z-[400] bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl space-y-2.5">
          
          <!-- Route Overview Summary Bar -->
          <div class="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase" style="background:${activeRoute.riskColor}22; color:${activeRoute.riskColor}; border:1px solid ${activeRoute.riskColor};">
                  ${activeRoute.type === 'SAFEST' ? t('safest_route') : t('fastest_route')}: ${t('status_low_risk')}
                </span>
                <span class="text-[10px] font-bold text-slate-300 truncate max-w-[130px]" data-i18n="safehouse_name">${t('safehouse_name')}</span>
              </div>
              <div class="text-xs font-black text-white mt-0.5 flex items-center gap-2">
                <span class="text-emerald-400" id="route-display-dist">${i18nService.formatDistance(activeRoute.distanceKm)}</span>
                <span class="text-slate-400">&bull;</span>
                <span id="route-display-time">${i18nService.formatTime(activeRoute.travelTimeMinutes)}</span>
              </div>
            </div>

            <!-- Route Mode Switcher Pill (Safest vs Fastest) -->
            <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
              <button id="btn-sel-safest" class="px-2 py-1 rounded-md transition-all ${currentRouteState.activeRouteType === 'SAFEST' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}" data-i18n="safest_route">
                ${t('safest_route')}
              </button>
              <button id="btn-sel-fastest" class="px-2 py-1 rounded-md transition-all ${currentRouteState.activeRouteType === 'FASTEST' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}" data-i18n="fastest_route">
                ${t('fastest_route')}
              </button>
            </div>
          </div>

          <!-- TURN-BY-TURN GUIDANCE HUD (Active during Evacuation) -->
          <div id="nav-step-banner" class="${evacuationState.isActive ? 'block' : 'hidden'} bg-slate-900 p-2.5 rounded-xl border border-emerald-500/40 text-[10px] font-mono space-y-1">
            <div class="flex justify-between items-center text-emerald-400 font-bold">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">turn_right</span> <span data-i18n="next_turn">${t('next_turn')}</span>
              </span>
              <span class="text-slate-400" id="nav-step-counter">STEP 1 OF 4</span>
            </div>
            <p class="text-white text-[11px] font-sans font-bold leading-tight" id="nav-step-text">
              ${activeRoute.navSteps[0]?.text || 'Proceed along marked green corridor'}
            </p>
            <div class="flex justify-between text-[9px] text-slate-400 pt-0.5">
              <span><span data-i18n="remaining_distance">${t('remaining_distance')}</span>: <strong class="text-emerald-300" id="nav-dist-remain">${i18nService.formatDistance(activeRoute.distanceKm)}</strong></span>
              <span><strong class="text-sky-300" data-i18n="elevation_safe">${t('elevation_safe')}</strong></span>
            </div>
          </div>

          <!-- PRIMARY ACTION BUTTONS -->
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-start-evacuation" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">${evacuationState.isActive ? (evacuationState.isPaused ? 'play_arrow' : 'pause') : 'directions_run'}</span>
              <span id="btn-start-text">${evacuationState.isActive ? (evacuationState.isPaused ? t('resume_evacuation') : t('pause_evacuation')) : t('start_evacuation')}</span>
            </button>

            <button id="btn-send-distress-mini" class="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">sos</span>
              <span data-i18n="sos_button">${t('sos_button')}</span>
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
                <h4 class="text-xs font-black text-white uppercase" id="sheet-title">${t('safehouse_name')}</h4>
                <span class="text-[9px] font-mono text-emerald-400" id="sheet-subtitle">${t('status_safe')}</span>
              </div>
            </div>
            <button id="btn-close-sheet" class="text-slate-400 hover:text-white p-1">&times;</button>
          </div>

          <div class="space-y-1.5 text-[10px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800" id="sheet-details-content">
            <!-- Dynamically populated -->
          </div>

          <div class="flex gap-2">
            <button id="btn-sheet-primary-action" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all" data-i18n="start_evacuation">
              ${t('start_evacuation')}
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
    subscribeToLanguageUpdates();
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

  const userHtml = `
    <div class="relative w-8 h-8 flex items-center justify-center">
      <div class="absolute inset-0 rounded-full bg-sky-500/30 animate-ping"></div>
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

  updateUserMarkerTooltip();
}

function updateUserMarkerTooltip() {
  if (!userMarker) return;
  const label = t('you_marker');
  if (userMarker.getTooltip()) {
    userMarker.setTooltipContent(label);
  } else {
    userMarker.bindTooltip(label, {
      permanent: true,
      direction: 'top',
      className: 'user-marker-tooltip',
      offset: [0, -16]
    });
  }
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

  updateSafehouseMarkerTooltip();
  safehouseMarker.on('click', () => showSafehouseSheet(safehouse));
}

function updateSafehouseMarkerTooltip() {
  if (!safehouseMarker) return;
  const safehouse = DEMO_SAFEHOUSES[0];
  const label = `🟢 ${t('safehouse_name')} (${i18nService.formatNumber(safehouse.available)} free)`;
  if (safehouseMarker.getTooltip()) {
    safehouseMarker.setTooltipContent(label);
  } else {
    safehouseMarker.bindTooltip(label, {
      permanent: true,
      direction: 'top',
      className: 'user-marker-tooltip',
      offset: [0, -18]
    });
  }
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
    marker.bindTooltip(`🚑 ${team.callsign} (${team.status === 'AVAILABLE' ? t('team_available') : t('team_deployed')})`, {
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
        Status: <strong style="color:${color};">${isSafe ? t('status_safe') : t('status_critical')}</strong><br>
        Flood Depth: <strong>${i18nService.formatNumber(road.floodDepthMeters, { minimumFractionDigits: 2 })}m</strong><br>
        Risk Level: <strong>${road.riskLevel === 'LOW' ? t('status_low_risk') : t('status_high_risk')}</strong>
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
    evacuationState.isPaused = true;
    clearInterval(evacuationState.animInterval);
    updateEvacUIState();
    return;
  }

  if (evacuationState.isPaused) {
    evacuationState.isPaused = false;
    resumeEvacuationLoop();
    updateEvacUIState();
    return;
  }

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
      ? (evacuationState.isPaused ? t('resume_evacuation') : t('pause_evacuation'))
      : t('start_evacuation');
  }

  if (navBanner) {
    navBanner.className = evacuationState.isActive
      ? 'block bg-slate-900 p-2.5 rounded-xl border border-emerald-500/40 text-[10px] font-mono space-y-1'
      : 'hidden';
  }

  if (statusPill) {
    statusPill.textContent = evacuationState.isActive
      ? (evacuationState.isPaused ? t('evacuation_paused') : t('evacuation_active'))
      : t('status_at_risk');
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
    navCounter.textContent = t('step_counter', { current: i18nService.formatNumber(currentNavIndex + 1), total: i18nService.formatNumber(activeRoute.navSteps.length) });
  }

  const remainingFraction = 1 - (evacuationState.stepIndex / (activeRoute.waypoints.length - 1));
  const remainingKm = Math.max(0.1, (activeRoute.distanceKm * remainingFraction));
  if (navDistRemain) {
    navDistRemain.textContent = i18nService.formatDistance(remainingKm);
  }
}

function showArrivalToast() {
  const toast = document.getElementById('route-recalc-toast');
  const reason = document.getElementById('route-recalc-reason');
  if (toast && reason) {
    reason.innerHTML = `<strong class="text-emerald-400">🎉 ${t('arrived_safehouse')}</strong>`;
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

  title.textContent = t('safehouse_name');
  sub.textContent = `${t('tab_shelter')} • ${t('status_safe')}`;
  sub.className = 'text-[9px] font-mono text-emerald-400 font-bold';

  details.innerHTML = `
    <div class="flex justify-between"><span>CAPACITY:</span><strong class="text-white">${i18nService.formatNumber(safehouse.occupied)} / ${i18nService.formatNumber(safehouse.capacity)} (${i18nService.formatNumber(safehouse.available)} Available)</strong></div>
    <div class="flex justify-between"><span>ELEVATION:</span><strong class="text-sky-400">${t('safehouse_elevation')}</strong></div>
    <div class="flex justify-between"><span>MEDICAL AID:</span><strong class="text-emerald-400">${t('safehouse_medical')}</strong></div>
    <div class="flex justify-between"><span>SUPPLIES:</span><strong class="text-white">${t('safehouse_supplies')}</strong></div>
    <div class="flex justify-between"><span>POWER BACKUP:</span><strong class="text-amber-400">${t('safehouse_power')}</strong></div>
    <div class="flex justify-between"><span>COMMS CHANNEL:</span><strong class="text-purple-400">${t('safehouse_comms')}</strong></div>
  `;

  actionBtn.textContent = t('start_evacuation');
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

  title.textContent = t('rescue_team_alpha');
  sub.textContent = `CALLSIGN: ${team.callsign} • ${team.status === 'AVAILABLE' ? t('team_available') : t('team_deployed')}`;
  sub.className = 'text-[9px] font-mono text-sky-400 font-bold';

  details.innerHTML = `
    <div class="flex justify-between"><span>STATUS:</span><strong class="text-emerald-400">${team.status === 'AVAILABLE' ? t('team_available') : t('team_deployed')}</strong></div>
    <div class="flex justify-between"><span>SPECIALIZATION:</span><strong class="text-white">${t('rescue_spec')}</strong></div>
    <div class="flex justify-between"><span>EQUIPMENT:</span><strong class="text-sky-300">${t('rescue_equipment')}</strong></div>
    <div class="flex justify-between"><span>CREW LEADER:</span><strong class="text-white">${t('rescue_leader')}</strong></div>
    <div class="flex justify-between"><span>DISTANCE:</span><strong class="text-amber-400">${i18nService.formatDistance(0.7)} (${i18nService.formatTime(team.etaMinutes)})</strong></div>
  `;

  actionBtn.textContent = team.status === 'AVAILABLE' ? t('request_rescue_btn') : t('team_deployed');
  actionBtn.className = 'flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all';
  actionBtn.onclick = () => {
    team.status = 'DISPATCHED (Assisting Arjun)';
    showRescueTeamSheet(team);
    renderRescueTeamMarkers();
    locationService.transmitDistressPacket({
      situation: `${t('request_sent')} (${DEMO_PERSON.deviceId})`,
      notes: `${team.name}. Coordinates: ${evacuationState.simPersonLoc.latitude}, ${evacuationState.simPersonLoc.longitude}`
    });
  };

  sheet.classList.remove('hidden');
}

/* --------------------------------------------------------------------------
   EVENT ATTACHMENTS & ROUTE/i18n OBSERVERS
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
      floodBtn.textContent = state.isR12Flooded ? '🌊 ' + t('recede_flood_btn') : '🌊 ' + t('sim_flood_btn');
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

function subscribeToLanguageUpdates() {
  if (i18nUnsubscribe) i18nUnsubscribe();

  i18nUnsubscribe = i18nService.subscribe(() => {
    i18nService.updateDOM();
    updateUserMarkerTooltip();
    updateSafehouseMarkerTooltip();
    renderRescueTeamMarkers();
    updateEvacUIState();

    const activeRoute = routeEngine.getRouteState().activeRoute;
    const distEl = document.getElementById('route-display-dist');
    const timeEl = document.getElementById('route-display-time');
    if (distEl) distEl.textContent = i18nService.formatDistance(activeRoute.distanceKm);
    if (timeEl) timeEl.textContent = i18nService.formatTime(activeRoute.travelTimeMinutes);
  });
}
