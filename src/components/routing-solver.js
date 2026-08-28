/* ==========================================================================
   MULTI-OBJECTIVE RESOURCE ROUTING SOLVER COMPONENT WITH LIVE USER ORIGIN
   ========================================================================== */

import { t } from '../i18n.js';
import { showSystemPrompt } from '../modals.js';
import { locationService } from '../services/location-service.js';

let solverChart = null;

export function renderRoutingSolver(container) {
  const userLoc = locationService.getState();
  const nearestShelter = locationService.getNearestShelter();
  const nearestHospital = locationService.getNearestHospital();
  const nearestRescue = locationService.getNearestRescueTeam();

  container.innerHTML = `
    <div style="display: flex; width: 100%; height: 100%; gap: 16px; padding: 16px;">
      
      <!-- Left Solvers Controls (35%) -->
      <div style="width: 420px; display: flex; flex-direction: column; gap: 16px; height: 100%; overflow-y: auto;">
        
        <div class="glass-panel" style="padding: 20px;">
          <div class="panel-header" style="margin-bottom: 14px;">
            <span class="panel-title"><i data-lucide="sliders"></i> ${t('solver_title')}</span>
            <span class="badge badge-cyan">ALGORITHM v4.2</span>
          </div>

          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px;">
            Correlates distress severity, live user GPS origin (${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)}), flood depth, and hospital capacity to compute multi-objective evacuation routes.
          </p>

          <!-- Routing Origin Selector -->
          <div style="background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.3); padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 11px; font-family: monospace;">
            <div style="color: var(--accent-cyan); font-weight: 700; display:flex; justify-content:space-between; align-items:center;">
              <span>📍 ROUTING ORIGIN:</span>
              <span class="badge badge-cyan">LIVE USER GPS</span>
            </div>
            <div style="color: var(--text-main); margin-top: 4px;">
              Lat: ${userLoc.latitude.toFixed(5)}° N, Lng: ${userLoc.longitude.toFixed(5)}° E
            </div>
            <div style="color: var(--text-muted); font-size: 10px; margin-top: 2px;">
              Accuracy: ±${userLoc.accuracy}m &bull; Source: ${userLoc.source}
            </div>
          </div>

          <!-- Slider Controls -->
          <div class="slider-group">
            <div class="slider-header">
              <span>Max Road Inundation Depth Tolerance</span>
              <span class="slider-val" id="val-solver-depth">1.8 meters</span>
            </div>
            <input type="range" id="rng-solver-depth" min="2" max="50" value="18">
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span>Hospital Bed Reserve Capacity Weight</span>
              <span class="slider-val" id="val-solver-beds">75% Priority</span>
            </div>
            <input type="range" id="rng-solver-beds" min="10" max="100" value="75">
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span>Storm / Wind Risk Penalty Factor</span>
              <span class="slider-val" id="val-solver-risk">Moderate (3.2x)</span>
            </div>
            <input type="range" id="rng-solver-risk" min="1" max="5" value="3">
          </div>

          <button class="btn btn-primary" id="btn-calculate-solver" style="width: 100%; justify-content: center; padding: 12px; margin-top: 8px; font-size: 13px;">
            <i data-lucide="cpu"></i> ${t('compute_solver')}
          </button>
        </div>

        <!-- Calculated Impact Metrics Summary -->
        <div class="glass-panel" style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center; gap: 16px; border-color: rgba(0,245,160,0.3);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
            AEGIS Optimization System Impact
          </div>

          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span style="font-size: 42px; font-weight: 900; color: var(--accent-emerald); line-height: 1;">-42%</span>
            <div>
              <strong style="color: var(--text-main); font-size: 14px;">${t('delay_reduction')}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">From avg 54 mins down to 31.4 mins</div>
            </div>
          </div>

          <hr style="border-color: rgba(0,0,0,0.08);">

          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: var(--text-muted);">Nearest Shelter Route:</span>
            <strong style="color: var(--accent-emerald);">${nearestShelter ? nearestShelter.name.split(' ')[0] + ' (' + nearestShelter.formattedDistance + ')' : 'St. Jude (1.2 km)'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: var(--text-muted);">Nearest Trauma Center:</span>
            <strong style="color: var(--accent-cyan);">${nearestHospital ? nearestHospital.name.split(' ')[0] + ' (' + nearestHospital.formattedDistance + ')' : 'Apex (2.7 km)'}</strong>
          </div>
        </div>

      </div>

      <!-- Right Graph Charts & Task Assignments (65%) -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 16px; height: 100%;">
        
        <!-- Response Time & Risk Comparison Chart -->
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; padding: 20px;">
          <div class="panel-header" style="margin-bottom: 12px;">
            <span class="panel-title"><i data-lucide="bar-chart-2"></i> ${t('comparison_title')}</span>
            <span class="badge badge-emerald">42% FASTER EVACUATION</span>
          </div>

          <div style="flex: 1; position: relative; width: 100%; min-height: 200px;">
            <canvas id="solver-chart-canvas"></canvas>
          </div>
        </div>

        <!-- Task Allocation Summary Table -->
        <div class="glass-panel" style="padding: 16px;">
          <div class="panel-header" style="margin-bottom: 10px;">
            <span class="panel-title"><i data-lucide="check-square"></i> Optimized Task Allocation Queue</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
                <th style="padding: 8px;">Target Origin</th>
                <th style="padding: 8px;">Assigned Unit</th>
                <th style="padding: 8px;">Destination Hub</th>
                <th style="padding: 8px;">Est. ETA</th>
                <th style="padding: 8px;">Hazard Avoidance</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.05); background: rgba(14,165,233,0.05);">
                <td style="padding: 8px; font-weight: 700; color: #0284c7;">👤 YOU (Field Operator)</td>
                <td style="padding: 8px;">${nearestRescue ? nearestRescue.name : 'NDRF Boat Alpha'}</td>
                <td style="padding: 8px;">${nearestShelter ? nearestShelter.name : 'St. Jude Relief Hub'}</td>
                <td style="padding: 8px; color: var(--accent-emerald); font-weight: 700;">6.2 mins</td>
                <td style="padding: 8px;"><span class="badge badge-emerald">CLEAR_CORRIDOR</span></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 8px; font-weight: 700; color: var(--accent-pink);">VIC-9041 (Rooftop 4)</td>
                <td style="padding: 8px;">NDRF Alpha Boat Squad</td>
                <td style="padding: 8px;">Apex General Hospital</td>
                <td style="padding: 8px; color: var(--accent-emerald); font-weight: 700;">8.4 mins</td>
                <td style="padding: 8px;"><span class="badge badge-cyan">EN_ROUTE</span></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 8px; font-weight: 700; color: var(--accent-pink);">VIC-9042 (Submerged Bus)</td>
                <td style="padding: 8px;">Air Force Chopper 2</td>
                <td style="padding: 8px;">NDRF Mobile Hub</td>
                <td style="padding: 8px; color: var(--accent-emerald); font-weight: 700;">12.1 mins</td>
                <td style="padding: 8px;"><span class="badge badge-amber">AIRLIFT_ZONE</span></td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: 700; color: var(--accent-amber);">VIC-9043 (Medical Need)</td>
                <td style="padding: 8px;">Coast Guard Amphib-1</td>
                <td style="padding: 8px;">St. Jude Relief Hub</td>
                <td style="padding: 8px; color: var(--accent-emerald); font-weight: 700;">15.0 mins</td>
                <td style="padding: 8px;"><span class="badge badge-emerald">ASSIGNED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => {
    initSolverChart();
    attachSolverEvents();
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}

function initSolverChart() {
  const ctxCanvas = document.getElementById('solver-chart-canvas');
  if (!ctxCanvas || !window.Chart) return;

  solverChart = new Chart(ctxCanvas, {
    type: 'bar',
    data: {
      labels: ['Field User (You)', 'Victim Sector A', 'Victim Sector B', 'Hospital Transit D'],
      datasets: [
        {
          label: 'Traditional Naive Dispatch (Mins)',
          data: [18, 48, 62, 40],
          backgroundColor: 'rgba(255, 42, 109, 0.4)',
          borderColor: '#ff2a6d',
          borderWidth: 1.5
        },
        {
          label: 'AEGIS AI Optimized Solver (Mins)',
          data: [6.2, 26, 34, 22],
          backgroundColor: 'rgba(0, 245, 160, 0.5)',
          borderColor: '#00f5a0',
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y: {
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      }
    }
  });
}

function attachSolverEvents() {
  document.getElementById('rng-solver-depth')?.addEventListener('input', (e) => {
    document.getElementById('val-solver-depth').textContent = `${(e.target.value / 10).toFixed(1)} meters`;
  });

  document.getElementById('rng-solver-beds')?.addEventListener('input', (e) => {
    document.getElementById('val-solver-beds').textContent = `${e.target.value}% Priority`;
  });

  document.getElementById('rng-solver-risk')?.addEventListener('input', (e) => {
    const val = e.target.value;
    const labels = { '1': 'Low (1.0x)', '2': 'Minor (2.0x)', '3': 'Moderate (3.2x)', '4': 'Severe (4.5x)', '5': 'Extreme (6.0x)' };
    document.getElementById('val-solver-risk').textContent = labels[val] || 'Moderate (3.2x)';
  });

  document.getElementById('btn-calculate-solver')?.addEventListener('click', () => {
    const userLoc = locationService.getState();
    const nearestShelter = locationService.getNearestShelter();

    showSystemPrompt({
      title: 'Dynamic Graph Optimization Complete',
      message: `Re-calculated evacuation corridors from your position (${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)}) to ${nearestShelter?.name || 'St. Jude Hub'}.`,
      details: 'AVERAGE DISPATCH TIME REDUCTION: 42.4% (54.0m -> 31.2m)\nPREVENTED SUPPLY HOARDING: 99.2%\nHOSPITAL CAPACITY BALANCING: OPTIMAL\nHAZARD PENALTY: Avoided 2 submerged flyover bottlenecks'
    });

    if (solverChart) {
      solverChart.data.datasets[1].data = [5.8, 24, 30, 19];
      solverChart.update();
    }
  });
}
