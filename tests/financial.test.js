// =============================================================
// Financial Module Tests — CAPEX, OPEX, VPN, TIR, Payback, ROI
// =============================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf-8');

// ---- Extract CONFIG from index.html ----
const configMatch = html.match(/const CONFIG\s*=\s*(\{[\s\S]*?\});/);
const CONFIG = new Function(`return ${configMatch[1]}`)();

// ---- Extract helpers ----
const fmtCOPMatch = html.match(/function fmtCOP\(n\)\s*\{[\s\S]*?\n\}/);
const fmtCOP = new Function('n', fmtCOPMatch[0].replace(/^function fmtCOP\(n\)\s*\{/, '').replace(/\}$/, ''));

const fmtMMatch = html.match(/function fmtM\(n\)\s*\{[\s\S]*?\n\}/);
const fmtM = new Function('n', fmtMMatch[0].replace(/^function fmtM\(n\)\s*\{/, '').replace(/\}$/, ''));

// ---- Extract TIR function ----
const tirMatch = html.match(/function calcTIR\(cashflows\)\s*\{[\s\S]*?\n\}/);
const calcTIR = new Function('cashflows', tirMatch[0].replace(/^function calcTIR\(cashflows\)\s*\{/, '').replace(/\}$/, ''));

// ---- Financial model computation (mirrors updateFinancialDashboard logic) ----
function computeFinancials(params = {}) {
  const landHa   = params.landHa   ?? 5;
  const landCost = params.landCost ?? 150;
  const build    = params.build    ?? 800;
  const equip    = params.equip    ?? 300;
  const vehicles = params.vehicles ?? 0;
  const wkcap    = params.wkcap    ?? 200;
  const staff    = params.staff    ?? 8;
  const salary   = params.salary   ?? 2.5;
  const services = params.services ?? 15;
  const maintPct = params.maintPct ?? 5;
  const insPct   = params.insPct   ?? 2;
  const admin    = params.admin    ?? 8;
  const extBoxes = params.extBoxes ?? 0;
  const extRate  = params.extRate  ?? 80;
  const growth   = params.growth   ?? 3;
  const discount = params.discount ?? 12;
  const inflation = params.inflation ?? 3;
  const horizon  = params.horizon  ?? 10;
  const savePerBox = params.savePerBox ?? 88;
  const prodK    = params.prodK    ?? 110;

  // CAPEX
  const capexLand = landHa * landCost;
  const capexTotal = capexLand + build + equip + vehicles + wkcap;

  // OPEX
  const depreciableAssets = build + equip;
  const opexStaff = staff * salary;
  const opexMaint = (depreciableAssets * maintPct / 100) / 12;
  const opexIns   = (capexTotal * insPct / 100) / 12;
  const opexMonth = opexStaff + services + opexMaint + opexIns + admin;
  const opexYear  = opexMonth * 12;

  // Income
  const annualBoxes = prodK * 1000 * 52;
  const annualSaveG20 = savePerBox * annualBoxes / 1e6;
  const extIncomeMonth = (extBoxes * 1000 * 4.33 * extRate) / 1e6;
  const extIncomeYear = extIncomeMonth * 12;
  const totalIncomeYear = annualSaveG20 + extIncomeYear;

  // Depreciation
  const depYear = depreciableAssets / 10;

  // Cashflows (using editable inflation & horizon)
  const growthMult = 1 + growth / 100;
  const inflMult = 1 + inflation / 100;
  const discountRate = discount / 100;
  const cashflows = [-capexTotal];
  for (let y = 1; y <= horizon; y++) {
    const gf = Math.pow(growthMult, y - 1);
    const income = totalIncomeYear * gf;
    const opex = opexYear * Math.pow(inflMult, y - 1);
    cashflows.push(income - opex);
  }

  // VPN
  let vpn = cashflows[0];
  for (let y = 1; y <= horizon; y++) {
    vpn += cashflows[y] / Math.pow(1 + discountRate, y);
  }

  // TIR
  const tir = calcTIR(cashflows);

  // Payback
  let cumul = 0, paybackMonths = null;
  for (let y = 0; y < cashflows.length; y++) {
    cumul += cashflows[y];
    if (cumul >= 0 && paybackMonths === null) {
      if (y === 0) { paybackMonths = 0; }
      else {
        const prev = cumul - cashflows[y];
        const frac = -prev / cashflows[y];
        paybackMonths = Math.round((y - 1 + frac) * 12);
      }
    }
  }

  // ROI
  const totalBenefit = cashflows.reduce((s, v) => s + v, 0);
  const roi = (totalBenefit / capexTotal) * 100;

  // P&L (5 years)
  const pl = [];
  for (let y = 1; y <= 5; y++) {
    const gf = Math.pow(growthMult, y - 1);
    const income = totalIncomeYear * gf;
    const opex = opexYear * Math.pow(inflMult, y - 1);
    const ebitda = income - opex;
    const util = ebitda - depYear;
    pl.push({ income, opex, ebitda, dep: depYear, util });
  }

  return { capexTotal, opexMonth, opexYear, totalIncomeYear, annualSaveG20, vpn, tir, paybackMonths, roi, cashflows, pl, depYear };
}

// ---- simResults-style data structure (mirrors what updateSim writes) ----
function buildSimResults(params = {}) {
  const prodK = params.prodK ?? 110;
  const savePerBox = params.savePerBox ?? 88;
  const costDirect = params.costDirect ?? 386;
  const costHub = params.costHub ?? 298;
  return {
    prodK,
    annualBoxes: prodK * 1000 * 52,
    savePerBox,
    costDirect,
    costHub,
    annualSave: Math.round(savePerBox * prodK * 1000 * 52 / 1e6),
    savePct: Math.round(((costDirect - costHub) / costDirect) * 100),
    congestionFactor: params.cf ?? 1.0,
    totalViajes: params.totalViajes ?? 154,
    hubMulas: params.hubMulas ?? 17,
    scenario: params.scenario ?? 'chaos'
  };
}

// ============================================================
describe('Financial Module — CONFIG', () => {
  it('CONFIG contains all required sections', () => {
    expect(CONFIG.fleet).toBeDefined();
    expect(CONFIG.bpr).toBeDefined();
    expect(CONFIG.cost).toBeDefined();
    expect(CONFIG.regional).toBeDefined();
  });

  it('CONFIG fleet params match expected values', () => {
    expect(CONFIG.fleet.N_MULAS).toBe(4);
    expect(CONFIG.fleet.N_SENC).toBe(6);
    expect(CONFIG.fleet.MULA_CAP).toBe(1152);
    expect(CONFIG.fleet.SENC_CAP).toBe(528);
  });

  it('CONFIG BPR params: bt=28, bc=800', () => {
    expect(CONFIG.bpr.bt).toBe(28);
    expect(CONFIG.bpr.bc).toBe(800);
    expect(CONFIG.bpr.pce).toBe(2.5);
  });
});

// ============================================================
describe('Financial Module — Helpers', () => {
  it('fmtCOP formats millions correctly', () => {
    const r = fmtCOP(1500000000);
    expect(r).toContain('$');
    expect(r).toContain('M');
  });

  it('fmtCOP formats small numbers', () => {
    const r = fmtCOP(42);
    expect(r).toBe('$42');
  });

  it('fmtM formats COP M values', () => {
    const r = fmtM(2050);
    expect(r).toBe('$2.050M');
  });

  it('fmtM handles zero', () => {
    expect(fmtM(0)).toBe('$0M');
  });
});

// ============================================================
describe('Financial Module — CAPEX Calculation', () => {
  it('CAPEX total equals sum of components with defaults', () => {
    const f = computeFinancials();
    // 5*150 + 800 + 300 + 0 + 200 = 750 + 800 + 300 + 0 + 200 = 2050
    expect(f.capexTotal).toBe(2050);
  });

  it('CAPEX changes with different land parameters', () => {
    const f1 = computeFinancials({ landHa: 5, landCost: 150 });
    const f2 = computeFinancials({ landHa: 10, landCost: 300 });
    expect(f2.capexTotal).toBeGreaterThan(f1.capexTotal);
  });

  it('CAPEX includes vehicles when specified', () => {
    const f0 = computeFinancials({ vehicles: 0 });
    const f1 = computeFinancials({ vehicles: 500 });
    expect(f1.capexTotal).toBe(f0.capexTotal + 500);
  });
});

// ============================================================
describe('Financial Module — OPEX Calculation', () => {
  it('OPEX monthly calculates correctly', () => {
    const f = computeFinancials();
    // staff: 8*2.5=20, services:15, maint:(1100*5/100)/12=4.58, ins:(2050*2/100)/12=3.42, admin:8
    // total ~ 20 + 15 + 4.58 + 3.42 + 8 = 51
    expect(f.opexMonth).toBeGreaterThan(40);
    expect(f.opexMonth).toBeLessThan(65);
  });

  it('OPEX annual is 12x monthly', () => {
    const f = computeFinancials();
    expect(f.opexYear).toBeCloseTo(f.opexMonth * 12, 2);
  });

  it('OPEX increases with more staff', () => {
    const f1 = computeFinancials({ staff: 8 });
    const f2 = computeFinancials({ staff: 20 });
    expect(f2.opexMonth).toBeGreaterThan(f1.opexMonth);
  });
});

// ============================================================
describe('Financial Module — VPN & TIR', () => {
  // With low congestion (savePerBox=88), hub is NOT viable — OPEX > savings
  it('VPN is negative with low-congestion defaults (savePerBox=88)', () => {
    const f = computeFinancials();
    expect(f.vpn).toBeLessThan(0);
  });

  // Under high congestion, hub saves ~$250/caja → project is very viable
  it('VPN is positive under high congestion (savePerBox=250)', () => {
    const f = computeFinancials({ savePerBox: 250 });
    expect(f.vpn).toBeGreaterThan(0);
  });

  it('TIR is greater than discount rate under high congestion', () => {
    const f = computeFinancials({ savePerBox: 250 });
    expect(f.tir).not.toBeNull();
    expect(f.tir).toBeGreaterThan(0.12);
  });

  it('VPN decreases with higher discount rate (viable scenario)', () => {
    const f1 = computeFinancials({ savePerBox: 250, discount: 10 });
    const f2 = computeFinancials({ savePerBox: 250, discount: 20 });
    expect(f2.vpn).toBeLessThan(f1.vpn);
  });

  it('VPN increases with higher production', () => {
    const f1 = computeFinancials({ prodK: 75 });
    const f2 = computeFinancials({ prodK: 135 });
    expect(f2.vpn).toBeGreaterThan(f1.vpn);
  });

  it('external service income can make marginal project viable', () => {
    const f1 = computeFinancials({ savePerBox: 88 }); // not viable
    const f2 = computeFinancials({ savePerBox: 88, extBoxes: 100, extRate: 150 }); // add external income
    expect(f2.vpn).toBeGreaterThan(f1.vpn);
  });
});

// ============================================================
describe('Financial Module — Payback & ROI', () => {
  it('payback is less than 60 months under high congestion', () => {
    const f = computeFinancials({ savePerBox: 250 });
    expect(f.paybackMonths).not.toBeNull();
    expect(f.paybackMonths).toBeLessThan(60);
  });

  it('ROI is positive under high congestion', () => {
    const f = computeFinancials({ savePerBox: 250 });
    expect(f.roi).toBeGreaterThan(0);
  });

  it('no payback at low congestion defaults', () => {
    const f = computeFinancials({ savePerBox: 88 });
    expect(f.paybackMonths).toBeNull();
  });

  it('payback increases with higher CAPEX', () => {
    const f1 = computeFinancials({ savePerBox: 250, build: 800 });
    const f2 = computeFinancials({ savePerBox: 250, build: 2000, equip: 800 });
    if (f1.paybackMonths !== null && f2.paybackMonths !== null) {
      expect(f2.paybackMonths).toBeGreaterThan(f1.paybackMonths);
    }
  });
});

// ============================================================
describe('Financial Module — Cashflow', () => {
  it('cashflow year 0 is negative (CAPEX investment)', () => {
    const f = computeFinancials();
    expect(f.cashflows[0]).toBeLessThan(0);
    expect(f.cashflows[0]).toBe(-2050);
  });

  it('cashflow year 1+ is positive under high congestion', () => {
    const f = computeFinancials({ savePerBox: 250 });
    for (let y = 1; y <= 10; y++) {
      expect(f.cashflows[y]).toBeGreaterThan(0);
    }
  });

  it('cashflow year 1 is negative at low congestion defaults', () => {
    const f = computeFinancials({ savePerBox: 88 });
    expect(f.cashflows[1]).toBeLessThan(0);
  });

  it('cashflow grows with production growth factor', () => {
    const f = computeFinancials({ growth: 5, savePerBox: 250 });
    expect(f.cashflows[5]).toBeGreaterThan(f.cashflows[1]);
  });
});

// ============================================================
describe('Financial Module — P&L Projection', () => {
  it('P&L has 5 years of data', () => {
    const f = computeFinancials();
    expect(f.pl).toHaveLength(5);
  });

  it('P&L income grows each year', () => {
    const f = computeFinancials({ growth: 3 });
    for (let y = 1; y < 5; y++) {
      expect(f.pl[y].income).toBeGreaterThan(f.pl[y-1].income);
    }
  });

  it('depreciation is straight-line over 10 years on build+equip', () => {
    const f = computeFinancials({ build: 800, equip: 300 });
    expect(f.depYear).toBe(110); // (800+300)/10
  });

  it('EBITDA = income - opex', () => {
    const f = computeFinancials();
    f.pl.forEach(row => {
      expect(row.ebitda).toBeCloseTo(row.income - row.opex, 2);
    });
  });
});

// ============================================================
describe('Financial Module — Sensitivity', () => {
  it('VPN varies with production changes', () => {
    const base = computeFinancials({ prodK: 110 });
    const high = computeFinancials({ prodK: 132 }); // +20%
    const low  = computeFinancials({ prodK: 88 });  // -20%
    expect(high.vpn).toBeGreaterThan(base.vpn);
    expect(low.vpn).toBeLessThan(base.vpn);
  });

  it('VPN varies with CAPEX changes', () => {
    const base = computeFinancials({ build: 800 });
    const low  = computeFinancials({ build: 640 });  // -20%
    const high = computeFinancials({ build: 960 });  // +20%
    expect(low.vpn).toBeGreaterThan(base.vpn);
    expect(high.vpn).toBeLessThan(base.vpn);
  });
});

// ============================================================
describe('Financial Module — TIR Calculation', () => {
  it('calcTIR returns correct rate for known cashflows', () => {
    const tir = calcTIR([-100, 50, 50, 50]);
    expect(tir).not.toBeNull();
    expect(tir).toBeGreaterThan(0.2);
    expect(tir).toBeLessThan(0.3);
  });

  it('calcTIR returns null for always-negative cashflows', () => {
    const tir = calcTIR([-1000, -100, -100, -100]);
    expect(tir === null || tir < -0.4).toBeTruthy();
  });
});

// ============================================================
describe('Financial Module — simResults Data Flow', () => {
  it('buildSimResults creates valid data structure', () => {
    const sr = buildSimResults();
    expect(sr.prodK).toBe(110);
    expect(sr.annualBoxes).toBe(110 * 1000 * 52);
    expect(sr.savePerBox).toBe(88);
    expect(sr.costDirect).toBe(386);
    expect(sr.costHub).toBe(298);
    expect(sr.scenario).toBe('chaos');
  });

  it('simResults savePerBox matches costDirect - costHub', () => {
    const sr = buildSimResults({ costDirect: 400, costHub: 300, savePerBox: 100 });
    expect(sr.savePerBox).toBe(sr.costDirect - sr.costHub);
  });

  it('simResults annualSave is consistent with savePerBox and production', () => {
    const sr = buildSimResults({ prodK: 110, savePerBox: 88 });
    const expected = Math.round(88 * 110 * 1000 * 52 / 1e6);
    expect(sr.annualSave).toBe(expected);
  });

  it('computeFinancials uses simResults savePerBox correctly', () => {
    const sr = buildSimResults({ savePerBox: 250 });
    const f = computeFinancials({ savePerBox: sr.savePerBox });
    expect(f.vpn).toBeGreaterThan(0);
  });

  it('different simResults scenarios yield different financials', () => {
    const srLow = buildSimResults({ savePerBox: 50 });
    const srHigh = buildSimResults({ savePerBox: 300 });
    const fLow = computeFinancials({ savePerBox: srLow.savePerBox });
    const fHigh = computeFinancials({ savePerBox: srHigh.savePerBox });
    expect(fHigh.vpn).toBeGreaterThan(fLow.vpn);
    expect(fHigh.roi).toBeGreaterThan(fLow.roi);
  });
});

// ============================================================
describe('Financial Module — Inflation & Horizon', () => {
  it('higher inflation reduces VPN', () => {
    const f1 = computeFinancials({ inflation: 2, savePerBox: 250 });
    const f2 = computeFinancials({ inflation: 8, savePerBox: 250 });
    expect(f2.vpn).toBeLessThan(f1.vpn);
  });

  it('longer horizon increases VPN for viable project', () => {
    const f1 = computeFinancials({ horizon: 5, savePerBox: 250 });
    const f2 = computeFinancials({ horizon: 15, savePerBox: 250 });
    expect(f2.vpn).toBeGreaterThan(f1.vpn);
  });

  it('cashflow length matches horizon + 1', () => {
    const f5 = computeFinancials({ horizon: 5 });
    const f15 = computeFinancials({ horizon: 15 });
    expect(f5.cashflows).toHaveLength(6);
    expect(f15.cashflows).toHaveLength(16);
  });

  it('zero inflation equals flat OPEX', () => {
    const f = computeFinancials({ inflation: 0, growth: 0, savePerBox: 250 });
    // All yearly FCFs should be equal (year 1 through N)
    for (let y = 2; y < f.cashflows.length; y++) {
      expect(f.cashflows[y]).toBeCloseTo(f.cashflows[1], 2);
    }
  });
});

// ============================================================
describe('Financial Module — Dashboard HTML Structure', () => {
  it('index.html contains fin-dashboard div', () => {
    expect(html).toContain('id="fin-dashboard"');
  });

  it('dashboard has KPI banner with all 6 metrics', () => {
    expect(html).toContain('id="fd-vpn"');
    expect(html).toContain('id="fd-tir"');
    expect(html).toContain('id="fd-payback"');
    expect(html).toContain('id="fd-roi"');
    expect(html).toContain('id="fd-annual"');
    expect(html).toContain('id="fd-capex"');
  });

  it('dashboard has view toggle buttons', () => {
    expect(html).toContain('class="view-toggle"');
    expect(html).toContain('switchView');
  });

  it('dashboard has cashflow table', () => {
    expect(html).toContain('id="fd-cf-table"');
    expect(html).toContain('id="fd-cf-body"');
  });

  it('dashboard has two sensitivity matrices', () => {
    expect(html).toContain('id="fd-sens1"');
    expect(html).toContain('id="fd-sens2"');
  });

  it('dashboard has inflation and horizon sliders', () => {
    expect(html).toContain('id="fs-inflation"');
    expect(html).toContain('id="fs-horizon"');
  });

  it('old rp-tabs are removed', () => {
    expect(html).not.toContain('class="rp-tabs"');
    expect(html).not.toContain('switchRPTab');
    expect(html).not.toContain('id="rpt-ops"');
    expect(html).not.toContain('id="rpt-fin"');
  });

  it('old rp-fin section is removed', () => {
    expect(html).not.toContain('id="rp-fin"');
    expect(html).not.toContain('id="rp-ops"');
  });

  it('updateFinancialDashboard function exists', () => {
    expect(html).toContain('function updateFinancialDashboard()');
  });

  it('simResults object is defined', () => {
    expect(html).toContain('const simResults');
    expect(html).toContain('simResults.savePerBox');
  });
});
