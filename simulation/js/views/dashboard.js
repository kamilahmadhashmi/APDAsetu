/* ==========================================================================
   SMARTPHONE SIMULATOR — HOME & SAFETY DASHBOARD VIEW
   Represents the field device for Arjun Sharma (FIELD-104).
   Focuses on critical person safety, nearest safehouse, rescue team,
   road condition metrics, and offline emergency resilience.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_RESCUE_TEAMS } from '../data/demo-rescue-teams.js';
import { routeEngine } from '../services/route-engine.js';
import { locationService } from '../services/location-service.js';

export function renderDashboardView(container, options = {}, actions = {}) {
  const routeState = routeEngine.getRouteState();
  const primarySafehouse = DEMO_SAFEHOUSES[0];
  const nearestRescue = DEMO_RESCUE_TEAMS[0];
  const userLoc = locationService.getState();

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-950 text-slate-100 relative select-none overflow-y-auto pb-16 font-sans">
      
      <!-- TOP PERSON EMERGENCY HEADER -->
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 p-4 border-b border-slate-800 shrink-0 space-y-2">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-lg">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">person</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h2 class="text-sm font-black text-white uppercase tracking-tight">${DEMO_PERSON.name}</h2>
                <span class="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold">${DEMO_PERSON.deviceId}</span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono">Blood: <strong>${DEMO_PERSON.bloodGroup}</strong> &bull; ${DEMO_PERSON.medicalAlert}</p>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase bg-red-950 text-red-400 border border-red-700 animate-pulse">
            ● ${DEMO_PERSON.status}
          </span>
        </div>

        <!-- Person Location Strip -->
        <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center text-[10px] font-mono">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span class="text-slate-300">GPS FIX: <strong class="text-sky-300">${userLoc.latitude.toFixed(4)}° N, ${userLoc.longitude.toFixed(4)}° E</strong></span>
          </div>
          <span class="text-emerald-400 font-bold">±${userLoc.accuracy}m</span>
        </div>
      </div>

      <div class="p-4 space-y-3.5 flex-1">
        
        <!-- 1. SAFEST ROUTE & EVACUATION CARD -->
        <div class="bg-slate-900 border-2 border-emerald-500/50 p-3.5 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">route</span> SAFEST EVACUATION CORRIDOR
            </span>
            <span class="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold">
              ${routeState.activeRoute.riskScore}
            </span>
          </div>

          <div class="flex justify-between items-end">
            <div>
              <h3 class="text-sm font-black text-white leading-tight">${primarySafehouse.name}</h3>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">${routeState.activeRoute.name}</p>
            </div>
            <div class="text-right">
              <div class="text-base font-black text-emerald-400">${routeState.activeRoute.formattedDistance}</div>
              <div class="text-[10px] text-slate-400 font-mono">${routeState.activeRoute.formattedTime} on foot</div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button id="btn-dash-start-nav" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">directions_run</span>
              <span>START EVAC</span>
            </button>
            <button id="btn-dash-open-map" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all">
              <span class="material-symbols-outlined text-sm">map</span>
              <span>VIEW MAP</span>
            </button>
          </div>
        </div>

        <!-- 2. NEARBY RESCUE TEAM CONTACT CARD -->
        <div class="bg-slate-900 border border-blue-500/40 p-3.5 rounded-2xl space-y-2.5 shadow-lg">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">directions_boat</span> NEAREST RESCUE ASSET
            </span>
            <span class="text-[9px] font-mono bg-blue-950 text-sky-300 px-2 py-0.5 rounded border border-blue-700 font-bold">
              ${nearestRescue.status}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-xs font-bold text-white">${nearestRescue.name}</h4>
              <p class="text-[10px] text-slate-400 font-mono">${nearestRescue.specialization}</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-sky-400 font-mono">0.7 km</span>
              <span class="text-[9px] text-slate-400 block font-mono">ETA: ${nearestRescue.etaMinutes} min</span>
            </div>
          </div>

          <button id="btn-dash-req-rescue" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95">
            <span class="material-symbols-outlined text-sm">emergency_share</span>
            <span>REQUEST RESCUE ASSISTANCE</span>
          </button>
        </div>

        <!-- 3. ROAD CONDITIONS & FLOOD RISK SUMMARY -->
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
          <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">
            REAL-TIME ROAD NETWORK STATUS
          </span>

          <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div class="bg-slate-950 p-2 rounded-xl border border-emerald-900/60">
              <span class="text-[9px] text-slate-400 uppercase block">Safe Roads</span>
              <strong class="text-base text-emerald-400 font-black">${routeState.summary.safeRoadsCount}</strong>
            </div>
            <div class="bg-slate-950 p-2 rounded-xl border border-red-900/60">
              <span class="text-[9px] text-slate-400 uppercase block">Blocked</span>
              <strong class="text-base text-red-400 font-black">${routeState.summary.unsafeRoadsCount}</strong>
            </div>
            <div class="bg-slate-950 p-2 rounded-xl border border-amber-900/60">
              <span class="text-[9px] text-slate-400 uppercase block">Flood Threat</span>
              <strong class="text-[10px] text-amber-400 font-bold block truncate mt-1">HIGH</strong>
            </div>
          </div>
        </div>

        <!-- 4. NETWORK BLACKOUT & GPS INDEPENDENCE TELEMETRY -->
        <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-purple-400 uppercase">OFFLINE RESILIENCE TELEMETRY</span>
            <span class="text-[8px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700 font-bold">
              LOCAL DEMO ROUTING
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div>GPS SATELLITE: <strong class="text-emerald-400">ACTIVE (3D Fix)</strong></div>
            <div>LOCAL MAP CACHE: <strong class="text-emerald-400">READY</strong></div>
            <div>CELLULAR 5G: <strong class="text-red-400">OFFLINE</strong></div>
            <div>BLE MESH RELAYS: <strong class="text-purple-400">12 PEERS</strong></div>
          </div>
        </div>

        <!-- 5. BIG EMERGENCY SOS BUTTON -->
        <button id="btn-dash-sos-distress" class="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95">
          <span class="material-symbols-outlined text-lg font-bold">sos</span>
          <span>BROADCAST ENCRYPTED DISTRESS SIGNAL</span>
        </button>

      </div>

    </div>
  `;

  // Attach event handlers
  container.querySelector('#btn-dash-open-map')?.addEventListener('click', () => actions.switchTab('map'));
  container.querySelector('#btn-dash-start-nav')?.addEventListener('click', () => actions.switchTab('map'));
  container.querySelector('#btn-dash-sos-distress')?.addEventListener('click', actions.openSosModal);

  container.querySelector('#btn-dash-req-rescue')?.addEventListener('click', () => {
    nearestRescue.status = 'DISPATCHED (En Route to Arjun)';
    actions.switchTab('map');
  });
}
