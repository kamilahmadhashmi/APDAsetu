/* ==========================================================================
   SMARTPHONE SIMULATOR — EMERGENCY SOS DISTRESS TRANSMISSION CHAIN
   Captures live person location, signs payload with AES-256, and simulates
   multi-hop BLE mesh relay to LoRa Gateway and Command Center.
   Fully localized with reactive global multilingual translations.
   ========================================================================== */

import { DEMO_PERSON } from '../data/demo-person.js';
import { locationService } from '../services/location-service.js';
import { i18nService, t } from '../services/i18n-service.js';

let isTransmitting = false;

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
              <h3 class="text-xs font-black uppercase text-red-500 tracking-wider" data-i18n="distress_title">${t('distress_title')}</h3>
              <span class="text-[9px] font-mono text-slate-400" data-i18n="distress_protocol">${t('distress_protocol')}</span>
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
              <div class="text-slate-200 font-bold" data-i18n="distress_step1_title">${t('distress_step1_title')}</div>
              <div class="text-[8px] text-slate-400" data-i18n="distress_step1_desc">${t('distress_step1_desc')}</div>
            </div>
            <span class="text-amber-400 text-[10px] font-mono animate-pulse">QUEUED</span>
          </div>

          <!-- Step 2: Peer BLE Relay Found -->
          <div id="step-relay" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">2</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold" data-i18n="distress_step2_title">${t('distress_step2_title')}</div>
              <div class="text-[8px] text-slate-500" data-i18n="distress_step2_desc">${t('distress_step2_desc')}</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono" id="relay-status">WAITING</span>
          </div>

          <!-- Step 3: Gateway Discovered -->
          <div id="step-gateway" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">3</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold" data-i18n="distress_step3_title">${t('distress_step3_title')}</div>
              <div class="text-[8px] text-slate-500" data-i18n="distress_step3_desc">${t('distress_step3_desc')}</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono" id="gateway-status">WAITING</span>
          </div>

          <!-- Step 4: Command Center Received -->
          <div id="step-command" class="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl flex items-center gap-2.5 opacity-40 transition-all">
            <div class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">4</div>
            <div class="flex-1 text-[10px] font-mono">
              <div class="text-slate-400 font-bold" data-i18n="distress_step4_title">${t('distress_step4_title')}</div>
              <div class="text-[8px] text-slate-500" data-i18n="distress_step4_desc">${t('distress_step4_desc')}</div>
            </div>
            <span class="text-slate-500 text-[10px] font-mono" id="command-status">PENDING</span>
          </div>

        </div>

        <!-- Transmit Action Button -->
        <button id="btn-execute-broadcast" class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-all active:scale-95">
          <span class="material-symbols-outlined text-base">podcasts</span>
          <span data-i18n="transmit_distress_btn">${t('transmit_distress_btn')}</span>
        </button>

        <p class="text-[9px] text-center text-slate-400 font-mono" data-i18n="demo_data_notice">
          ${t('demo_data_notice')}
        </p>

      </div>
    </div>
  `;

  // Attach events
  const close = () => {
    onClose();
  };

  document.getElementById('btn-close-sos-backdrop')?.addEventListener('click', close);
  document.getElementById('btn-close-sos-x')?.addEventListener('click', close);

  document.getElementById('btn-execute-broadcast')?.addEventListener('click', () => {
    if (isTransmitting) return;
    isTransmitting = true;

    const btn = document.getElementById('btn-execute-broadcast');
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">refresh</span> <span>${t('broadcast_in_progress')}</span>`;
      btn.classList.remove('bg-red-600', 'hover:bg-red-500');
      btn.classList.add('bg-slate-700');
    }

    // Step 2 Progression (1.0s)
    setTimeout(() => {
      const stepRelay = document.getElementById('step-relay');
      const relayStatus = document.getElementById('relay-status');
      if (stepRelay) {
        stepRelay.className = 'bg-slate-900 border border-sky-500 p-2 rounded-xl flex items-center gap-2.5 transition-all';
        stepRelay.querySelector('div')?.classList.replace('bg-slate-800', 'bg-sky-500/20');
        stepRelay.querySelector('div')?.classList.replace('text-slate-400', 'text-sky-400');
        stepRelay.querySelector('div')?.classList.replace('border-slate-700', 'border-sky-400');
        stepRelay.querySelector('.text-slate-400')?.classList.replace('text-slate-400', 'text-slate-200');
      }
      if (relayStatus) {
        relayStatus.className = 'text-sky-400 text-[10px] font-mono font-bold';
        relayStatus.textContent = 'RELAYED (Hop 1)';
      }
    }, 1000);

    // Step 3 Progression (2.2s)
    setTimeout(() => {
      const stepGateway = document.getElementById('step-gateway');
      const gatewayStatus = document.getElementById('gateway-status');
      if (stepGateway) {
        stepGateway.className = 'bg-slate-900 border border-purple-500 p-2 rounded-xl flex items-center gap-2.5 transition-all';
        stepGateway.querySelector('div')?.classList.replace('bg-slate-800', 'bg-purple-500/20');
        stepGateway.querySelector('div')?.classList.replace('text-slate-400', 'text-purple-400');
        stepGateway.querySelector('div')?.classList.replace('border-slate-700', 'border-purple-400');
        stepGateway.querySelector('.text-slate-400')?.classList.replace('text-slate-400', 'text-slate-200');
      }
      if (gatewayStatus) {
        gatewayStatus.className = 'text-purple-400 text-[10px] font-mono font-bold';
        gatewayStatus.textContent = 'UPLINKED (LoRa/Sat)';
      }
    }, 2200);

    // Step 4 Progression (3.4s)
    setTimeout(() => {
      const stepCommand = document.getElementById('step-command');
      const commandStatus = document.getElementById('command-status');
      if (stepCommand) {
        stepCommand.className = 'bg-slate-900 border border-emerald-500 p-2 rounded-xl flex items-center gap-2.5 transition-all';
        stepCommand.querySelector('div')?.classList.replace('bg-slate-800', 'bg-emerald-500/20');
        stepCommand.querySelector('div')?.classList.replace('text-slate-400', 'text-emerald-400');
        stepCommand.querySelector('div')?.classList.replace('border-slate-700', 'border-emerald-400');
        stepCommand.querySelector('.text-slate-400')?.classList.replace('text-slate-400', 'text-slate-200');
      }
      if (commandStatus) {
        commandStatus.className = 'text-emerald-400 text-[10px] font-mono font-bold';
        commandStatus.textContent = 'ACK RECEIVED';
      }

      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-base">check_circle</span> <span>${t('rescue_confirmed')}</span>`;
        btn.classList.remove('bg-slate-700');
        btn.classList.add('bg-emerald-600');
      }

      // Transmit to Central Location Service & Command Center
      locationService.transmitDistressPacket({
        situation: 'Field Evacuation Emergency SOS',
        notes: `Device ${DEMO_PERSON.deviceId} (${DEMO_PERSON.name}). Blood Group: ${DEMO_PERSON.bloodGroup}. Medical: ${DEMO_PERSON.medicalNotes}`
      });

      isTransmitting = false;
    }, 3400);
  });
}
