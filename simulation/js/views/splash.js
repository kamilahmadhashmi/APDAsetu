/* ==========================================================================
   SMARTPHONE SIMULATOR — ONBOARDING & SCENARIO INITIALIZATION
   Introduces the scenario for Arjun Sharma (FIELD-104).
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';

export function renderSplashView(container, onRoleSelect) {
  container.innerHTML = `
    <div class="h-full flex flex-col justify-between items-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white text-center select-none font-sans">
      
      <!-- Top Branding -->
      <div class="mt-6 flex flex-col items-center gap-2.5">
        <div class="w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <span class="material-symbols-outlined text-emerald-400" style="font-size: 32px; font-variation-settings: 'FILL' 1;">directions_run</span>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-white uppercase">RESQNET EVAC</h1>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/80 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-[9px] font-mono font-bold tracking-widest text-emerald-300 uppercase">SIMULATION MODE &bull; DEMO</span>
        </div>
      </div>

      <!-- Person & Scenario Card -->
      <div class="w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left font-mono text-xs text-slate-300 space-y-2 shadow-xl">
        <div class="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1">// FIELD DEVICE TELEMETRY</div>
        
        <div class="flex justify-between items-center text-[11px]">
          <span class="text-slate-400">PERSON:</span>
          <strong class="text-white font-sans">${DEMO_PERSON.name}</strong>
        </div>
        <div class="flex justify-between items-center text-[11px]">
          <span class="text-slate-400">DEVICE ID:</span>
          <strong class="text-sky-300">${DEMO_PERSON.deviceId}</strong>
        </div>
        <div class="flex justify-between items-center text-[11px]">
          <span class="text-slate-400">STATUS:</span>
          <span class="text-amber-400 font-bold">● AT RISK (Sector B4)</span>
        </div>
        <div class="flex justify-between items-center text-[11px]">
          <span class="text-slate-400">LOCATION:</span>
          <span class="text-emerald-400 font-bold">${DEMO_PERSON.initialLocation.latitude.toFixed(4)}° N, ${DEMO_PERSON.initialLocation.longitude.toFixed(4)}° E</span>
        </div>
      </div>

      <!-- Role Selection CTA Buttons -->
      <div class="w-full space-y-2.5 mb-4">
        <button id="btn-enter-evacuation" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95">
          <span class="material-symbols-outlined text-base">map</span>
          <span>LAUNCH EVACUATION MAP</span>
        </button>

        <button id="btn-enter-responder" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
          <span class="material-symbols-outlined text-base">security</span>
          <span>VIEW CITIZEN SAFETY HUB</span>
        </button>
      </div>

    </div>
  `;

  container.querySelector('#btn-enter-evacuation')?.addEventListener('click', () => onRoleSelect('citizen'));
  container.querySelector('#btn-enter-responder')?.addEventListener('click', () => onRoleSelect('responder'));
}
