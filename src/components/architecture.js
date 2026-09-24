/* ==========================================================================
   SYSTEM ARCHITECTURE EXPLORER COMPONENT (i18n SUPPORT)
   ========================================================================== */

import { t } from '../i18n.js';

export function renderArchitectureExplorer(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; gap: 16px; padding: 16px; overflow-y: auto;">
      
      <!-- Top Overview Header -->
      <div class="glass-panel" style="padding: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <i data-lucide="cpu" style="color: var(--accent-cyan);"></i> ${t('arch_title')}
          </h2>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            End-to-end resilient topology mapping from peer BLE mesh ingestion to FastAPI brokers and Command GIS.
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <div style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.2); padding: 8px 14px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Ingress Throughput</div>
            <strong style="font-size: 14px; color: var(--accent-cyan);" id="arch-tput">1,480 req/sec</strong>
          </div>
          <div style="background: rgba(0,245,160,0.08); border: 1px solid rgba(0,245,160,0.2); padding: 8px 14px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">RabbitMQ Queue</div>
            <strong style="font-size: 14px; color: var(--accent-emerald);" id="arch-queue">0 Pending (0ms)</strong>
          </div>
          <div style="background: rgba(157,78,221,0.08); border: 1px solid rgba(157,78,221,0.2); padding: 8px 14px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">PostGIS Spatial Queries</div>
            <strong style="font-size: 14px; color: var(--accent-purple);" id="arch-spatial">2.4 ms Avg</strong>
          </div>
        </div>
      </div>

      <!-- Interactive 4-Tier System Flow Chart Container -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- TIER 1: FIELD & INGESTION LAYER -->
        <div class="glass-panel" style="padding: 16px; border-color: rgba(0,240,255,0.25);">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title" style="color: var(--accent-cyan);"><i data-lucide="wifi"></i> ${t('layer_1')}</span>
            <span class="badge badge-cyan">DUAL-MODE INGESTION</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="arch-box" style="background: rgba(255,42,109,0.1); border: 1px solid rgba(255,42,109,0.3); padding: 12px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-pink);">Stranded Victims</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Smartphone Offline Mesh (BLE / Wi-Fi Direct)</div>
            </div>
            <div class="arch-box" style="background: rgba(0,245,160,0.1); border: 1px solid rgba(0,245,160,0.3); padding: 12px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-emerald);">Rescue Nodes & Volunteers</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Uplink Gateway Nodes when available</div>
            </div>
            <div class="arch-box" style="background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3); padding: 12px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-cyan);">Multi-Spectral Satellite Feeds</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Sentinel-2 & Drone Aerial Stream</div>
            </div>
            <div class="arch-box" style="background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.3); padding: 12px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-amber);">Weather & IoT Sensors</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Water level, river gauge, wind vector</div>
            </div>
          </div>
        </div>

        <!-- FLOW CONNECTOR ARROW -->
        <div style="text-align: center; color: var(--accent-cyan); font-size: 18px; margin: -6px 0;">&darr; (Secure Data Stream Sync) &darr;</div>

        <!-- TIER 2: API GATEWAY & BACKEND LAYER -->
        <div class="glass-panel" style="padding: 16px; border-color: rgba(157,78,221,0.25);">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title" style="color: var(--accent-purple);"><i data-lucide="server"></i> ${t('layer_2')}</span>
            <span class="badge badge-purple">FASTAPI CORE</span>
          </div>

          <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div style="flex: 1; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--text-main); font-size: 13px;">FastAPI Gateway</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Asynchronous ASGI Endpoint</div>
            </div>
            <span style="color: var(--accent-cyan); font-weight: 700; text-align: center;">&rarr;</span>
            <div style="flex: 1; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--text-main); font-size: 13px;">Auth & WebSocket Dispatcher</strong>
              <div style="font-size: 11px; color: var(--text-muted);">JWT Auth & Realtime Broadcast</div>
            </div>
            <span style="color: var(--accent-cyan); font-weight: 700; text-align: center;">&rarr;</span>
            <div style="flex: 1; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--text-main); font-size: 13px;">Message Broker</strong>
              <div style="font-size: 11px; color: var(--text-muted);">RabbitMQ / Apache Kafka</div>
            </div>
          </div>
        </div>

        <!-- FLOW CONNECTOR ARROW -->
        <div style="text-align: center; color: var(--accent-purple); font-size: 18px; margin: -6px 0;">&darr; (Pub/Sub Event Dispatch) &darr;</div>

        <!-- TIER 3: AI / VISION ENGINE, OPTIMIZATION & SPATIAL DATA LAYER -->
        <div class="glass-panel" style="padding: 16px; border-color: rgba(0,245,160,0.25);">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title" style="color: var(--accent-emerald);"><i data-lucide="box"></i> ${t('layer_3')}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            <!-- AI/Vision Engine Card -->
            <div style="background: rgba(255,42,109,0.06); border: 1px solid rgba(255,42,109,0.25); padding: 14px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-pink); margin-bottom: 8px;">AI / VISION ENGINE</div>
              <ul style="font-size: 11px; color: var(--text-muted); padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
                <li>YOLOv8 Object Detection</li>
                <li>Flood Extent Segmentation</li>
                <li>Structural Damage Classifier</li>
              </ul>
            </div>

            <!-- Optimization & Routing Card -->
            <div style="background: rgba(0,245,160,0.06); border: 1px solid rgba(0,245,160,0.25); padding: 14px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-emerald); margin-bottom: 8px;">OPTIMIZATION & ROUTING</div>
              <ul style="font-size: 11px; color: var(--text-muted); padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
                <li>Multi-Objective Solver</li>
                <li>Dynamic Graph Router</li>
                <li>Hospital Capacity Model</li>
              </ul>
            </div>

            <!-- Spatial Data Layer Card -->
            <div style="background: rgba(0,240,255,0.06); border: 1px solid rgba(0,240,255,0.25); padding: 14px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px;">SPATIAL DATA LAYER</div>
              <ul style="font-size: 11px; color: var(--text-muted); padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
                <li>PostgreSQL / PostGIS DB</li>
                <li>Redis Cache & Pub/Sub</li>
                <li>S3 (Tiles & Aerial Imagery)</li>
              </ul>
            </div>

          </div>
        </div>

        <!-- FLOW CONNECTOR ARROW -->
        <div style="text-align: center; color: var(--accent-emerald); font-size: 18px; margin: -6px 0;">&darr; (Realtime Mapbox & Relay Sync) &darr;</div>

        <!-- TIER 4: COMMAND & CONTROL TIER -->
        <div class="glass-panel" style="padding: 16px; border-color: rgba(255,184,0,0.25); margin-bottom: 20px;">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title" style="color: var(--accent-amber);"><i data-lucide="layout"></i> ${t('layer_4')}</span>
            <span class="badge badge-amber">TACOPS USER INTERFACE</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--accent-cyan); font-size: 13px;">React + Mapbox GIS Dashboard</strong>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Central Command Operations</div>
            </div>
            <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--accent-emerald); font-size: 13px;">Field Responder Mobile App</strong>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Offline-synced Volunteer App</div>
            </div>
            <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
              <strong style="color: var(--accent-pink); font-size: 13px;">SMS / LoRa Emergency Relays</strong>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Low-Bandwidth Satellite Bridge</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}
