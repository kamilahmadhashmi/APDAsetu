/* ==========================================================================
   AEGIS SMARTPHONE SIMULATOR - MOBILE AI VISION VIEW
   ========================================================================== */

import { tSim } from '../i18n-sim.js';

export function renderVisionView(container) {
  let isScanning = false;

  container.innerHTML = `
    <div class="h-full flex flex-col bg-slate-950 text-white relative overflow-hidden">
      
      <!-- Top Camera Viewport Header -->
      <div class="p-3 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center z-20">
        <div>
          <h3 class="text-xs font-black uppercase text-cyan-400 tracking-tight" data-sim-i18n="vision_title">Field AI Camera Scanner</h3>
          <p class="text-[10px] text-gray-400 font-mono" data-sim-i18n="vision_subtitle">YOLOv8 Real-Time Survivor Detection</p>
        </div>
        <div class="px-2 py-0.5 bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono text-[9px] rounded font-bold">
          FP16 INF
        </div>
      </div>

      <!-- Camera Feed Display Box -->
      <div class="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        
        <!-- Simulated Drone/Camera Frame View -->
        <div class="absolute inset-0 bg-cover bg-center opacity-70" style="background-image: url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80');"></div>
        
        <!-- Scanning Animation Overlay -->
        <div id="sim-scan-line" class="hidden absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-line z-10"></div>

        <!-- Simulated YOLOv8 Bounding Boxes -->
        <div id="bbox-1" class="absolute top-[30%] left-[25%] w-[45%] h-[35%] border-2 border-red-500 bg-red-500/10 rounded p-1 z-10 flex flex-col justify-between transition-all">
          <div class="flex justify-between items-start bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
            <span>● PERSON_SURVIVOR</span>
            <span>94.8%</span>
          </div>
          <div class="text-[8px] font-mono text-red-300 bg-black/80 px-1 py-0.5 rounded">
            COORDINATES: 20.2961, 85.8245
          </div>
        </div>

        <div id="bbox-2" class="absolute bottom-[20%] right-[15%] w-[35%] h-[25%] border-2 border-amber-500 bg-amber-500/10 rounded p-1 z-10 flex flex-col justify-between transition-all">
          <div class="flex justify-between items-start bg-amber-600 text-white px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
            <span>● SUBMERGED_VEHICLE</span>
            <span>88.2%</span>
          </div>
          <div class="text-[8px] font-mono text-amber-300 bg-black/80 px-1 py-0.5 rounded">
            DEPTH EST: 2.4m
          </div>
        </div>

        <!-- Camera Crosshair Grid overlay -->
        <div class="absolute inset-0 border-[16px] border-slate-950/40 pointer-events-none flex items-center justify-center">
          <span class="material-symbols-outlined text-white/30" style="font-size: 64px;">filter_center_focus</span>
        </div>
      </div>

      <!-- Bottom Camera Controls -->
      <div class="p-4 bg-slate-900 border-t border-slate-800 space-y-3 z-20">
        <div class="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
          <div class="bg-slate-950 p-2 rounded border border-slate-800">
            <span class="text-gray-400 uppercase block">Detect Targets</span>
            <strong id="sim-target-count" class="text-cyan-400 font-bold text-sm">2 DETECTED</strong>
          </div>
          <div class="bg-slate-950 p-2 rounded border border-slate-800">
            <span class="text-gray-400 uppercase block">Inference Latency</span>
            <strong class="text-emerald-400 font-bold text-sm">18.4 ms</strong>
          </div>
        </div>

        <button id="btn-trigger-scan" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all">
          <span class="material-symbols-outlined" style="font-size: 18px;">center_focus_strong</span>
          <span data-sim-i18n="scan_button">Start AI Camera Scan</span>
        </button>
      </div>

    </div>
  `;

  const btnScan = container.querySelector('#btn-trigger-scan');
  const scanLine = container.querySelector('#sim-scan-line');
  const bbox1 = container.querySelector('#bbox-1');
  const bbox2 = container.querySelector('#bbox-2');

  btnScan.addEventListener('click', () => {
    isScanning = true;
    scanLine.classList.remove('hidden');
    bbox1.classList.add('scale-105', 'border-cyan-400');
    bbox2.classList.add('scale-105', 'border-cyan-400');

    setTimeout(() => {
      isScanning = false;
      scanLine.classList.add('hidden');
      bbox1.classList.remove('scale-105', 'border-cyan-400');
      bbox2.classList.remove('scale-105', 'border-cyan-400');
    }, 2500);
  });
}
