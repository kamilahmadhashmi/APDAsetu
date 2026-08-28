/* ==========================================================================
   SMARTPHONE SIMULATOR — EMERGENCY SOS DISTRESS TRANSMISSION CHAIN
   Captures live person location, signs payload with AES-256, and simulates
   multi-hop BLE mesh relay to LoRa Gateway and Command Center.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { locationService } from '../services/location-service.js';

export function renderSosModal(container, onClose) {
  const loc = locationService.getState();
  const packetId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

  container.innerHTML = `
    <div class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="btn-close-sos-backdrop"></div>

      <div class="relative w-full max-w-sm bg-slate-950 border-2 border-red-600 rounded-3xl p-5 shadow-2xl text-white font-sans space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Header -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center text-red-500">
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">sos</span>
            </div>
            <div>
              <h3 class="text-xs font-black uppercase text-red-500 tracking-wider">ENCRYPTED DISTRESS SIGNAL</h3>
              <span class="text-[9px] font-mono text-slate-400">AES-256 GCM &bull; BLE Mesh Protocol</span>
            </div>
          </div>
          <button id="btn-close-sos-x" class="text-slate-400 hover:text-white p-1">&times;</button>
        </div>

        <!-- Person Location Stamp (Locked to Person) -->
        <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1 text-[10px] font-mono">
          <div class="flex justify-between">
            <span class="text-slate-400">PERSON:</span>
            <strong class="text-white">${DEMO_PERSON.name} (${DEMO_PERSON.deviceId})</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">COORDINATES:</span>
            <strong class="text-cyan-400">${loc.latitude.toFixed(5)}° N, ${loc.longitude.toFixed(5)}° E</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">ACCURACY:</span>
            <strong class="text-emerald-400">±${loc.accuracy}m (${loc.source})</strong>
          </div>
        </div>

        <!-- Transmission Chain Progression Steps -->
        <div class="space-y-2" id="transmission-chain-steps">
          
          <!-- Step 1: Queued Locally -->
          <div id="step-queued" class="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-2.5 transition-all">
            <div class="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">1</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-200 font-bold">1. DISTRESS QUEUED LOCALLY</div>
              <div class="text-[8px] text-slate-400">Packet ${packetId} signed & stored offline</div>
            </div>
            <span class="text-amber-400 text-[10px] font-mono animate-pulse">QUEUED</span>
          </div>

          <!-- Step 2: Peer BLE Relay Found -->
          <div id="step-relay" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">2</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold">2. BLE MESH RELAY FOUND</div>
              <div class="text-[8px] text-slate-500">Forwarded to Peer Node 0x4F2A (Hop 1)</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono">WAITING</span>
          </div>

          <!-- Step 3: Gateway Discovered -->
          <div id="step-gateway" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">3</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold">3. LORA / SATELLITE GATEWAY</div>
              <div class="text-[8px] text-slate-500">Uplink established via High Ground Hub</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono">WAITING</span>
          </div>

          <!-- Step 4: Command Center Received -->
          <div id="step-command" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">4</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold">4. COMMAND CENTER RECEIVED</div>
              <div class="text-[8px] text-slate-500">Rescue dispatch ACK confirmed</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono">PENDING</span>
          </div>

        </div>

        <!-- Transmit Action Button -->
        <button id="btn-execute-broadcast" class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-all active:scale-95">
          <span class="material-symbols-outlined text-base">podcasts</span>
          <span>TRANSMIT DISTRESS PACKET</span>
        </button>

        <button id="btn-cancel-sos" class="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 py-2 rounded-xl text-[10px] font-bold uppercase transition-all">
          CLOSE
        </button>

      </div>
    </div>
  `;

  // Attach handlers
  const close = () => {
    container.innerHTML = '';
    if (onClose) onClose();
  };

  container.querySelector('#btn-close-sos-backdrop')?.addEventListener('click', close);
  container.querySelector('#btn-close-sos-x')?.addEventListener('click', close);
  container.querySelector('#btn-cancel-sos')?.addEventListener('click', close);

  const btnBroadcast = container.querySelector('#btn-execute-broadcast');

  btnBroadcast?.addEventListener('click', () => {
    btnBroadcast.disabled = true;
    btnBroadcast.className = 'w-full bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed';
    btnBroadcast.innerHTML = '<span class="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span> BROADCASTING ACROSS MESH...';

    // Step 1: Queued (instant)
    const s1 = container.querySelector('#step-queued');
    if (s1) {
      s1.querySelector('span').textContent = 'CONFIRMED ✓';
      s1.querySelector('span').className = 'text-emerald-400 text-[10px] font-mono font-bold';
    }

    // Step 2: Relay Found (after 600ms)
    setTimeout(() => {
      const s2 = container.querySelector('#step-relay');
      if (s2) {
        s2.className = 'bg-slate-900 border border-purple-500/50 p-2 rounded-xl flex items-center gap-2.5 transition-all';
        s2.querySelector('.w-5').className = 'w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-[10px] font-mono font-bold text-purple-400';
        s2.querySelector('.text-slate-400').className = 'text-slate-200 font-bold';
        s2.querySelector('span').textContent = 'RELAYED ✓';
        s2.querySelector('span').className = 'text-purple-400 text-[10px] font-mono font-bold';
      }
    }, 600);

    // Step 3: Gateway Discovered (after 1200ms)
    setTimeout(() => {
      const s3 = container.querySelector('#step-gateway');
      if (s3) {
        s3.className = 'bg-slate-900 border border-cyan-500/50 p-2 rounded-xl flex items-center gap-2.5 transition-all';
        s3.querySelector('.w-5').className = 'w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-400';
        s3.querySelector('.text-slate-400').className = 'text-slate-200 font-bold';
        s3.querySelector('span').textContent = 'UPLINKED ✓';
        s3.querySelector('span').className = 'text-cyan-400 text-[10px] font-mono font-bold';
      }
    }, 1200);

    // Step 4: Command Center Received (after 1800ms)
    setTimeout(() => {
      const s4 = container.querySelector('#step-command');
      if (s4) {
        s4.className = 'bg-slate-900 border-2 border-emerald-500 p-2 rounded-xl flex items-center gap-2.5 transition-all shadow-lg';
        s4.querySelector('.w-5').className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400';
        s4.querySelector('.text-slate-400').className = 'text-white font-bold';
        s4.querySelector('span').textContent = 'ACKNOWLEDGED ✓';
        s4.querySelector('span').className = 'text-emerald-400 text-[10px] font-mono font-black animate-pulse';
      }

      // Transmit to Central Location Service & BroadcastChannel
      locationService.transmitDistressPacket({
        situation: `Citizen Distress Broadcast — ${DEMO_PERSON.name} (${DEMO_PERSON.deviceId})`,
        notes: `Emergency Beacon locked to user GPS. Medical Note: ${DEMO_PERSON.medicalAlert}. Blood: ${DEMO_PERSON.bloodGroup}.`
      });

      btnBroadcast.className = 'w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg';
      btnBroadcast.innerHTML = '<span class="material-symbols-outlined text-base">verified</span> RESCUE DISPATCH CONFIRMED';
    }, 1800);
  });
}
