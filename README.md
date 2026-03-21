# Gemelo Digital Logistico — Uraba Banana Belt

Dashboard interactivo que modela la logistica del **Grupo 20** (19 fincas bananeras, ~5% produccion regional) comparando 3 escenarios de transporte: situacion actual (Zungo), despacho directo a Puerto Antioquia, y un modelo **Hub & Spoke** con 3 nodos de consolidacion.

[![Vanilla JS](https://img.shields.io/badge/Vanilla-HTML%2FJS-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Mapbox GL JS](https://img.shields.io/badge/Mapbox%20GL%20JS-v3.3-000?logo=mapbox)](https://docs.mapbox.com/mapbox-gl-js/)
[![Vercel](https://img.shields.io/badge/Vercel-deploy-000?logo=vercel)](https://vercel.com)

**Live:** [gemelo-digital-uraba.vercel.app](https://gemelo-digital-uraba.vercel.app)

---

## Modelo de 3 Nodos

| Nodo | Fincas | Funcion |
|---|---|---|
| **Centro Consolidacion** | 12 | Hub principal, consolida en mulas hacia Puerto Antioquia |
| **Mini-Hub Puerto** | 3 | Despacho directo al puerto (cercanas) |
| **Embarcadero Zungo** | 4 | Embarque fluvial (esquema actual para fincas cercanas) |

Las 19 fincas cubren ~985 ha del Grupo 20.

---

## Escenario Acido (Peor Caso)

Todos los parametros en su valor mas conservador — toda mejora es upside real.

| Metrica | SC1 (Hoy/Zungo) | SC3 (Hub) |
|---|---|---|
| Costo por caja | $919 (SC2 Centro) | **$810** |
| **Ahorro** | — | **$109/caja** |
| Viajes via principal | 41 | **25** (-39%) |
| Viajes totales | 41 | **51** (25 via principal + 26 finca→hub cortos) |
| Descuento mula G20 | — | **$0** (rango real: hasta $150K) |
| Resultado neto anual | — | **~$0 (equilibrio)** |
| Con terceros | — | **+$652M** |

### Parametros clave

| Parametro | Valor |
|---|---|
| Cajas por pallet | **54** |
| Sencillo | 12 pallets max, tarifa 10 pallets (648 cajas/viaje) |
| Mula | 24 pallets max, tarifa 20 pallets (1,296 cajas/viaje) |
| Flete sencillo | $250K-$500K COP/viaje (10p) |
| Flete mula | sencillo x 2 (hasta -$150K descuento G20) |
| Peajes | **No hay peajes en estos trayectos** |
| CAPEX | **$1,200M** (terreno $100M + pergola $600M + equipos $200M + WK $100M + contingencia $200M) |
| OPEX | **$362M/ano** |

### Sensibilidad

Dos variables criticas:

1. **Descuento G20 mula**: $0 (acido) a $150K/viaje — reduce costo Hub→PA
2. **Flete finca→hub (F→H)**: $80 a $300/caja — costo de los 26 viajes cortos locales

---

## 3 Escenarios Comparados

| | SC1: Hoy (Zungo) | SC2: Todos a PA | SC3: Con Hub |
|---|---|---|---|
| Descripcion | 19 fincas al embarcadero | Despacho individual a Puerto Antioquia | 3 nodos (Centro + Mini-Hub + Zungo) |
| Costo/caja | $406 | $919 (Centro) | $810 (acido) |
| Viajes/dia | 26 | 41 | 25 via principal + 26 locales |
| Anual | $2,133M | $5,058M | ~$3,900M |

---

## Fuentes de Datos

| Fuente | Dato |
|---|---|
| Anderson Mestra (Mar 2026) | Tarifas, operacion logistica, productividad |
| Geocercas GPS (Mar 9-12, 2026) | Telemetria 7 vehiculos (EA1348, EA1663, NCF179, GUD084, BVP459, LHE760, EA1334) |
| OSRM | Ruteo real (39 rutas, geometria completa) |
| Shapefile GRUPO20 | 19 fincas (EPSG:3116 → WGS84) |
| Uniban 2012-2025 | Productividad historica 19 fincas |
| DANE MGN 2024 | Limites municipales (9 municipios) |
| UPRA Geoservicios | Limites veredales (611 veredas) |
| SIPRA/UPRA 2019 | Aptitud banano (68 poligonos) |
| OpenStreetMap Overpass | Red vial (299 seg.) + Hidrografia (759 seg.) |
| Mapbox Isochrone API | Isocronas driving (15/30/45 min) |
| IDEAM WMS / UPRA WMS | Amenaza inundacion / Aptitud uso suelo |

---

## Stack Tecnico

| Componente | Tecnologia |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla (single-page, ~486 KB) |
| Mapas | Mapbox GL JS v3.3.0 (dark-v11) |
| Ruteo | OSRM (router.project-osrm.org) |
| Deploy | Vercel (auto-deploy desde Git) |
| Serverless | `/api/traffic.js` — proxy Google Maps Distance Matrix |

---

## Desarrollo Local

```bash
git clone <repo-url>
cd gemelo-digital-uraba
```

Crear `config.js`:
```js
const MAPBOX_TOKEN = 'pk.tu_token_aqui';
```

Servir:
```bash
npx serve .
# o
python3 -m http.server 3000
```

Abrir `http://localhost:3000`.

### Trafico en vivo (opcional)

Requiere `GMAPS_KEY` en variables de entorno de Vercel. El endpoint `/api/traffic.js` actua como proxy serverless.

---

## Deploy

```bash
git push origin main
```

Auto-deploy en Vercel. Config:
- `vercel.json`: maxDuration 10s, cache headers para HTML
- `.vercelignore`: excluye archivos grandes (shapefiles, GeoJSON originales)
- Variable de entorno: `GMAPS_KEY`

---

## Estructura del Proyecto

```
gemelo-digital-uraba/
├── index.html              # Dashboard single-page (~486 KB)
├── presentacion.html       # Presentacion ejecutiva HTML
├── presentacion.tex        # Presentacion LaTeX/Beamer
├── presentacion.pdf        # PDF generado
├── api/
│   └── traffic.js          # Vercel serverless proxy Google Maps
├── config.js               # Token Mapbox (gitignored)
├── vercel.json             # Config Vercel
├── data/
│   ├── fincas_g20.geojson          # 19 fincas G20 (47 KB)
│   ├── fincas_uraba.geojson        # Fincas region (664 KB)
│   ├── osrm_routes_g20.json        # Rutas OSRM G20 (211 KB)
│   ├── routes_g20.js               # Rutas JS (189 KB)
│   ├── osm_roads.geojson           # Red vial OSM (132 KB)
│   ├── osm_waterways_web.geojson   # Hidrografia (446 KB)
│   ├── sipra_uraba_web.geojson     # Aptitud banano SIPRA (337 KB)
│   ├── uraba_municipios_web.geojson # Limites municipales (48 KB)
│   ├── uraba_veredas_web.geojson   # Limites veredales (2.2 MB)
│   └── r_zungo.js                  # Rutas Zungo (26 KB)
├── scripts/
│   └── fetch_osm_roads.py  # Descarga datos OSM via Overpass
├── tests/                   # Tests Vitest
├── analyze_routes.py        # Analisis de rutas Python
├── analisis_3_escenarios.csv
├── Analisis_Centro_Consolidacion_G20.xlsx
└── README.md
```

---

**Fourier.dev** — Gemelo Digital Logistico Uraba
