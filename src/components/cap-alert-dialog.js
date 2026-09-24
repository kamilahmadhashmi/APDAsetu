/* ==========================================================================
   AAPDASETU — OASIS CAP v1.2 GOVERNMENT ALERT BROADCASTER & VIEWER
   ==========================================================================
   Allows Incident Commanders to preview, draft, and broadcast standards-compliant
   CAP v1.2 XML emergency alerts for NDMA SACHET (India) & FEMA IPAWS (USA).
   ========================================================================== */

import { showSystemPrompt } from '../modals.js';
import { identityService } from '../services/identity-service.js';

export function openCapAlertModal() {
  let modal = document.getElementById('cap-alert-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cap-alert-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '999999';
    modal.style.background = 'rgba(2, 6, 23, 0.88)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '16px';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 600px; padding: 20px; border-radius: 8px; border: 1px solid rgba(2,132,199,0.4); background: #0f172a; color: #f8fafc; box-shadow: 0 10px 40px rgba(0,0,0,0.8); max-height: 90vh; overflow-y: auto;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="radio" style="color: #0284c7;"></i>
          <strong style="font-size: 13.5px; letter-spacing: 0.05em; color: #f8fafc;">OASIS CAP v1.2 EARLY-WARNING DISPATCH</strong>
          <span class="badge badge-purple" style="font-size: 9.5px;">ITU-T X.1303</span>
        </div>
        <button id="btn-close-cap-modal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
      </div>

      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 14px; line-height: 1.4;">
        Broadcasts certified Common Alerting Protocol (CAP v1.2) emergency warnings to National Disaster Management feeds (NDMA SACHET / FEMA IPAWS), municipal siren relays, and cellular broadcast channels.
      </div>

      <!-- Alert Form -->
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; font-size: 11px;">
        <div>
          <label style="color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">EVENT HEADLINE:</label>
          <input type="text" id="cap-headline" value="FLASH FLOOD EMERGENCY: Rapid Riverfront Breach in Low-Lying Wards" style="width: 100%; background: #020617; border: 1px solid #334155; color: #f8fafc; padding: 6px 10px; border-radius: 4px; font-size: 11px; box-sizing: border-box;" />
        </div>

        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">SEVERITY:</label>
            <select id="cap-severity" style="width: 100%; background: #020617; border: 1px solid #334155; color: #f8fafc; padding: 6px 10px; border-radius: 4px; font-size: 11px; box-sizing: border-box;">
              <option value="Severe" selected>Severe (Significant threat to life)</option>
              <option value="Extreme">Extreme (Extraordinary threat)</option>
              <option value="Moderate">Moderate (Possible threat)</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label style="color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">URGENCY:</label>
            <select id="cap-urgency" style="width: 100%; background: #020617; border: 1px solid #334155; color: #f8fafc; padding: 6px 10px; border-radius: 4px; font-size: 11px; box-sizing: border-box;">
              <option value="Immediate" selected>Immediate (Take responsive action now)</option>
              <option value="Expected">Expected (Action within 1 hour)</option>
              <option value="Future">Future</option>
            </select>
          </div>
        </div>

        <div>
          <label style="color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">PROTECTIVE INSTRUCTION:</label>
          <textarea id="cap-instruction" rows="2" style="width: 100%; background: #020617; border: 1px solid #334155; color: #f8fafc; padding: 6px 10px; border-radius: 4px; font-size: 11px; box-sizing: border-box; resize: vertical;">Evacuate low-ground households immediately. Follow NDRF Green Corridors to Sector 4 Apex Trauma Safe Zone. Do not drive through flooded underpasses.</textarea>
        </div>

        <div>
          <label style="color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">TARGET GEOGRAPHIC CIRCLE (LAT, LNG, RADIUS KM):</label>
          <input type="text" id="cap-circle" value="20.2961,85.8245,6.0" style="width: 100%; background: #020617; border: 1px solid #334155; color: #38bdf8; font-family: monospace; padding: 6px 10px; border-radius: 4px; font-size: 11px; box-sizing: border-box;" />
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="btn-broadcast-cap" class="btn btn-danger" style="flex: 1; justify-content: center; font-size: 11px; padding: 8px;">
          <i data-lucide="radio-tower"></i> Broadcast Official CAP Alert
        </button>
        <button id="btn-view-raw-xml" class="btn" style="background: #1e293b; color: #38bdf8; border: 1px solid #475569; font-size: 11px; padding: 8px;">
          <i data-lucide="code"></i> Inspect Raw XML Feed
        </button>
      </div>

      <!-- Live XML Preview Drawer -->
      <div id="cap-xml-preview" style="display: none; margin-top: 14px; background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 10px; color: #a5f3fc; max-height: 160px; overflow-y: auto; white-space: pre;">
      </div>

    </div>
  `;

  modal.style.display = 'flex';
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('btn-close-cap-modal')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('btn-view-raw-xml')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/alerts/cap.xml');
      const xml = await res.text();
      const preview = document.getElementById('cap-xml-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.textContent = xml;
      }
    } catch (e) {
      showSystemPrompt({
        title: 'CAP Feed Access Notice',
        message: 'Unable to retrieve OASIS CAP XML feed from API gateway.',
        details: String(e && e.message ? e.message : e)
      });
    }
  });

  document.getElementById('btn-broadcast-cap')?.addEventListener('click', async () => {
    const headline = document.getElementById('cap-headline').value;
    const severity = document.getElementById('cap-severity').value;
    const urgency = document.getElementById('cap-urgency').value;
    const instruction = document.getElementById('cap-instruction').value;
    const circle = document.getElementById('cap-circle').value;

    try {
      const res = await fetch('/api/v1/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, severity, urgency, instruction, circle })
      });
      const data = await res.json();

      showSystemPrompt({
        title: 'CAP v1.2 Alert Broadcast Dispatched',
        message: 'Alert officially published to NDMA SACHET / FEMA IPAWS feeds and municipal siren relay.',
        details: `IDENTIFIER: ${data.alert.identifier}\nSEVERITY: ${data.alert.severity}\nURGENCY: ${data.alert.urgency}\nTARGET: ${data.alert.circle}\nFORMAT: OASIS CAP v1.2 / ITU-T X.1303`
      });

      const preview = document.getElementById('cap-xml-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.textContent = data.cap_xml;
      }
    } catch (e) {
      showSystemPrompt({
        title: 'Broadcast Dispatch Error',
        message: 'Failed to broadcast CAP emergency alert to gateway.',
        details: String(e && e.message ? e.message : e)
      });
    }
  });
}
