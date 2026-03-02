# Gemelo Digital Logistico — Uraba Banana Belt

Dashboard interactivo que modela la transicion logistica del **Grupo 20** (19 fincas bananeras, ~5% produccion regional) de un esquema de exportacion directa descentralizada a un modelo **Hub & Spoke** via Hub Casa Verde → Puerto Antioquia.

**Live:** [gemelo-digital-uraba.vercel.app](https://gemelo-digital-uraba.vercel.app)

## Resumen Ejecutivo (Sprint 0)

### Que se construyo

- **Mapa interactivo** con 10+ capas geoespaciales verificadas, responsive (desktop + movil)
- **Simulador de estres vial** — 3 sliders (produccion, carga regional, competidores) que actualizan el mapa en tiempo real: rutas cambian de color/grosor, vias se iluminan con congestion, semaforo de estado
- **Modelo de costos logisticos** — $/caja desglosado por combustible, conductor, peajes, desgaste, consolidacion; reactivo a parametros
- **Isocronas** — Contornos de 15/30/45 min driving desde el Hub con conteo automatico de fincas por anillo
- **41 rutas OSRM** con geometria completa (1,653 puntos sobre vias reales)
- **20 fincas** snapped a la red vial OSM
- **Trafico en vivo** via Google Maps Distance Matrix API (proxy serverless)
- **Diseno mobile-responsive** con navegacion por tabs (Mapa / Controles / Datos)

### Resultado clave del modelo

- **Reduccion ~89%** de tractomulas en via principal con Hub & Spoke
- **Ahorro ~23% en $/caja** (combustible, conductor, peajes, desgaste vs. costo consolidacion)
- **Hub Casa Verde** fuera de zona de inundacion, a 25.4 km / 34.8 min del puerto

## Fuentes de Datos

| Fuente | Dato | Registros |
|---|---|---|
| DANE MGN 2024 | Limites municipales | 9 municipios |
| UPRA Geoservicios | Limites veredales | 611 veredas |
| SIPRA/UPRA 2019 | Aptitud banano (shapefile) | 68 poligonos |
| OpenStreetMap Overpass | Red vial | 299 segmentos |
| OpenStreetMap Overpass | Hidrografia | 759 segmentos (rios, quebradas, canales) |
| OSRM | Ruteo real | 41 rutas (finca→hub, finca→puerto, hub→puerto) |
| Mapbox Isochrone API | Isocronas driving | 15/30/45 min |
| Google Maps Distance Matrix | Trafico en vivo | 20 fincas x 2 destinos |
| Augura 2023 | Parametros produccion G20 | Benchmark regional |
| IDEAM WMS | Amenaza inundacion | Capa raster |
| UPRA WMS | Aptitud uso suelo | Capa raster |

## Pendientes (Post-Sprint 0)

- **Coordenadas reales de las 19 fincas del G20** — actualmente simuladas; se necesitan ubicaciones reales
- **Produccion real por finca** — datos de volumen por finca para calibrar el modelo
- **Costos reales de operacion** — validar $/km diesel, $/hr conductor, peajes con datos del operador
- **Modelo financiero completo** — CAPEX del Hub, payback, TIR, VPN
- **Datos de competidores** — volumenes reales de Uniban, Banacol, otros para calibrar congestion
- **Escenario fluvial** — modelar transporte por rio (embarcadero Rio Leon) como tercer escenario
- **Animacion de flujo de camiones** — puntos animados moviendose por las rutas
- **Comparacion side-by-side** — pantalla dividida caos vs hub
- **Datos reales ICA/AUGURA** — geolocalizacion de plantaciones registradas

## Stack

HTML + CSS + JavaScript vanilla + Mapbox GL JS v3.3.0. Backend: Vercel serverless function (Node.js). Deploy en Vercel.

## Estructura

```
├── index.html                        # Dashboard single-page (tema oscuro)
├── api/traffic.js                    # Proxy serverless Google Maps Distance Matrix
├── config.js                         # Token Mapbox local (gitignored)
├── data/
│   ├── osm_roads.geojson             # Red vial OSM (299 segmentos)
│   ├── osm_waterways_web.geojson     # Hidrografia OSM (759 segmentos)
│   ├── sipra_uraba_web.geojson       # Aptitud banano SIPRA (68 poligonos)
│   ├── uraba_municipios_web.geojson  # Limites municipales DANE (9 mpios)
│   └── uraba_veredas_web.geojson     # Limites veredales UPRA (611 veredas)
├── vercel.json
├── .gitignore
└── .vercelignore
```

## Desarrollo Local

1. Crear `config.js` con tu token de Mapbox:
   ```js
   const MAPBOX_TOKEN = 'pk.tu_token_aqui';
   ```
2. Servir con cualquier servidor local: `npx serve .`
3. Para trafico en vivo, configurar `GMAPS_KEY` en variables de entorno de Vercel.

---

**Observatorio de Datos y Analisis SAS** — Sprint 0 MVP
