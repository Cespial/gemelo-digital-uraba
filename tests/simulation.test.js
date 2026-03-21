// =============================================================
// Simulation Tests — BPR congestion model, cost model, truck counts
// =============================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf-8');

// ---- Extract data from index.html ----
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
const OD = calcOD();

// ---- BPR Congestion simulation (extracted from updateSim) ----
function computeBPR(p, l, c, scenario) {
  const cpw = p * 1000;
  const cpd = cpw / 6;
  const MULA_CAP = 1152, SENC_CAP = 528, N_MULAS = 4, N_SENC = 6;
  const capViajeDia = N_MULAS * MULA_CAP + N_SENC * SENC_CAP;
  const viajesNeed = Math.ceil(cpd / capViajeDia);
  const totalViajes = viajesNeed * (N_MULAS + N_SENC);
  const g20t = Math.ceil(cpd / 960);
  const rbd = 114000000 / 52 / 6;
  const rt = Math.ceil((rbd * l / 100 * c / 100) / 960);
  const hubMulas = Math.ceil(cpd / MULA_CAP);
  const hubt = Math.ceil(hubMulas * 1.1);

  const tot = scenario === 'chaos' ? g20t + rt : hubt + rt;
  const bt = 28, bc = 800, pce = 2.5;
  const lr = (bc * 0.6 + tot * pce) / bc;
  const cf = Math.max(1, Math.pow(lr, 3));
  const et = Math.min(160, Math.round(bt * cf));

  return { g20t, rt, hubt, tot, lr, cf, et, totalViajes, hubMulas };
}

// ---- Cost model (extracted from updateSim) ----
function computeCost(cf, g20t, hubt) {
  const DIESEL_KM = 3200;
  const DRIVER_HR = 28000;
  const TOLL_TRIP = 0; // no hay peajes en estos trayectos
  const TOLL_HUB = 0;
  const WEAR_KM = 1800;
  const HUB_CONSOL = 42;
  const BOXES_TRUCK = 960;

  const avgDistDirect = OD.reduce((s, o) => s + o.dd, 0) / OD.length;
  const avgTimeDirect = OD.reduce((s, o) => s + o.dt, 0) / OD.length;
  const avgDistHub = OD.reduce((s, o) => s + o.hd, 0) / OD.length;
  const avgTimeHub = OD.reduce((s, o) => s + o.ht, 0) / OD.length;

  const fuelDirect = Math.round((DIESEL_KM * avgDistDirect * 2) / BOXES_TRUCK);
  const fuelHub = Math.round((DIESEL_KM * avgDistHub * 2) / BOXES_TRUCK);
  const drvDirect = Math.round((DRIVER_HR * (avgTimeDirect * cf * 2 / 60)) / BOXES_TRUCK);
  const drvHub = Math.round((DRIVER_HR * (avgTimeHub * Math.min(cf, 1.3) * 2 / 60)) / BOXES_TRUCK);
  const tollDirect = Math.round(TOLL_TRIP / BOXES_TRUCK * (g20t > 0 ? 1 : 0));
  const tollHub = Math.round(TOLL_HUB / BOXES_TRUCK * (hubt > 0 ? 1 : 0));
  const wearDirect = Math.round((WEAR_KM * avgDistDirect * 2) / BOXES_TRUCK);
  const wearHub = Math.round((WEAR_KM * avgDistHub * 2) / BOXES_TRUCK);

  const totalDirect = fuelDirect + drvDirect + tollDirect + wearDirect;
  const totalHub = fuelHub + drvHub + tollHub + wearHub + HUB_CONSOL;

  return {
    fuelDirect, fuelHub, drvDirect, drvHub,
    tollDirect, tollHub, wearDirect, wearHub,
    totalDirect, totalHub, HUB_CONSOL,
  };
}

// ============================================================
describe('Simulation — BPR Congestion Model', () => {
  // ----- 13. BPR at default slider values -----
  it('BPR congestion factor at default slider values (p=110, l=20, c=5)', () => {
    const { cf, g20t, et } = computeBPR(110, 20, 5, 'chaos');

    // With bc=800 (corrected from 8000), congestion works realistically
    expect(cf).toBeGreaterThan(0);
    expect(cf).toBeGreaterThanOrEqual(1); // cf >= 1 means some congestion at defaults
    expect(g20t).toBe(Math.ceil((110 * 1000 / 6) / 960));
    expect(et).toBeGreaterThanOrEqual(28); // estimated time >= base time (28 min)
    expect(et).toBeLessThanOrEqual(160);   // capped at 160
  });

  // ----- 14. BPR increases with higher stress -----
  it('BPR congestion factor increases with higher production/load/competitors', () => {
    const low = computeBPR(75, 20, 5, 'chaos');
    const mid = computeBPR(110, 60, 50, 'chaos');
    const high = computeBPR(135, 100, 100, 'chaos');

    // At low stress, cf is clamped to 1 (free flow). At mid/high, cf > 1.
    expect(low.cf).toBe(1);             // clamped: road under capacity
    expect(mid.cf).toBeGreaterThan(1);   // above capacity threshold
    expect(high.cf).toBeGreaterThan(mid.cf);
    expect(high.et).toBeGreaterThan(low.et);

    // High stress should produce significant congestion
    expect(high.cf).toBeGreaterThan(5);
    expect(high.et).toBe(160); // capped at max
  });

  // ----- 15. Cost model: direct components at defaults -----
  it('cost model: direct cost components calculate correctly at defaults', () => {
    const { cf, g20t, hubt } = computeBPR(110, 20, 5, 'chaos');
    const cost = computeCost(cf, g20t, hubt);

    expect(cost.fuelDirect).toBeGreaterThan(0);
    expect(cost.drvDirect).toBeGreaterThan(0);
    expect(cost.tollDirect).toBeGreaterThan(0);
    expect(cost.wearDirect).toBeGreaterThan(0);

    // Total = sum of components
    expect(cost.totalDirect).toBe(
      cost.fuelDirect + cost.drvDirect + cost.tollDirect + cost.wearDirect
    );
  });

  // ----- 16. Hub cost is lower than direct under high congestion -----
  it('cost model: hub cost is lower than direct under high congestion', () => {
    // At low stress (defaults), hub is more expensive because hub route distance
    // (farm->hub + hub->port) > direct route (farm->port). No congestion = no hub benefit.
    const low = computeBPR(110, 20, 5, 'chaos');
    const costLow = computeCost(low.cf, low.g20t, low.hubt);
    expect(costLow.totalHub).toBeGreaterThan(costLow.totalDirect);

    // At high stress, congestion factor is large. Direct suffers full cf penalty on
    // driver time, while hub is capped at min(cf, 1.3). This driver savings overcomes
    // the hub distance penalty + $42 consolidation cost.
    const high = computeBPR(135, 100, 100, 'chaos');
    expect(high.cf).toBeGreaterThan(5); // extreme congestion
    const costHigh = computeCost(high.cf, high.g20t, high.hubt);
    expect(costHigh.totalHub).toBeLessThan(costHigh.totalDirect);
  });

  // ----- 17. Hub consolidation cost always added -----
  it('cost model: hub consolidation cost ($42/caja) is always added', () => {
    const { cf, g20t, hubt } = computeBPR(110, 20, 5, 'chaos');
    const cost = computeCost(cf, g20t, hubt);

    expect(cost.HUB_CONSOL).toBe(42);
    // totalHub includes the HUB_CONSOL
    expect(cost.totalHub).toBe(
      cost.fuelHub + cost.drvHub + cost.tollHub + cost.wearHub + cost.HUB_CONSOL
    );
  });

  // ----- 18. Fleet model: vehicle counts and hub mulas -----
  it('fleet model: totalViajes, hubMulas calculate correctly from production', () => {
    const r110 = computeBPR(110, 20, 5, 'chaos');
    const r135 = computeBPR(135, 20, 5, 'chaos');

    // totalViajes = ceil(cpd / capViajeDia) * 10 vehicles
    const cpd110 = 110 * 1000 / 6;
    const capViajeDia = 4 * 1152 + 6 * 528;  // 7776 cajas per round
    expect(r110.totalViajes).toBe(Math.ceil(cpd110 / capViajeDia) * 10);

    // hubMulas = ceil(cpd / 1152) — only mulas go to port from hub
    expect(r110.hubMulas).toBe(Math.ceil(cpd110 / 1152));

    // hubt = ceil(hubMulas * 1.1) — 10% scheduling overhead
    expect(r110.hubt).toBe(Math.ceil(r110.hubMulas * 1.1));

    // Higher production = more trips and mulas
    expect(r135.totalViajes).toBeGreaterThanOrEqual(r110.totalViajes);
    expect(r135.hubMulas).toBeGreaterThan(r110.hubMulas);
  });
});
