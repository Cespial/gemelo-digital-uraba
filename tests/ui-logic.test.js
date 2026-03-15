// =============================================================
// UI Logic Tests — mobTab, toggleLy, setScenario, switchView
// Uses jsdom environment from vitest config
// =============================================================
import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================
// Minimal DOM setup for UI functions
// ============================================================
function setupDOM() {
  document.body.innerHTML = `
    <div class="main" id="main-view" style="display:flex;">
      <div id="panel-lp" class="panel lp" style="display:flex;"></div>
      <div id="panel-map" class="map-wrap" style="display:block;"></div>
      <div id="panel-rp" class="panel rp" style="display:flex;"></div>
    </div>
    <div id="fin-dashboard" style="display:none;"></div>
    <div id="mob-tabs">
      <button class="mob-tab active" data-panel="map">Mapa</button>
      <button class="mob-tab" data-panel="controls">Controles</button>
      <button class="mob-tab" data-panel="data">Datos</button>
      <button class="mob-tab" data-panel="finance">Financiero</button>
    </div>
    <div class="view-toggle">
      <button class="view-btn active" data-view="map">MAPA</button>
      <button class="view-btn" data-view="finance">FINANCIERO</button>
    </div>
    <button id="btn-chaos" class="sc-btn a-chaos"></button>
    <button id="btn-hub" class="sc-btn"></button>
    <span id="sc-icon"></span>
    <input type="range" id="sl-p" value="110">
    <input type="range" id="sl-l" value="20">
    <input type="range" id="sl-c" value="5">
    <span id="pv"></span><span id="lv"></span><span id="cv"></span><span id="cl"></span>
    <div id="cb"></div>
    <div id="sg" class="sem-l"></div><div id="sy" class="sem-l"></div><div id="sr" class="sem-l"></div>
    <div id="st"></div><div id="stime"></div>
    <div id="kpi-trucks"></div><div id="kpi-time"></div><div id="kpi-dist"></div><div id="kpi-save"></div>
    <div id="cp-p"></div><div id="cp-b"></div><div id="cp-t"></div><div id="cp-tr"></div>
    <div id="bar-c"></div><div id="bar-h"></div>
    <span id="bl-c"></span><span id="bl-h"></span><span id="red-pct"></span>
    <div id="cost-direct"></div><div id="cost-hub"></div><div id="cost-save"></div><div id="cost-annual"></div>
    <div id="cd-fuel-d"></div><div id="cd-fuel-h"></div><div id="cd-fuel-s"></div>
    <div id="cd-drv-d"></div><div id="cd-drv-h"></div><div id="cd-drv-s"></div>
    <div id="cd-toll-d"></div><div id="cd-toll-h"></div><div id="cd-toll-s"></div>
    <div id="cd-wear-d"></div><div id="cd-wear-h"></div><div id="cd-wear-s"></div>
    <div id="cd-cons-d"></div><div id="cd-cons-h"></div><div id="cd-cons-s"></div>
    <div id="cd-tot-d"></div><div id="cd-tot-h"></div><div id="cd-tot-s"></div>
    <div id="exec-cost-save"></div>
    <div id="gm-hub-time"></div><div id="gm-hub-base"></div><div id="gm-avg-farm"></div><div id="gm-ratio"></div>
    <div id="gm-detail"></div>
    <input type="checkbox" id="ly-municipios" checked>
    <input type="checkbox" id="ly-veredas">
    <input type="checkbox" id="ly-sipra" checked>
    <input type="checkbox" id="ly-roads" checked>
    <input type="checkbox" id="ly-farm-poly" checked>
    <input type="checkbox" id="ly-farms" checked>
    <input type="checkbox" id="ly-routes" checked>
    <input type="checkbox" id="ly-isochrone" checked>
    <input type="checkbox" id="ly-flood">
    <input type="checkbox" id="ly-rivers" checked>
    <input type="checkbox" id="ly-wms-upra">
    <input type="checkbox" id="ly-wms-ideam">
    <table><tbody id="od-body"></tbody></table>
    <span id="od-badge"></span>
    <div id="traffic-badge"></div>
    <div id="traffic-status"></div>
    <div id="gm-badge"></div>
    <div id="osm-roads-congestion"></div>
    <div id="hub-flood"></div>
    <div id="iso-stats"></div>
  `;
}

// Mock map for setScenario and toggleLy
const mockMap = {
  _layerVisibility: {},
  isStyleLoaded() { return true; },
  setLayoutProperty(layerId, prop, value) {
    if (prop === 'visibility') this._layerVisibility[layerId] = value;
  },
  getLayer(id) { return true; },
  setPaintProperty() {},
  getCanvas() { return { style: {} }; },
  resize() {},
};

let curSc = 'chaos';
let _dashboardUpdated = false;

// Stub for updateFinancialDashboard
function updateFinancialDashboard() { _dashboardUpdated = true; }

function switchView(view) {
  const main = document.querySelector('.main');
  const dash = document.getElementById('fin-dashboard');
  document.querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  if (view === 'finance') {
    main.style.display = 'none';
    dash.style.display = 'block';
    updateFinancialDashboard();
  } else {
    main.style.display = 'flex';
    dash.style.display = 'none';
  }
}

function mobTab(panel) {
  const lp = document.getElementById('panel-lp');
  const rp = document.getElementById('panel-rp');
  const mp = document.getElementById('panel-map');
  const dash = document.getElementById('fin-dashboard');
  const main = document.querySelector('.main');
  const isMobile = true;

  lp.style.display = 'none';
  rp.style.display = 'none';
  mp.style.display = 'none';
  dash.style.display = 'none';
  main.style.display = 'flex';

  if (panel === 'map') {
    mp.style.display = 'block';
  } else if (panel === 'controls') {
    lp.style.display = 'flex';
  } else if (panel === 'data') {
    rp.style.display = 'flex';
  } else if (panel === 'finance') {
    main.style.display = 'none';
    dash.style.display = 'block';
    updateFinancialDashboard();
  }

  document.querySelectorAll('.mob-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === panel);
  });
}

function setScenario(sc) {
  curSc = sc;
  document.getElementById('btn-chaos').className = sc === 'chaos' ? 'sc-btn a-chaos' : 'sc-btn';
  document.getElementById('btn-hub').className = sc === 'hub' ? 'sc-btn a-hub' : 'sc-btn';
  document.getElementById('sc-icon').innerHTML = sc === 'chaos' ? '&#x26A0;' : '&#x2714;';

  mockMap.setLayoutProperty('chaos-routes', 'visibility', sc === 'chaos' ? 'visible' : 'none');
  mockMap.setLayoutProperty('chaos-routes-glow', 'visibility', sc === 'chaos' ? 'visible' : 'none');
  mockMap.setLayoutProperty('hub-routes', 'visibility', sc === 'hub' ? 'visible' : 'none');
  mockMap.setLayoutProperty('hub-port', 'visibility', sc === 'hub' ? 'visible' : 'none');
  mockMap.setLayoutProperty('hub-port-glow', 'visibility', sc === 'hub' ? 'visible' : 'none');
  mockMap.setLayoutProperty('hub-port-flow', 'visibility', sc === 'hub' ? 'visible' : 'none');
}

function toggleLy(name) {
  const on = document.getElementById('ly-' + name).checked;
  const vis = on ? 'visible' : 'none';
  const layers = {
    'municipios': ['municipios-fill', 'municipios-line', 'municipios-label'],
    'veredas': ['veredas-fill', 'veredas-line'],
    'sipra': ['sipra-fill', 'sipra-line'],
    'roads': ['osm-roads'],
    'farm-poly': ['farm-poly-fill', 'farm-poly-line', 'farm-poly-label', 'farm-poly-all-fill', 'farm-poly-all-line'],
    'farms': ['farms', 'farms-glow'],
    'routes': curSc === 'chaos' ? ['chaos-routes', 'chaos-routes-glow'] : ['hub-routes', 'hub-port', 'hub-port-glow', 'hub-port-flow'],
    'isochrone': ['iso-45-fill', 'iso-45-line', 'iso-30-fill', 'iso-30-line', 'iso-15-fill', 'iso-15-line', 'iso-labels'],
    'flood': ['flood-fill', 'flood-line'],
    'rivers': ['rivers', 'rivers-glow', 'rivers-label'],
    'wms-upra': ['wms-upra'],
    'wms-ideam': ['wms-ideam'],
  };
  (layers[name] || []).forEach(l => {
    mockMap.setLayoutProperty(l, 'visibility', vis);
  });
}

// ============================================================
describe('UI Logic — View Switching', () => {
  beforeEach(() => {
    setupDOM();
    _dashboardUpdated = false;
  });

  it('switchView to finance hides main, shows dashboard', () => {
    switchView('finance');
    expect(document.querySelector('.main').style.display).toBe('none');
    expect(document.getElementById('fin-dashboard').style.display).toBe('block');
  });

  it('switchView to finance triggers updateFinancialDashboard', () => {
    switchView('finance');
    expect(_dashboardUpdated).toBe(true);
  });

  it('switchView to map shows main, hides dashboard', () => {
    switchView('finance');
    switchView('map');
    expect(document.querySelector('.main').style.display).toBe('flex');
    expect(document.getElementById('fin-dashboard').style.display).toBe('none');
  });

  it('switchView updates toggle button active state', () => {
    switchView('finance');
    const btns = document.querySelectorAll('.view-btn');
    const finBtn = [...btns].find(b => b.dataset.view === 'finance');
    const mapBtn = [...btns].find(b => b.dataset.view === 'map');
    expect(finBtn.classList.contains('active')).toBe(true);
    expect(mapBtn.classList.contains('active')).toBe(false);
  });
});

// ============================================================
describe('UI Logic — Mobile Tabs', () => {
  beforeEach(() => {
    setupDOM();
    mockMap._layerVisibility = {};
    curSc = 'chaos';
    _dashboardUpdated = false;
  });

  it('mobTab hides/shows correct panels', () => {
    mobTab('controls');
    expect(document.getElementById('panel-lp').style.display).toBe('flex');
    expect(document.getElementById('panel-rp').style.display).toBe('none');
    expect(document.getElementById('panel-map').style.display).toBe('none');

    mobTab('data');
    expect(document.getElementById('panel-lp').style.display).toBe('none');
    expect(document.getElementById('panel-rp').style.display).toBe('flex');
    expect(document.getElementById('panel-map').style.display).toBe('none');

    mobTab('map');
    expect(document.getElementById('panel-lp').style.display).toBe('none');
    expect(document.getElementById('panel-rp').style.display).toBe('none');
    expect(document.getElementById('panel-map').style.display).toBe('block');

    const tabs = document.querySelectorAll('.mob-tab');
    const activeTab = [...tabs].find(t => t.classList.contains('active'));
    expect(activeTab.dataset.panel).toBe('map');
  });

  it('mobTab finance shows dashboard and hides main', () => {
    mobTab('finance');
    expect(document.querySelector('.main').style.display).toBe('none');
    expect(document.getElementById('fin-dashboard').style.display).toBe('block');
    expect(_dashboardUpdated).toBe(true);
  });

  it('mobTab finance sets correct active tab', () => {
    mobTab('finance');
    const tabs = document.querySelectorAll('.mob-tab');
    const activeTab = [...tabs].find(t => t.classList.contains('active'));
    expect(activeTab.dataset.panel).toBe('finance');
  });

  it('switching from finance to map restores main', () => {
    mobTab('finance');
    mobTab('map');
    expect(document.querySelector('.main').style.display).toBe('flex');
    expect(document.getElementById('fin-dashboard').style.display).toBe('none');
    expect(document.getElementById('panel-map').style.display).toBe('block');
  });
});

// ============================================================
describe('UI Logic — Layer Toggles', () => {
  beforeEach(() => {
    setupDOM();
    mockMap._layerVisibility = {};
    curSc = 'chaos';
  });

  it('toggleLy maps layer names to correct Mapbox layer IDs', () => {
    document.getElementById('ly-municipios').checked = false;
    toggleLy('municipios');
    expect(mockMap._layerVisibility['municipios-fill']).toBe('none');
    expect(mockMap._layerVisibility['municipios-line']).toBe('none');
    expect(mockMap._layerVisibility['municipios-label']).toBe('none');

    document.getElementById('ly-flood').checked = true;
    toggleLy('flood');
    expect(mockMap._layerVisibility['flood-fill']).toBe('visible');
    expect(mockMap._layerVisibility['flood-line']).toBe('visible');

    document.getElementById('ly-isochrone').checked = true;
    toggleLy('isochrone');
    expect(mockMap._layerVisibility['iso-45-fill']).toBe('visible');
    expect(mockMap._layerVisibility['iso-15-line']).toBe('visible');
    expect(mockMap._layerVisibility['iso-labels']).toBe('visible');

    curSc = 'chaos';
    document.getElementById('ly-routes').checked = true;
    toggleLy('routes');
    expect(mockMap._layerVisibility['chaos-routes']).toBe('visible');
    expect(mockMap._layerVisibility['chaos-routes-glow']).toBe('visible');
  });
});

// ============================================================
describe('UI Logic — Scenario Toggle', () => {
  beforeEach(() => {
    setupDOM();
    mockMap._layerVisibility = {};
    curSc = 'chaos';
  });

  it('setScenario toggles chaos vs hub layer visibility', () => {
    setScenario('hub');
    expect(mockMap._layerVisibility['chaos-routes']).toBe('none');
    expect(mockMap._layerVisibility['chaos-routes-glow']).toBe('none');
    expect(mockMap._layerVisibility['hub-routes']).toBe('visible');
    expect(mockMap._layerVisibility['hub-port']).toBe('visible');
    expect(mockMap._layerVisibility['hub-port-glow']).toBe('visible');
    expect(mockMap._layerVisibility['hub-port-flow']).toBe('visible');
    expect(document.getElementById('btn-hub').className).toBe('sc-btn a-hub');
    expect(document.getElementById('btn-chaos').className).toBe('sc-btn');

    setScenario('chaos');
    expect(mockMap._layerVisibility['chaos-routes']).toBe('visible');
    expect(mockMap._layerVisibility['chaos-routes-glow']).toBe('visible');
    expect(mockMap._layerVisibility['hub-routes']).toBe('none');
    expect(mockMap._layerVisibility['hub-port']).toBe('none');
    expect(document.getElementById('btn-chaos').className).toBe('sc-btn a-chaos');
    expect(document.getElementById('btn-hub').className).toBe('sc-btn');
  });
});
