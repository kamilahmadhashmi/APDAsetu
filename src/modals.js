/* ==========================================================================
   AEGIS-MESH & EMERGE - TACTICAL MODAL DIALOG MANAGER
   Replaces native browser alert() with custom System & Ultra Emergency Prompts.
   ========================================================================== */

import { t } from './i18n.js';

export function showSystemPrompt({ title, message, details = '' }) {
  const modal = document.getElementById('sys-prompt-modal');
  if (!modal) return;

  document.getElementById('sys-prompt-title').textContent = title || t('dispatch_center');
  document.getElementById('sys-prompt-msg').textContent = message || '';
  
  const detailsEl = document.getElementById('sys-prompt-details');
  if (details) {
    detailsEl.textContent = details;
    detailsEl.parentElement.classList.remove('hidden');
  } else {
    detailsEl.parentElement.classList.add('hidden');
  }

  modal.classList.remove('hidden');

  if (window.lucide) window.lucide.createIcons();
}

export function showUltraEmergencyModal({ title, message, details = '', location = '20.2961° N, 85.8245° E (Sector B4)', priority = 'P1 CRITICAL' }) {
  const modal = document.getElementById('ultra-emergency-modal');
  if (!modal) return;

  document.getElementById('ultra-modal-title').textContent = title || t('sos_btn');
  document.getElementById('ultra-modal-msg').textContent = message || '';
  document.getElementById('ultra-modal-loc').textContent = location;
  document.getElementById('ultra-modal-prio').textContent = priority;

  const detailsEl = document.getElementById('ultra-modal-details');
  if (details) {
    detailsEl.textContent = details;
    detailsEl.parentElement.classList.remove('hidden');
  } else {
    detailsEl.parentElement.classList.add('hidden');
  }

  modal.classList.remove('hidden');

  if (window.lucide) window.lucide.createIcons();
}

export function closeModals() {
  document.getElementById('sys-prompt-modal')?.classList.add('hidden');
  document.getElementById('ultra-emergency-modal')?.classList.add('hidden');
}

// Expose globally for inline onclicks
window.closeModals = closeModals;
window.showSystemPrompt = showSystemPrompt;
window.showUltraEmergencyModal = showUltraEmergencyModal;
