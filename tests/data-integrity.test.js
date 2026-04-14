// =============================================================
// Data Integrity Tests — validate FARMS, NODES, R, FLOOD_ZONES,
// and GeoJSON files have correct structure & counts
// =============================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- Extract inline data from index.html ----
const html = readFileSync(resolve(root, 'index.html'), 'utf-8');

function extractJSObject(varName) {
  // Match: const VARNAME = [...] or const VARNAME = {...}
  const re = new RegExp(`const ${varName}\\s*=\\s*([\\[\\{])`);
  const m = html.match(re);
  if (!m) throw new Error(`Cannot find ${varName} in index.html`);
  const start = html.indexOf(m[0]) + m[0].length - 1;
  let depth = 0;
  let i = start;
  const open = html[start];
  const close = open === '[' ? ']' : '}';
  for (; i < html.length; i++) {
    if (html[i] === open) depth++;
    else if (html[i] === close) { depth--; if (depth === 0) break; }
  }
  const raw = html.slice(start, i + 1);
  // Convert JS object literals to JSON-parseable form
  // Add quotes around unquoted keys
  const jsonLike = raw
    .replace(/'/g, '"')
    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
  try {
    return JSON.parse(jsonLike);
  } catch {
    // For complex objects with nested arrays (like R), use Function eval
    return new Function(`return ${raw}`)();
  }
}

const FARMS = extractJSObject('FARMS');
const NODES = extractJSObject('NODES');
const FLOOD_ZONES = extractJSObject('FLOOD_ZONES');

// R is a massive object — extract it via Function eval
const rMatch = html.match(/const R\s*=\s*(\{[\s\S]*?\});\s*\n/);
const R = new Function(`return ${rMatch[1]}`)();

// OPS_2025 operational data — extract via Function eval
const ops2025Match = html.match(/const OPS_2025\s*=\s*(\{[\s\S]*?\n\});/);
const OPS_2025 = ops2025Match ? new Function(`return ${ops2025Match[1]}`)() : null;

// ---- GeoJSON file loaders ----
function loadGeoJSON(relPath) {
  return JSON.parse(readFileSync(resolve(root, relPath), 'utf-8'));
}

// ============================================================
describe('Data Integrity', () => {
  // ----- 1. FARMS: exactly 19 entries with required fields -----
  it('FARMS has exactly 19 entries with required fields (id, name, lat, lng, prod, cl)', () => {
    expect(FARMS).toHaveLength(19);
    const requiredKeys = ['id', 'name', 'lat', 'lng', 'prod', 'cl'];
    for (const farm of FARMS) {
      for (const key of requiredKeys) {
        expect(farm).toHaveProperty(key);
      }
      expect(typeof farm.lat).toBe('number');
      expect(typeof farm.lng).toBe('number');
      expect(typeof farm.prod).toBe('number');
      expect(farm.prod).toBeGreaterThan(0);
    }
  });

  // ----- 2. All FARMS coordinates within Uraba bounding box -----
  it('all FARMS coordinates are within Uraba bounding box (lat 7.5-8.2, lng -76.9 to -76.3)', () => {
    for (const f of FARMS) {
      expect(f.lat).toBeGreaterThanOrEqual(7.5);
      expect(f.lat).toBeLessThanOrEqual(8.2);
      expect(f.lng).toBeGreaterThanOrEqual(-76.9);
      expect(f.lng).toBeLessThanOrEqual(-76.3);
    }
  });

  // ----- 3. R routes has entries for all 19 farm IDs + "hp" -----
  it('R routes object has entries for all 19 farm IDs + "hp"', () => {
    expect(R).toHaveProperty('hp');
    expect(R.hp).toHaveProperty('d');
    expect(R.hp).toHaveProperty('t');
    expect(R.hp).toHaveProperty('c');

    for (const farm of FARMS) {
      expect(R).toHaveProperty(farm.id);
    }
  });

  // ----- 4. Each R entry has h and p sub-objects with d, t, c -----
  it('each R farm entry has h (hub) and p (puerto) sub-objects with d, t, c properties', () => {
    for (const farm of FARMS) {
      const route = R[farm.id];
      expect(route).toHaveProperty('h');
      expect(route).toHaveProperty('p');

      for (const leg of [route.h, route.p]) {
        expect(leg).toHaveProperty('d'); // distance km
        expect(leg).toHaveProperty('t'); // time min
        expect(leg).toHaveProperty('c'); // coordinates array
        expect(typeof leg.d).toBe('number');
        expect(typeof leg.t).toBe('number');
        expect(Array.isArray(leg.c)).toBe(true);
        expect(leg.c.length).toBeGreaterThan(1);
      }
    }
  });

  // ----- 5. NODES has 8 required keys -----
  it('NODES has 9 required keys (hub, mini_hub, zungo, puerto, apartado, carepa, chigorodo, turbo, aeropuerto)', () => {
    const expectedKeys = ['hub', 'mini_hub', 'zungo', 'puerto', 'apartado', 'carepa', 'chigorodo', 'turbo', 'aeropuerto'];
    for (const key of expectedKeys) {
      expect(NODES).toHaveProperty(key);
      expect(NODES[key]).toHaveProperty('lat');
      expect(NODES[key]).toHaveProperty('lng');
      expect(NODES[key]).toHaveProperty('name');
    }
    expect(Object.keys(NODES)).toHaveLength(9);
  });

  // ----- 6. GeoJSON files have correct feature counts -----
  it('GeoJSON files have correct feature counts (municipios=9, veredas=611, sipra=68, roads=299, waterways=759)', () => {
    const municipios = loadGeoJSON('data/uraba_municipios_web.geojson');
    expect(municipios.features.length).toBe(9);

    const veredas = loadGeoJSON('data/uraba_veredas_web.geojson');
    expect(veredas.features.length).toBe(611);

    const sipra = loadGeoJSON('data/sipra_uraba_web.geojson');
    expect(sipra.features.length).toBe(68);

    const roads = loadGeoJSON('data/osm_roads.geojson');
    expect(roads.features.length).toBe(299);

    const waterways = loadGeoJSON('data/osm_waterways_web.geojson');
    expect(waterways.features.length).toBe(759);
  });

  // ----- 7. FLOOD_ZONES has 3 entries with valid risk levels -----
  it('FLOOD_ZONES has 3 entries with valid risk levels', () => {
    expect(FLOOD_ZONES).toHaveLength(3);
    const validRisks = ['alta', 'media', 'baja'];
    for (const zone of FLOOD_ZONES) {
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('risk');
      expect(zone).toHaveProperty('coords');
      expect(validRisks).toContain(zone.risk);
      expect(Array.isArray(zone.coords)).toBe(true);
      expect(zone.coords.length).toBeGreaterThan(3);
    }
  });
});

// ============================================================
describe('OPS_2025 operational data', () => {
    it('has correct trip totals from real 2025 data', () => {
        expect(OPS_2025).toBeDefined();
        expect(OPS_2025.totalTrips).toBe(12860);
        expect(OPS_2025.totalBoxesShipped).toBe(5057968);
        expect(OPS_2025.totalBoxesReceived).toBe(5349445);
        expect(OPS_2025.avgBoxesPerTrip).toBe(393);
        expect(OPS_2025.avgOccupancy).toBeCloseTo(0.728, 2);
    });
    it('has geocerca standby stats per farm', () => {
        expect(OPS_2025.standby).toBeDefined();
        expect(OPS_2025.standby.totalEvents).toBe(132488);
        expect(OPS_2025.standby.vehicles).toBe(16);
        expect(OPS_2025.standby.farmMedianMin).toBe(14);
        expect(OPS_2025.standby.farmMeanMin).toBeCloseTo(52.9, 0);
        expect(OPS_2025.standby.farmP90Min).toBeCloseTo(97.3, 0);
        expect(OPS_2025.standby.embarqueroMedianMin).toBe(113);
    });
    it('has nocturnal pallet data', () => {
        expect(OPS_2025.nocturnos).toBeDefined();
        expect(OPS_2025.nocturnos.palletsYear).toBe(50000);
        expect(OPS_2025.nocturnos.costPerPallet).toBe(4200);
        expect(OPS_2025.nocturnos.totalCostYear).toBe(210);
    });
    it('has per-farm standby detail for G20 farms', () => {
        expect(OPS_2025.standby.farms).toBeDefined();
        const tucanes = OPS_2025.standby.farms.find(f => f.name === 'Tucanes');
        expect(tucanes).toBeDefined();
        expect(tucanes.medianMin).toBe(47);
        expect(tucanes.p90Min).toBe(128);
    });
});
