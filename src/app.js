/* ==========================================================================
   AEGIS-MESH & EMERGE APP ORCHESTRATOR WITH TACTICAL DIALOG MANAGER
   ========================================================================== */

import { getLang, setLang, t } from './i18n.js';
import { showSystemPrompt, showUltraEmergencyModal, closeModals } from './modals.js';
import { renderGisDashboard } from './components/gis-map.js';
import { renderAiVisionEngine } from './components/ai-vision.js';
import { renderMeshNetwork } from './components/mesh-network.js';
import { renderRoutingSolver } from './components/routing-solver.js';
import { renderArchitectureExplorer } from './components/architecture.js';
import { locationService } from './services/location-service.js';

let currentViewId = 'gis-dashboard';

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initNavigation();
  initSosModal();
  initFooterLinks();
  initLiveHeaderTelemetry();

  // Apply initial translations
  applyLanguage(getLang());

  // Initial View Mount
  mountView(currentViewId);
});

function initLanguageSwitcher() {
  const select = document.getElementById('sel-lang-switch');
  if (!select) return;

  select.value = getLang();

  select.addEventListener('change', (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    applyLanguage(newLang);
    
    // Re-mount current view to update dynamic translations
    mountView(currentViewId);
  });
}

function applyLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translatedStr = t(key);

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.placeholder) el.placeholder = translatedStr;
      else el.value = translatedStr;
    } else {
      el.textContent = translatedStr;
    }
  });
}

function initNavigation() {
  const sidebarTabs = document.querySelectorAll('.nav-sidebar-tab');
  const topLinks = document.querySelectorAll('.nav-top-link');

  const handleNavClick = (e, tabElement) => {
    e.preventDefault();
    const targetId = tabElement.getAttribute('data-tab');
    if (!targetId) return;

    currentViewId = targetId;

    // Sync active classes across sidebar & top nav
    sidebarTabs.forEach(t => {
      if (t.getAttribute('data-tab') === targetId) {
        t.classList.add('active');
        t.classList.remove('text-on-surface-variant');
        t.classList.add('bg-primary', 'text-on-primary');
      } else {
        t.classList.remove('active', 'bg-primary', 'text-on-primary');
        t.classList.add('text-on-surface-variant');
      }
    });

    topLinks.forEach(l => {
      if (l.getAttribute('data-tab') === targetId) {
        l.classList.add('active', 'border-primary', 'text-primary');
        l.classList.remove('border-transparent', 'text-on-surface-variant');
      } else {
        l.classList.remove('active', 'border-primary', 'text-primary');
        l.classList.add('border-transparent', 'text-on-surface-variant');
      }
    });

    mountView(targetId);
  };

  sidebarTabs.forEach(tab => tab.addEventListener('click', (e) => handleNavClick(e, tab)));
  topLinks.forEach(link => link.addEventListener('click', (e) => handleNavClick(e, link)));
}

function mountView(viewId) {
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(p => p.classList.remove('active'));

  const targetPanel = document.getElementById(viewId);
  if (!targetPanel) return;

  targetPanel.classList.add('active');

  switch (viewId) {
    case 'gis-dashboard':
      renderGisDashboard(targetPanel);
      break;
    case 'ai-vision':
      renderAiVisionEngine(targetPanel);
      break;
    case 'mesh-network':
      renderMeshNetwork(targetPanel);
      break;
    case 'routing-solver':
      renderRoutingSolver(targetPanel);
      break;
    case 'architecture':
      renderArchitectureExplorer(targetPanel);
      break;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function initSosModal() {
  const form = document.getElementById('sos-form');
  const coordsInput = document.getElementById('sos-coords-input');

  // Update SOS coordinate input dynamically with live location
  locationService.subscribe((loc) => {
    if (coordsInput) {
      const sourceLabel = loc.source === 'GPS' ? 'LIVE GPS' : (loc.source === 'SIMULATED' ? 'SIMULATED' : 'DEMO');
      coordsInput.value = `${loc.latitude.toFixed(5)}° N, ${loc.longitude.toFixed(5)}° E (±${loc.accuracy}m, ${sourceLabel})`;
    }
  });

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('sos-type')?.value || 'Emergency';
    const details = document.getElementById('sos-details')?.value || 'No details provided';

    document.getElementById('sos-modal')?.classList.add('hidden');
    form.reset();

    // Broadcast distress packet with current user coordinates
    const packet = locationService.transmitDistressPacket({
      situation: type,
      notes: details
    });

    // Trigger Ultra Emergency Dialog Window
    showUltraEmergencyModal({
      title: 'EMERGENCY SOS DISTRESS TRANSMITTED',
      message: `Distress Situation: ${type}`,
      details: `RAW PAYLOAD: 0x8F4A...B93C_AEGIS_SECURE_PAYLOAD\nCOORDINATES: ${packet.lat.toFixed(5)}° N, ${packet.lng.toFixed(5)}° E\nACCURACY: ±${packet.accuracy}m\nSTATUS: ENCRYPTED & QUEUED INTO BLE MESH RELAY\nDETAILS: ${details}`,
      location: `${packet.lat.toFixed(4)}° N, ${packet.lng.toFixed(4)}° E (Sector B4 Flood Zone)`,
      priority: 'P1 ULTRA CRITICAL SOS'
    });
  });
}

function initFooterLinks() {
  document.getElementById('btn-support-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSystemPrompt({
      title: 'AEGIS Support Channel',
      message: 'Connecting to Disaster Command Center Hub Support.',
      details: 'Gateway Endpoint: https://api.aegis.disaster.gov/v1/support\nAuth Status: Active Admin Session'
    });
  });

  document.getElementById('btn-logs-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSystemPrompt({
      title: 'Telemetry & Ingress Logs',
      message: 'Ingress pipeline operating within normal operational latency.',
      details: 'Throughput: 1,480 req/sec\nRabbitMQ Broker Queue: 0 Pending (0ms)\nPostGIS Spatial Queries: 2.4 ms Avg'
    });
  });

  document.getElementById('btn-notifications-top')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSystemPrompt({
      title: 'System Notifications',
      message: 'All 5 mesh relay nodes operating normally. 0 critical network dropouts detected in the past 24 hours.'
    });
  });
}

function initLiveHeaderTelemetry() {
  setInterval(() => {
    const latEl = document.getElementById('hdr-gateway-status');
    if (latEl) {
      const ms = (12 + Math.random() * 4).toFixed(1);
      latEl.textContent = `${ms}ms`;
    }
  }, 3000);
}
