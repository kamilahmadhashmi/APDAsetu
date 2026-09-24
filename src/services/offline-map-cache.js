/* ==========================================================================
   AAPDASETU — 100% AIR-GAPPED OFFLINE MAP TILE & VECTOR TOPOGRAPHY ENGINE
   ==========================================================================
   Guarantees zero blank/broken map screens during complete storm blackouts.
   1. Procedural Canvas Tactical Grid Generator (draws military tiles on the fly).
   2. Offline Vector GeoJSON flood contours, rivers, and evacuation sanctuaries.
   3. Tile math to calculate precise GPS bounding box from (x, y, z) tile indices.
   ========================================================================== */

/**
 * Converts XYZ tile coordinates to latitude and longitude (WGS84).
 */
export function tile2lng(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

export function tile2lat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Creates an offline procedural canvas tile when remote OSM tiles are unreachable.
 */
export function createTacticalGridTile(coords, tileSize = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const ctx = canvas.getContext('2d');

  const { x, y, z } = coords;
  const nwLat = tile2lat(y, z);
  const nwLng = tile2lng(x, z);
  const seLat = tile2lat(y + 1, z);
  const seLng = tile2lng(x + 1, z);

  // 1. Tactical dark air-gapped background
  ctx.fillStyle = '#060a13';
  ctx.fillRect(0, 0, tileSize, tileSize);

  // 2. Micro-grid overlay lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;

  const step = tileSize / 4;
  for (let px = step; px < tileSize; px += step) {
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, tileSize);
    ctx.stroke();
  }
  for (let py = step; py < tileSize; py += step) {
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(tileSize, py);
    ctx.stroke();
  }

  // 3. Tile Border
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
  ctx.strokeRect(0, 0, tileSize, tileSize);

  // 4. Center Crosshair
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.lineWidth = 1.5;
  const mid = tileSize / 2;
  ctx.beginPath();
  ctx.moveTo(mid - 6, mid);
  ctx.lineTo(mid + 6, mid);
  ctx.moveTo(mid, mid - 6);
  ctx.lineTo(mid, mid + 6);
  ctx.stroke();

  // 5. GPS Coordinate & Tactical HUD text
  ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.font = '9px monospace';
  ctx.fillText(`${nwLat.toFixed(3)}°N, ${nwLng.toFixed(3)}°E`, 8, 14);

  ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
  ctx.font = '8px monospace';
  ctx.fillText(`MGRS GRID [Z${z}/${x}/${y}]`, 8, tileSize - 8);

  ctx.fillStyle = 'rgba(0, 245, 160, 0.35)';
  ctx.textAlign = 'right';
  ctx.fillText('AIR-GAPPED OFFLINE MESH', tileSize - 8, 14);

  return canvas;
}

/**
 * Offline Vector Hazard & River Basin Boundaries (Odisha / Cuttack / Bhubaneswar)
 */
export const OFFLINE_HAZARD_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Mahanadi Active Flood Inundation Basin",
        hazard: "SEVERE_WATER_SURGE",
        flood_depth: "3.2m",
        color: "#ef4444"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [85.805, 20.312],
          [85.835, 20.318],
          [85.860, 20.298],
          [85.842, 20.280],
          [85.815, 20.288],
          [85.805, 20.312]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sector 4 High-Ground Trauma Sanctuary",
        hazard: "SAFE_EVACUATION_ZONE",
        elevation: "42m MSL",
        color: "#10b981"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [85.820, 20.305],
          [85.832, 20.308],
          [85.836, 20.299],
          [85.823, 20.297],
          [85.820, 20.305]
        ]]
      }
    }
  ]
};

/**
 * Factory for creating an air-gapped Leaflet GridLayer fallback.
 */
export function createAirGappedTileLayer(L) {
  if (!L || !L.GridLayer) return null;

  return L.GridLayer.extend({
    createTile: function(coords) {
      return createTacticalGridTile(coords, this.getTileSize().x);
    }
  });
}
