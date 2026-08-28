/* ==========================================================================
   RESQNET SMARTPHONE SIMULATOR - MAIN APP COORDINATOR
   Coordinates view lifecycle for Arjun Sharma (FIELD-104).
   ========================================================================== */

import { setSimLanguage } from './i18n-sim.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderMapView } from './views/map.js';
import { renderVisionView } from './views/vision.js';
import { renderMeshView } from './views/mesh.js';
import { renderSosModal } from './modals/sos.js';

class SmartphoneSimulatorApp {
  constructor() {
    this.activeTab = 'map';
    this.activeRole = 'citizen';
    this.currentLanguage = 'en';
  }

  init() {
    this.initClock();
    this.initLanguageSwitcher();
    this.initNavigation();
    this.initPresetControls();
    
    // Immediately display the bottom navigation and open the Map view
    const mainNav = document.getElementById('sim-mobile-nav-bar');
    if (mainNav) mainNav.classList.remove('hidden');

    this.switchTab('map');
  }

  initClock() {
    const updateTime = () => {
      const clockEl = document.getElementById('sim-status-clock');
      if (clockEl) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}`;
      }
    };
    updateTime();
    setInterval(updateTime, 10000);
  }

  initLanguageSwitcher() {
    const langSelect = document.getElementById('sim-lang-switch');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
        setSimLanguage(this.currentLanguage);
      });
    }
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.sim-mobile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab === 'distress') {
          this.openSosModal();
        } else if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  initPresetControls() {
    document.getElementById('ctrl-trigger-sos')?.addEventListener('click', () => this.openSosModal());
    document.getElementById('ctrl-tab-map')?.addEventListener('click', () => this.switchTab('map'));
    document.getElementById('ctrl-tab-safety')?.addEventListener('click', () => this.switchTab('dashboard'));
    document.getElementById('ctrl-tab-mesh')?.addEventListener('click', () => this.switchTab('mesh'));
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update bottom nav UI state
    document.querySelectorAll('.sim-mobile-nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all views and show target view
    document.querySelectorAll('.sim-view-panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(`sim-view-${tabName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
      this.renderViewContent(tabName, targetPanel);
    }
  }

  renderViewContent(tabName, container) {
    const actions = {
      openSosModal: () => this.openSosModal(),
      switchTab: (t) => this.switchTab(t)
    };

    switch (tabName) {
      case 'map':
        renderMapView(container, actions);
        break;
      case 'dashboard':
        renderDashboardView(container, { role: this.activeRole }, actions);
        break;
      case 'vision':
        renderVisionView(container);
        break;
      case 'mesh':
        renderMeshView(container, actions);
        break;
    }

    setSimLanguage(this.currentLanguage);
  }

  openSosModal() {
    const modalContainer = document.getElementById('sim-modal-container');
    if (!modalContainer) return;

    renderSosModal(modalContainer, () => {
      modalContainer.innerHTML = '';
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SmartphoneSimulatorApp();
  app.init();
  window.aegisSimApp = app;
});
