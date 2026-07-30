# Roadmap — La Taberna de Martita

> Estado actual: v1.0.0 en producción (`la-taberna-de-martita.quest`)

---

## Estado del MVP

| Área | Estado |
|------|--------|
| Auth (login, registro, recovery) | ✅ |
| Dashboard | ✅ |
| Creación de personaje (wizard D&D 5e API) | ✅ |
| Hoja de personaje — stats, hechizos, pericias, historia | ✅ |
| Inventario con peso | ✅ |
| Paper doll con 11 slots y drag & drop | ✅ |
| Catálogo D&D con iconos BG3 (675 iconos) | ✅ |
| Estado de combate (HP, CA, XP, condiciones wax seal) | ✅ |
| Retrato (subir o generar con IA) | ✅ |
| Campañas (crear, unirse por invite) | ✅ |
| Hub de campaña con tab-bar DM | ✅ |
| Pantalla DM (iniciativa, NPCs, notas de sesión) | ✅ |
| Generador de PNJs persistentes | ✅ |
| Bestiario + Spellbook | ✅ |
| Taberna y Comercio (tiendas y consumo) | ✅ |
| Generador de objetos custom con imagen IA | ✅ |
| Tirador de dados flotante | ✅ |
| Visual overhaul: papiro, cuero, latón, wax seals | ✅ |
| Realtime sync (HP, condiciones) | ✅ |
| Deploy producción + dominio custom + email | ✅ |
| Landing Page pública & Optimización SEO | ✅ |

---

## 🏗️ Roadmap de ingeniería

Trabajo que no agrega features pero hace el proyecto verificable y sostenible.
Las fases van en orden: cada una se apoya en la anterior.

### Fase 0 — Higiene defensiva

| Tarea | Estado |
|---|---|
| `LICENSE` (MIT) + atribución CC-BY del SRD 5.1 en README y `ATTRIBUTIONS.md` | ✅ |
| Sacar paths locales del autor de archivos versionados | ✅ |
| Modularizar los 3 archivos que violaban la regla de 500 líneas | ✅ |
| Reemplazar los 3.328 assets de BG3 (45 MB) por 129 SVGs de game-icons.net (536 KB) | ✅ |
| Optimizar `public/`: 94 MB → 14 MB (assets huérfanos + recompresión a JPEG) | ✅ |
| Documentar la posición sobre generación de arte por IA (`@fal-ai/client`) | ⏳ |
| Pasar a WebP las 26 imágenes con transparencia (12 MB) — requiere `sharp` | ⏳ |

**Terminado cuando:** el repo declara su licencia y atribuye el SRD, no tiene assets de
terceros con licencia dudosa, ningún archivo viola sus propias reglas, y el bundle de
íconos pesa menos de 5 MB.

Estado: **536 KB de íconos** (objetivo: < 5 MB) y `public/` en 14 MB. Lo que queda son
los 12 MB de PNGs con canal alfa; `sips` (la única herramienta disponible sin sumar
dependencias) no escribe WebP.

### Fase 1 — El motor de reglas como paquete

Consolidar en `src/engine/` lo que hoy está disperso (modificadores y CA, umbrales de XP,
slots por clase y nivel, límites de carga, descansos, conversión de moneda, escalado de
encuentros, motor de loot). Tres reglas: **cero React, cero Supabase, funciones puras**.
Las reglas que hoy son condicionales en TypeScript pasan a ser datos declarativos que el
motor interpreta.

Candidatos ya identificados para migrar: `maxHpFor()` en `taberna/use-taberna.ts` y la
estimación de reventa en `comercio/comercio-sell-tab.tsx`.

**Terminado cuando:** se puede importar el motor en un script de Node sin JSDOM y calcular
una ficha completa.

### Fase 2 — Verificabilidad

Tests del motor escritos como spec ejecutable del SRD (no como verificación de la
implementación), tests de los flujos críticos de UI (aplicar daño, equipar y recalcular
peso, subir de nivel) y CI en GitHub Actions con typecheck + tests + build.

**Terminado cuando:** hay un badge verde en el README y romper una regla de D&D hace
fallar el pipeline.

### Fase 3 — Sistemas distribuidos y accesibilidad

- **Unificar la capa de realtime**, hoy dispersa en seis hooks (`use-character-sheet`,
  `use-tablero-data`, `use-combat-broadcast`, `use-dm-tablero`, `use-board-maps`,
  `player-tablero`), con política explícita de suscripción, reconexión y reconciliación.
- **Medir y publicar números**: latencia de propagación entre dispositivos, tiempo hasta
  que la UI refleja un cambio optimista, comportamiento con red degradada.
- **Accesibilidad** — ✅ base resuelta. Medido con `scripts/audit-a11y.mjs` sobre
  11 rutas:

  | | Antes | Ahora |
  |---|---|---|
  | Botones con nombre accesible | 99% | **100%** (924) |
  | Elementos clickeables que no son controles | 128 | **0** |
  | Campos sin etiqueta | 11 | **0** |

  El grueso del problema no era `aria-label` —un botón con texto visible ya es
  accesible— sino las 128 tarjetas del wizard de creación, que eran `<div onClick>`
  con el botón de info anidado adentro. Se reescribieron como radios nativos dentro
  de `<label>` (`selection-card.tsx`): navegación con flechas, agrupación y anuncio
  de estado sin JavaScript.

  Queda pendiente lo que el script no mide: contraste de color, orden de foco,
  `aria-live` para los cambios de HP en tiempo real, y una pasada con lector de
  pantalla real.
- **Bundle**: `DiceModule` (Three.js + cannon-es, 1,68 MB) se importa estáticamente en
  `$campaignId.tsx` y `$characterId.tsx`, así que baja al entrar a cualquier campaña o
  ficha aunque nunca se abra el tirador. Pasarlo a `lazy()`.

**Terminado cuando:** hay números publicados, no adjetivos.

### Fase 4 — Internacionalización

Hoy la app es monolingüe: `<html lang="es">` fijo, sin librería de i18n, y 42 de los 90
archivos `.tsx` tienen texto en español embebido (~395 líneas con acentos, que subestima
el total porque no cuenta strings como "Buscar" o "Vender").

**Por qué no es cosmético.** El problema ya apareció solo y se resolvió ad-hoc en dos
lugares: `dnd-backgrounds.ts` exporta `ABILITY_LABELS_ES` — el sufijo `_ES` es la señal de
que la dimensión de idioma ya existía sin infraestructura que la sostenga — y
`item-icons.ts` matchea términos en los dos idiomas a la vez (`'espada larga'` y
`'longsword'`, 12 términos así). Son parches correctos sobre un problema que nunca se
modeló.

**El eje que hay que separar: locale de UI ≠ locale de contenido de juego.** No se mueven
juntos. La API del SRD solo sirve inglés, y en la mesa hispanohablante se juega
naturalmente mezclado ("tiro el save", "es un longsword"). Un jugador puede querer la
interfaz en español y los términos de reglas en inglés — o cualquier combinación.
Colapsar los dos ejes en un solo `locale` es la decisión fácil y equivocada; es
exactamente el tipo de trade-off que merece quedar documentado como decisión de
arquitectura.

**Trabajo concreto:**

- Extraer los strings de UI a catálogos por idioma. Los 7 mapas `*_LABELS` que ya existen
  (`RARITY_LABELS`, `ITEM_TYPE_LABELS`, `DAMAGE_TYPE_LABELS`, `STAT_LABELS`,
  `RECHARGE_LABELS`, `SLOT_LABELS`, `ABILITY_LABELS`) son el molde: ya centralizan
  etiquetas, solo les falta el eje de idioma.
- Elegir librería (o no: con ~400 strings un módulo propio tipado puede alcanzar y evita
  una dependencia). Requisito: tipado fuerte de claves, para que borrar una traducción
  rompa el typecheck en vez de renderizar la clave cruda.
- Resolver plurales y género — el español los necesita y es donde una solución casera se
  cae ("1 poción" / "2 pociones", "el hacha" / "la espada").
- `lang` dinámico en el `<html>`, hoy hardcodeado. Además de i18n, es requisito de
  accesibilidad: los lectores de pantalla eligen la voz según ese atributo, así que se
  hace junto con la Fase 3.
- Detección de idioma + preferencia persistida por usuario.

**Se puede adelantar.** El trabajo se parte en dos mitades independientes: el *chrome* de
UI (botones, navegación, mensajes) no depende de nada y se puede hacer cuando sea; el
contenido de reglas conviene hacerlo después de la Fase 1, porque el motor data-driven
convierte las reglas en datos y las etiquetas viajan con ellos — hacerlo antes obliga a
extraer strings dos veces.

Si el objetivo inmediato es que alguien que no habla español pueda evaluar la app, la
versión mínima es solo el catálogo `en` del chrome de UI, y es bastante más barata que la
i18n completa.

**Terminado cuando:** se puede usar la app entera en inglés, y el idioma de la interfaz se
elige por separado del idioma de los términos de reglas.

**Estado.** El módulo propio tipado está (`src/i18n/`) y se eligió no sumar dependencia.
Traducidos: login, dashboard, campaña, taberna, comercio, notas, tablero, compendios,
ficha de personaje completa —incluidos el modal de subida de nivel y la fila de PV/CA/PX—
y los términos del SRD que la UI muestra tal cual (`src/lib/dnd-terms.ts`). Las capturas
de `docs/screenshots/` se generan en los dos idiomas, que es la prueba de que no quedó
texto pegado.

Pendiente: el formulario de PNJ y los pasos 2 a 6 del wizard de creación. El segundo eje
—locale de UI separado del locale de términos de reglas— sigue sin implementarse: hoy hay
un solo `locale`, y el contenido del SRD que viene por API (descripciones de rasgos,
nombres de conjuros y monstruos) llega siempre en inglés porque la API solo sirve inglés.
Se ve en la captura de la subida de nivel: la interfaz está en español y el texto de
*Ability Score Improvement* no.

---

## 🎯 Próximas prioridades (Propuestas Futuras)

### 🎲 1. Dado compartido e interactivo (1-Way Player-to-DM)
Sincronización de dados en mesa integrada al tablero de combate del DM (documentado detalladamente en [shared-dice-proposal.md](./docs/shared-dice-proposal.md)):
- **Tiradas interactivas en la hoja (Click-to-Roll)**: Hacer clickeables modificadores de características, salvaciones y pericias.
- **Broadcast de tiradas de jugador**: Transmitir el resultado vía Supabase Realtime al DM.
- **Tiradas del DM secretas**: Las tiradas del DM permanecen locales y secretas.
- **Registro de Tiradas en la Pantalla del DM**: Tercera columna derecha en la pantalla de Combate del DM (`lucha.tsx`) que funciona como feed en tiempo real de tiradas.

### 🔧 2. Bugs y UX pendientes (Sesión 2 feedback)

| Item | Prioridad |
|------|-----------|
| Al salir del personaje: volver a la campaña, no al dashboard | Alta |
| XP: sumar al valor actual (no reemplazar) | Alta |
| Objetos: cantidad con +/- (no input directo) | Media |
| Peso al agregar ítem desde catálogo | Media |
| Level up: accesible desde la hoja del jugador sin XP | Media |
| Level up: conjuros, estilo de combate y enemigo predilecto | ✅ |
| Trasfondo visible en la hoja de personaje (tab Historia) | ✅ |
| HP lag en owner: update optimista faltaba en patchCharacter | ✅ |
| DM ve HP nivel 1 post-level-up: maxHpFor ahora lee sheet_json.max_hp | ✅ |
| Tooltip de inventario: recortado por overflow → reescrito con position fixed | ✅ |
| Log de combate integrado en panel de ataque del tablero | ✅ |
| Maniquí PNG reemplaza silueta SVG en paper doll | ✅ |
| Borrar campañas y personajes desde el dashboard | Media |
| Navegación: "volver" consistente en todas las pantallas | Baja |
| Feedback de guardado en la hoja (actualmente solo HP lo tiene) | Baja |
| Diseño visual del panel de cálculo de ataque | ✅ |
| Scrolls indeseados en el tablero y barra de scroll descentrada → solucionado dinámicamente en CampaignLayout | ✅ |
| Reemplazo de emojis genéricos por iconos SVG premium y personalizados en la barra de navegación de la campaña | ✅ |
| Configuración de fondos atmosféricos de pantalla específicos para cada pestaña del hub de campaña (Overview, PNJs, Hechizos, Comercio, Taberna, Habilidades) | ✅ |
| Reemplazo de emojis en la creación de personajes por retratos e ilustraciones premium | ✅ |
| Carga de 16 ilustraciones de trasfondos (Backgrounds) y optimización de todas las imágenes (resize 512px) | ✅ |
| Vitral tripartito en creación (75% clase/raza, 25% trasfondo) con sombreado de textos y glassmorphism | ✅ |
| Límite de estadísticas base a 15 y cálculo dinámico de modificadores de trasfondo | ✅ |
| Reemplazo de emojis de clases de D&D por avatares premium en todas las hojas y vistas | ✅ |

### 🛠 3. Tablero de Batalla, Creación de PNJ, Notas y Establo (Sesión 3)

| Item | Estado |
|------|--------|
| Color destacado en el CTA de fin de combate | ✅ |
| Color distintivo único por ficha en tablero y brillo interactivo en hover ficha-lista | ✅ |
| Optimización de sensibilidad de scroll y clamping de escala negativa en mapas pequeños | ✅ |
| Paneles laterales colapsables en la vista del DM | ✅ |
| Creación de PNJ: auto-escalado de HP máximo al cambiar nivel/clase | ✅ |
| Creación de PNJ: selector interactivo de raza con pestañas de Razas Clásicas (traducidas) y Monstruos desde la API de D&D 5e | ✅ |
| Creación de PNJ: selección de libro de conjuros desde la API de D&D | ✅ |
| Creación de PNJ: notas libres para equipamiento y pertenencias | ✅ |
| Creación de PNJ: agregar armas personalizadas y tirar daño de arma específico en popup de combate | ✅ |
| Diario de Campaña: pestaña interactiva "Notas" con notas públicas y privadas (CRUD + Supabase) | ✅ |
| Migración de Establos a la Taberna, con compra automática de monturas, cobro de monedas y registro de compra | ✅ |
| CA calculada automáticamente al equipar/desequipar armadura y escudo | ✅ |
| Conjuros: backfill de conocidos + sistema de preparados por clase (Mago/Clérigo/Druida/Paladín) | ✅ |
| Dado de daño de arma equipada en popup de combate (dice+stat via D&D API) | ✅ |
| HP sync en tiempo real para jugadores (Supabase Realtime en player-tablero) | ✅ |
| Agrupación de NPCs por encuentro generado + hover group en tablero | ✅ |

---

## 🗺 Features más grandes (largo plazo)

### Generador Procedural de Encuentros
- ✅ Arquetipos con pool de monstruos SRD (30 arquetipos, 6 entornos)
- ✅ Multi-select de arquetipos con chips y dropdown
- ✅ Tabla de composición editable con roles (Melee/Distancia/Magia/Soporte) y colores
- ✅ Cards individuales por criatura con retrato, stats, habilidades especiales con tooltip
- ✅ Nivel por unidad (independiente entre individuos de la misma especie)
- ✅ XP y HP escalados por nivel; dificultad pre-genera nivel relativo al grupo
- ✅ Botín procedural ajustable (monedas + ítems)
- ✅ Spawn al tablero con rol, retrato y nivel persistidos en BD
- ✅ Rol y nivel visibles en tokens de combate y panel de NPCs

### Mapas de sesión (Combat Grid, Zoom/Pan & AoE Templates)
- ✅ Subir imagen como mapa visible por el party.
- ✅ Solo el DM puede cambiarla.
- ✅ Tokens drag-and-drop en tiempo real.
- ✅ Cuadrícula de combate interactiva y zoomeable.
- ✅ Cálculo de distancia y rango de ataque (Melee, Arco, Lanzamiento).
- ✅ Proyección de áreas de efecto de hechizos (Esfera, Cubo, Línea) con detección de blancos en área.
- ✅ Resolución y log de combate con soporte para curaciones y daño multi-objetivo.
- ✅ Deducción automática de casillas de conjuro (spell slots) en base de datos.
- ✅ Clasificación y agrupado de conjuros por nivel en el panel de ataque.
- ✅ Bounding limits y clamping dinámico del popup de ataque para evitar overflow en pantalla.
- ✅ Refactorización y modularización del tablero de combate para una arquitectura limpia.
- ✅ Panel de cálculo de ataque interactivo y arrastrable (evita superposiciones del terreno).
- ✅ Flujo simplificado de targeting y right-click para jugadores con datos confidenciales del DM protegidos.
- ✅ Biblioteca de mapas (`Map Selector Modal`) con listado completo, miniaturas/thumbnails y carga.
- ✅ Modo exploración (tablero activo siempre) unificado con el modo combate.

### Historial de sesiones
- Lista de sesiones pasadas por campaña.
- Notas archivadas y consultables.

### Distribución de loot
- DM crea un "tesoro" con ítems del catálogo.
- Jugadores toman ítems → van directo a su inventario.
