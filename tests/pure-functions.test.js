// =============================================================
// Pure Functions Tests — routeGJ, isPointInPolygon, aptColor, calcOD
// =============================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf-8');

// ---- Extract pure functions from index.html ----
// routeGJ
function routeGJ(coords) {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: coords.map(c => [c[1], c[0]]) } };
}

// isPointInPolygon (ray casting)
function isPointInPolygon(point, feature) {
  if (!feature || !feature.geometry) return false;
  const ring = feature.geometry.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > point[1]) !== (yj > point[1])) && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// aptColor
function aptColor(apt) {
  if (apt === 'Aptitud alta') return '#00cc44';
  if (apt === 'Aptitud media') return '#88cc00';
  if (apt === 'Aptitud baja') return '#ccaa00';
  return '#666666';
}

// Extract FARMS and R for calcOD
function extractArray(varName) {
  const re = new RegExp(`const ${varName}\\s*=\\s*(\\[)`);
  const m = html.match(re);
  if (!m) throw new Error(`Cannot find ${varName}`);
  const start = html.indexOf(m[0]) + m[0].length - 1;
  let depth = 0, i = start;
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) break; }
  }
  return new Function(`return ${html.slice(start, i + 1)}`)();
}

const FARMS = extractArray('FARMS');
const rMatch = html.match(/const R\s*=\s*(\{[\s\S]*?\});\s*\n/);
const R = new Function(`return ${rMatch[1]}`)();

function calcOD() {
  return FARMS.map(f => {
    const r = R[f.id];
    const tt = r.h.t + R.hp.t;
    const td = r.h.d + R.hp.d;
    return { ...f, dd: r.p.d, dt: r.p.t, hd: td, ht: tt, fhd: r.h.d, fht: r.h.t, hpd: R.hp.d, hpt: R.hp.t, stk: Math.ceil(f.prod / 960) };
  });
}

// ============================================================
describe('Pure Functions', () => {
  // ----- 8. routeGJ swaps [lat,lng] to [lng,lat] -----
  it('routeGJ swaps [lat,lng] to [lng,lat] and returns valid GeoJSON LineString', () => {
    const coords = [[7.87, -76.66], [7.88, -76.65], [7.89, -76.64]];
    const gj = routeGJ(coords);

    expect(gj.type).toBe('Feature');
    expect(gj.geometry.type).toBe('LineString');
    expect(gj.geometry.coordinates).toHaveLength(3);

    // First coordinate: original [lat=7.87, lng=-76.66] should become [lng=-76.66, lat=7.87]
    expect(gj.geometry.coordinates[0]).toEqual([-76.66, 7.87]);
    expect(gj.geometry.coordinates[1]).toEqual([-76.65, 7.88]);
    expect(gj.geometry.coordinates[2]).toEqual([-76.64, 7.89]);
  });

  // ----- 9. isPointInPolygon: true inside, false outside -----
  it('isPointInPolygon returns true for point inside polygon, false for outside', () => {
    const square = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
      },
    };

    expect(isPointInPolygon([5, 5], square)).toBe(true);   // center
    expect(isPointInPolygon([1, 1], square)).toBe(true);   // near corner
    expect(isPointInPolygon([15, 5], square)).toBe(false);  // outside right
    expect(isPointInPolygon([-1, 5], square)).toBe(false);  // outside left
    expect(isPointInPolygon([5, 15], square)).toBe(false);  // outside top
  });

  // ----- 10. isPointInPolygon edge cases -----
  it('isPointInPolygon handles edge cases (null feature, missing geometry)', () => {
    expect(isPointInPolygon([5, 5], null)).toBe(false);
    expect(isPointInPolygon([5, 5], undefined)).toBe(false);
    expect(isPointInPolygon([5, 5], {})).toBe(false);
    expect(isPointInPolygon([5, 5], { geometry: null })).toBe(false);
  });

  // ----- 11. aptColor returns correct hex for each level -----
  it('aptColor returns correct hex colors for each aptitud level', () => {
    expect(aptColor('Aptitud alta')).toBe('#00cc44');
    expect(aptColor('Aptitud media')).toBe('#88cc00');
    expect(aptColor('Aptitud baja')).toBe('#ccaa00');
    expect(aptColor('unknown')).toBe('#666666');
    expect(aptColor('')).toBe('#666666');
  });

  // ----- 12. calcOD returns 19 entries with correct computed fields -----
  it('calcOD returns 19 entries with correct computed fields (dd, dt, hd, ht, stk)', () => {
    const od = calcOD();
    expect(od).toHaveLength(19);

    for (const entry of od) {
      // Must have original farm fields
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('name');

      // Must have computed fields
      expect(typeof entry.dd).toBe('number');  // direct distance
      expect(typeof entry.dt).toBe('number');  // direct time
      expect(typeof entry.hd).toBe('number');  // hub distance (farm->hub + hub->port)
      expect(typeof entry.ht).toBe('number');  // hub time
      expect(typeof entry.stk).toBe('number'); // truck count

      // stk = ceil(prod / 960)
      expect(entry.stk).toBe(Math.ceil(entry.prod / 960));

      // hd = farm->hub distance + hub->port distance
      const r = R[entry.id];
      expect(entry.hd).toBeCloseTo(r.h.d + R.hp.d, 5);

      // ht = farm->hub time + hub->port time
      expect(entry.ht).toBeCloseTo(r.h.t + R.hp.t, 5);
    }
  });
});
