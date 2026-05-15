# Hoja de Supuestos — Junta Directiva

Cheatsheet para presentación. Ten esto a mano cuando preguntas "¿de dónde sale ese número?"

---

## 1. Tarifas

| # | Supuesto | Valor | Fuente | Sensibilidad | Riesgo si erra |
|---|---|---|---|---|---|
| 1.1 | Tarifas $/viaje sencillo 10p (PA) | Por finca, ver Excel | `TTE FRUTA 6052026.xlsx` (mayo 2026) | Fija (negociada y firmada) | Bajo — ya firmado |
| 1.2 | Tarifa mula Chinita 20p (negociada) | $470K/viaje | Excel mayo'26 | Fija | Bajo |
| 1.3 | Mula Chinita 24p (extrapolada) | $564K = $470K × 1.2 (factor llenado) | Cálculo motor | Media — factor 1.2 puede ser 1.15-1.25 | $50-100M/año si factor cambia |
| 1.4 | **F→H base "límite JP López"** | **$400/cj** | Reunión 12 mayo, JP López dice "realista, no $200" | **Crítica — variable maestra del modelo** | **Cada $50/cj = $165M/año FCF** |
| 1.5 | F→H objetivo (negociación con Anderson + Vera) | $200/cj | Modelo target. Equivale a ~$260K/viaje sencillo | Crítica | Si negociación falla, caso pivote a punto débil |
| 1.6 | F→H óptimo (caso teórico) | $80/cj | Cota inferior plausible | Baja — solo escenario | — |
| 1.7 | Tarifa terceros $/cj | $57/cj (mínimo $42 = costo consol) | Reuniones con Uniban + estimación | Media | $652M baja a ~$300M si tarifa < $42 |

---

## 2. Volúmenes y operación

| # | Supuesto | Valor | Fuente | Riesgo |
|---|---|---|---|---|
| 2.1 | Cajas/semana por finca | 19 fincas, total 101,003 cj/sem | `produccion_anual.xlsx` 2025 | Bajo — data histórica |
| 2.2 | Cajas/día G20 (5 días/sem) | 20,201 | Cálculo (101,003 / 5) | Bajo |
| 2.3 | Cajas/día Centro (12 fincas) | 12,674 | Subset Centro group | Bajo |
| 2.4 | Pallets/día Centro | 234.8 (= 12,674 / 54 cj-pallet) | Estándar industria 54 cj/pallet | Bajo |
| 2.5 | Trips Hub→PA (mulas llenas 24p) | 10/día | Cálculo (234.8 / 24) | Bajo |
| 2.6 | Llenado actual sencillos (real) | 72.8% | Geocercas 2025 (data 7-16 vehículos, Mar-Dic, 132,488 eventos) | Bajo — data hard |
| 2.7 | Espera P50 actual Zungo | 1h 53min | Geocercas 2025 | Bajo |
| 2.8 | Espera proyectada hub | <1h | Estimación (mulas con slot vs sencillos dispersos) | Medio — supuesto de eficiencia |
| 2.9 | Reducción viajes vía principal | -39% (41 → 25) | Cálculo carruseles + consolidación | Medio |

---

## 3. CAPEX ($4,020M total — slide 9 desglosa)

| Componente | Monto | Comentario |
|---|---|---|
| Lote 5,000 m² (Chinita) | $200M | Adquisición terreno |
| Bodega consolidación (1,000 m²) | $1,900M | $1.6-2.2M/m² |
| Plataformas + muelles (250 m²) | $475M | 4 muelles (2 recepción + 2 despacho 24p) |
| Pérgolas + circulaciones (400 m²) | $640M | |
| Oficinas + servicios (150 m²) | $405M | $2.2-3.0M/m² |
| Equipos (dock levelers, montacargas) | $250M | |
| Capital de trabajo | $150M | |
| **TOTAL** | **$4,020M** | Incluye indirectos 15-20% (diseño, licencias, interventoría, imprevistos) |

**Riesgo:** sobrecosto típico construcción 10-25% → +$400-1,000M. Mitigación: cotización detallada con 3 constructores antes de inicio (compromiso ejecución #2).

---

## 4. OPEX ($437M/año — slide 9 desglosa)

| Componente | Monto/a | Comentario |
|---|---|---|
| Personal (6 personas) | $215M | Operativo + supervisión |
| Servicios | $73M | Energía, agua, comunicaciones |
| Mantenimiento (2% construcción) | $73M | |
| Seguros (1% CAPEX) | $40M | |
| Administración | $36M | |
| **TOTAL** | **$437M** | |

**Inflación supuesta:** 3%/año

---

## 5. Palancas operativas ($142M/año)

| Palanca | Valor | Cálculo | Fuente |
|---|---|---|---|
| **Standby evitado** | $42M | $20K/h × 50% captura × 4,200h estimadas (2,315 viajes con espera >1h) | Geocercas 2025 |
| **Nocturnos evitados** | $100M | 50K pallets × $4,200/pallet × 50% reducción turno extendido | Datos operativos 2025 |
| **TOTAL** | **$142M/año** | | |

**Riesgo:** captura 50% es supuesto. Si captura real es 30%, palancas bajan a ~$85M/a (-$57M).

---

## 6. Servicio a terceros ($652M/año tope, ramp 5 años)

| Supuesto | Valor | Justificación |
|---|---|---|
| Capacidad ociosa hub | 30% | G20 usa 70% de diseño 120 pallets simultáneos |
| Universo región | 402 fincas bananeras zona Urabá | Datos Uniban + estudios de mercado |
| Captura objetivo | 10% región | Asumido conservador (5%-25% rango) |
| Tarifa unitaria | $57/cj | Floor $42 (costo consol) + margen $15 |
| **Tope ingreso anual** | **$652M** | = $57 × 10% × 402 × producción promedio |
| Ramp 5 años | 0% / 20% / 50% / 85% / 100% año 5+ | Curva conservadora (puede acelerarse) |

**Riesgo crítico:** sin terceros, FCF F→H $400 = deficit -$87M/año (incluso con palancas). Mitigación: cartas de interés ≥2 terceros antes go-live (compromiso ejecución #3).

---

## 7. Financieros

| Supuesto | Valor | Justificación | Riesgo |
|---|---|---|---|
| **WACC** | 12% | Tasa descuento agronegocio Colombia (estándar industria) | Bajo |
| **Inflación OPEX** | 3%/año | Inflación esperada Colombia | Bajo |
| Inflación tarifas Tx | 0% (no modelada) | Conservador, asume tarifas mayo'26 estables | **Medio** — si suben, caso construir mejora |
| Horizonte de análisis | 10 años | Vida útil mínima infraestructura | Conservador (real >20a) |
| Tipo de cambio | No modelado (cifras en COP) | Banano se cobra USD, costos COP | **Medio** — variación FX impacta margen pero no decisión |

---

## 8. Cifras canónicas para defender en Junta

### Costos anuales (M COP)
| Métrica | Solo Centro (12 fincas, 3.30M cj/a) | Total G20 (19 fincas, 5.25M cj/a) |
|---|---|---|
| **SC1 Actual** ($/cj prom) | $429 ($1,416M/a) | $407 ($2,137M/a) |
| **SC2 Full PA inminente** | $950 ($3,135M/a) | $964 ($5,063M/a) |
| **SC3 Hub F→H $400** | $887 ($2,927M/a) | $704 ($3,697M/a) |
| **SC3 Hub F→H $200** | $687 ($2,267M/a) | $578 ($3,037M/a) |

### Δ vs SC2 inminente (con hub vs sin hub)
- **Solo Centro:** −$208M/año ahorro
- **Total G20:** −$1,366M/año ahorro

### 10 años acumulado (nominal, sin descontar)
> **Cifras en COP.** En español "billón" = millón de millones (10¹²). Para evitar ambigüedad, todas las cifras en este documento están en **millones de pesos colombianos (M COP)**. NO usamos la notación "$XB" porque puede leerse como "billones" (10¹²) en lugar de "miles de millones" (10⁹).

- **NO Construir** (SC2 G20): **$50,650M COP** (cincuenta mil seiscientos cincuenta millones)
- **Construir** (SC3 G20 + OPEX + CAPEX − palancas − terceros), F→H $400: **$39,008M COP**
- **Construir** F→H $200: **$32,418M COP**
- **Diferencia ahorro F→H $400:** **$11,642M COP** (~$11,600M)
- **Diferencia ahorro F→H $200:** **$18,232M COP** (~$18,200M)

### Indicadores FCF (con palancas + terceros ramp, WACC 12%, 10a)
| F→H | Payback FCF | VPN @ 12% | TIR |
|---|---|---|---|
| $400 (límite JP) | >10a | −$2,406M | −2.4% |
| $300 (punto neutro) | ~5.5a | ~$0 | ~12% |
| **$200 (objetivo)** | **4.7a** | **+$1,317M** | **18.6%** |
| $80 (óptimo) | 3.6a | +$2,400M | ~28% |

---

## 9. Lo que NO está modelado (upside no contabilizado)

- Independencia operativa de PA (riesgo cuello de botella)
- Trazabilidad pallet→puerto (certificaciones, calidad)
- Posición negociadora futura (con hub propio)
- Opcionalidad expansión (otros productos: cacao, plátano, aguacate)
- Reducción mermas/calidad (no cuantificado por falta de data G20 actual)

---

## 10. Lo que NO está modelado (downside no contabilizado)

- Sobrecosto construcción (típico 10-25%)
- Demora inicio operación (cada año = $437M OPEX adicional sin ingreso)
- Riesgo regulatorio (cambios normativos PA, Apartadó)
- Cambio precio banano UE (no modelado pero afecta volumen)
- Captura terceros < 10% región
