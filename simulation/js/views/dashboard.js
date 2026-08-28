/* ==========================================================================
   SMARTPHONE SIMULATOR — HOME & SAFETY DASHBOARD VIEW
   Represents the field device for Arjun Sharma (FIELD-104).
   Focuses on critical person safety, nearest safehouse, rescue team,
   road condition metrics, and offline emergency resilience.
   Fully localized with global multilingual translations.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { DEMO_SAFEHOUSES } from '../data/demo-safehouses.js';
import { DEMO_RESCUE_TEAMS } from '../data/demo-rescue-teams.js';
import { routeEngine } from '../services/route-engine.js';
import { locationService } from '../services/location-service.js';
import { i18nService, t } from '../services/i18n-service.js';

let dashI18nUnsubscribe = null;

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
                <h2 class="text-sm font-black text-white uppercase tracking-tight" data-i18n="person_name">${t('person_name')}</h2>
                <span class="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold">${DEMO_PERSON.deviceId}</span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono">
                <span data-i18n="person_blood">${t('person_blood')}</span> &bull; <span data-i18n="person_medical_alert">${t('person_medical_alert')}</span>
              </p>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase bg-red-950 text-red-400 border border-red-700 animate-pulse" data-i18n="status_at_risk">
            ● ${t('status_at_risk')}
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
              <span class="material-symbols-outlined text-sm">route</span> <span data-i18n="safest_route">${t('safest_route')}</span>
            </span>
            <span class="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold" data-i18n="status_low_risk">
              ${t('status_low_risk')}
            </span>
          </div>

          <div class="flex justify-between items-end">
            <div>
              <h3 class="text-sm font-black text-white leading-tight" data-i18n="safehouse_name">${t('safehouse_name')}</h3>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5" data-i18n="elevation_safe">${t('elevation_safe')}</p>
            </div>
            <div class="text-right">
              <div class="text-base font-black text-emerald-400" id="dash-route-dist">${i18nService.formatDistance(routeState.activeRoute.distanceKm)}</div>
              <div class="text-[10px] text-slate-400 font-mono" id="dash-route-time">${i18nService.formatTime(routeState.activeRoute.travelTimeMinutes)}</div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button id="btn-dash-start-nav" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm font-bold">directions_run</span>
              <span data-i18n="start_evacuation">${t('start_evacuation')}</span>
            </button>
            <button id="btn-dash-open-map" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all">
              <span class="material-symbols-outlined text-sm">map</span>
              <span data-i18n="tab_map">${t('tab_map')}</span>
            </button>
          </div>
        </div>

        <!-- 2. NEARBY RESCUE TEAM CONTACT CARD -->
        <div class="bg-slate-900 border border-blue-500/40 p-3.5 rounded-2xl space-y-2.5 shadow-lg">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">directions_boat</span> <span data-i18n="rescue_team_alpha">${t('rescue_team_alpha')}</span>
            </span>
            <span class="text-[9px] font-mono bg-blue-950 text-sky-300 px-2 py-0.5 rounded border border-blue-700 font-bold" data-i18n="team_available">
              ${t('team_available')}
            </span>
          </div>

          <div class="text-[11px] font-mono text-slate-300 space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">LEADER:</span>
              <strong class="text-white" data-i18n="rescue_leader">${t('rescue_leader')}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">DISTANCE:</span>
              <strong class="text-sky-300">${i18nService.formatDistance(0.7)} (${i18nService.formatTime(4)})</strong>
            </div>
          </div>

          <button id="btn-dash-req-rescue" class="w-full py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-sky-300 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all">
            <span class="material-symbols-outlined text-sm">support_agent</span>
            <span data-i18n="request_rescue_btn">${t('request_rescue_btn')}</span>
          </button>
        </div>

        <!-- 3. ROAD NETWORK HEALTH SUMMARY -->
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <h4 class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider" data-i18n="legend_title">${t('legend_title')}</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
              <div class="text-lg font-black text-emerald-400">8 ${t('status_safe')}</div>
              <div class="text-[9px] font-mono text-slate-400" data-i18n="legend_safe_road">${t('legend_safe_road')}</div>
            </div>
            <div class="bg-slate-950 p-2.5 rounded-xl border border-red-500/30">
              <div class="text-lg font-black text-red-400">3 ${t('status_critical')}</div>
              <div class="text-[9px] font-mono text-slate-400" data-i18n="legend_unsafe_road">${t('legend_unsafe_road')}</div>
            </div>
          </div>
        </div>

        <!-- 4. OFFLINE EMERGENCY RESILIENCE -->
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-[10px] font-mono">
          <h4 class="font-bold text-slate-400 uppercase tracking-wider" data-i18n="mesh_title">${t('mesh_title')}</h4>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-emerald-400">
              <span data-i18n="gps_satellite_active">${t('gps_satellite_active')}</span>
              <span class="material-symbols-outlined text-xs">satellite_alt</span>
            </div>
            <div class="flex justify-between items-center text-amber-400">
              <span data-i18n="cellular_offline">${t('cellular_offline')}</span>
              <span class="material-symbols-outlined text-xs">signal_cellular_off</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach button events
  document.getElementById('btn-dash-start-nav')?.addEventListener('click', () => {
    actions.switchTab('map');
  });

  document.getElementById('btn-dash-open-map')?.addEventListener('click', () => {
    actions.switchTab('map');
  });

  document.getElementById('btn-dash-req-rescue')?.addEventListener('click', () => {
    locationService.transmitDistressPacket({
      situation: `${t('request_sent')} (${DEMO_PERSON.deviceId})`,
      notes: `${nearestRescue.name}. Coordinates: ${userLoc.latitude}, ${userLoc.longitude}`
    });
    const btn = document.getElementById('btn-dash-req-rescue');
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> <span>${t('request_sent')}</span>`;
      btn.className = 'w-full py-2 bg-emerald-600/30 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5';
    }
  });

  // Subscribe to i18n updates
  if (dashI18nUnsubscribe) dashI18nUnsubscribe();
  dashI18nUnsubscribe = i18nService.subscribe(() => {
    i18nService.updateDOM(container);
  });
}
