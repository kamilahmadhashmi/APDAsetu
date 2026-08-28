/* ==========================================================================
   AEGIS-MESH - FLOOD LEVEL PREDICTION & SURGE SIMULATOR ENGINE
   ========================================================================== */

export class FloodPredictionEngine {
  constructor() {
    this.currentWaterLevel = 2.8; // meters
    this.rainfallIntensity = 85;  // mm/hr
    this.damDischargeRate = 1800; // m3/s
    this.isSurgeActive = false;
    this.surgeTimer = null;
  }

  calculateForecast(rainfall = 85, discharge = 1800, baseLevel = 2.8) {
    this.rainfallIntensity = rainfall;
    this.damDischargeRate = discharge;
    this.currentWaterLevel = baseLevel;

    const netInput = (rainfall - 35) * 0.014 + (discharge - 800) * 0.0004;
    const ratePerHr = round(netInput, 2);

    let trend = 'STABLE';
    let trendSymbol = '▬';
    let trendColor = '#3b82f6';

    if (ratePerHr > 0.05) {
      trend = 'RISING SURGE';
      trendSymbol = '▲';
      trendColor = '#ef4444';
    } else if (ratePerHr < -0.05) {
      trend = 'RECEDING';
      trendSymbol = '▼';
      trendColor = '#10b981';
    }

    const predictedLevel12h = round(Math.max(0.2, baseLevel + ratePerHr * 12), 2);
    const predictedLevel24h = round(Math.max(0.1, baseLevel + ratePerHr * 24), 2);
    const polygonScale = Math.min(2.2, Math.max(0.5, baseLevel / 2.8));

    const dangerousRoads = [];
    const safeRoads = [];

    const roads = [
      { id: 'ROAD-01', name: 'Main Street Sector B4', threshold: 1.5, type: 'Arterial' },
      { id: 'ROAD-02', name: 'Jan Path Highway (Elevated)', threshold: 4.5, type: 'Elevated Highway' },
      { id: 'ROAD-03', name: 'Riverbed Flyover Approach', threshold: 2.0, type: 'Low-lying Bridge' },
      { id: 'ROAD-04', name: 'School Zone Connector Road', threshold: 1.2, type: 'Residential' },
      { id: 'ROAD-05', name: 'Hospital Trauma Emergency Corridor', threshold: 3.8, type: 'High Elevation' }
    ];

    roads.forEach(r => {
      if (baseLevel >= r.threshold) {
        dangerousRoads.push({ ...r, depth: round(baseLevel - r.threshold + 0.4, 1), status: 'SUBMERGED' });
      } else {
        safeRoads.push({ ...r, clearance: round(r.threshold - baseLevel, 1), status: 'PASSABLE' });
      }
    });

    return {
      currentWaterLevel: baseLevel,
      rainfallIntensity: rainfall,
      damDischargeRate: discharge,
      trend,
      trendSymbol,
      trendColor,
      ratePerHr: ratePerHr > 0 ? `+${ratePerHr}` : `${ratePerHr}`,
      predictedLevel12h,
      predictedLevel24h,
      polygonScale,
      dangerousRoads,
      safeRoads
    };
  }

  startSurgeSimulation(onTickCallback, onCompleteCallback) {
    if (this.surgeTimer) clearInterval(this.surgeTimer);
    this.isSurgeActive = true;
    let level = 1.8; // Start low

    this.surgeTimer = setInterval(() => {
      if (!this.isSurgeActive) return;

      level = round(level + 0.15, 2);
      const forecast = this.calculateForecast(95, 2400, level);

      if (onTickCallback) onTickCallback(forecast);

      if (level >= 5.2) {
        this.stopSurgeSimulation();
        if (onCompleteCallback) onCompleteCallback();
      }
    }, 1000);
  }

  stopSurgeSimulation() {
    this.isSurgeActive = false;
    if (this.surgeTimer) {
      clearInterval(this.surgeTimer);
      this.surgeTimer = null;
    }
  }
}

function round(val, decimals = 1) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

export const floodPredictionService = new FloodPredictionEngine();
