/* ==========================================================================
   GIS COMMAND & CONTROL DASHBOARD COMPONENT WITH LIVE USER LOCATION SYSTEM
   & REAL-TIME FLOOD SURGE SIMULATION
   ========================================================================== */

import { t } from '../i18n.js';
import { showSystemPrompt, showUltraEmergencyModal } from '../modals.js';
import { floodPredictionService } from '../services/flood-prediction.js';
import { weatherIngressService } from '../services/weather-ingress.js';
import { locationService, DEMO_USER_LOCATION, mockShelters } from '../services/location-service.js';
import { websocketClient } from '../services/websocket-service.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const mockHospitals = [
  { id: 'HOSP-01', name: 'Apex General Trauma Center', occupied: 102, total: 120, pct: 85, lat: 20.3200, lng: 85.8100, status: 'HIGH_LOAD', color: '#f59e0b' },
  { id: 'HOSP-02', name: 'St. Jude Emergency Relief Hub', occupied: 76, total: 80, pct: 95, lat: 20.2700, lng: 85.8000, status: 'CRITICAL_CAPACITY', color: '#ef4444' },
  { id: 'HOSP-03', name: 'NDRF Mobile Field Hospital', occupied: 15, total: 50, pct: 30, lat: 20.3300, lng: 85.8500, status: 'OPERATIONAL_FREE', color: '#10b981' }
];

export const mockUtilityFleet = [
  { id: 'FLEET-BOAT-1', name: 'NDRF Rescue Boat Alpha', type: 'Rescue Boat', crew: '4 Rescue Specialists', status: 'DISPATCHED', lat: 20.2920, lng: 85.8200, icon: 'directions_boat', color: '#0ea5e9' },
  { id: 'FLEET-CHOP-2', name: 'Air Force Chopper 2', type: 'Rescue Chopper', crew: '3 Air Crew + Winch', status: 'PATROLLING', lat: 20.3100, lng: 85.8250, icon: 'helicopter', color: '#a855f7' },
  { id: 'FLEET-AMPH-1', name: 'Coast Guard Amphibious-1', type: 'Amphibious Vehicle', crew: '6 Crew', status: 'AVAILABLE', lat: 20.2750, lng: 85.8100, icon: 'directions_car', color: '#10b981' },
  { id: 'FLEET-PUMP-4', name: 'High Capacity Pumper Truck 04', type: 'Utility Pumper', crew: '5000L/min Pump', status: 'DEPLOYED', lat: 20.2880, lng: 85.8180, icon: 'fire_truck', color: '#f59e0b' },
  { id: 'FLEET-GEN-02', name: 'Mobile Generator Truck 250kW', type: 'Utility Power', crew: 'Emergency Substation', status: 'EN_ROUTE', lat: 20.2820, lng: 85.8120, icon: 'bolt', color: '#eab308' }
];

export const mockIncidents = [
  { id: 'INC-442', title: 'Multi-Vehicle Flood Trapping', prio: 'Priority 1', prioType: 'red', time: '2m ago', desc: '4 people trapped on roof. Submerged depth 2.8m.', tags: ['Medical', 'Boat Squad'], lat: 20.2961, lng: 85.8245, meshHop: 'BLE Hop #3' },
  { id: 'INC-9042', title: 'Submerged Bus (12 Passengers)', prio: 'Priority 1', prioType: 'red', time: '6m ago', desc: 'Water depth 3.1m. Offline Wi-Fi Direct telemetry.', tags: ['Mass Rescue', 'Airlift'], lat: 20.3015, lng: 85.8310, meshHop: 'Wi-Fi Direct' },
  { id: 'INC-9043', title: 'Elderly Resident Trauma', prio: 'Priority 2', prioType: 'amber', time: '14m ago', desc: 'Oxygen concentrator power failure. Pumper needed.', tags: ['Medical', 'Generator'], lat: 20.2880, lng: 85.8150, meshHop: 'BLE Hop #1' },
  { id: 'INC-9044', title: 'Isolated Shelter (8 Refugees)', prio: 'Priority 3', prioType: 'emerald', time: '45m ago', desc: 'High ground school auditorium. Clean water refill.', tags: ['Logistics', 'Supplies'], lat: 20.3150, lng: 85.8420, meshHop: 'LoRa Gateway' }
];

let map = null;
let incidentMarkers = [];
let hospitalMarkers = [];
let fleetMarkers = [];
let shelterMarkers = [];
let floodPolygonLayer = null;
let safeRoadsLayer = null;
let dangerousRoadsLayer = null;
let userEvacRouteLayer = null;

// User Location Map Elements
let userMarker = null;
let userAccuracyCircle = null;
let userGlideAnimFrame = null;
let locationUnsubscribe = null;
let distressEventListener = null;

let currentRainfall = 85;
let currentDischarge = 1800;
let currentWaterLevel = 2.8;
let isSurgeModeActive = false;

export function renderGisDashboard(container) {
  const forecast = floodPredictionService.calculateForecast(currentRainfall, currentDischarge, currentWaterLevel);

  container.innerHTML = `
    <div class="flex-1 flex overflow-hidden relative w-full h-full">
      
      <!-- Active Incidents, Hospitals & Fleet Telemetry Panel (Left) -->
      <aside class="w-96 border-r border-outline-variant bg-surface-container-lowest flex flex-col h-full z-10 shadow-sm hidden xl:flex shrink-0">
        
        <!-- Tab Headers -->
        <div class="p-2 border-b border-outline-variant flex bg-surface gap-1">
          <button class="flex-1 py-2 text-xs font-bold uppercase bg-black text-white" id="tab-left-incidents">Incidents</button>
          <button class="flex-1 py-2 text-xs font-bold uppercase border border-outline-variant hover:bg-gray-100" id="tab-left-hospitals">Hospitals</button>
          <button class="flex-1 py-2 text-xs font-bold uppercase border border-outline-variant hover:bg-gray-100" id="tab-left-fleet">Fleet</button>
          <button class="flex-1 py-2 text-xs font-bold uppercase border border-outline-variant hover:bg-gray-100" id="tab-left-shelters">Shelters</button>
        </div>

        <!-- Dynamic List Container -->
        <div class="flex-1 overflow-y-auto" id="left-sidebar-content">
          <!-- Rendered dynamically -->
        </div>

        <!-- REAL-TIME RISING FLOOD SURGE ENGINE FOOTER -->
        <div class="p-4 border-t border-outline-variant bg-slate-950 text-white flex flex-col gap-3 shrink-0">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold uppercase text-red-400 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm animate-pulse text-red-500">water</span> Real-Time Rising Flood Engine
            </span>
            <span class="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] font-bold uppercase rounded animate-pulse" id="lbl-surge-status">
              ● RISING SURGE ACTIVE
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div class="bg-slate-900/90 p-2 border border-red-900/60">
              <div class="text-[10px] text-gray-400 uppercase">Live Water Depth</div>
              <strong class="text-xl text-red-400 font-black animate-pulse" id="disp-cur-level">${forecast.currentWaterLevel}m</strong>
            </div>
            <div class="bg-slate-900/90 p-2 border border-red-900/60">
              <div class="text-[10px] text-gray-400 uppercase">Surge Velocity</div>
              <strong class="text-xl text-amber-400 font-bold" id="disp-cur-rain">+0.4m/hr</strong>
            </div>
          </div>

          <div class="bg-slate-900 p-2 border border-slate-800 flex justify-between items-center text-xs font-mono">
            <div>
              <span class="text-[10px] text-gray-400 uppercase block">12h Forecast Peak</span>
              <strong class="text-sm text-red-400 font-bold" id="disp-pred-12h">${forecast.predictedLevel12h}m</strong>
            </div>
            <span class="text-xs font-mono font-bold px-2 py-1 rounded text-white" id="disp-trend-badge" style="background:${forecast.trendColor};">
              ${forecast.trendSymbol} ${forecast.trend}
            </span>
          </div>

          <!-- SURGE TRIGGER CTA BUTTON -->
          <button class="w-full bg-red-600 text-white py-3 px-4 text-xs font-extrabold uppercase tracking-wider hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2" id="btn-trigger-surge">
            <span class="material-symbols-outlined" style="font-size: 18px;">waves</span> SIMULATE LIVE RISING FLOOD SURGE
          </button>
        </div>

      </aside>

      <!-- Interactive Map Interface (Center / Right) -->
      <section class="flex-1 relative bg-surface-container-low overflow-hidden flex flex-col">
        
        <!-- Top GIS Layer & Road Hazard Toolbar -->
        <div class="w-full bg-surface border-b border-outline-variant px-4 py-2 flex items-center justify-between z-20 shrink-0 flex-wrap gap-2">
          
          <!-- GIS Layers Toggles -->
          <div class="flex items-center gap-3 text-xs font-bold uppercase text-primary">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">layers</span> GIS Layers:</span>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-user-loc" checked class="accent-sky-600"> 👤 You (Live)
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-flood-layer" checked class="accent-red-600"> 🌊 Flood Extent
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-safe-roads" checked class="accent-emerald-600"> 🟢 Safe Corridors
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-danger-roads" checked class="accent-red-600"> 🔴 Hazards
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-hospitals-layer" checked class="accent-black"> 🏥 Hospitals
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" id="chk-fleet-layer" checked class="accent-black"> 🛥️ Fleet
            </label>
          </div>

          <!-- Location Mode Controls & Main Action Buttons -->
          <div class="flex items-center gap-2">
            
            <!-- Live Location Status Badge with Dropdown Switcher -->
            <div class="relative">
              <button id="btn-loc-mode-menu" class="px-3 py-1 bg-slate-900 border border-slate-700 text-white rounded text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-slate-800 shadow-sm transition-all">
                <span id="loc-status-dot" class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span id="loc-status-text">LOCATION: ● DEMO</span>
                <span class="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>

              <!-- Location Mode Dropdown -->
              <div id="loc-mode-dropdown" class="hidden absolute right-0 mt-1 w-64 bg-slate-950 border border-slate-700 shadow-2xl p-2 rounded z-[500] text-xs font-sans text-white space-y-1">
                <div class="text-[10px] font-mono text-gray-400 px-2 py-1 uppercase font-bold border-b border-slate-800">
                  Select Location Mode
                </div>
                
                <button id="opt-mode-gps" class="w-full text-left px-2 py-1.5 hover:bg-slate-900 rounded flex items-center justify-between group">
                  <span class="flex items-center gap-2 font-bold">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Live Browser GPS
                  </span>
                  <span class="text-[9px] font-mono text-emerald-400">navigator.gps</span>
                </button>

                <button id="opt-mode-demo" class="w-full text-left px-2 py-1.5 hover:bg-slate-900 rounded flex items-center justify-between group">
                  <span class="flex items-center gap-2 font-bold">
                    <span class="w-2 h-2 rounded-full bg-cyan-400"></span> Sector B4 Demo Location
                  </span>
                  <span class="text-[9px] font-mono text-cyan-400">Default</span>
                </button>

                <button id="opt-mode-sim" class="w-full text-left px-2 py-1.5 hover:bg-slate-900 rounded flex items-center justify-between group">
                  <span class="flex items-center gap-2 font-bold">
                    <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span> Simulate Evacuation Path
                  </span>
                  <span class="text-[9px] font-mono text-purple-400">Glide Motion</span>
                </button>
              </div>
            </div>

            <button class="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 shadow-sm flex items-center gap-1" id="btn-top-surge">
              <span class="material-symbols-outlined" style="font-size:14px;">water</span> Simulate Rising Water
            </button>
            <button class="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 flex items-center gap-1" id="btn-recenter-user">
              <span class="material-symbols-outlined" style="font-size:14px;">my_location</span> Center on Me
            </button>
          </div>
        </div>

        <!-- Leaflet Map Container -->
        <div class="flex-1 relative w-full h-full" id="map-wrap">
          <div id="leaflet-container" class="w-full h-full bg-slate-900"></div>
          <div class="absolute inset-0 map-grid-overlay pointer-events-none"></div>

          <!-- Floating Map View Controls (Top-Right) -->
          <div class="absolute right-6 top-6 flex flex-col gap-2 z-[400]">
            <button class="w-10 h-10 bg-white border border-outline-variant text-primary flex items-center justify-center hover:bg-slate-100 shadow-sm" id="btn-zoom-in" title="Zoom In">
              <span class="material-symbols-outlined">add</span>
            </button>
            <button class="w-10 h-10 bg-white border border-outline-variant text-primary flex items-center justify-center hover:bg-slate-100 shadow-sm" id="btn-zoom-out" title="Zoom Out">
              <span class="material-symbols-outlined">remove</span>
            </button>
            <button class="w-10 h-10 bg-sky-600 text-white border border-sky-700 flex items-center justify-center hover:bg-sky-700 shadow-md mt-2 transition-all active:scale-95" id="btn-my-loc" title="Center on My Location">
              <span class="material-symbols-outlined">my_location</span>
            </button>
            <button class="w-10 h-10 bg-slate-950 text-white border border-slate-700 flex items-center justify-center hover:bg-slate-900 shadow-md" id="btn-toggle-inspector" title="Toggle Location Inspector">
              <span class="material-symbols-outlined">person_pin_circle</span>
            </button>
          </div>

          <!-- USER LOCATION INSPECTOR CARD (Floating Bottom-Left) -->
          <div id="user-location-inspector" class="absolute bottom-6 left-6 z-[400] w-80 bg-slate-950/95 backdrop-blur-md text-white border border-slate-700 p-4 shadow-2xl rounded-none font-sans space-y-3 transition-all duration-300">
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                </div>
                <div>
                  <h4 class="text-xs font-black uppercase text-white tracking-tight">YOUR LOCATION</h4>
                  <span class="text-[9px] font-mono text-sky-400" id="insp-source-badge">DEMO LOCATION</span>
                </div>
              </div>
              <button id="btn-close-inspector" class="text-slate-400 hover:text-white p-0.5">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <!-- Coordinates & Accuracy Metrics -->
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div class="bg-slate-900 p-2 border border-slate-800">
                <span class="text-[9px] text-gray-400 uppercase block">Coordinates</span>
                <strong class="text-[11px] text-cyan-300 block truncate" id="insp-coords">20.2961, 85.8245</strong>
              </div>
              <div class="bg-slate-900 p-2 border border-slate-800">
                <span class="text-[9px] text-gray-400 uppercase block">Accuracy</span>
                <strong class="text-[11px] text-emerald-400" id="insp-accuracy">±14m Confidence</strong>
              </div>
            </div>

            <!-- Nearest Infrastructure Calculations -->
            <div class="space-y-1.5 text-xs font-mono bg-slate-900/80 p-2.5 border border-slate-800">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-amber-400">local_hospital</span> Nearest Hospital:</span>
                <strong class="text-amber-400 font-bold" id="insp-nearest-hosp">Apex Trauma (2.7 km)</strong>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-400">night_shelter</span> Nearest Safe Shelter:</span>
                <strong class="text-emerald-400 font-bold" id="insp-nearest-shelter">St. Jude Hub (1.2 km)</strong>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-sky-400">directions_boat</span> Nearest Rescue Team:</span>
                <strong class="text-sky-400 font-bold" id="insp-nearest-rescue">Boat Alpha (0.8 km)</strong>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex gap-2 pt-1">
              <button id="btn-insp-route-shelter" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 text-[10px] font-bold uppercase rounded-none transition-all flex items-center justify-center gap-1 shadow">
                <span class="material-symbols-outlined text-xs">route</span> Evac Route
              </button>
              <button id="btn-insp-center" class="bg-slate-800 hover:bg-slate-700 text-white py-1.5 px-3 text-[10px] font-bold uppercase rounded-none transition-all flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-xs">filter_center_focus</span> Center
              </button>
            </div>
          </div>

          <!-- Floating Map Legend (Bottom-Right) -->
          <div class="absolute bottom-6 right-6 z-[400] bg-slate-950/90 text-white border border-slate-700 p-3 rounded-none text-[11px] font-mono shadow-xl hidden md:block">
            <div class="font-bold text-gray-300 mb-1 border-b border-slate-700 pb-1">TACTICAL ROAD & FLEET LEGEND</div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-400 border border-white inline-block"></span> 👤 You (Live User / Device)</div>
              <div class="flex items-center gap-2"><span class="w-4 h-1 bg-emerald-500 block"></span> 🟢 Safe Passable Corridor</div>
              <div class="flex items-center gap-2"><span class="w-4 h-1 bg-red-600 block"></span> 🔴 Dangerous Submerged Route</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-400 inline-block"></span> Utility Rescue Fleet</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 bg-amber-500 inline-block"></span> Hospital Occupancy Hub</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 bg-emerald-600 inline-block"></span> Safe Disaster Shelter</div>
            </div>
          </div>

          <!-- Global Action Bar Bottom Center -->
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-[400]">
            <button class="bg-white border border-outline-variant text-primary px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-100 shadow-md" id="btn-bottom-inspect">
              <span class="material-symbols-outlined" style="font-size: 18px;">my_location</span> My Position
            </button>
            <button class="bg-primary text-on-primary px-6 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800 shadow-md" onclick="document.getElementById('sos-modal').classList.remove('hidden')">
              <span class="material-symbols-outlined" style="font-size: 18px;">add</span> Broadcast SOS
            </button>
          </div>
        </div>

      </section>

    </div>
  `;

  setTimeout(() => {
    initLeafletMap();
    renderSidebarTab('incidents');
    attachGisEvents();
    initAutomatedWeatherStream();
    initUserLocationTracking();
  }, 100);
}

/* --------------------------------------------------------------------------
   LEAFLET INITIALIZATION & LAYER PLOTTING
   -------------------------------------------------------------------------- */
function initLeafletMap() {
  const mapElement = document.getElementById('leaflet-container');
  if (!mapElement) return;

  const initialPos = locationService.getState();

  map = L.map('leaflet-container', {
    center: [initialPos.latitude, initialPos.longitude],
    zoom: 13,
    zoomControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(map);

  updateFloodPolygon();
  renderRoadPolylines();
  plotIncidentMarkers(mockIncidents);
  plotHospitalMarkers(mockHospitals);
  plotFleetMarkers(mockUtilityFleet);
  plotShelterMarkers(mockShelters);
  initUserLocationLayer(initialPos);

  // Connect real-time WebSocket & fetch live persistent incidents
  websocketClient.connect();
  fetch('/api/v1/incidents')
    .then(r => r.json())
    .then(data => {
      if (data && data.incidents) {
        data.incidents.forEach(inc => {
          if (!mockIncidents.find(i => i.id === inc.id)) {
            mockIncidents.push({
              id: inc.id,
              title: inc.title,
              desc: inc.desc,
              lat: inc.lat,
              lng: inc.lng,
              prio: inc.priority,
              prioType: inc.prio_type || 'red',
              meshHop: inc.mesh_hop || 'BLE Hop #1',
              time: inc.time || 'Just now'
            });
          }
        });
        plotIncidentMarkers(mockIncidents);
        renderSidebarTab('incidents');
      }
    })
    .catch(() => {});

  // Real-time dispatch listener
  window.addEventListener('aegis-dispatch-event', (e) => {
    if (e.detail && e.detail.type === 'NEW_DISTRESS_INCIDENT') {
      const inc = e.detail.incident;
      if (inc && !mockIncidents.find(i => i.id === inc.id)) {
        mockIncidents.unshift({
          id: inc.id,
          title: inc.title,
          desc: inc.desc,
          lat: inc.lat,
          lng: inc.lng,
          prio: inc.priority,
          prioType: inc.prio_type || 'red',
          meshHop: inc.mesh_hop || 'BLE Hop #1',
          time: inc.time || 'Just now'
        });
        plotIncidentMarkers(mockIncidents);
        renderSidebarTab('incidents');
      }
    }
  });

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 250);
}

/* --------------------------------------------------------------------------
   USER LOCATION LAYER & SMOOTH GLIDE ANIMATION
   -------------------------------------------------------------------------- */
function initUserLocationLayer(locState) {
  if (!map) return;

  const lat = locState.latitude;
  const lng = locState.longitude;
  const accuracy = locState.accuracy || 15;

  const userIcon = L.divIcon({
    className: 'custom-user-gps-marker',
    html: `
      <div class="user-gps-pin" style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; inset:0; border-radius:50%; background:rgba(14,165,233,0.35); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative; width:22px; height:22px; border-radius:50%; background:#ffffff; border:3px solid #0284c7; box-shadow:0 0 15px rgba(14,165,233,0.8); display:flex; align-items:center; justify-content:center;">
          <div style="width:8px; height:8px; border-radius:50%; background:#0284c7;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  userAccuracyCircle = L.circle([lat, lng], {
    radius: accuracy,
    color: '#0284c7',
    fillColor: '#0ea5e9',
    fillOpacity: 0.12,
    weight: 1.5,
    dashArray: '4, 4'
  }).addTo(map);

  userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

  userMarker.on('click', () => {
    updateInspectorUI();
    const inspector = document.getElementById('user-location-inspector');
    if (inspector) inspector.classList.remove('hidden');
  });

  updateUserMarkerTooltip(locState);
}

function updateUserMarkerTooltip(locState) {
  if (!userMarker) return;
  const label = locState.source === 'GPS' ? 'YOU (LIVE GPS)' : (locState.source === 'SIMULATED' ? 'YOU (SIMULATING)' : 'YOU (DEMO LOCATION)');
  
  if (userMarker.getTooltip()) {
    userMarker.setTooltipContent(label);
  } else {
    userMarker.bindTooltip(label, {
      permanent: true,
      direction: 'top',
      className: 'user-marker-tooltip',
      offset: [0, -18]
    });
  }
}

function smoothUpdateUserPosition(newState) {
  if (!map || !userMarker) return;

  const targetLat = newState.latitude;
  const targetLng = newState.longitude;
  const targetAccuracy = newState.accuracy || 15;

  const currentLatLng = userMarker.getLatLng();
  const startLat = currentLatLng.lat;
  const startLng = currentLatLng.lng;

  if (userGlideAnimFrame) {
    cancelAnimationFrame(userGlideAnimFrame);
    userGlideAnimFrame = null;
  }

  const startTime = performance.now();
  const duration = 350;

  function glideStep(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3);

    const lat = startLat + (targetLat - startLat) * ease;
    const lng = startLng + (targetLng - startLng) * ease;

    userMarker.setLatLng([lat, lng]);
    if (userAccuracyCircle) {
      userAccuracyCircle.setLatLng([lat, lng]);
      userAccuracyCircle.setRadius(targetAccuracy);
    }

    if (progress < 1) {
      userGlideAnimFrame = requestAnimationFrame(glideStep);
    } else {
      userMarker.setLatLng([targetLat, targetLng]);
      if (userAccuracyCircle) {
        userAccuracyCircle.setLatLng([targetLat, targetLng]);
        userAccuracyCircle.setRadius(targetAccuracy);
      }
      userGlideAnimFrame = null;
    }
  }

  userGlideAnimFrame = requestAnimationFrame(glideStep);
  updateUserMarkerTooltip(newState);
  updateInspectorUI();
}

function initUserLocationTracking() {
  if (locationUnsubscribe) locationUnsubscribe();

  locationUnsubscribe = locationService.subscribe((state) => {
    updateLocationStatusBadge(state);
    smoothUpdateUserPosition(state);
  });

  if (distressEventListener) {
    window.removeEventListener('resqnet-distress-packet', distressEventListener);
  }

  distressEventListener = (e) => {
    const packet = e.detail;
    if (!packet) return;

    const exists = mockIncidents.find(i => i.id === packet.id);
    if (!exists) {
      mockIncidents.unshift(packet);
      plotIncidentMarkers(mockIncidents);
      renderSidebarTab('incidents');
    }

    showUltraEmergencyModal({
      title: 'EMERGENCY DISTRESS PACKET RECEIVED',
      message: `Distress signal generated at user coordinates (${packet.lat.toFixed(4)}, ${packet.lng.toFixed(4)})`,
      details: `INCIDENT ID: ${packet.id}\nSOURCE: ${packet.source}\nCOORDINATES: ${packet.lat.toFixed(5)}, ${packet.lng.toFixed(5)}\nACCURACY: ±${packet.accuracy}m\nTRIAGE: ${packet.prio}\nSTATUS: QUEUED FOR RESCUE DISPATCH`,
      location: `${packet.lat.toFixed(4)}° N, ${packet.lng.toFixed(4)}° E`,
      priority: 'P1 CRITICAL SOS'
    });
  };

  window.addEventListener('resqnet-distress-packet', distressEventListener);
}

function updateLocationStatusBadge(state) {
  const dot = document.getElementById('loc-status-dot');
  const text = document.getElementById('loc-status-text');
  const inspBadge = document.getElementById('insp-source-badge');

  if (!dot || !text) return;

  if (state.source === 'GPS') {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    text.textContent = 'LOCATION: ● LIVE GPS';
    if (inspBadge) {
      inspBadge.textContent = '● LIVE BROWSER GPS';
      inspBadge.className = 'text-[9px] font-mono text-emerald-400 font-bold';
    }
  } else if (state.source === 'SIMULATED') {
    dot.className = 'w-2 h-2 rounded-full bg-purple-400 animate-ping';
    text.textContent = 'LOCATION: ⚡ SIMULATING';
    if (inspBadge) {
      inspBadge.textContent = '⚡ EVACUATION SIMULATION';
      inspBadge.className = 'text-[9px] font-mono text-purple-400 font-bold';
    }
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-cyan-400';
    text.textContent = 'LOCATION: ○ DEMO';
    if (inspBadge) {
      inspBadge.textContent = '○ DEMO SCENARIO LOCATION';
      inspBadge.className = 'text-[9px] font-mono text-cyan-400 font-bold';
    }
  }
}

function updateInspectorUI() {
  const data = locationService.getComprehensiveInspectorData();
  const coordsEl = document.getElementById('insp-coords');
  const accEl = document.getElementById('insp-accuracy');
  const hospEl = document.getElementById('insp-nearest-hosp');
  const shelterEl = document.getElementById('insp-nearest-shelter');
  const rescueEl = document.getElementById('insp-nearest-rescue');

  if (coordsEl) coordsEl.textContent = `${data.state.latitude.toFixed(5)}, ${data.state.longitude.toFixed(5)}`;
  if (accEl) accEl.textContent = `±${data.state.accuracy || 14}m Confidence`;

  if (hospEl && data.nearestHospital) {
    hospEl.textContent = `${data.nearestHospital.name.split(' ')[0]} (${data.nearestHospital.formattedDistance})`;
  }
  if (shelterEl && data.nearestShelter) {
    shelterEl.textContent = `${data.nearestShelter.name.split(' ')[0]} (${data.nearestShelter.formattedDistance})`;
  }
  if (rescueEl && data.nearestRescue) {
    rescueEl.textContent = `${data.nearestRescue.name.split(' ')[1] || 'Unit'} (${data.nearestRescue.formattedDistance})`;
  }
}

function drawEvacuationRouteToShelter() {
  if (!map) return;
  const userPos = locationService.getState();
  const nearestShelter = locationService.getNearestShelter();
  if (!nearestShelter) return;

  if (userEvacRouteLayer) map.removeLayer(userEvacRouteLayer);

  const routePoints = [
    [userPos.latitude, userPos.longitude],
    [20.2920, 85.8190],
    [nearestShelter.lat, nearestShelter.lng]
  ];

  userEvacRouteLayer = L.polyline(routePoints, {
    color: '#06b6d4',
    weight: 5,
    dashArray: '8, 8',
    opacity: 0.9
  }).addTo(map);

  map.fitBounds(userEvacRouteLayer.getBounds(), { padding: [60, 60] });

  showSystemPrompt({
    title: 'Optimal Evacuation Route Computed',
    message: `Dynamic corridor plotted from your position to ${nearestShelter.name}.`,
    details: `DISTANCE: ${nearestShelter.formattedDistance}\nTARGET HUB: ${nearestShelter.name} (${nearestShelter.capacity} capacity)\nESTIMATED TIME: 8.5 mins on foot / 3 mins boat\nSTATUS: AVOIDING SUBMERGED RIVERBED FLYOVER`
  });
}

/* --------------------------------------------------------------------------
   STANDARD GIS LAYERS & MARKERS
   -------------------------------------------------------------------------- */
function plotIncidentMarkers(incidents) {
  if (!map) return;
  incidentMarkers.forEach(m => map.removeLayer(m));
  incidentMarkers = [];

  incidents.forEach(inc => {
    const customIcon = L.divIcon({
      className: 'custom-inc-marker',
      html: `
        <div style="background:#000; color:#fff; border:2px solid #000; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); font-weight:bold;">
          <span class="material-symbols-outlined" style="font-size:18px;">warning</span>
        </div>
      `,
      iconSize: [34, 34]
    });

    const marker = L.marker([inc.lat, inc.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong style="color:#ef4444;">${inc.prio}: ${inc.title}</strong><br>
        <span style="font-size:12px; color:#333;">${inc.desc}</span><br>
        <span style="font-size:11px; color:#666; font-family:monospace;">Mesh Telemetry: ${inc.meshHop}</span>
      </div>
    `);
    incidentMarkers.push(marker);
  });
}

function plotHospitalMarkers(hospitals) {
  if (!map) return;
  hospitalMarkers.forEach(m => map.removeLayer(m));
  hospitalMarkers = [];

  hospitals.forEach(hosp => {
    const customIcon = L.divIcon({
      className: 'custom-hosp-marker',
      html: `
        <div style="background:${hosp.color}; color:#fff; border:2px solid #000; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; display:flex; align-items:center; gap:3px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
          🏥 <span>${hosp.pct}%</span>
        </div>
      `,
      iconSize: [50, 26]
    });

    const marker = L.marker([hosp.lat, hosp.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong>${hosp.name}</strong><br>
        Occupancy: <strong>${hosp.occupied}/${hosp.total} beds (${hosp.pct}%)</strong><br>
        Status: <span style="color:${hosp.color}; font-weight:bold;">${hosp.status}</span>
      </div>
    `);
    hospitalMarkers.push(marker);
  });
}

function plotFleetMarkers(fleet) {
  if (!map) return;
  fleetMarkers.forEach(m => map.removeLayer(m));
  fleetMarkers = [];

  fleet.forEach(unit => {
    const customIcon = L.divIcon({
      className: 'custom-fleet-marker',
      html: `
        <div style="background:${unit.color}; color:#fff; border:2px solid #000; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
          <span class="material-symbols-outlined" style="font-size:18px;">${unit.icon}</span>
        </div>
      `,
      iconSize: [34, 34]
    });

    const marker = L.marker([unit.lat, unit.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong>${unit.name}</strong><br>
        Type: <strong>${unit.type}</strong><br>
        Crew: <span>${unit.crew}</span><br>
        Status: <strong style="color:${unit.color};">${unit.status}</strong>
      </div>
    `);
    fleetMarkers.push(marker);
  });
}

function plotShelterMarkers(shelters) {
  if (!map) return;
  shelterMarkers.forEach(m => map.removeLayer(m));
  shelterMarkers = [];

  shelters.forEach(s => {
    const customIcon = L.divIcon({
      className: 'custom-shelter-marker',
      html: `
        <div style="background:${s.color}; color:#fff; border:2px solid #000; width:32px; height:32px; border-radius:4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
          <span class="material-symbols-outlined" style="font-size:18px;">night_shelter</span>
        </div>
      `,
      iconSize: [32, 32]
    });

    const marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong style="color:${s.color};">${s.name}</strong><br>
        Type: <strong>${s.type}</strong><br>
        Capacity: <strong>${s.capacity}</strong>
      </div>
    `);
    shelterMarkers.push(marker);
  });
}

function updateFloodPolygon() {
  if (!map) return;
  if (floodPolygonLayer && map) map.removeLayer(floodPolygonLayer);

  const forecast = floodPredictionService.calculateForecast(currentRainfall, currentDischarge, currentWaterLevel);
  const scale = forecast.polygonScale;

  const baseCenterLat = 20.293;
  const baseCenterLng = 85.830;

  const rawCoords = [
    [20.285, 85.815],
    [20.308, 85.820],
    [20.312, 85.845],
    [20.290, 85.848],
    [20.278, 85.830]
  ];

  const scaledCoords = rawCoords.map(([lat, lng]) => [
    baseCenterLat + (lat - baseCenterLat) * scale,
    baseCenterLng + (lng - baseCenterLng) * scale
  ]);

  floodPolygonLayer = L.polygon(scaledCoords, {
    color: '#dc2626',
    fillColor: '#ef4444',
    fillOpacity: Math.min(0.75, 0.3 + scale * 0.2),
    weight: 3,
    dashArray: '6, 6'
  }).addTo(map);

  floodPolygonLayer.bindPopup(`
    <div style="font-family:sans-serif; padding:4px;">
      <strong style="color:#ef4444;">LIVE FLOOD INUNDATION VECTOR</strong><br>
      Current Water Depth: <strong style="font-size:14px; color:#ef4444;">${forecast.currentWaterLevel}m</strong><br>
      12h Forecasted Peak: <strong>${forecast.predictedLevel12h}m</strong><br>
      Status: <strong>${forecast.trend}</strong>
    </div>
  `);
}

async function renderRoadPolylines() {
  if (!map) return;
  if (safeRoadsLayer && map) map.removeLayer(safeRoadsLayer);
  if (dangerousRoadsLayer && map) map.removeLayer(dangerousRoadsLayer);

  try {
    const res = await fetch('/api/v1/routing/network');
    if (res.ok) {
      const data = await res.json();
      const safeSegments = [];
      const dangerSegments = [];

      if (data.network && Array.isArray(data.network.edges)) {
        data.network.edges.forEach(edge => {
          const coords = [edge.start_coord, edge.end_coord];
          if (edge.is_flooded) {
            dangerSegments.push(coords);
          } else {
            safeSegments.push(coords);
          }
        });

        safeRoadsLayer = L.polyline(safeSegments, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9
        }).addTo(map);

        dangerousRoadsLayer = L.polyline(dangerSegments, {
          color: '#ef4444',
          weight: 6,
          opacity: 0.95,
          dashArray: '8, 8'
        }).addTo(map);

        return;
      }
    }
  } catch (err) {
    console.warn('Live routing network API unavailable, falling back to local vectors:', err);
  }

  const safeCoords = [
    [20.2790, 85.8390],
    [20.2850, 85.8280],
    [20.3000, 85.8180],
    [20.3200, 85.8100]
  ];

  safeRoadsLayer = L.polyline(safeCoords, {
    color: '#10b981',
    weight: 6,
    opacity: 0.95
  }).addTo(map);

  const dangerCoords = [
    [20.2900, 85.8480],
    [20.2961, 85.8245],
    [20.3015, 85.8310]
  ];

  dangerousRoadsLayer = L.polyline(dangerCoords, {
    color: '#ef4444',
    weight: 5,
    opacity: 0.95,
    dashArray: '8, 8'
  }).addTo(map);
}

async function calculateAndRenderEvacRoute() {
  const btn = document.getElementById('btn-insp-route-shelter');
  if (btn) btn.innerHTML = '<span class="material-symbols-outlined text-xs animate-spin">sync</span> Routing...';

  try {
    const payload = {
      origin_node: "NODE_SHELTER_SOUTH",
      destination_node: "NODE_HOSP_CENTRAL",
      vehicle_type: "AMBULANCE",
      flood_threshold: 0.8
    };

    const res = await fetch('/api/v1/routing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const routeData = await res.json();
    if (!routeData.success || !routeData.path_coordinates || routeData.path_coordinates.length === 0) {
      alert('Unable to compute safe corridor. Flooding is impassable.');
      return;
    }

    if (userEvacRouteLayer && map) {
      map.removeLayer(userEvacRouteLayer);
    }

    // Draw glowing cyan polyline for Dijkstra calculated path
    userEvacRouteLayer = L.polyline(routeData.path_coordinates, {
      color: '#06b6d4',
      weight: 8,
      opacity: 0.95,
      dashArray: '12, 6'
    }).addTo(map);

    // Fit map bounds to view whole route
    map.fitBounds(userEvacRouteLayer.getBounds(), { padding: [60, 60] });

    // Show Evacuation Summary Modal
    showUltraEmergencyModal({
      title: 'DIJKSTRA EVACUATION CORRIDOR COMPUTED',
      message: `Optimal detour computed: ${routeData.flooded_segments_avoided} submerged bottleneck(s) bypassed!`,
      details: `ALGORITHM: Dijkstra Shortest Path\nTOTAL DISTANCE: ${routeData.total_distance_km} km\nESTIMATED TRANSIT: ${routeData.estimated_transit_minutes} min\nSUBMERGED HAZARDS AVOIDED: ${routeData.flooded_segments_avoided}\nCLEARANCE MARGIN: ${routeData.clearance_margin_meters}m\nWAYPOINTS: ${routeData.path_nodes.join(' → ')}`,
      location: `${routeData.path_coordinates[0][0].toFixed(4)}° N → ${routeData.path_coordinates[routeData.path_coordinates.length - 1][0].toFixed(4)}° N`,
      priority: 'SAFE TRANSIT ACTIVE'
    });
  } catch (err) {
    console.error('Routing calculation failed:', err);
    alert('Failed to connect to routing engine.');
  } finally {
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined text-xs">route</span> Evac Route';
  }
}

function renderSidebarTab(tabName) {
  const container = document.getElementById('left-sidebar-content');
  if (!container) return;

  if (tabName === 'incidents') {
    container.innerHTML = mockIncidents.map(inc => `
      <div class="p-4 border-b border-outline-variant hover:bg-surface transition-colors cursor-pointer group inc-card-item" onclick="window.panToCoordinates(${parseFloat(inc.lat) || 20.2961}, ${parseFloat(inc.lng) || 85.8245})">
        <div class="flex justify-between items-start mb-2">
          <span class="bg-primary text-on-primary text-xs font-bold px-2 py-0.5">${escapeHtml(inc.prio || 'Priority 1')}</span>
          <span class="text-xs text-on-surface-variant">${escapeHtml(inc.time || 'Just now')}</span>
        </div>
        <h3 class="text-base font-medium text-primary mb-1 group-hover:underline">${escapeHtml(inc.title || 'Distress Incident')}</h3>
        <p class="text-sm text-on-surface-variant mb-2">${escapeHtml(inc.desc || '')}</p>
        <div class="text-[10px] font-mono text-cyan-600">📡 ${escapeHtml(inc.meshHop || 'BLE Hop #1')}</div>
      </div>
    `).join('');
  } else if (tabName === 'hospitals') {
    container.innerHTML = mockHospitals.map(h => `
      <div class="p-4 border-b border-outline-variant hover:bg-surface transition-colors cursor-pointer" onclick="window.panToCoordinates(${h.lat}, ${h.lng})">
        <div class="flex justify-between items-start mb-1">
          <strong class="text-sm text-primary">${h.name}</strong>
          <span class="text-xs font-bold px-2 py-0.5" style="background:${h.color}; color:#fff;">${h.pct}% OCCUPIED</span>
        </div>
        <div class="w-full bg-slate-200 h-2 rounded my-2 overflow-hidden">
          <div class="h-full" style="width:${h.pct}%; background:${h.color};"></div>
        </div>
      </div>
    `).join('');
  } else if (tabName === 'fleet') {
    container.innerHTML = mockUtilityFleet.map(f => `
      <div class="p-4 border-b border-outline-variant hover:bg-surface transition-colors flex gap-3 items-center cursor-pointer" onclick="window.panToCoordinates(${f.lat}, ${f.lng})">
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style="background:${f.color};">
          <span class="material-symbols-outlined">${f.icon}</span>
        </div>
        <div class="flex-1">
          <strong class="text-sm text-primary">${f.name}</strong>
          <div class="text-xs text-on-surface-variant">${f.type} &bull; ${f.crew}</div>
        </div>
      </div>
    `).join('');
  } else if (tabName === 'shelters') {
    container.innerHTML = mockShelters.map(s => `
      <div class="p-4 border-b border-outline-variant hover:bg-surface transition-colors flex gap-3 items-center cursor-pointer" onclick="window.panToCoordinates(${s.lat}, ${s.lng})">
        <div class="w-10 h-10 rounded-none flex items-center justify-center text-white shrink-0" style="background:${s.color};">
          <span class="material-symbols-outlined">night_shelter</span>
        </div>
        <div class="flex-1">
          <strong class="text-sm text-primary">${s.name}</strong>
          <div class="text-xs text-on-surface-variant">${s.type} &bull; Cap: ${s.capacity}</div>
        </div>
      </div>
    `).join('');
  }
}

// Global pan helper
window.panToCoordinates = (lat, lng) => {
  if (map) map.flyTo([lat, lng], 15, { duration: 1.2 });
};

function initAutomatedWeatherStream() {
  weatherIngressService.subscribe((data) => {
    if (isSurgeModeActive) return;
    currentRainfall = data.rainfall_mmhr;
    currentDischarge = data.dam_discharge_m3s;
    currentWaterLevel = data.water_level_m;
    updateUIForecast(floodPredictionService.calculateForecast(currentRainfall, currentDischarge, currentWaterLevel));
  });
  weatherIngressService.startAutoSync(3500);
}

function startSurgeSequence() {
  isSurgeModeActive = true;
  weatherIngressService.stopAutoSync();

  const surgeBtn = document.getElementById('btn-trigger-surge');
  const topBtn = document.getElementById('btn-top-surge');
  if (surgeBtn) surgeBtn.textContent = '🌊 RISING SURGE SIMULATION IN PROGRESS...';
  if (topBtn) topBtn.textContent = '🌊 SURGING...';

  let alertTriggered = false;

  floodPredictionService.startSurgeSimulation(
    (forecast) => {
      currentWaterLevel = forecast.currentWaterLevel;
      updateUIForecast(forecast);

      if (currentWaterLevel >= 4.0 && !alertTriggered) {
        alertTriggered = true;
        showUltraEmergencyModal({
          title: 'CRITICAL FLOOD BREACH ALERT',
          message: `Water level surged to ${currentWaterLevel}m (CRITICAL DANGER THRESHOLD BREACHED)!`,
          details: `WATER LEVEL: ${currentWaterLevel}m\nRAINFALL RATE: 95 mm/hr\nDAM DISCHARGE: 2,400 m³/s\n\nSUBMERGED ROUTES: Riverbed Flyover & Main St Impassable!\nIMMEDIATE DISPATCH REQUIRED.`,
          location: '20.2961° N, 85.8245° E (Sector B4)',
          priority: 'P1 CRITICAL FLOOD BREACH'
        });
      }
    },
    () => {
      isSurgeModeActive = false;
      if (surgeBtn) surgeBtn.textContent = '🌊 SIMULATE LIVE RISING FLOOD SURGE';
      if (topBtn) topBtn.textContent = 'Simulate Rising Water';
      weatherIngressService.startAutoSync(3500);
    }
  );
}

function updateUIForecast(forecast) {
  const levelEl = document.getElementById('disp-cur-level');
  const pred12hEl = document.getElementById('disp-pred-12h');
  const badgeEl = document.getElementById('disp-trend-badge');

  if (levelEl) levelEl.textContent = `${forecast.currentWaterLevel}m`;
  if (pred12hEl) pred12hEl.textContent = `${forecast.predictedLevel12h}m`;

  if (badgeEl) {
    badgeEl.textContent = `${forecast.trendSymbol} ${forecast.trend}`;
    badgeEl.style.background = forecast.trendColor;
  }

  updateFloodPolygon();
}

function attachGisEvents() {
  document.getElementById('tab-left-incidents')?.addEventListener('click', (e) => {
    setActiveTab(e.target);
    renderSidebarTab('incidents');
  });

  document.getElementById('tab-left-hospitals')?.addEventListener('click', (e) => {
    setActiveTab(e.target);
    renderSidebarTab('hospitals');
  });

  document.getElementById('tab-left-fleet')?.addEventListener('click', (e) => {
    setActiveTab(e.target);
    renderSidebarTab('fleet');
  });

  document.getElementById('tab-left-shelters')?.addEventListener('click', (e) => {
    setActiveTab(e.target);
    renderSidebarTab('shelters');
  });

  document.getElementById('btn-trigger-surge')?.addEventListener('click', startSurgeSequence);
  document.getElementById('btn-top-surge')?.addEventListener('click', startSurgeSequence);

  // Layer Toggles
  document.getElementById('chk-user-loc')?.addEventListener('change', (e) => {
    if (!map) return;
    if (e.target.checked) {
      if (userMarker) map.addLayer(userMarker);
      if (userAccuracyCircle) map.addLayer(userAccuracyCircle);
    } else {
      if (userMarker) map.removeLayer(userMarker);
      if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
    }
  });

  document.getElementById('chk-flood-layer')?.addEventListener('change', (e) => {
    if (e.target.checked && floodPolygonLayer) map.addLayer(floodPolygonLayer);
    else if (floodPolygonLayer) map.removeLayer(floodPolygonLayer);
  });

  document.getElementById('chk-safe-roads')?.addEventListener('change', (e) => {
    if (e.target.checked && safeRoadsLayer) map.addLayer(safeRoadsLayer);
    else if (safeRoadsLayer) map.removeLayer(safeRoadsLayer);
  });

  document.getElementById('chk-danger-roads')?.addEventListener('change', (e) => {
    if (e.target.checked && dangerousRoadsLayer) map.addLayer(dangerousRoadsLayer);
    else if (dangerousRoadsLayer) map.removeLayer(dangerousRoadsLayer);
  });

  document.getElementById('chk-hospitals-layer')?.addEventListener('change', (e) => {
    hospitalMarkers.forEach(m => e.target.checked ? map.addLayer(m) : map.removeLayer(m));
  });

  document.getElementById('chk-fleet-layer')?.addEventListener('change', (e) => {
    fleetMarkers.forEach(m => e.target.checked ? map.addLayer(m) : map.removeLayer(m));
  });

  // Location Mode Dropdown Switcher
  const btnModeMenu = document.getElementById('btn-loc-mode-menu');
  const dropdown = document.getElementById('loc-mode-dropdown');

  btnModeMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => dropdown?.classList.add('hidden'));

  document.getElementById('opt-mode-gps')?.addEventListener('click', () => {
    dropdown?.classList.add('hidden');
    locationService.startWatchingGPS();
  });

  document.getElementById('opt-mode-demo')?.addEventListener('click', () => {
    dropdown?.classList.add('hidden');
    locationService.setDemoLocation();
  });

  document.getElementById('opt-mode-sim')?.addEventListener('click', () => {
    dropdown?.classList.add('hidden');
    locationService.startMovementSimulation();
  });

  // Center on User controls (does NOT constantly lock map)
  const centerUser = () => {
    if (!map) return;
    const pos = locationService.getState();
    map.flyTo([pos.latitude, pos.longitude], 15, { duration: 1.2 });
  };

  document.getElementById('btn-recenter-user')?.addEventListener('click', centerUser);
  document.getElementById('btn-my-loc')?.addEventListener('click', centerUser);
  document.getElementById('btn-insp-center')?.addEventListener('click', centerUser);
  document.getElementById('btn-bottom-inspect')?.addEventListener('click', () => {
    centerUser();
    document.getElementById('user-location-inspector')?.classList.remove('hidden');
  });

  // Zoom controls
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => map?.zoomIn());
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => map?.zoomOut());

  // Inspector Card
  document.getElementById('btn-toggle-inspector')?.addEventListener('click', () => {
    const insp = document.getElementById('user-location-inspector');
    if (insp) insp.classList.toggle('hidden');
  });
  document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
    document.getElementById('user-location-inspector')?.classList.add('hidden');
  });
  document.getElementById('btn-insp-route-shelter')?.addEventListener('click', calculateAndRenderEvacRoute);
}

function setActiveTab(btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll('button').forEach(b => {
    b.className = 'flex-1 py-2 text-xs font-bold uppercase border border-outline-variant hover:bg-gray-100';
  });
  btn.className = 'flex-1 py-2 text-xs font-bold uppercase bg-black text-white';
}
