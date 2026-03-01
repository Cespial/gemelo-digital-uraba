# Gemelo Digital Logistico — Uraba Banana Belt

Dashboard interactivo tipo gemelo digital para la logistica del corredor bananero de Uraba, Colombia. Sprint 0 MVP con visualizacion de redes viales, rutas logisticas (OSRM), datos territoriales (SIPRA) y escenarios comparativos sobre mapa Mapbox GL.

## Funcionalidades

- Mapa interactivo Mapbox GL con redes viales de OpenStreetMap
- Rutas logisticas pre-computadas con OSRM
- Datos territoriales rurales SIPRA (GeoJSON)
- Paneles de escenarios ("Caos" vs "Hub") con KPIs y sliders
- Proxy serverless de Google Maps Distance Matrix API para datos de trafico en tiempo real

## Stack

HTML + CSS + JavaScript vanilla + Mapbox GL JS. Backend: Vercel serverless function (Node.js). Pipeline de datos: Python (OSM road fetching). Deploy en Vercel.

## Estructura

```
├── index.html              # Dashboard single-page (tema oscuro, JetBrains Mono + Inter)
├── api/traffic.js          # Serverless function — proxy Google Maps Distance Matrix
├── scripts/fetch_osm_roads.py  # Extraccion de vias OSM
├── data/
│   ├── osm_roads.geojson       # Red vial cruda
│   ├── osrm_routes.json        # Rutas OSRM pre-computadas
│   └── sipra_uraba_web.geojson # Datos territoriales SIPRA
└── vercel.json
```
