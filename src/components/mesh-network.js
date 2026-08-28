/* ==========================================================================
   OFFLINE BLE & WI-FI DIRECT MESH TOPOLOGY VISUALIZER (CUSTOM DIALOGS)
   ========================================================================== */

import { t } from '../i18n.js';
import { showSystemPrompt, showUltraEmergencyModal } from '../modals.js';
import { locationService } from '../services/location-service.js';

let meshCanvas = null;
let meshCtx = null;
let animFrame = null;
let isCellularActive = false;

const meshNodes = [
  { id: 'NODE-VIC-01', name: 'Victim Device (You)', type: 'victim', x: 120, y: 220, battery: '14%', status: 'ISOLATED' },
  { id: 'NODE-HOP-A', name: 'Peer Phone (Hop #1)', type: 'relay', x: 280, y: 140, battery: '68%', status: 'RELAYING' },
  { id: 'NODE-HOP-B', name: 'Peer Phone (Hop #2)', type: 'relay', x: 420, y: 300, battery: '82%', status: 'RELAYING' },
  { id: 'NODE-VOL-99', name: 'Rescue Volunteer Unit', type: 'volunteer', x: 580, y: 180, battery: '95%', status: 'ACTIVE_GATEWAY' },
  { id: 'NODE-UPLINK', name: 'Command Satellite Relay', type: 'uplink', x: 740, y: 220, battery: '100%', status: 'COMMAND_CENTER' }
];

export function renderMeshNetwork(container) {
  const userLoc = locationService.getState();

  container.innerHTML = `
    <div style="display: flex; width: 100%; height: 100%; gap: 16px; padding: 16px;">
      
      <!-- Left Mesh Topology Graph (68%) -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 12px; height: 100%;">
        
        <!-- Header Controls -->
        <div class="glass-panel" style="padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
              <i data-lucide="wifi-off" style="color: var(--accent-pink);"></i> ${t('mesh_title')}
            </span>
            <span class="badge badge-red" id="network-mode-badge">${t('blackout_active')}</span>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-danger" id="btn-toggle-blackout" style="padding: 4px 12px; font-size: 11px;">
              <i data-lucide="zap-off"></i> ${t('toggle_blackout')}
            </button>
            <button class="btn btn-primary" id="btn-ping-mesh" style="padding: 4px 12px; font-size: 11px;">
              <i data-lucide="radio"></i> ${t('broadcast_ping')}
            </button>
          </div>
        </div>

        <!-- Canvas Visualizer -->
        <div class="glass-panel" style="flex: 1; padding: 0; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: var(--radius-md); background: #050811;">
          <canvas id="mesh-canvas" width="850" height="460" style="width: 100%; height: 100%; object-fit: contain;"></canvas>
          
          <div style="position: absolute; bottom: 16px; left: 16px; font-family: monospace; font-size: 11px; color: var(--accent-cyan); background: rgba(7,10,18,0.85); padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.2);">
            <div>PROTOCOL: <strong style="color:var(--accent-emerald);">AEGIS BLE / Wi-Fi Direct Mesh v2.4</strong></div>
            <div>USER GPS BEACON: <strong style="color:#38bdf8;">${userLoc.latitude.toFixed(4)}° N, ${userLoc.longitude.toFixed(4)}° E (±${userLoc.accuracy}m)</strong></div>
            <div>HOP COUNT: <strong>3 Intermediate Devices</strong> | AVG RSSI: <strong>-74 dBm</strong></div>
            <div>ESTIMATED DELIVERY SUCCESS: <strong style="color:var(--accent-emerald);">99.4% (Sub-Second Latency)</strong></div>
          </div>
        </div>

      </div>

      <!-- Right Packet Telemetry Decryption Inspector (32%) -->
      <div style="width: 370px; display: flex; flex-direction: column; gap: 16px; height: 100%;">
        
        <!-- Live Encrypted Packet Payload Inspector -->
        <div class="glass-panel" style="padding: 16px; border-color: rgba(255,42,109,0.3);">
          <div class="panel-header" style="margin-bottom: 10px;">
            <span class="panel-title"><i data-lucide="shield-check"></i> ${t('encrypted_packet')}</span>
            <span class="badge badge-purple">DECRYPTED</span>
          </div>

          <div style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: var(--accent-cyan); margin-bottom: 12px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); margin-bottom: 4px;">// RAW ENCRYPTED PAYLOAD HASH</div>
            <div style="word-break: break-all; color: var(--accent-pink);">0x8F4A...B93C_AEGIS_SECURE_PAYLOAD</div>
            <hr style="border-color: rgba(0,0,0,0.1); margin: 8px 0;">
            <div style="color: var(--accent-emerald);">[DECRYPTED DISTRESS TELEMETRY]</div>
            <div>SENDER_ID: <strong>FIELD_OPERATOR_DEVICE</strong></div>
            <div>LAT_LNG: <strong style="color:#38bdf8;">${userLoc.latitude.toFixed(5)} N, ${userLoc.longitude.toFixed(5)} E</strong></div>
            <div>ACCURACY: <strong>±${userLoc.accuracy}m (${userLoc.source})</strong></div>
            <div>TRIAGE: <span style="color:var(--accent-pink);">CRITICAL_RED</span></div>
            <div>VICTIMS: <strong>4 (2 Adults, 2 Children)</strong></div>
            <div>BATTERY_LEVEL: <strong>14%</strong></div>
            <div>MEDICAL_NOTE: <strong>Immediate Oxygen Needed</strong></div>
          </div>

          <button class="btn btn-primary" id="btn-broadcast-ack" style="width: 100%; justify-content: center; font-size: 12px;">
            <i data-lucide="check-circle"></i> ${t('send_ack')}
          </button>
        </div>

        <!-- Hop Node Relay Stats Card -->
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px;">
          <div class="panel-header" style="margin-bottom: 10px;">
            <span class="panel-title"><i data-lucide="share-2"></i> Active Mesh Nodes</span>
            <span class="badge badge-cyan">5 NODES</span>
          </div>

          <div id="mesh-nodes-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    initMeshCanvas();
    renderMeshNodesList();
    attachMeshEvents();
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}

function initMeshCanvas() {
  meshCanvas = document.getElementById('mesh-canvas');
  if (!meshCanvas) return;
  meshCtx = meshCanvas.getContext('2d');

  let packetProgress = 0;
  let pingPacketProgress = 0;
  let isPinging = false;

  function renderFrame() {
    if (!meshCtx || !meshCanvas) return;

    meshCtx.clearRect(0, 0, meshCanvas.width, meshCanvas.height);

    // Draw background grid lines
    meshCtx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    meshCtx.lineWidth = 1;
    for (let x = 0; x < meshCanvas.width; x += 40) {
      meshCtx.beginPath();
      meshCtx.moveTo(x, 0);
      meshCtx.lineTo(x, meshCanvas.height);
      meshCtx.stroke();
    }
    for (let y = 0; y < meshCanvas.height; y += 40) {
      meshCtx.beginPath();
      meshCtx.moveTo(0, y);
      meshCtx.lineTo(meshCanvas.width, y);
      meshCtx.stroke();
    }

    // Draw mesh connection edges
    meshCtx.lineWidth = 2;
    for (let i = 0; i < meshNodes.length - 1; i++) {
      const n1 = meshNodes[i];
      const n2 = meshNodes[i + 1];

      meshCtx.strokeStyle = isCellularActive ? 'rgba(0, 245, 160, 0.6)' : 'rgba(0, 240, 255, 0.35)';
      meshCtx.beginPath();
      meshCtx.moveTo(n1.x, n1.y);
      meshCtx.lineTo(n2.x, n2.y);
      meshCtx.stroke();
    }

    // Cross-link relays
    meshCtx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
    meshCtx.beginPath();
    meshCtx.moveTo(meshNodes[1].x, meshNodes[1].y);
    meshCtx.lineTo(meshNodes[2].x, meshNodes[2].y);
    meshCtx.stroke();

    // Draw moving telemetry packets
    packetProgress = (packetProgress + 0.008) % 1;
    const totalEdges = meshNodes.length - 1;
    const currentEdgeIndex = Math.floor(packetProgress * totalEdges);
    const edgeProgress = (packetProgress * totalEdges) % 1;

    if (currentEdgeIndex < totalEdges) {
      const src = meshNodes[currentEdgeIndex];
      const dst = meshNodes[currentEdgeIndex + 1];
      const px = src.x + (dst.x - src.x) * edgeProgress;
      const py = src.y + (dst.y - src.y) * edgeProgress;

      meshCtx.fillStyle = '#ff2a6d';
      meshCtx.shadowColor = '#ff2a6d';
      meshCtx.shadowBlur = 10;
      meshCtx.beginPath();
      meshCtx.arc(px, py, 5, 0, Math.PI * 2);
      meshCtx.fill();
      meshCtx.shadowBlur = 0;
    }

    // Draw Nodes
    meshNodes.forEach((node, idx) => {
      // Glow aura
      meshCtx.fillStyle = idx === 0 ? 'rgba(255, 42, 109, 0.2)' : 'rgba(0, 240, 255, 0.15)';
      meshCtx.beginPath();
      meshCtx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      meshCtx.fill();

      // Node Body
      meshCtx.fillStyle = '#0d1117';
      meshCtx.strokeStyle = idx === 0 ? '#ff2a6d' : (idx === meshNodes.length - 1 ? '#00f5a0' : '#00f0ff');
      meshCtx.lineWidth = 2;
      meshCtx.beginPath();
      meshCtx.arc(node.x, node.y, 14, 0, Math.PI * 2);
      meshCtx.fill();
      meshCtx.stroke();

      // Node Label
      meshCtx.fillStyle = '#f8fafc';
      meshCtx.font = '10px Inter, sans-serif';
      meshCtx.textAlign = 'center';
      meshCtx.fillText(node.name, node.x, node.y + 30);

      meshCtx.fillStyle = '#64748b';
      meshCtx.font = '9px monospace';
      meshCtx.fillText(`BAT: ${node.battery}`, node.x, node.y + 42);
    });

    animFrame = requestAnimationFrame(renderFrame);
  }

  if (animFrame) cancelAnimationFrame(animFrame);
  renderFrame();
}

function renderMeshNodesList() {
  const container = document.getElementById('mesh-nodes-list');
  if (!container) return;

  container.innerHTML = meshNodes.map(node => `
    <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
      <div>
        <strong style="color: var(--text-main);">${node.name}</strong>
        <div style="color: var(--text-muted); font-size: 10px; font-family: monospace;">${node.id} &bull; ${node.status}</div>
      </div>
      <span class="badge ${node.type === 'victim' ? 'badge-red' : (node.type === 'uplink' ? 'badge-emerald' : 'badge-cyan')}">${node.battery}</span>
    </div>
  `).join('');
}

function attachMeshEvents() {
  document.getElementById('btn-toggle-blackout')?.addEventListener('click', () => {
    isCellularActive = !isCellularActive;
    const badge = document.getElementById('network-mode-badge');
    const btn = document.getElementById('btn-toggle-blackout');

    if (isCellularActive) {
      if (badge) {
        badge.className = 'badge badge-emerald';
        badge.textContent = 'CELLULAR RESTORED';
      }
      if (btn) btn.innerHTML = '<i data-lucide="zap"></i> Sim Blackout';
      locationService.setConnectionStatus('ONLINE');
    } else {
      if (badge) {
        badge.className = 'badge badge-red';
        badge.textContent = t('blackout_active');
      }
      if (btn) btn.innerHTML = '<i data-lucide="zap-off"></i> ' + t('toggle_blackout');
      locationService.setConnectionStatus('BLACKOUT_MESH');
    }

    if (window.lucide) window.lucide.createIcons();
  });

  document.getElementById('btn-ping-mesh')?.addEventListener('click', () => {
    showSystemPrompt({
      title: 'BLE Mesh Broadcast Ping Sent',
      message: 'Packet propagated across 5 mesh relay hops in 14.2ms.',
      details: 'PING LATENCY: 14.2ms (Avg)\nPACKET INTEGRITY: 100% (AES-256 Verified)\nNEXT HOP: NODE-HOP-A (RSSI -68 dBm)\nSTATUS: ALL 5 NODES RESPONDING'
    });
  });

  document.getElementById('btn-broadcast-ack')?.addEventListener('click', () => {
    showSystemPrompt({
      title: 'AES-256 Mesh ACK Broadcasted',
      message: 'Rescue Dispatch Confirmation Packet transmitted to field operator device.',
      details: 'PAYLOAD: 0x39AC_ACK_NDRF_DISPATCH_CONFIRMED\nDESTINATION: SENDER_DEVICE (Sector B4)\nETA ASSIGNED: 6.2 mins\nENCRYPTION: GCM-Auth Validated'
    });
  });
}
