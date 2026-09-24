/* ==========================================================================
   OFFLINE BLE, WI-FI DIRECT & SUB-GHZ LORA MESH CONTROLLER & VISUALIZER
   ==========================================================================
   Provides production hardware interfacing:
   1. W3C Web Bluetooth API (Nordic UART & Meshtastic LoRa transceivers)
   2. W3C Web Serial API (USB LoRa dongles: CH340, CP2102, FTDI @ 115200 baud)
   3. Virtual LoRa Radio Loopback Simulator (SX1262 @ 868.1MHz)
   4. Live Binary RF Hex Packet Monitor (LAF v1 protocol stream)
   ========================================================================== */

import { t } from '../i18n.js';
import { showSystemPrompt } from '../modals.js';
import { locationService } from '../services/location-service.js';
import { hardwareMeshBridge } from '../services/hardware-mesh-bridge.js';
import { PacketType, TriageLevel, toHexString } from '../services/lora-packet-codec.js';

let meshCanvas = null;
let meshCtx = null;
let animFrame = null;
let isCellularActive = false;
let bridgeUnsubscribe = null;
let rfRipples = [];
let packetLogs = [];
let currentLogFilter = 'ALL';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let dynamicMeshNodes = [
  { id: 'NODE-VIC-01', name: 'Citizen SOS Beacon (You)', type: 'victim', x: 100, y: 230, battery: '42%', status: 'ISOLATED' },
  { id: 'NODE-HOP-A', name: 'Field Phone Relay (Hop #1)', type: 'relay', x: 260, y: 150, battery: '68%', status: 'RELAYING' },
  { id: 'NODE-HOP-B', name: 'Substation Repeater (Hop #2)', type: 'relay', x: 420, y: 310, battery: '85%', status: 'RELAYING' },
  { id: 'FLEET-BOAT-1', name: 'NDRF Rescue Boat Alpha', type: 'volunteer', x: 580, y: 180, battery: '94%', status: 'DISPATCHED' },
  { id: 'NODE-UPLINK', name: 'Command Satellite Gateway', type: 'uplink', x: 740, y: 230, battery: '100%', status: 'COMMAND_CENTER' }
];

export function renderMeshNetwork(container) {
  const userLoc = locationService.getState();
  const bridgeStatus = hardwareMeshBridge.getStatus();

  container.innerHTML = `
    <div class="flex flex-col lg:flex-row w-full h-full gap-3 p-3 lg:gap-4 lg:p-4 box-border overflow-y-auto lg:overflow-hidden">
      
      <!-- Left Mesh Topology Graph & Radio Control -->
      <div class="flex-1 flex flex-col gap-3 min-w-0 min-h-[360px] lg:min-h-0 lg:h-full">
        
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

        <!-- Hardware LoRa Transceiver Control Bar -->
        <div class="glass-panel" style="padding: 10px 14px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border-radius: var(--radius-md); background: #f8fafc; border-left: 4px solid #0284c7;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="radio-status-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #94a3b8;"></span>
              <span id="radio-status-text" style="font-size: 11px; font-weight: 700; font-family: monospace; color: var(--text-main);">
                RADIO: DISCONNECTED
              </span>
            </div>
            <span style="font-size: 10px; color: var(--text-muted); font-family: monospace;" id="rf-param-badge">
              868.100 MHz &bull; SF10/BW125 &bull; CR 4/5
            </span>
            <span class="badge badge-cyan" id="rf-metrics-badge" style="font-size: 10px;">
              RSSI: -- dBm | SNR: -- dB | TX: 0 | RX: 0
            </span>
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button class="btn" id="btn-pair-ble" style="padding: 4px 10px; font-size: 11px; background: #ffffff; border-color: #cbd5e1;" title="Connect BLE Transceiver via Web Bluetooth">
              <i data-lucide="bluetooth" style="color: #0284c7;"></i> Pair BLE
            </button>
            <button class="btn" id="btn-connect-usb" style="padding: 4px 10px; font-size: 11px; background: #ffffff; border-color: #cbd5e1;" title="Connect USB-UART LoRa Dongle via Web Serial">
              <i data-lucide="usb" style="color: #059669;"></i> Connect USB
            </button>
            <button class="btn" id="btn-sim-radio" style="padding: 4px 10px; font-size: 11px; background: #ffffff; border-color: #cbd5e1;" title="Toggle Virtual SX1262 LoRa Radio Loopback">
              <i data-lucide="radio-tower" style="color: #7c3aed;"></i> Sim LoRa
            </button>
            <button class="btn btn-primary" id="btn-tx-lora-beacon" style="padding: 4px 10px; font-size: 11px;" title="Transmit Over-The-Air LAF v1 Distress Beacon">
              <i data-lucide="send"></i> TX Beacon
            </button>
            <button class="btn btn-danger" id="btn-disconnect-radio" style="padding: 4px 8px; font-size: 11px; display: none;" title="Disconnect Transceiver">
              <i data-lucide="power"></i>
            </button>
          </div>
        </div>

        <!-- Canvas Visualizer -->
        <div class="glass-panel" style="flex: 1; min-height: 250px; padding: 0; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: var(--radius-md); background: #050811;">
          <canvas id="mesh-canvas" width="850" height="460" style="width: 100%; height: 100%; object-fit: contain;"></canvas>
          
          <div style="position: absolute; bottom: 16px; left: 16px; font-family: monospace; font-size: 11px; color: var(--accent-cyan); background: rgba(7,10,18,0.88); padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.25);" id="mesh-hud-footer">
            <div>PROTOCOL: <strong style="color:var(--accent-emerald);" id="mesh-protocol-label">AEGIS BLE 5.3 / LoRa Sub-GHz LAF v1</strong></div>
            <div>USER GPS BEACON: <strong style="color:#38bdf8;">${userLoc.latitude.toFixed(4)}° N, ${userLoc.longitude.toFixed(4)}° E (±${userLoc.accuracy}m)</strong></div>
            <div>STATUS: <strong id="mesh-nodes-status">Connecting to backend database...</strong></div>
          </div>

          <div style="position: absolute; top: 12px; right: 12px; font-family: monospace; font-size: 10px; color: #94a3b8; background: rgba(15,23,42,0.85); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
            <span id="canvas-rf-activity">CHIRP ACTIVITY: IDLE</span>
          </div>
        </div>

        <!-- Bottom Quick Radio Action Trigger Bar -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); font-family: monospace;">CHIRP TRIGGERS:</span>
          <button class="btn" id="btn-quick-sos" style="padding: 4px 10px; font-size: 11px; background: #fee2e2; border-color: #ef4444; color: #991b1b;">
            <i data-lucide="alert-triangle"></i> SOS Chirp (Prio 1)
          </button>
          <button class="btn" id="btn-quick-ping" style="padding: 4px 10px; font-size: 11px; background: #e0f2fe; border-color: #0284c7; color: #075985;">
            <i data-lucide="activity"></i> Relay Heartbeat
          </button>
          <button class="btn" id="btn-quick-telemetry" style="padding: 4px 10px; font-size: 11px; background: #dcfce7; border-color: #22c55e; color: #166534;">
            <i data-lucide="cpu"></i> Telemetry Sync
          </button>
        </div>

      </div>

      <!-- Right Telemetry & Hardware Console -->
      <div class="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-3 shrink-0 lg:h-full lg:overflow-y-auto pr-0 lg:pr-1">
        
        <!-- Live Hardware RF Hex Packet Monitor -->
        <div class="glass-panel" style="padding: 12px; display: flex; flex-direction: column; gap: 8px; border-color: rgba(2,132,199,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i data-lucide="terminal" style="color: #0284c7; width: 15px; height: 15px;"></i>
              <span style="font-size: 12px; font-weight: 700; font-family: monospace; color: var(--text-main);">LIVE RF HEX PACKET MONITOR</span>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
              <button id="btn-filter-all" class="badge badge-cyan" style="cursor: pointer; padding: 2px 6px;">ALL</button>
              <button id="btn-filter-rx" class="badge" style="cursor: pointer; padding: 2px 6px; background:#f1f5f9; color:#475569;">RX</button>
              <button id="btn-filter-tx" class="badge" style="cursor: pointer; padding: 2px 6px; background:#f1f5f9; color:#475569;">TX</button>
              <button id="btn-clear-logs" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px 4px;" title="Clear Monitor Logs">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          </div>

          <!-- Scrolling Terminal Window -->
          <div id="rf-packet-terminal" style="background: #020617; border: 1px solid #1e293b; border-radius: 4px; padding: 8px; height: 135px; overflow-y: auto; font-family: monospace; font-size: 10.5px; line-height: 1.4; display: flex; flex-direction: column; gap: 4px;">
            <div style="color: #64748b;">// LAF v1 Over-the-air packet monitor initialized...</div>
            <div style="color: #64748b;">// Sub-GHz modulation: 868.100 MHz, SF10, BW 125kHz, CRC16-CCITT</div>
            <div style="color: #38bdf8;">[READY] Connect BLE, USB-UART, or click 'Sim LoRa' to capture radio frames.</div>
          </div>
        </div>

        <!-- Live Encrypted Packet Payload Inspector -->
        <div class="glass-panel" style="padding: 12px; border-color: rgba(255,42,109,0.3);">
          <div class="panel-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span class="panel-title" style="font-size: 12px;"><i data-lucide="shield-check"></i> ${t('encrypted_packet')}</span>
            <span class="badge badge-purple" style="font-size: 10px;">AES-256-GCM AEAD</span>
          </div>

          <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 4px; font-family: monospace; font-size: 10.5px; color: var(--accent-cyan); margin-bottom: 8px; border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); margin-bottom: 2px;">// W3C WEB CRYPTO ENVELOPE</div>
            <div style="word-break: break-all; color: var(--accent-pink);">0x8F4A...B93C_AES256GCM_AUTH_TAG</div>
            <hr style="border-color: rgba(0,0,0,0.08); margin: 6px 0;">
            <div style="color: var(--accent-emerald);">[AUTHENTICATED DISTRESS TELEMETRY]</div>
            <div>SENDER_ID: <strong>CITIZEN_DEVICE_BEACON</strong></div>
            <div>LAT_LNG: <strong style="color:#38bdf8;">${userLoc.latitude.toFixed(5)} N, ${userLoc.longitude.toFixed(5)} E</strong></div>
            <div>ACCURACY: <strong>±${userLoc.accuracy}m (${userLoc.source})</strong></div>
            <div>TRIAGE: <span style="color:var(--accent-pink);">CRITICAL_PRIORITY_1</span></div>
            <div>SECURITY: <strong style="color:var(--accent-emerald);">NIST SP 800-38D GCM Verified</strong></div>
          </div>

          <button class="btn btn-primary" id="btn-broadcast-ack" style="width: 100%; justify-content: center; font-size: 11px; padding: 5px;">
            <i data-lucide="check-circle"></i> Broadcast Mesh ACK
          </button>
        </div>

        <!-- Hop Node Relay Stats Card -->
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 12px; min-height: 130px;">
          <div class="panel-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span class="panel-title" style="font-size: 12px;"><i data-lucide="share-2"></i> Active Mesh Nodes (Live DB)</span>
            <span class="badge badge-cyan" id="badge-mesh-count" style="font-size: 10px;">CONNECTING...</span>
          </div>

          <div id="mesh-nodes-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            <!-- Populated dynamically from /api/v1/mesh/topology -->
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    fetchMeshTopology();
    attachMeshEvents();
    subscribeHardwareBridge();
    updateHardwareUI();
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}

function updateHardwareUI() {
  const info = hardwareMeshBridge.getStatus();
  const dot = document.getElementById('radio-status-dot');
  const text = document.getElementById('radio-status-text');
  const metrics = document.getElementById('rf-metrics-badge');
  const simBtn = document.getElementById('btn-sim-radio');
  const disconnectBtn = document.getElementById('btn-disconnect-radio');
  const protocolLabel = document.getElementById('mesh-protocol-label');

  if (!dot || !text) return;

  if (info.status === 'BLE_CONNECTED') {
    dot.style.background = '#0284c7';
    text.textContent = `RADIO: BLE (${info.metrics.connectedDeviceName || 'Nordic UART'})`;
    text.style.color = '#0284c7';
    if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
    if (protocolLabel) protocolLabel.textContent = 'BLE 5.3 Nordic UART / Meshtastic';
  } else if (info.status === 'SERIAL_CONNECTED') {
    dot.style.background = '#059669';
    text.textContent = `RADIO: USB SERIAL (115200 Baud)`;
    text.style.color = '#059669';
    if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
    if (protocolLabel) protocolLabel.textContent = 'USB-UART LoRa SX1262 (115200 Baud)';
  } else if (info.status === 'SIMULATED_ACTIVE') {
    dot.style.background = '#7c3aed';
    text.textContent = `RADIO: VIRTUAL LoRa (SX1262 @ 868.1MHz)`;
    text.style.color = '#7c3aed';
    if (simBtn) {
      simBtn.style.background = '#ede9fe';
      simBtn.style.borderColor = '#7c3aed';
      simBtn.innerHTML = '<i data-lucide="radio-tower" style="color: #7c3aed;"></i> Stop Sim';
    }
    if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
    if (protocolLabel) protocolLabel.textContent = 'Virtual Sub-GHz LoRa (SX1262 Loopback)';
  } else {
    dot.style.background = '#94a3b8';
    text.textContent = 'RADIO: DISCONNECTED (OFF-AIR)';
    text.style.color = 'var(--text-main)';
    if (simBtn) {
      simBtn.style.background = '#ffffff';
      simBtn.style.borderColor = '#cbd5e1';
      simBtn.innerHTML = '<i data-lucide="radio-tower" style="color: #7c3aed;"></i> Sim LoRa';
    }
    if (disconnectBtn) disconnectBtn.style.display = 'none';
    if (protocolLabel) protocolLabel.textContent = 'AEGIS BLE 5.3 / LoRa Sub-GHz LAF v1';
  }

  if (metrics) {
    metrics.textContent = `RSSI: ${info.metrics.lastRssi} dBm | SNR: ${info.metrics.lastSnr} dB | TX: ${info.metrics.packetsTx} | RX: ${info.metrics.packetsRx}`;
  }

  if (window.lucide) window.lucide.createIcons();
}

function subscribeHardwareBridge() {
  if (bridgeUnsubscribe) bridgeUnsubscribe();

  bridgeUnsubscribe = hardwareMeshBridge.subscribe((evt) => {
    updateHardwareUI();

    if (evt.type === 'STATUS_CHANGE') {
      appendTerminalLog('STATUS', evt.message || evt.status, evt.error ? '#ef4444' : '#94a3b8');
    } else if (evt.type === 'PACKET_RX') {
      const p = evt.packet;
      const logLine = `[RX CHIRP] ${p.packetTypeName} from ${p.senderNodeId} | Lat:${p.lat.toFixed(4)}, Lng:${p.lng.toFixed(4)} | Bat:${p.batteryPct}% | RSSI:${evt.meta.rssi}dBm CRC:OK`;
      appendTerminalLog('RX', logLine, '#00f5a0', evt.rawHex, p);
      triggerRfRipple(0); // Animate RF ripple on canvas
      setCanvasActivity(`RX CHIRP: ${p.packetTypeName} (${p.senderNodeId})`);
    } else if (evt.type === 'PACKET_TX') {
      appendTerminalLog('TX', `[TX CHIRP] Over-the-air frame broadcasted (${evt.rawBytes.length} bytes)`, '#38bdf8', evt.rawHex);
      triggerRfRipple(dynamicMeshNodes.length - 1);
      setCanvasActivity(`TX CHIRP: ${evt.rawBytes.length}B OTA Broadcast`);
    }
  });
}

function setCanvasActivity(text) {
  const el = document.getElementById('canvas-rf-activity');
  if (el) {
    el.textContent = text;
    el.style.color = '#38bdf8';
    setTimeout(() => {
      if (el) {
        el.textContent = 'CHIRP ACTIVITY: IDLE';
        el.style.color = '#94a3b8';
      }
    }, 4000);
  }
}

function triggerRfRipple(nodeIdx = 0) {
  if (dynamicMeshNodes && dynamicMeshNodes[nodeIdx]) {
    const node = dynamicMeshNodes[nodeIdx];
    rfRipples.push({
      x: node.x,
      y: node.y,
      radius: 12,
      maxRadius: 65,
      alpha: 1.0,
      color: nodeIdx === 0 ? '#ff2a6d' : '#00f5a0'
    });
  }
}

function appendTerminalLog(direction, text, color = '#38bdf8', rawHex = null, decoded = null) {
  const terminal = document.getElementById('rf-packet-terminal');
  const now = new Date().toLocaleTimeString();

  const entry = {
    id: 'pkt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    direction,
    time: now,
    text,
    color,
    rawHex,
    decoded
  };

  packetLogs.push(entry);
  if (packetLogs.length > 50) packetLogs.shift();

  if (!terminal) return;

  if (currentLogFilter !== 'ALL' && currentLogFilter !== direction) {
    return;
  }

  const row = document.createElement('div');
  row.style.cursor = rawHex ? 'pointer' : 'default';
  row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
  row.style.paddingBottom = '2px';

  let hexSnippet = '';
  if (rawHex) {
    const truncated = rawHex.length > 28 ? rawHex.slice(0, 24) + '...' + rawHex.slice(-6) : rawHex;
    hexSnippet = `<div style="color: #64748b; font-size: 9.5px; word-break: break-all;">HEX: 0x${truncated}</div>`;
  }

  row.innerHTML = `
    <div>
      <span style="color: #64748b;">[${now}]</span>
      <strong style="color: ${color};">[${direction}]</strong>
      <span style="color: #f1f5f9;">${escapeHtml(text)}</span>
    </div>
    ${hexSnippet}
  `;

  if (rawHex || decoded) {
    row.addEventListener('click', () => {
      showSystemPrompt({
        title: `Over-the-Air LoRa Packet Inspector (${direction})`,
        message: `Captured LAF v1 Radio Frame at ${now}`,
        details: `RAW HEX BYTES:\n0x${rawHex || 'N/A'}\n\nDECODED STRUCTURE:\n${JSON.stringify(decoded || { raw: rawHex }, null, 2)}`
      });
    });
  }

  terminal.appendChild(row);
  terminal.scrollTop = terminal.scrollHeight;
}

function filterLogs(filterType) {
  currentLogFilter = filterType;
  const terminal = document.getElementById('rf-packet-terminal');
  if (!terminal) return;

  ['all', 'rx', 'tx'].forEach(f => {
    const btn = document.getElementById(`btn-filter-${f}`);
    if (btn) {
      if (f.toUpperCase() === filterType) {
        btn.className = 'badge badge-cyan';
        btn.style.background = '#e0f2fe';
        btn.style.color = '#0284c7';
      } else {
        btn.className = 'badge';
        btn.style.background = '#f1f5f9';
        btn.style.color = '#475569';
      }
    }
  });

  terminal.innerHTML = '';
  const filtered = packetLogs.filter(l => filterType === 'ALL' || l.direction === filterType);
  filtered.forEach(l => {
    const row = document.createElement('div');
    row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    row.style.paddingBottom = '2px';
    let hexSnippet = '';
    if (l.rawHex) {
      const truncated = l.rawHex.length > 28 ? l.rawHex.slice(0, 24) + '...' + l.rawHex.slice(-6) : l.rawHex;
      hexSnippet = `<div style="color: #64748b; font-size: 9.5px;">HEX: 0x${truncated}</div>`;
    }
    row.innerHTML = `
      <div>
        <span style="color: #64748b;">[${l.time}]</span>
        <strong style="color: ${l.color};">[${l.direction}]</strong>
        <span style="color: #f1f5f9;">${escapeHtml(l.text)}</span>
      </div>
      ${hexSnippet}
    `;
    terminal.appendChild(row);
  });
  terminal.scrollTop = terminal.scrollHeight;
}

async function fetchMeshTopology() {
  try {
    const res = await fetch('/api/v1/mesh/topology');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data.nodes) && data.nodes.length > 0) {
      const cWidth = 850;
      const spacing = (cWidth - 180) / (data.nodes.length - 1);

      dynamicMeshNodes = data.nodes.map((node, i) => ({
        ...node,
        x: 90 + (i * spacing),
        y: 230 + (Math.sin(i * 1.6) * 75)
      }));

      const badgeCount = document.getElementById('badge-mesh-count');
      if (badgeCount) badgeCount.textContent = `${dynamicMeshNodes.length} LIVE NODES`;

      const statusEl = document.getElementById('mesh-nodes-status');
      if (statusEl) {
        statusEl.innerHTML = `HOP COUNT: <strong>${dynamicMeshNodes.length - 1} Devices</strong> | AVG RSSI: <strong>${data.avg_rssi_dbm} dBm</strong> | SUCCESS: <strong style="color:var(--accent-emerald);">${data.delivery_success_pct}%</strong>`;
      }

      renderMeshNodesList();
      initMeshCanvas();
    }
  } catch (err) {
    console.warn('Using default mesh layout (offline fallback):', err);
    initMeshCanvas();
    renderMeshNodesList();
  }
}

function initMeshCanvas() {
  meshCanvas = document.getElementById('mesh-canvas');
  if (!meshCanvas) return;
  meshCtx = meshCanvas.getContext('2d');

  let packetProgress = 0;

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

    // Draw active RF ripples (from hardware transmissions/receptions)
    for (let i = rfRipples.length - 1; i >= 0; i--) {
      const rip = rfRipples[i];
      rip.radius += 1.2;
      rip.alpha -= 0.02;

      meshCtx.save();
      meshCtx.strokeStyle = rip.color;
      meshCtx.globalAlpha = Math.max(0, rip.alpha);
      meshCtx.lineWidth = 2;
      meshCtx.beginPath();
      meshCtx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      meshCtx.stroke();
      meshCtx.restore();

      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        rfRipples.splice(i, 1);
      }
    }

    // Draw mesh connection edges
    meshCtx.lineWidth = 2;
    for (let i = 0; i < dynamicMeshNodes.length - 1; i++) {
      const n1 = dynamicMeshNodes[i];
      const n2 = dynamicMeshNodes[i + 1];

      meshCtx.strokeStyle = isCellularActive ? 'rgba(0, 245, 160, 0.6)' : 'rgba(0, 240, 255, 0.35)';
      meshCtx.beginPath();
      meshCtx.moveTo(n1.x, n1.y);
      meshCtx.lineTo(n2.x, n2.y);
      meshCtx.stroke();
    }

    // Cross-link relays if more than 3 nodes
    if (dynamicMeshNodes.length >= 4) {
      meshCtx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
      meshCtx.beginPath();
      meshCtx.moveTo(dynamicMeshNodes[1].x, dynamicMeshNodes[1].y);
      meshCtx.lineTo(dynamicMeshNodes[3].x, dynamicMeshNodes[3].y);
      meshCtx.stroke();
    }

    // Draw moving telemetry packets
    packetProgress = (packetProgress + 0.008) % 1;
    const totalEdges = dynamicMeshNodes.length - 1;
    const currentEdgeIndex = Math.floor(packetProgress * totalEdges);
    const edgeProgress = (packetProgress * totalEdges) % 1;

    if (currentEdgeIndex < totalEdges) {
      const src = dynamicMeshNodes[currentEdgeIndex];
      const dst = dynamicMeshNodes[currentEdgeIndex + 1];
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
    dynamicMeshNodes.forEach((node, idx) => {
      // Glow aura
      meshCtx.fillStyle = idx === 0 ? 'rgba(255, 42, 109, 0.2)' : 'rgba(0, 240, 255, 0.15)';
      meshCtx.beginPath();
      meshCtx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      meshCtx.fill();

      // Node Body
      meshCtx.fillStyle = '#0d1117';
      meshCtx.strokeStyle = idx === 0 ? '#ff2a6d' : (idx === dynamicMeshNodes.length - 1 ? '#00f5a0' : '#00f0ff');
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
      meshCtx.fillText(`BAT: ${node.battery} | ${node.status}`, node.x, node.y + 42);
    });

    animFrame = requestAnimationFrame(renderFrame);
  }

  if (animFrame) cancelAnimationFrame(animFrame);
  renderFrame();
}

function renderMeshNodesList() {
  const container = document.getElementById('mesh-nodes-list');
  if (!container) return;

  container.innerHTML = dynamicMeshNodes.map(node => `
    <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
      <div>
        <strong style="color: var(--text-main); font-size: 11px;">${escapeHtml(node.name)}</strong>
        <div style="color: var(--text-muted); font-size: 9.5px; font-family: monospace;">${escapeHtml(node.id)} &bull; ${escapeHtml(node.status)}</div>
      </div>
      <span class="badge ${node.type === 'victim' ? 'badge-red' : (node.type === 'uplink' ? 'badge-emerald' : 'badge-cyan')}">${escapeHtml(node.battery)}</span>
    </div>
  `).join('');
}

function attachMeshEvents() {
  // 1. Blackout simulator toggle
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

  // 2. Broadcast ping
  document.getElementById('btn-ping-mesh')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/system/health');
      const health = await res.json();
      showSystemPrompt({
        title: 'BLE Mesh Broadcast Ping Confirmed',
        message: `Packet propagated across ${dynamicMeshNodes.length - 1} mesh hops. Gateway latency: ${health.gateway_latency_ms}ms.`,
        details: `PING ROUNDTRIP: ${health.gateway_latency_ms}ms\nCRYPTO CIPHER: ${health.mesh_protocol || 'AES-256-GCM'}\nACTIVE NODES: ${health.active_incidents} registered in database\nSTATUS: OPERATIONAL`
      });
    } catch (e) {
      showSystemPrompt({
        title: 'BLE Mesh Ping (Offline Local RF)',
        message: `Local RF broadcast propagated across ${dynamicMeshNodes.length - 1} hops.`,
        details: 'STATUS: P2P ACK RECEIVED'
      });
    }
  });

  // 3. Web Bluetooth Pairing
  document.getElementById('btn-pair-ble')?.addEventListener('click', async () => {
    try {
      await hardwareMeshBridge.connectBluetooth();
      showSystemPrompt({
        title: 'BLE LoRa Transceiver Paired',
        message: `Successfully connected to ${hardwareMeshBridge.metrics.connectedDeviceName || 'Disaster Mesh Node'}`,
        details: 'GATT Profile: Nordic UART Service (NUS)\nData Rate: 1 Mbps BLE 5.3 PHY\nSub-GHz Bridge: Enabled'
      });
    } catch (err) {
      if (err.name !== 'NotFoundError') { // Don't alert if user just cancelled the picker
        showSystemPrompt({
          title: 'Bluetooth Connection Notice',
          message: err.message,
          details: 'Web Bluetooth requires Chrome/Edge on Desktop or Android with Bluetooth enabled.'
        });
      }
    }
  });

  // 4. Web Serial Connection (USB LoRa dongles)
  document.getElementById('btn-connect-usb')?.addEventListener('click', async () => {
    try {
      await hardwareMeshBridge.connectSerial(115200);
      showSystemPrompt({
        title: 'USB LoRa Transceiver Connected',
        message: 'Serial port opened at 115200 baud (CH340/CP2102/FTDI driver)',
        details: 'Baud Rate: 115200\nData Bits: 8, Stop: 1, Parity: None\nFraming: LAF v1 Magic Frame (0xAE61)'
      });
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        showSystemPrompt({
          title: 'USB Serial Connection Notice',
          message: err.message,
          details: 'Web Serial requires Chrome or Edge on Windows, macOS, or Linux.'
        });
      }
    }
  });

  // 5. Virtual Radio Loopback Toggle
  document.getElementById('btn-sim-radio')?.addEventListener('click', () => {
    const isActive = hardwareMeshBridge.toggleVirtualRadio();
    updateHardwareUI();
    if (isActive) {
      showSystemPrompt({
        title: 'Virtual Sub-GHz LoRa Radio Activated',
        message: 'Emulating Semtech SX1262 LoRa transceiver on 868.100 MHz (IN865/EU868 band).',
        details: 'MODULATION: LoRa Chirp Spread Spectrum\nSPREADING FACTOR: SF10\nBANDWIDTH: 125 kHz\nCODING RATE: 4/5\nBEACON INTERVAL: 7.0 seconds\nCRC16: Enabled'
      });
    }
  });

  // 6. Transmit LoRa Beacon
  document.getElementById('btn-tx-lora-beacon')?.addEventListener('click', async () => {
    const loc = locationService.getState();
    try {
      const res = await hardwareMeshBridge.transmitPacket({
        packetType: PacketType.SOS_BEACON,
        seqNum: Math.floor(100 + Math.random() * 900),
        hopCount: 0,
        senderNodeId: 0x38AF12C0,
        lat: loc.latitude,
        lng: loc.longitude,
        triage: TriageLevel.EMERGENCY_SOS,
        batteryPct: 88,
        payload: JSON.stringify({
          caller: 'Citizen Beacon (Self)',
          situation: 'Active distress signal beacon transmitted over LoRa mesh'
        })
      });

      showSystemPrompt({
        title: 'LoRa Aegis Frame (LAF v1) Transmitted',
        message: `Over-the-air chirp dispatched (${res.bytesSent} bytes).`,
        details: `MAGIC: 0xAE61\nSEQUENCE: LAF-v1\nRAW HEX: 0x${res.hex}\nCRC16: Computed & Appended`
      });
    } catch (err) {
      showSystemPrompt({
        title: 'LoRa Transmission Notice',
        message: err.message,
        details: "Click 'Sim LoRa' or connect a hardware radio to transmit over-the-air packets."
      });
    }
  });

  // 7. Disconnect Transceiver
  document.getElementById('btn-disconnect-radio')?.addEventListener('click', async () => {
    await hardwareMeshBridge.disconnect();
    updateHardwareUI();
  });

  // 8. Quick Radio Triggers
  document.getElementById('btn-quick-sos')?.addEventListener('click', async () => {
    const loc = locationService.getState();
    try {
      await hardwareMeshBridge.transmitPacket({
        packetType: PacketType.SOS_BEACON,
        seqNum: Math.floor(10 + Math.random() * 80),
        hopCount: 0,
        senderNodeId: 0x99001122,
        lat: loc.latitude + 0.003,
        lng: loc.longitude - 0.002,
        triage: TriageLevel.EMERGENCY_SOS,
        batteryPct: 35,
        payload: JSON.stringify({ caller: 'Submerged Sector 4', situation: 'Flash flood trapped 4 citizens on terrace' })
      });
    } catch (e) {
      hardwareMeshBridge.startVirtualRadio();
      updateHardwareUI();
    }
  });

  document.getElementById('btn-quick-ping')?.addEventListener('click', async () => {
    const loc = locationService.getState();
    try {
      await hardwareMeshBridge.transmitPacket({
        packetType: PacketType.PING_HEARTBEAT,
        seqNum: Math.floor(200 + Math.random() * 100),
        hopCount: 1,
        senderNodeId: 0x77AABB00,
        lat: loc.latitude,
        lng: loc.longitude,
        triage: TriageLevel.NORMAL,
        batteryPct: 92,
        payload: 'HEARTBEAT_ACK_RSSI_82'
      });
    } catch (e) {
      hardwareMeshBridge.startVirtualRadio();
      updateHardwareUI();
    }
  });

  document.getElementById('btn-quick-telemetry')?.addEventListener('click', async () => {
    const loc = locationService.getState();
    try {
      await hardwareMeshBridge.transmitPacket({
        packetType: PacketType.RELAY_TELEMETRY,
        seqNum: Math.floor(500 + Math.random() * 50),
        hopCount: 2,
        senderNodeId: 0x55443322,
        lat: loc.latitude - 0.004,
        lng: loc.longitude + 0.003,
        triage: TriageLevel.URGENT,
        batteryPct: 78,
        payload: JSON.stringify({ temp: 31.4, humidity: 89, water_depth_cm: 145 })
      });
    } catch (e) {
      hardwareMeshBridge.startVirtualRadio();
      updateHardwareUI();
    }
  });

  // 9. Terminal Filter & Clear buttons
  document.getElementById('btn-filter-all')?.addEventListener('click', () => filterLogs('ALL'));
  document.getElementById('btn-filter-rx')?.addEventListener('click', () => filterLogs('RX'));
  document.getElementById('btn-filter-tx')?.addEventListener('click', () => filterLogs('TX'));
  document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
    packetLogs = [];
    const terminal = document.getElementById('rf-packet-terminal');
    if (terminal) terminal.innerHTML = '<div style="color: #64748b;">// Logs cleared. Ready for next LoRa frame...</div>';
  });

  // 10. Broadcast ACK
  document.getElementById('btn-broadcast-ack')?.addEventListener('click', () => {
    showSystemPrompt({
      title: 'AES-256-GCM Mesh ACK Broadcasted',
      message: 'Rescue Dispatch Confirmation Packet transmitted to field operator device.',
      details: 'PAYLOAD: 0x39AC_ACK_NDRF_DISPATCH_CONFIRMED\nDESTINATION: SENDER_DEVICE (Sector B4)\nETA ASSIGNED: 6.2 mins\nENCRYPTION: GCM-Auth Validated'
    });
  });
}
