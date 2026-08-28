/* ==========================================================================
   AI / VISION ENGINE SIMULATOR COMPONENT (CUSTOM DIALOGS)
   ========================================================================== */

import { t } from '../i18n.js';
import { showSystemPrompt } from '../modals.js';

let canvas = null;
let ctx = null;
let animationFrameId = null;

const getFeedSources = () => ({
  drone_alpha: {
    name: t('feed_drone'),
    type: 'RGB Multi-Spectral Aerial',
    resolution: '3840x2160 @ 60FPS',
    detections: [
      { label: 'Person (Rooftop)', conf: 0.96, x: 180, y: 120, w: 70, h: 70, color: '#ff2a6d' },
      { label: 'Submerged Vehicle', conf: 0.92, x: 380, y: 260, w: 120, h: 80, color: '#ffb800' },
      { label: 'Person (Rooftop)', conf: 0.94, x: 260, y: 140, w: 60, h: 60, color: '#ff2a6d' },
      { label: 'Collapsed Bridge Section', conf: 0.89, x: 520, y: 180, w: 160, h: 110, color: '#9d4edd' }
    ]
  },
  satellite_sentinel: {
    name: t('feed_sat'),
    type: 'Synthetic Aperture Radar (SAR)',
    resolution: '0.5m/pixel Multi-Band',
    detections: [
      { label: 'Flood Inundation Boundary', conf: 0.98, x: 100, y: 80, w: 580, h: 300, color: '#00f0ff' },
      { label: 'Isolated Evacuation Island', conf: 0.95, x: 320, y: 190, w: 150, h: 120, color: '#00f5a0' }
    ]
  },
  flir_thermal: {
    name: t('feed_flir'),
    type: 'Infrared Long-Wave IR (8-14μm)',
    resolution: '1280x720 Thermal',
    detections: [
      { label: 'Thermal Body Heat Signature (2)', conf: 0.97, x: 290, y: 150, w: 90, h: 80, color: '#ff2a6d' },
      { label: 'Thermal Body Heat Signature (1)', conf: 0.93, x: 440, y: 220, w: 50, h: 50, color: '#ff2a6d' }
    ]
  }
});

let currentFeedKey = 'drone_alpha';
let floodSegmentationOpacity = 0.55;

export function renderAiVisionEngine(container) {
  const feeds = getFeedSources();
  container.innerHTML = `
    <div style="display: flex; width: 100%; height: 100%; gap: 16px; padding: 16px;">
      
      <!-- Left Visual Canvas Area (68%) -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 12px; height: 100%;">
        
        <!-- Toolbar -->
        <div class="glass-panel" style="padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
              <i data-lucide="eye" style="color: var(--accent-cyan);"></i> ${t('yolo_pipeline')}
            </span>
            <span class="badge badge-cyan" id="ai-model-tag">YOLOv8x-SEG FP16</span>
          </div>

          <div style="display: flex; gap: 8px;">
            <select id="sel-feed-source" style="background: rgba(15,23,42,0.9); color: var(--text-main); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: var(--radius-sm); font-size: 12px;">
              <option value="drone_alpha">${t('feed_drone')}</option>
              <option value="satellite_sentinel">${t('feed_sat')}</option>
              <option value="flir_thermal">${t('feed_flir')}</option>
            </select>
            <button class="btn btn-primary" id="btn-toggle-boxes" style="padding: 4px 10px; font-size: 11px;">
              <i data-lucide="scan"></i> ${t('toggle_boxes')}
            </button>
          </div>
        </div>

        <!-- Vision Canvas Box -->
        <div class="glass-panel" style="flex: 1; padding: 0; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: var(--radius-md); background: #04070d;">
          <canvas id="vision-canvas" width="800" height="480" style="width: 100%; height: 100%; object-fit: contain;"></canvas>
          
          <!-- HUD Overlay Text -->
          <div style="position: absolute; top: 16px; left: 16px; font-family: monospace; font-size: 11px; color: var(--accent-cyan); background: rgba(7,10,18,0.75); padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.2);">
            <div>FEED: <span id="hud-feed-name">${feeds[currentFeedKey].name}</span></div>
            <div>RES: <span id="hud-res">3840x2160</span> | FPS: <span id="hud-fps" style="color:var(--accent-emerald);">62.4 FPS</span></div>
            <div>GPU LATENCY: <span style="color:var(--accent-emerald);">13.8 ms (TensorRT)</span></div>
          </div>

          <div style="position: absolute; top: 16px; right: 16px; font-family: monospace; font-size: 11px; color: var(--accent-pink); background: rgba(7,10,18,0.75); padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255,42,109,0.2);">
            <div>DETECTIONS: <strong id="hud-det-count">4 Objects</strong></div>
            <div>FLOOD EXTENT: <strong id="hud-flood-pct" style="color:var(--accent-amber);">68.2% Coverage</strong></div>
          </div>
        </div>

      </div>

      <!-- Right Controls & Inference Stats Sidebar (32%) -->
      <div style="width: 360px; display: flex; flex-direction: column; gap: 16px; height: 100%;">
        
        <!-- Segmentation Controls Card -->
        <div class="glass-panel" style="padding: 16px;">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title"><i data-lucide="sliders"></i> ${t('flood_layer')}</span>
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span>${t('mask_opacity')}</span>
              <span class="slider-val" id="val-mask-opacity">55%</span>
            </div>
            <input type="range" id="rng-mask-opacity" min="0" max="100" value="55">
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span>${t('conf_thresh')}</span>
              <span class="slider-val" id="val-conf-thresh">0.45</span>
            </div>
            <input type="range" id="rng-conf-thresh" min="10" max="95" value="45">
          </div>

          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="btn btn-primary" id="btn-run-inference" style="width: 100%; justify-content: center; font-size: 12px;">
              <i data-lucide="refresh-cw"></i> ${t('run_inference')}
            </button>
          </div>
        </div>

        <!-- Detection Class Breakdown Table -->
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px;">
          <div class="panel-header" style="margin-bottom: 10px;">
            <span class="panel-title"><i data-lucide="list-checks"></i> Automated Detections</span>
            <span class="badge badge-emerald">REALTIME</span>
          </div>

          <div id="detection-items-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- AI Engine Pipeline Performance Metrics -->
        <div class="glass-panel" style="padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
            Pipeline Performance Benchmarks
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px;">
              <span style="color: var(--text-dim);">mAP50-95 Score:</span><br>
              <strong style="color: var(--accent-emerald); font-size: 14px;">89.4%</strong>
            </div>
            <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px;">
              <span style="color: var(--text-dim);">VRAM Usage:</span><br>
              <strong style="color: var(--accent-cyan); font-size: 14px;">3.4 / 12 GB</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    initVisionCanvas();
    attachVisionEvents();
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}

function initVisionCanvas() {
  canvas = document.getElementById('vision-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  let tick = 0;
  function drawFrame() {
    tick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const feeds = getFeedSources();
    const source = feeds[currentFeedKey] || feeds.drone_alpha;

    if (currentFeedKey === 'flir_thermal') {
      ctx.fillStyle = '#0f051d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 42, 109, 0.4)';
      ctx.beginPath();
      ctx.arc(335, 190, 45, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentFeedKey === 'satellite_sentinel') {
      ctx.fillStyle = '#05121e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0e1826';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (floodSegmentationOpacity > 0) {
      ctx.fillStyle = `rgba(0, 102, 255, ${floodSegmentationOpacity * 0.45})`;
      ctx.strokeStyle = `rgba(0, 240, 255, ${floodSegmentationOpacity})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(80, 180 + Math.sin(tick * 0.03) * 5);
      ctx.lineTo(340, 220 + Math.cos(tick * 0.03) * 5);
      ctx.lineTo(720, 160 + Math.sin(tick * 0.04) * 5);
      ctx.lineTo(750, 440);
      ctx.lineTo(50, 450);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = '11px monospace';
      ctx.fillText('⚡ FLOOD SEGMENTATION MASK (DEEP WATER 2.4m)', 120, 360);
    }

    source.detections.forEach(det => {
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(det.x, det.y, det.w, det.h);

      const cLen = 10;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(det.x, det.y + cLen); ctx.lineTo(det.x, det.y); ctx.lineTo(det.x + cLen, det.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(det.x + det.w - cLen, det.y); ctx.lineTo(det.x + det.w, det.y); ctx.lineTo(det.x + det.w, det.y + cLen); ctx.stroke();

      ctx.fillStyle = det.color;
      ctx.fillRect(det.x, det.y - 20, ctx.measureText(`${det.label} ${(det.conf * 100).toFixed(0)}%`).width + 12, 20);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${det.label} ${(det.conf * 100).toFixed(0)}%`, det.x + 6, det.y - 6);
    });

    const scanY = (tick * 2.5) % canvas.height;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(canvas.width, scanY);
    ctx.stroke();

    animationFrameId = requestAnimationFrame(drawFrame);
  }

  drawFrame();
  updateDetectionList(getFeedSources()[currentFeedKey].detections);
}

function updateDetectionList(detections) {
  const container = document.getElementById('detection-items-list');
  if (!container) return;

  container.innerHTML = detections.map(d => `
    <div class="glass-panel" style="padding: 10px 12px; border-left: 3px solid ${d.color}; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">${d.label}</div>
        <div style="font-size: 10px; color: var(--text-dim);">Coordinates: (${d.x}, ${d.y})</div>
      </div>
      <span class="badge" style="background: rgba(0,0,0,0.05); color: ${d.color}; border: 1px solid ${d.color}; font-size: 11px;">
        ${(d.conf * 100).toFixed(1)}% CONF
      </span>
    </div>
  `).join('');

  document.getElementById('hud-det-count').textContent = `${detections.length} Objects`;
}

function attachVisionEvents() {
  document.getElementById('sel-feed-source')?.addEventListener('change', (e) => {
    currentFeedKey = e.target.value;
    const feeds = getFeedSources();
    const src = feeds[currentFeedKey] || feeds.drone_alpha;
    document.getElementById('hud-feed-name').textContent = src.name;
    document.getElementById('hud-res').textContent = src.resolution;
    updateDetectionList(src.detections);
  });

  document.getElementById('rng-mask-opacity')?.addEventListener('input', (e) => {
    floodSegmentationOpacity = e.target.value / 100;
    document.getElementById('val-mask-opacity').textContent = `${e.target.value}%`;
  });

  document.getElementById('rng-conf-thresh')?.addEventListener('input', (e) => {
    document.getElementById('val-conf-thresh').textContent = (e.target.value / 100).toFixed(2);
  });

  document.getElementById('btn-run-inference')?.addEventListener('click', () => {
    showSystemPrompt({
      title: 'YOLOv8 Inference Pipeline Executed',
      message: 'FP16 TensorRT multi-spectral pass completed successfully.',
      details: 'Model: YOLOv8x-SEG FP16 TensorRT\nInference Latency: 13.8 ms\nmAP50-95 Score: 89.4%\nVRAM Occupancy: 3.4 / 12 GB'
    });
  });
}
