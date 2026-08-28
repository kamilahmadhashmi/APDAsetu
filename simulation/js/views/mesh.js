/* ==========================================================================
   AEGIS SMARTPHONE SIMULATOR - MOBILE BLE MESH COMMUNICATOR VIEW
   ========================================================================== */

import { tSim } from '../i18n-sim.js';
import { locationService } from '../services/location-service.js';

export function renderMeshView(container, actions) {
  let isBlackoutActive = true;
  const userLoc = locationService.getState();

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-950 text-white relative select-none">
      
      <!-- Top Mesh Control Header -->
      <div class="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 class="text-xs font-black uppercase text-purple-400 tracking-tight" data-sim-i18n="mesh_title">Offline BLE Mesh Comms</h3>
          <p class="text-[10px] text-gray-400 font-mono">AES-256 Encrypted Telemetry</p>
        </div>

        <button id="btn-toggle-blackout" class="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all bg-red-600 text-white animate-pulse">
          ● BLACKOUT MODE
        </button>
      </div>

      <!-- Main Mesh Relay Graph Visualization -->
      <div class="p-4 flex-1 flex flex-col justify-between space-y-3 overflow-y-auto">
        
        <!-- Peer Hops Visualizer Container -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 relative overflow-hidden">
          <div class="text-[10px] font-mono text-purple-400 uppercase font-bold flex justify-between items-center">
            <span>PEER MESH RELAY HOPS</span>
            <span class="text-gray-400">12 NODES CONNECTED</span>
          </div>

          <!-- Peer Nodes Diagram -->
          <div class="flex justify-between items-center my-4 relative">
            <div class="w-10 h-10 rounded-full bg-purple-600/30 border-2 border-purple-500 flex flex-col items-center justify-center z-10 animate-pulse-mesh">
              <span class="material-symbols-outlined text-sm text-purple-400">smartphone</span>
              <span class="text-[8px] font-mono text-gray-300">YOU</span>
            </div>

            <div class="flex-1 h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 relative">
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-2 py-0.5 rounded text-[8px] font-mono text-purple-300 border border-purple-800">
                BLE HOP #3
              </div>
            </div>

            <div class="w-10 h-10 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex flex-col items-center justify-center z-10">
              <span class="material-symbols-outlined text-sm text-emerald-400">router</span>
              <span class="text-[8px] font-mono text-gray-300">GATEWAY</span>
            </div>
          </div>

          <div class="text-[10px] text-gray-400 font-mono space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div class="flex justify-between">
              <span>PROTOCOL:</span>
              <strong class="text-white">BLE 5.3 + Wi-Fi Direct</strong>
            </div>
            <div class="flex justify-between">
              <span>USER GPS POSITION:</span>
              <strong class="text-cyan-400">${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)}</strong>
            </div>
            <div class="flex justify-between">
              <span>PACKET ENCRYPTION:</span>
              <strong class="text-emerald-400">AES-256-GCM</strong>
            </div>
            <div class="flex justify-between">
              <span>PING LATENCY:</span>
              <strong class="text-purple-400">14.2ms (3 Hops)</strong>
            </div>
          </div>
        </div>

        <!-- Simulated Telemetry Terminal Log -->
        <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex-1 flex flex-col">
          <span class="text-[10px] text-gray-400 font-mono uppercase font-bold mb-2">// MESH TELEMETRY BROADCAST STREAM</span>
          <div class="flex-1 bg-black/90 font-mono text-[9px] text-cyan-400 p-2.5 rounded-xl border border-slate-800 overflow-y-auto space-y-1">
            <div>[00:01.04] BROADCAST_PING (Node 0x4F2A) -> HOP 1</div>
            <div>[00:01.12] ACK_RECEIVED (Node 0x9B11) -> Hop distance: 120m</div>
            <div class="text-cyan-300">[00:01.20] GPS_BEACON -> ${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)} (Locked)</div>
            <div class="text-purple-300">[00:01.28] PACKET_FORWARD (Distress #442) -> Encrypted</div>
            <div class="text-emerald-400">[00:01.40] RELAY_CONFIRMED -> LoRa Gateway Online</div>
          </div>
        </div>

        <!-- Action Button -->
        <button id="btn-mesh-broadcast-sos" class="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
          <span class="material-symbols-outlined" style="font-size: 18px;">podcasts</span>
          <span data-sim-i18n="broadcast_distress">Transmit Encrypted SOS</span>
        </button>

      </div>

    </div>
  `;

  // Handlers
  container.querySelector('#btn-mesh-broadcast-sos')?.addEventListener('click', actions.openSosModal);

  const btnBlackout = container.querySelector('#btn-toggle-blackout');
  const dashStatus = document.querySelector('#sim-dash-mesh-status');

  btnBlackout?.addEventListener('click', () => {
    isBlackoutActive = !isBlackoutActive;
    if (isBlackoutActive) {
      btnBlackout.className = "px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all bg-red-600 text-white animate-pulse";
      btnBlackout.textContent = "● BLACKOUT MODE";
      if (dashStatus) dashStatus.textContent = "OFFLINE BLE MESH";
      locationService.setConnectionStatus('BLACKOUT_MESH');
    } else {
      btnBlackout.className = "px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all bg-emerald-600 text-white";
      btnBlackout.textContent = "● CELLULAR ONLINE";
      if (dashStatus) dashStatus.textContent = "CELLULAR ONLINE";
      locationService.setConnectionStatus('ONLINE');
    }
  });
}
