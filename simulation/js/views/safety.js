/* ==========================================================================
   SMARTPHONE SIMULATOR — SAFETY & DISASTER TRIAGE SCREEN
   Concise safety posture, road network health, safehouse status, and rescue teams.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_RESCUE_TEAMS } from '../data/demo-rescue-teams.js';
import { routeEngine } from '../services/route-engine.js';

export function renderSafetyView(container, actions = {}) {
  const routeState = routeEngine.getRouteState();
  const primarySafehouse = DEMO_SAFEHOUSES[0];
  const rescueTeam = DEMO_RESCUE_TEAMS[0];

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-950 text-slate-100 relative select-none font-sans overflow-y-auto pb-16">
      
      <!-- Top Safety Title -->
      <div class="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex justify-between items-center">
        <div>
          <h2 class="text-xs font-black text-white uppercase tracking-tight">CITIZEN SAFETY POSTURE</h2>
          <p class="text-[10px] text-slate-400 font-mono">${DEMO_PERSON.name} &bull; ${DEMO_PERSON.deviceId}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase bg-amber-950 text-amber-300 border border-amber-600">
          ● AT RISK (FLOOD BASIN)
        </span>
      </div>

      <div class="p-4 space-y-3.5 flex-1">
        
        <!-- 1. SAFEHOUSE DESTINATION TELEMETRY -->
        <div class="bg-slate-900 border border-emerald-500/40 p-3.5 rounded-2xl space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase">DESIGNATED SAFEHOUSE</span>
            <span class="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold">
              ${primarySafehouse.status}
            </span>
          </div>

          <h3 class="text-xs font-bold text-white">${primarySafehouse.name}</h3>
          
          <div class="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div>DISTANCE: <strong class="text-emerald-400 block">${routeState.activeRoute.formattedDistance}</strong></div>
            <div>ETA: <strong class="text-emerald-400 block">${routeState.activeRoute.formattedTime}</strong></div>
            <div>CAPACITY: <strong class="text-sky-300 block">${primarySafehouse.available} free</strong></div>
          </div>

          <button id="btn-safety-nav-safehouse" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
            NAVIGATE TO SAFEHOUSE
          </button>
        </div>

        <!-- 2. NEAREST RESCUE TEAM -->
        <div class="bg-slate-900 border border-blue-500/40 p-3.5 rounded-2xl space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-sky-400 uppercase">NEAREST RESCUE TEAM</span>
            <span class="text-[9px] font-mono bg-blue-950 text-sky-300 px-2 py-0.5 rounded border border-blue-700 font-bold">
              ${rescueTeam.status}
            </span>
          </div>

          <h4 class="text-xs font-bold text-white">${rescueTeam.name}</h4>
          <p class="text-[10px] text-slate-400 font-mono">${rescueTeam.specialization}</p>

          <div class="flex justify-between text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span>Distance: <strong class="text-amber-400">0.7 km</strong></span>
            <span>ETA: <strong class="text-emerald-400">${rescueTeam.etaMinutes} min</strong></span>
            <span>Channel: <strong class="text-purple-300">VHF Ch 12</strong></span>
          </div>
        </div>

        <!-- 3. ROAD CONDITIONS BREAKDOWN -->
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono font-bold text-slate-400 uppercase block">SYNTHETIC ROAD HAZARD MONITOR</span>
          
          <div class="space-y-1 text-[10px] font-mono">
            <div class="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-emerald-400 font-bold">🟢 SAFE HIGH-GROUND CORRIDORS:</span>
              <strong class="text-white">${routeState.summary.safeRoadsCount} Roads Passable</strong>
            </div>
            <div class="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-red-400 font-bold">🔴 SUBMERGED / BLOCKED ROADS:</span>
              <strong class="text-red-400">${routeState.summary.unsafeRoadsCount} Impassable (R17, R18${routeState.isR12Flooded ? ', R12' : ''})</strong>
            </div>
            <div class="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-amber-400 font-bold">🌊 FLOOD INUNDATION RISK:</span>
              <strong class="text-amber-300">${routeState.summary.floodRisk}</strong>
            </div>
          </div>
        </div>

        <!-- 4. EMERGENCY SURVIVAL CHECKLIST -->
        <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono font-bold text-slate-300 uppercase">FIELD EVACUATION PROTOCOLS</span>
          <div class="text-[10px] text-slate-400 font-sans space-y-1 pl-2 border-l-2 border-slate-700">
            <div>&bull; Avoid walking through moving flood water deeper than 15cm.</div>
            <div>&bull; Keep device battery conserved; BLE mesh operates in low-power sleep.</div>
            <div>&bull; Maintain continuous bearing toward elevated Sector 4 ridge.</div>
          </div>
        </div>

      </div>

    </div>
  `;

  container.querySelector('#btn-safety-nav-safehouse')?.addEventListener('click', () => actions.switchTab('map'));
}
