/* ==========================================================================
   AEGIS SMARTPHONE SIMULATOR - MOBILE EVACUATION & SHELTER ROUTING VIEW
   Dynamically calculates real-time distances from live user coordinates.
   ========================================================================== */

import { tSim } from '../i18n-sim.js';
import { locationService, mockShelters } from '../services/location-service.js';

export function renderRoutingView(container, actions) {
  const userLoc = locationService.getState();

  // Compute live distances for all shelters and sort by proximity
  const shelterListWithDist = mockShelters.map(s => {
    const distKm = locationService.calculateDistanceKm(userLoc.latitude, userLoc.longitude, s.lat, s.lng);
    return {
      ...s,
      distKm,
      formattedDist: locationService.formatDistance(distKm)
    };
  }).sort((a, b) => a.distKm - b.distKm);

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-50 text-gray-900 relative select-none">
      
      <!-- Top Routing Header -->
      <div class="p-3 bg-white border-b border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h3 class="text-xs font-black uppercase text-gray-900 tracking-tight" data-sim-i18n="shelter_title">Evacuation Corridors & Shelters</h3>
          <p class="text-[10px] text-gray-500 font-mono">Real-Time Distance from Current GPS</p>
        </div>
        <div class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded font-mono">
          CORRIDOR ACTIVE
        </div>
      </div>

      <!-- Shelter List Cards -->
      <div class="p-3.5 flex-1 space-y-3 overflow-y-auto">
        
        ${shelterListWithDist.map((shelter, idx) => `
          <div class="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="px-2 py-0.5 ${idx === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} text-[9px] font-bold uppercase rounded font-mono">
                  ${shelter.formattedDist} Away ${idx === 0 ? '• NEAREST' : ''}
                </span>
                <h4 class="text-xs font-bold text-gray-900 mt-1">${shelter.name}</h4>
                <p class="text-[10px] text-gray-500 font-mono">${shelter.type}</p>
              </div>
              <div class="text-right">
                <span class="text-xs font-black text-emerald-600 font-mono">${shelter.capacity}</span>
                <span class="text-[8px] text-gray-400 block font-mono">CAPACITY</span>
              </div>
            </div>

            <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div class="h-full" style="width:${idx === 0 ? '95%' : (idx === 1 ? '30%' : '80%')}; background:${shelter.color};"></div>
            </div>

            <button class="btn-shelter-nav w-full bg-black hover:bg-gray-800 text-white py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95" data-lat="${shelter.lat}" data-lng="${shelter.lng}">
              <span class="material-symbols-outlined text-xs">navigation</span>
              <span data-sim-i18n="navigate">Plot Safe Evacuation Route</span>
            </button>
          </div>
        `).join('')}

      </div>

    </div>
  `;

  // Attach navigation buttons
  container.querySelectorAll('.btn-shelter-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      if (actions && actions.switchTab) {
        actions.switchTab('map');
      }
    });
  });
}
