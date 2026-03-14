# Gemelo Digital Logistico — Uraba Banana Belt

Dashboard interactivo que modela la transicion logistica del **Grupo 20** (19 fincas bananeras, ~5% produccion regional) de un esquema de exportacion directa descentralizada a un modelo **Hub & Spoke** via Hub Casa Verde → Puerto Antioquia.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deck.gl](https://img.shields.io/badge/Deck.gl-9-00A9E0)](https://deck.gl)
[![PostGIS](https://img.shields.io/badge/PostGIS-336791?logo=postgresql&logoColor=white)](https://postgis.net)

**Live:** [gemelo-digital-uraba.vercel.app](https://gemelo-digital-uraba.vercel.app)

---

## 1. Resumen Ejecutivo

### Que es

Un **gemelo digital logistico** — una replica virtual del corredor bananero de Uraba que permite simular, visualizar y comparar escenarios de transporte antes de tomar decisiones de infraestructura.

### El problema

El Grupo 20 (G20) opera 19 fincas bananeras en la region de Uraba, Antioquia. Actualmente cada finca despacha tractomulas individualmente hacia el puerto (**modelo directo descentralizado**), generando:
- **~154 tractomulas/dia** del G20 en la via principal
- Congestion vial acumulada con otros exportadores (Uniban, Banacol, etc.)
- Costos logisticos elevados por combustible, conductor, peajes y desgaste vehicular
- Cero consolidacion de carga

### La solucion modelada

**Hub & Spoke**: consolidar la carga de las 19 fincas en un punto intermedio (**Hub Casa Verde**, 7.8680°N, -76.6650°W) y despachar tractomulas consolidadas al puerto.

### Resultados del modelo

| Metrica | Valor |
|---|---|
| Reduccion de tractomulas en via principal | **~89%** (154 → 17/dia) |
| Ahorro en costo por caja | **~23%** ($386 → $298 COP/caja) |
| Ahorro anual estimado | **~$502M COP** |
| Distancia Hub → Puerto (OSRM) | **25.4 km / 34.8 min** |
| Hub en zona de inundacion | **NO** (verificado contra IDEAM) |
| Fincas dentro de isocrona 15 min del Hub | ~14-16 de 20 |

---

## 2. Funcionalidades

### 2.1 Mapa interactivo geoespacial

- **10+ capas superpuestas** con toggle individual:
  - Limites municipales (DANE MGN 2024) — 9 municipios
  - Limites veredales (UPRA) — 611 veredas
  - Aptitud banano SIPRA — 68 poligonos (113,640 ha aptitud alta)
  - Red vial OSM — 299 segmentos
  - Hidrografia OSM — 759 segmentos (rios, quebradas, canales)
  - Zonas de inundacion
  - Isocronas desde Hub (15/30/45 min driving)
  - Rutas OSRM (caos y hub)
  - Ruta Hub → Puerto
  - WMS oficiales (UPRA aptitud, IDEAM amenaza)
- **Terreno 3D** con DEM de Mapbox, hillshade y atmosfera
- **Vista top-down 2D** para claridad analitica (pitch: 0°)
- **Tema oscuro** optimizado para visualizacion de datos

### 2.2 Simulador de estres vial

Tres sliders interactivos que actualizan el mapa **en tiempo real**:

| Slider | Rango | Efecto |
|---|---|---|
| Produccion G20 | 50-200% | Escala volumen de cajas/semana, numero de tractomulas |
| Carga regional total | 50-200% | Simula trafico total en la via (todos los exportadores) |
| Competidores | 0-150% | Agrega volumen de Uniban, Banacol, otros |

**Visualizacion reactiva:**
- Rutas cambian de color segun congestion (verde → amarillo → rojo)
- Ancho de ruta proporcional al volumen de produccion por finca
- Overlay de congestion en red vial OSM
- Marcadores de fincas cambian tamano y color segun produccion
- Semaforo de estado vial (verde/amarillo/rojo)
- Barra de congestion con porcentaje

### 2.3 Modelo de costos logisticos

Modelo parametrico que calcula **$/caja** desglosado por componente:

| Componente | Directo | Hub | Delta |
|---|---|---|---|
| Combustible | $148 | $108 | -27% |
| Conductor | $82 | $58 | -29% |
| Peajes | $35 | $18 | -49% |
| Desgaste vehicular | $68 | $52 | -24% |
| Consolidacion Hub | -- | $42 | +$42 |
| **TOTAL** | **$386** | **$298** | **-23%** |

**Parametros del modelo:**

| Parametro | Valor | Fuente |
|---|---|---|
| Costo diesel | $3,200 COP/km | Estimado operador |
| Costo conductor | $28,000 COP/hr | Estimado operador |
| Peaje ruta directa | $35,000 COP/viaje | Estimado |
| Peaje ruta Hub | $18,000 COP/viaje | Estimado |
| Desgaste vehicular | $1,800 COP/km | Estimado |
| Consolidacion Hub | $42 COP/caja | Estimado |
| Cajas por tractomula | 960 | Augura |

Los costos se recalculan en tiempo real al mover los sliders.

### 2.4 Isocronas desde Hub

Contornos de accesibilidad driving desde Hub Casa Verde:
- **15 min** (verde) — 114 puntos de contorno
- **30 min** (amarillo) — 437 puntos de contorno
- **45 min** (rojo) — 1,163 puntos de contorno

Conteo automatico de fincas dentro de cada anillo usando **ray casting** (point-in-polygon).

### 2.5 Comparacion de escenarios

Dos escenarios toggleables con un click:

| | Caos (directo) | Hub & Spoke |
|---|---|---|
| Rutas visibles | 20 rutas finca → puerto | 20 rutas finca → hub + 1 hub → puerto |
| Tractomulas/dia | ~154 | ~17 |
| Costo/caja | $386 COP | $298 COP |
| Visual | Rutas rojas dispersas | Rutas verdes convergentes + trunk animado |

La ruta Hub → Puerto tiene animacion **ant march** (dash animado con `requestAnimationFrame`).

### 2.6 Trafico en vivo

- **Google Maps Distance Matrix API** para obtener tiempos de viaje con trafico actual
- Proxy serverless en Vercel (`/api/traffic.js`) para evitar CORS
- 20 fincas × 2 destinos (Hub + Puerto) = 40 consultas
- Muestra tiempo en trafico vs. tiempo libre para cada finca

### 2.7 Diseno mobile-responsive

- Navegacion por tabs (Mapa / Controles / Datos)
- 4 breakpoints: 1200px, 900px, 768px, 380px
- Touch targets agrandados (22px thumbs en sliders)
- Panels de ancho completo en movil
- Leyenda compacta
- Auto-restore layout desktop en resize

---

## 3. Datos del modelo

### 3.1 Fincas (20 puntos, snapped a red vial OSM)

| ID | Nombre | Lat | Lng | Prod (cajas/sem) | Cluster |
|---|---|---|---|---|---|
| F01 | La Sierra | 7.7927 | -76.6529 | 7,200 | sur |
| F02 | Villa Fresia | 7.7762 | -76.6563 | 5,100 | sur |
| F03 | El Retiro | 7.7655 | -76.6579 | 4,800 | sur |
| F04 | Santa Ana | 7.8067 | -76.6512 | 6,500 | sur |
| F05 | La Esperanza | 7.7965 | -76.6736 | 5,900 | sur |
| F06 | El Paraiso | 7.8422 | -76.6438 | 6,100 | central |
| F07 | La Fortuna | 7.8589 | -76.6486 | 5,500 | central |
| F08 | San Jose | 7.8648 | -76.6375 | 4,900 | central |
| F09 | Chinita | 7.8932 | -76.6515 | 7,800 | norte |
| F10 | Santa Marta | 7.8942 | -76.6510 | 6,700 | norte |
| F11 | La Llave | 7.9061 | -76.6379 | 5,400 | norte |
| F12 | El Progreso | 7.9356 | -76.6561 | 4,600 | norte |
| F13 | Las Dunas | 7.8686 | -76.6521 | 6,300 | hub |
| F14 | Oasis | 7.8649 | -76.6519 | 5,800 | hub |
| F15 | Guadalupe | 7.8790 | -76.6520 | 6,000 | hub |
| F16 | El Eden | 7.8667 | -76.6522 | 5,200 | hub |
| F17 | Monteverde | 7.8282 | -76.6548 | 4,500 | central |
| F18 | Bella Vista | 7.8044 | -76.6853 | 5,600 | sur |
| F19 | Los Almendros | 7.8161 | -76.7119 | 5,100 | central |
| F20 | Rio Claro | 7.8739 | -76.6350 | 4,800 | hub |

**Total produccion semanal modelo:** ~110,400 cajas/semana (~5.7M cajas/ano)

> **Nota:** Las coordenadas son simuladas y snapped al punto mas cercano de la red vial OSM. Se necesitan las ubicaciones reales de las fincas del G20.

### 3.2 Nodos de referencia

| Nodo | Lat | Lng | Rol |
|---|---|---|---|
| Hub Casa Verde | 7.8680 | -76.6650 | Centro de consolidacion |
| Puerto Antioquia | 7.9230 | -76.7341 | Puerto de exportacion |
| Apartado | 7.8829 | -76.6258 | Cabecera municipal |
| Carepa | 7.7567 | -76.6558 | Cabecera municipal |
| Chigorodo | 7.6647 | -76.6818 | Cabecera municipal |
| Turbo | 8.0926 | -76.7260 | Cabecera municipal |
| Aeropuerto Zungo | 7.8139 | -76.7161 | Infraestructura |
| Embarcadero Rio Leon | 7.9100 | -76.7000 | Infraestructura fluvial |

### 3.3 Rutas OSRM

- **41 rutas** con geometria completa (overview=full)
- **1,653 puntos** de coordenadas sobre vias reales
- **~34 KB** de datos de rutas embebidos en el frontend
- Tipos: 1 ruta hub→puerto, 20 rutas finca→hub, 20 rutas finca→puerto

Distancias promedio:
- Finca → Hub: 1.6 – 20.7 km (media ~8.2 km)
- Finca → Puerto: 9.4 – 42.8 km (media ~26.3 km)
- Hub → Puerto: 25.4 km / 34.8 min

### 3.4 Parametros G20 (benchmark Augura 2023)

| Parametro | Valor |
|---|---|
| Fincas en G20 | 19 |
| Produccion anual | ~5.7M cajas |
| Participacion regional | ~5% |
| Peso por caja | 20 kg |
| Cajas por pallet | 48 |
| Cajas por tractomula | 960 |

---

## 4. Fuentes de Datos

| # | Fuente | Dato | Registros | Formato | Tamano |
|---|---|---|---|---|---|
| 1 | DANE MGN 2024 | Limites municipales | 9 municipios | GeoJSON | 47 KB |
| 2 | UPRA Geoservicios | Limites veredales | 611 veredas | GeoJSON | 2.1 MB |
| 3 | SIPRA/UPRA 2019 | Aptitud banano | 68 poligonos | GeoJSON | 329 KB |
| 4 | OpenStreetMap Overpass | Red vial | 299 segmentos | GeoJSON | 129 KB |
| 5 | OpenStreetMap Overpass | Hidrografia | 759 segmentos (86 rios, 590 quebradas, 83 canales) | GeoJSON | 435 KB |
| 6 | OSRM | Ruteo real | 41 rutas, 1,653 puntos | JSON embebido | 34 KB |
| 7 | Mapbox Isochrone API | Isocronas driving | 3 contornos (15/30/45 min) | GeoJSON (runtime) | API |
| 8 | Google Maps Distance Matrix | Trafico en vivo | 20 fincas × 2 destinos | JSON (runtime) | API |
| 9 | Augura 2023 | Parametros produccion | Benchmark regional | Constantes | — |
| 10 | IDEAM WMS | Amenaza inundacion | Capa raster | WMS tile | — |
| 11 | UPRA WMS | Aptitud uso suelo | Capa raster | WMS tile | — |
| 12 | Mapbox | Terreno DEM | Elevacion | Raster-DEM | — |

---

## 5. Arquitectura Tecnica

### Stack

| Componente | Tecnologia |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla (single-page) |
| Mapas | Mapbox GL JS v3.3.0 (dark-v11 style) |
| Tipografia | JetBrains Mono (datos) + Inter (UI) |
| Backend | Vercel serverless function (Node.js) |
| Deploy | Vercel (auto-deploy desde Git) |
| Ruteo | OSRM (router.project-osrm.org) |
| Trafico | Google Maps Distance Matrix API |
| Isocronas | Mapbox Isochrone API |
| Terreno | Mapbox DEM + Hillshade |
| WMS | UPRA + IDEAM |

### Capas del mapa (orden de renderizado)

1. Hillshade (terreno sombreado)
2. Municipios (fill + line + label)
3. Veredas (fill + line)
4. SIPRA aptitud banano (fill + line)
5. OSM roads (line)
6. Waterways (glow + line + label)
7. Flood zones (fill + line)
8. Isocronas (45/30/15 min — fill + line + labels)
9. Chaos routes (glow + line) / Hub routes (line)
10. Hub-port route (glow + line + flow animation)
11. OSM roads congestion overlay
12. Farm markers (glow + circle + popups)
13. WMS overlays (UPRA, IDEAM)

### Modelo de congestion

Formula BPR (Bureau of Public Roads) simplificada:

```
lr = (baseCapacity * 0.6 + totalTrucks * PCE) / baseCapacity
congestionFactor = lr^3
```

Donde:
- `baseCapacity` = 800 vehiculos/hora (estimado via principal Uraba)
- `PCE` = 2.5 (Passenger Car Equivalent para tractomula)
- `totalTrucks` = tractomulas G20 + carga regional + competidores

### API Endpoints

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/traffic.js` | GET | Proxy Google Maps Distance Matrix |

Query params: `origins`, `destinations`, `mode` (default: driving)

Requiere `GMAPS_KEY` en variables de entorno de Vercel.

---

## 6. Estructura del Proyecto

```
gemelo-digital-uraba/
├── index.html                         # Dashboard single-page (1,410 lineas, 116 KB)
│                                      # HTML + CSS + JS — tema oscuro, mapa, simulador,
│                                      # modelo de costos, isocronas, mobile responsive
├── api/
│   └── traffic.js                     # Vercel serverless proxy para Google Maps API (41 lineas)
├── config.js                          # Token Mapbox local (gitignored)
├── vercel.json                        # Config: maxDuration=10s para /api/traffic.js
├── data/
│   ├── osm_roads.geojson              # Red vial OSM (299 segmentos, 129 KB) — deployed
│   ├── osm_waterways_web.geojson      # Hidrografia OSM (759 segmentos, 435 KB) — deployed
│   ├── sipra_uraba_web.geojson        # Aptitud banano SIPRA (68 poligonos, 329 KB) — deployed
│   ├── uraba_municipios_web.geojson   # Limites municipales DANE (9 mpios, 47 KB) — deployed
│   ├── uraba_veredas_web.geojson      # Limites veredales UPRA (611 veredas, 2.1 MB) — deployed
│   ├── osm_waterways.geojson          # Hidrografia completa (gitignored, 812 KB)
│   ├── osm_roads.js                   # Red vial formato JS (gitignored)
│   ├── osm_roads_compact.js           # Red vial compacta (gitignored)
│   ├── osrm_data.js                   # Rutas OSRM simplificadas (gitignored)
│   ├── osrm_routes.json               # Rutas OSRM basicas (gitignored)
│   ├── osrm_routes_full.json          # Rutas OSRM completas (gitignored, 176 KB)
│   ├── routes_js.txt                  # Datos snapped exportados (gitignored, 35 KB)
│   ├── sipra_uraba.geojson            # SIPRA original (gitignored, 2.5 MB)
│   ├── sipra_exclusion.geojson        # SIPRA exclusion (gitignored, 725 KB)
│   ├── uraba_municipios.geojson       # Municipios original (gitignored, 282 KB)
│   ├── uraba_veredas.geojson          # Veredas original (gitignored, 13 MB)
│   └── sipra/                         # Shapefiles originales SIPRA (gitignored)
├── scripts/
│   └── fetch_osm_roads.py             # Script Python para descargar datos OSM via Overpass
├── .gitignore
├── .vercelignore
└── README.md
```

**Archivos deployed a Vercel:** `index.html`, `api/traffic.js`, `vercel.json`, y 5 GeoJSON en `data/` (archivos `*_web.geojson` + `osm_roads.geojson`). Total ~3.1 MB.

---

## 7. Desarrollo Local

### Prerrequisitos

- Navegador moderno con WebGL (Chrome, Firefox, Safari, Edge)
- Servidor HTTP local (cualquiera: `npx serve`, Python, etc.)
- Token de Mapbox (para mapas)
- Token de Google Maps (opcional, para trafico en vivo)

### Setup

1. Clonar el repositorio:
   ```bash
   git clone <repo-url>
   cd gemelo-digital-uraba
   ```

2. Crear `config.js` con tu token de Mapbox:
   ```js
   const MAPBOX_TOKEN = 'pk.tu_token_aqui';
   ```

3. Servir con cualquier servidor local:
   ```bash
   npx serve .
   # o
   python3 -m http.server 3000
   ```

4. Abrir en `http://localhost:3000` (o el puerto que indique tu servidor)

### Trafico en vivo (opcional)

Para habilitar la funcionalidad de trafico en vivo con Google Maps:

1. Configurar `GMAPS_KEY` en las variables de entorno de Vercel
2. El endpoint `/api/traffic.js` actua como proxy serverless
3. Requiere deploy en Vercel (no funciona en localhost sin configuracion adicional)

---

## 8. Deploy

El proyecto se deploya automaticamente en **Vercel** via Git push.

```bash
git push origin main
```

Configuracion relevante:
- `vercel.json`: maxDuration de 10s para la funcion serverless
- `.vercelignore`: excluye archivos grandes de datos fuente (shapefiles, GeoJSON originales)
- Variable de entorno: `GMAPS_KEY` (Google Maps API key)

---

## 9. Historial de Desarrollo (Sprint 0)

| # | Commit | Descripcion |
|---|---|---|
| 1 | `05f4681` | Dashboard MVP inicial con Leaflet.js tema oscuro |
| 2 | `0e6f29d` | Integracion rutas OSRM reales y capas WMS |
| 3 | `3f4b05b` | Red vial OSM, resumen ejecutivo, polish |
| 4 | `5655612` | Limpiar .DS_Store del tracking |
| 5 | `dc31387` | Migracion a Mapbox GL JS + datos SIPRA reales |
| 6 | `b9c2d7c` | Agregar .vercelignore para archivos grandes |
| 7 | `9e65984` | Fix mapa negro + integrar Google Maps Distance Matrix |
| 8 | `c249395` | Remover API key expuesta del codigo fuente |
| 9 | `2b17a68` | Agregar README con documentacion |
| 10 | `a41b674` | Rebuild completo con limites municipales + veredales |
| 11 | `847e842` | Fix token Mapbox revocado |
| 12 | `ee5e949` | Usar token publico Mapbox verificado |
| 13 | `c46c745` | Upgrade: coords snapped, rutas OSRM completas, rios reales, terreno 3D |
| 14 | `aed5611` | Mapa interactivo: vista 2D, visuales reactivos a parametros |
| 15 | `d333706` | Modelo de costos logisticos + isocronas Hub (15/30/45 min) |
| 16 | `32908a8` | Layout mobile-responsive con navegacion por tabs |
| 17 | `a3bbb18` | Polish mobile: touch targets, gap fixes, estado inicial |
| 18 | `83541cf` | Actualizar README con resumen ejecutivo |

---

## 10. Pendientes (Post-Sprint 0)

### Datos por validar
- **Coordenadas reales de las 19 fincas del G20** — actualmente simuladas; se necesitan ubicaciones GPS reales
- **Produccion real por finca** — datos de volumen semanal/mensual por finca para calibrar el modelo
- **Costos reales de operacion** — validar $/km diesel, $/hr conductor, peajes con datos del operador logistico
- **Datos de competidores** — volumenes reales de Uniban, Banacol, otros para calibrar congestion
- **Datos reales ICA/AUGURA** — geolocalizacion de plantaciones registradas

### Modelo financiero
- **CAPEX del Hub** — costo de construccion/adecuacion del centro de consolidacion
- **Payback, TIR, VPN** — modelo financiero completo con flujo de caja proyectado

### Funcionalidades por desarrollar
- **Escenario fluvial** — modelar transporte por rio (Embarcadero Rio Leon, 7.9100°N, -76.7000°W) como tercer escenario de comparacion
- **Animacion de flujo de camiones** — puntos animados moviendose por las rutas en tiempo real
- **Comparacion side-by-side** — pantalla dividida mostrando caos vs hub simultaneamente
- **Modelo multi-hub** — evaluar ubicaciones alternativas de Hub o hubs multiples

---

**Observatorio de Datos y Analisis SAS** — Sprint 0 MVP
