// =============================================================
// Test setup — mock browser globals needed by the application
// =============================================================

// Mock mapboxgl (prevents real map instantiation in tests)
globalThis.mapboxgl = {
  accessToken: '',
  Map: class {
    constructor() { this._layers = {}; }
    addControl() {}
    addSource() {}
    addLayer(l) { this._layers[l.id] = l; }
    getLayer(id) { return this._layers[id]; }
    getSource() { return {}; }
    setLayoutProperty() {}
    setPaintProperty() {}
    setTerrain() {}
    setFog() {}
    on() {}
    isStyleLoaded() { return true; }
    resize() {}
    getCanvas() { return { style: {} }; }
  },
  NavigationControl: class {},
  ScaleControl: class {},
  AttributionControl: class {},
  Marker: class {
    setLngLat() { return this; }
    setPopup() { return this; }
    addTo() { return this; }
  },
  Popup: class {
    constructor() {}
    setLngLat() { return this; }
    setHTML() { return this; }
    addTo() { return this; }
  },
};

// Mock fetch (used by data loaders and API proxy tests)
globalThis.fetch = globalThis.fetch || (async () => ({
  json: async () => ({}),
  ok: true,
}));
