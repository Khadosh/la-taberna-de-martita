# Changelog — La Taberna de Martita

Todos los cambios notables ordenados cronológicamente, reflejando la evolución desde el setup inicial hasta las sesiones de juego reales.

---

## [Unreleased]

### fix
- **Tokens del tablero no se reposicionan al colapsar paneles**: el `ResizeObserver` ahora rescala todas las posiciones de tokens proporcionalmente en cada cambio de tamaño del board. Los tokens siguen el resize suavemente durante la transición CSS sin necesidad de moverlos manualmente.

### feat
- **Panel NPC siempre visible**: el panel derecho de NPCs en el tablero del DM ya no requiere combate activo. Fuera de combate muestra los NPCs del tablero con controles de HP, toggle de visibilidad y botón de eliminar. Durante combate mantiene la vista completa con rol, CA, ataque y estado "Caído".
- **Ocultar NPCs a jugadores**: el DM puede togglear visibilidad por NPC con un ícono de ojo/ojo-tachado en la barra lateral. NPCs ocultos muestran rayado diagonal en el token (solo DM), son invisibles para jugadores. Estado persistido en `board_tokens.hidden` (migration). El ojo abierto indica visible; el ojo tachado en ámbar indica oculto.
- **NPCs caídos en combate**: los NPCs a 0 HP ya no desaparecen sino que se marcan visualmente como "Caídos" — tarjeta griseada con tachado, badge "Caído", overlay de calavera en portrait; token en tablero con opacidad reducida, grayscale y calavera. Los controles de HP siguen activos para permitir revivir. Hover sync token↔fila ya existía y se mantiene.
- **Icono de clase en tarjeta de personaje**: tamaño aumentado de `w-7 h-7` a `w-10 h-10`.

### fix
- **Oro excesivo en loot**: corregida escala de oro en todos los perfiles (30 arquetipos). `defaultGoldScale` cambiado de `Math.max(1, level)` a `1 + (level-1)*0.1`. Rangos de oro reducidos a valores D&D realistas (ej. `guardia-real` pasó de `[20,80]×5.4 = 108–432 po` a `[6,20]×1.2 = 7–24 po` a nivel 3).
- **Hechizos para cualquier NPC**: el modal de edición de criaturas del generador ahora muestra un editor de hechizos para cualquier criatura (no solo los predefinidos). Se pueden agregar hechizos escribiendo el índice y presionando Enter; los hechizos personalizados se propagan al spawn y quedan disponibles en el dropdown de combate. `customSpells` propagado a través de `CreatureRow` → `EncounterUnit` → `addNpcFromMonster`.

### feat
- **Expertise e Iconos en Pericias**: Soporte completo para Expertise (Especialización) en la hoja de personajes. Duplica el bono de competencia en tiradas de habilidades y herramientas. Se muestran dos diamantes dorados `◆◆` y el badge "Especialista" en los modificadores.
- **Backfill de Habilidades y Subclases**: Banner interactivo en `ClassChoicesPanel` que detecta y guía a personajes preexistentes o creados a alto nivel para autocompletar de forma retroactiva sus subclases y expertises faltantes.
- **Creador de Personajes y Subida de Nivel oficiales**: Restricción del selector de subclase en el creador al nivel oficial de la clase (D&D 5e). El modal de Level Up y el creador ahora manejan la selección de especializaciones (Expertise) basadas en el nivel del personaje.
- **Sistema de Loot por Arquetipo**: implementación completa del spec `loot-system-spec.md`. Tipos en `src/loot/types.ts`, función `rollLoot` con RNG inyectable en `src/loot/roll.ts`, 30 `LootProfile` temáticos cubriendo los 8 environments, ensamble en `src/loot/profiles/index.ts` con `getArchetypesWithLoot()`. Script de ingest one-shot en `scripts/ingest-loot.ts`. Campo `loot?: LootProfile` agregado al tipo `Archetype`.
- **Hechizos por defecto en NPCs mágicos**: los NPCs con índice de monstruo spellcaster (`mage`, `priest`, `cult-fanatic`, `druid`, `archmage`, `warlock`) reciben una lista de hechizos por defecto al spawnearse desde el generador de encuentros. El dropdown de conjuros del popup de combate ahora funciona para NPCs, mostrando sus hechizos agrupados por nivel igual que los personajes jugadores.

### refactor
- **Arquitectura de Hoja de Personaje modular (< 500 líneas)**: Separación de pasos de creación en `creation-steps/` (`step1` al `step6` + `primitives.tsx`) y extracción de consultas y handlers de `$characterId.tsx` al custom hook `use-character-sheet.ts`, reduciendo las vistas principales a menos de 350 líneas de maquetación limpia.

- **Generador de objetos custom**: formulario unificado en la pestaña "Creaciones" de Comercio (solo GM). Soporta nombre, descripción, tipo, rareza, bonus de ataque/CA, modificadores de stats, resistencias al daño, hechizos con cargas y recarga, bonus de velocidad, regeneración de HP, bonus de HP máximo y objetos malditos. Integrado a `character_inventory` con FK `custom_item_id`.
- **Imagen en objetos custom**: soporte para subir imagen o generarla con IA (fal.ai FLUX). La URL temporal se convierte a base64 en el cliente antes de guardar para persistencia indefinida en la miniatura y el panel de detalle.
- **Asignación de objetos a personajes**: modal de selección de personaje desde el panel de Creaciones; requiere política RLS `inventory_all_dm` para que el GM pueda escribir en inventarios ajenos.
- Migración `custom_items`: tabla con propiedades jsonb (bonuses, hechizos, maldición, etc.) y FK en `character_inventory`.
- Migración `inventory_dm_policy`: política RLS que permite al DM modificar el inventario de cualquier personaje de su campaña.
- **Generador Procedural de Encuentros**: rediseño de selectores e incorporación de 38 íconos SVG temáticos para las 8 zonas y los 30 arquetipos de encuentros.
- **Dropdown de Zona en Rejilla**: selector de Zona rediseñado como un menú flotante de cuadrícula con marcos circulares, íconos y descripciones temáticas de cada entorno.
- **Tarjetas de Monstruo Clickables**: eliminación del botón "editar" en las tarjetas de monstruo, permitiendo abrir el modal de edición haciendo clic en cualquier parte de la tarjeta y mejorando la propagación de eventos en los botones de nivel.
- **Generador Procedural de Encuentros**: generación automática de encuentros D&D 5e por arquetipo, zona y dificultad. Multi-select de arquetipos con chips + dropdown. Tabla de composición editable con roles (Melee/Distancia/Magia/Soporte) y colores. Cards individuales por criatura con retrato, stats (STR/DEX/CON/INT/WIS/CHA), velocidad, habilidades especiales con tooltip, y nivel individual. XP y HP escalados por nivel. Botín procedural ajustable. Spawn al tablero con rol, retrato y nivel persistidos en `board_tokens.npc_level`.
- **Nivel por unidad en encuentros**: cada criatura individual en el generador puede tener su propio nivel (ya no afecta a toda la especie al modificarlo). El nivel pre-generado se basa en el promedio de nivel del grupo ± offset según dificultad.
- **Rol y nivel en tokens de combate**: badge circular con letra (M/D/G/S) inline con el nombre; nivel (Nv.N) visible en el token y en el card del panel derecho.
- Migración `board_tokens.npc_level`: columna `smallint` en Supabase para persistir el nivel del NPC entre sesiones de combate.

### style
- **Alineación de Selectores**: se unificaron las alturas de las etiquetas y de los selectores de Zona y Arquetipo a una altura fija de `h-[38px]` resolviendo la desalineación vertical en la interfaz.
- **Tarjetas de Monstruo a Color**: remoción del filtro de escala de grises en las tarjetas de monstruo, mostrándose a color por defecto y añadiendo un resplandor dorado/bronce de halo (`box-shadow`) al pasar el cursor.
- Unificación de layouts de campaña bajo el fondo global de mesa de madera (`board_bg.png`) y paneles de papiro flotantes con cuadrícula sepia de 24px (basado en la guía de diseño visual).
- Definición de tokens semánticos en el tema de Tailwind CSS v4 (`@theme` en `styles.css`) y utilidades (`bg-parchment-grid`, `bg-papyrus-texture`), eliminando el mix inconsistente de estilos en línea en React.
- Creación de la guía de estilo de referencia en `docs/design-system.md` y alineación de guías en `CLAUDE.md` y `AGENTS.md` (renombrado a mayúsculas para cumplir estándares).

### feat
- Tablero de combate: log de ataque integrado en el panel de cálculo — botones ✓ Pega / ✗ Falla + input de daño; confirmar aplica HP al objetivo automáticamente
- Tablero de combate: historial de combate colapsable en esquina inferior derecha (solo lectura, semi-transparente)
- Tablero de combate: `maxHpFor` lee `sheet_json.max_hp` primero para reflejar HP post-level-up correctamente en la vista del DM
- Inventario: tooltip de objetos equipados renderizado con `position: fixed` (escapa overflow); muestra nombre, peso y notas
- Inventario: objetos equipados sin icono muestran nombre en texto sobre el slot
- Paper doll: silueta humanoid reemplazada por imagen `maniqui.png` con `mixBlendMode: multiply`
- HP optimista para owner: `patchCharacter` aplica `setQueryData` antes del request a Supabase
- Fondo exclusivo para DM en la hoja de campaña (`Fondo DM.png`); jugadores siguen viendo el pergamino
- Level up: selector de conjuros conocidos para casters (Ranger, Bardo, Hechicero, Warlock) con buscador y filtro por nivel máximo casteable
- Level up: selector de Estilo de Combate para Ranger, Fighter y Paladin
- Level up: selector de Enemigo Predilecto para el Ranger
- Panel de elecciones pendientes en tab Resumen: aparece automáticamente cuando faltan selecciones de clase (estilo de combate, enemigo predilecto, conjuros) y permite completarlas sin resetear el nivel
- Trasfondo en tab Historia: muestra nombre, descripción, competencias en habilidades y herramienta del trasfondo elegido durante la creación; permite cambiarlo
- Rediseño visual del inventario con madera y chapas metálicas (`darkFrameStyle`)
- GACO auto-calculado por arma + proficiencia; badges de competencia clicables en tab pericias
- Tablero de combate visual: mapa `mapa_combate.png` con fichas circulares, drag libre, arco SVG de HP y flecha de ataque con cálculo integrado
- Layout 3 columnas en combate: PJs izquierda, tablero centro, NPCs derecha
- Panel lateral de NPCs en combate: controles -5/-1/+1/+5 de HP y botón de eliminar por cada NPC activo
- Fix de flash en HP optimista de jugadores: `refetchQueries` en lugar de `invalidateQueries` para borrar el override local recién cuando el servidor confirmó el dato
- **Tablero de Juego V1**: tab unificado (antes "Combate" + "Mapas") visible para DM y jugadores
  - DM puede subir imagen de mapa de fondo (Supabase Storage, bucket `campaign-maps`)
  - Mapa activo sincronizado en tiempo real para todos los conectados
  - Posiciones de tokens persistidas en tabla `board_tokens` y sincronizadas via Supabase Realtime
  - Jugadores pueden mover su propia ficha; DM puede mover cualquier ficha
  - Vista de jugador simplificada: solo el tablero, sin controles de combate
  - Mapa hardcodeado (`mapa_combate.png`) como fallback si no se subió ninguno

### refactor
- Pantalla de combate orientada exclusivamente a combate: eliminados header "Pantalla del DM", notas de sesión y botones de descanso largo/fin de combate
- Rutas `/lucha` y `/mapas` redirigen a `/tablero`

### fix
- Tirador de dados: eliminado flash blanco al abrir — canvas WebGL pre-montado en background, HDR servido localmente (sin request a GitHub), Environment envuelto en Suspense para evitar re-render al cargar
- Mobile layout, bugs de inventario y legibilidad en pergamino

### style
- Stat boxes: gradiente con luz desde arriba-derecha, carta levantada con sombra outward, badge semáforo (fondo oscuro + número pastel por tono rojo→neutro→verde según modificador)
- Textura de papiro actualizada
- Stat boxes con efecto latón gastado y puntadas decorativas entre tabs
- Wax seals con PNG real; condiciones con tooltip combinado; botón de quitar más visible
- Ajustes de contraste y bordes en tab pericias
- Highlight exterior de slots aumentado para mayor profundidad visual
- Panel de inventario: monedas compactas en borde superior, barra de filtro rediseñada, botón `+` metálico, barra de carga sin fondo sólido
- Paper doll: altura aumentada a 340px, bottom row con flex simétrico para CA badge centrado, slot extra vacío eliminado
- Tab Resumen: botón de nivel inactivo con texto y borde más oscuros para mayor contraste
- Fondo papiro visible al 100% (corregido el recorte de 105% que ocultaba el marco)
- Tab content con padding lateral para respirar dentro del marco del papiro
- Tiradas de salvación integradas en la chapa metálica de cada stat (modificador con proficiency + indicador ★ sal)
- Tiradas de salvación eliminadas del tab Pericias (unificadas en Resumen)
- FeatureCards: borde naranja reemplazado por box-shadow con profundidad
- Tab Pericias: indicadores de proficiencia como SVGs (diamante/círculo), colores cálidos, bordes unificados
- Tab Hechizos: spell slots con gradiente latón, colores de sección cálidos, bordes unificados
- Tab Historia: envuelto en SheetRow para consistencia visual con el resto
- SheetRow: bordes laterales eliminados (innecesarios con el nuevo padding del contenedor)
- Todos los emojis reemplazados por SVGs inline acordes al lenguaje visual del pergamino (tabs, dados, espada, bolsa, info, cierre, flecha, etc.)

### refactor
- `isMobile` state y resize listener eliminados; `sheetStyle` unificado para desktop y mobile
- `sheetStyleMobile` removido de imports y uso

### chore
- Eliminado `routeTree.gen.ts` auto-generado del repo

---

## [1.0.0] — 2026-05-17 · Paper Doll, Inventario BG3 y Visual Overhaul

El mayor salto visual y de UX desde el MVP. La hoja de personaje pasa de funcional a inmersiva.

### 🎨 Visual Overhaul — Estética BG3/Pergamino
- **Fondo papiro real**: textura `papiro.png` con `background-blend-mode: multiply` sobre base cálida; 105% zoom para ocultar bordes negros del PNG
- **Marco metálico**: múltiples `box-shadow` concéntricos simulan un marco de latón/cobre que "agarra" el pergamino
- **Tab bar de cuero**: gradiente marrón oscuro (#3a2410 → #271608) con tachones de latón en extremos via `radial-gradient` en `backgroundImage`; tab activo con subrayado dorado
- **Cajas de estadísticas metálicas**: efecto de chapa/latón embossed con bevel (inset box-shadow claro arriba-izq, oscuro abajo-der); escala de gris-marrón del cuerpo basada en el valor del stat (mayor valor = más cálido/claro); badge del modificador con color rojo→gris→verde según el valor
- **Frame de retrato**: triple borde inset tipo marco de cuadro + esquinas decorativas SVG en dorado
- **Sellos de cera SVG**: cada condición de D&D 5e tiene un sello único con color propio, ícono SVG embossed, brillo specular en 3 capas y sombra exterior; tooltip al hover, botón de quitar
- **SheetLabel mejorado**: texto e líneas en marrón cálido coherente con la paleta pergamino

### 🗂️ Paper Doll — Inventario Visual
- **Humanoid SVG**: figura dibujada con line-art en el panel de inventario derecho
- **11 slots de equipo**: cabeza, cuello, hombros, pecho, manos, cinturón, piernas, pies, anillo ×2, arma principal, offhand; iconos SVG propios por slot vacío
- **Drag & drop completo** (`@dnd-kit/core`): arrastrar item del inventario a slot del paper doll y viceversa; `PointerSensor` con distancia mínima 6px
- **Compatibilidad de slots**: durante el drag se destacan solo los slots compatibles con el ítem; slots incompatibles se opacan
- **SlotPickerModal**: cuando `inferSlot()` no puede determinar el slot, muestra un modal con los 11 slots para que el usuario elija; evita items que "desaparecen" del inventario
- **Desplazamiento de ítems**: equipar en un slot ocupado mueve el ítem existente a la mano contraria (si aplica) o lo desequipa
- **CA en paper doll**: muestra la CA actual del personaje sobre la figura
- **Doble-click**: toggle equip/desequip desde el inventario

### 🗃️ Catálogo de Equipo BG3
- **675 iconos BG3** descargados localmente desde `bg3.wiki` (3.4 MB)
- **Matching robusto**: normalización de nombres con comas invertidas, variantes `armor/armour`, word-boundary matching para evitar falsos positivos
- **Quick filters** por categoría (Armas, Armaduras, Equipo, Herramientas) en el catálogo
- **Buscar + agregar**: filtro client-side en tiempo real, agregar al inventario con un click

### 🗂️ Reorganización de Tabs
- **Fusión Resumen + Combate**: tab Combate eliminado; su contenido útil absorbido en Resumen
  - Fila de stats rápidos debajo de características: Ini | Vel | GACO | Perc. Pas. | Prof. | Sal.
  - GACO calculado como `profBonus + max(strMod, dexMod)`
  - Eliminados: "Dado de golpe", "DG disponibles" (redundantes)
- **Habilidades de clase con tabs por nivel**: en lugar de lista cascada, pestañas [Nv.1] [Nv.2 ★] [Subclase] que muestran solo el nivel seleccionado
- **Rasgos raciales**: removidos los badges de modificadores de habilidad (+2 CHA, etc.); conservados Darkvision y otros rasgos narrativos

### 🧹 Limpieza
- `tab-combate.tsx` eliminado (ya no existe el tab)
- Import huérfano `SkillDetail` removido de `tab-pericias.tsx`
- `QuickPill` y `ABILITY_LABELS` removidos de `$characterId.tsx` (ya no usados ahí)

---

## [0.9.0] — 2026-05-14 · Generador de PNJ Persistente

Los PNJ ahora son entidades persistentes de campaña, no estado efímero del tracker de combate.

### 🗄 Schema
- **Tabla `npcs`**: shape paralelo a `characters` pero todo opcional excepto `campaign_id` y `name`. Incluye `role` (antagonist / ally / neutral), `is_hidden` (villano sorpresa), stats default a 10s, max_hp / armor_class / attack_bonus / damage / conditions, `sheet_json` para extensiones.
- **Tabla `npc_inventory`**: paralela a `character_inventory` (name, weight_lbs, quantity, notes). Para loot al morir.
- **RLS**: DM full access en sus campañas; players SELECT sólo si `is_hidden = false`.
- **Realtime**: ambas tablas publicadas para sincronizar HP/condiciones/loot durante combate.

### 👤 Generador (`/campaigns/:id/pnj`)
- Form con secciones: Identidad / Características / Combate / Notas.
- Botón **🎲 Tirar (4d6dl)** que rerolea las 6 características.
- Modo creación y modo edición sobre el mismo form (click "Editar" carga el PNJ; "Cancelar edición" vuelve a creación).
- Lista de PNJs con chips de rol coloreados (antagonista rojo, aliado verde, neutral neutro), botón de eliminar con confirm inline.

### 📜 Landing
- Sección PNJs ahora renderiza los persistidos con role chip, barra de PG (si tiene max_hp), CA / bono de ataque / daño y modificadores de stats.
- Card linkea al generador en modo edición.

### ⚔️ Combate
- Nuevo botón **🎭 PNJ campaña** junto a Bestiario y Personalizado.
- Despliega buscador filtrable (por nombre, raza o rol); click agrega al tracker copiando stats + loot al combatant efímero.
- Sufijos numerados cuando el mismo PNJ se agrega varias veces.

---

## [0.8.0] — 2026-05-14 · Hub de Campaña con Pestañas DM

Rediseño de `/campaigns/:id` como hub del DM con barra de pestañas dedicadas para cada herramienta de partida.

### 🎨 Layout & Landing
- **Layout de Hub**: `/campaigns/:id` ahora es un layout con header (Dashboard + nombre + Pantalla DM) y tab-bar persistente sobre fondo pergamino cuadriculado.
- **Cards detalladas de PJs**: Reemplazo de las cards planas por tarjetas estilo hoja de personaje con esquinas decoradas — PG con barra, CA / Iniciativa / Percepción Pasiva, las 6 características con modificadores, Bonus de Competencia, GACO, Salvaciones, Rasgos de Clase y Espacios de Conjuro.
- **Sección PNJs**: Slot vacío en la landing con CTA al generador (placeholder hasta Fase 2).

### 🗂 Pestañas (rutas hijas, deep-linkables)
- `Lucha` — migración de la pantalla DM desde `/campaigns/:id/session`.
- `Generador de PNJ`, `Hechizos`, `Objetos`, `Habilidades`, `Taberna`, `Mapas` — skeletons navegables.
- **Hechizos** ya enlaza al `/spellbook` global como atajo.

### 🧹 Limpieza
- Eliminado `$campaignId_.session.tsx` (ruta huérfana sin layout compartido).

---

## [0.7.0] — 2026-05-14 · Feedback Sesión 1 & Compendio

Basado en el feedback de la primera sesión de juego real con el party.

### 📖 Compendio y Bestiario
- **Bestiario completo**: Nueva sección `/bestiary` con búsqueda de monstruos y stat blocks.
- **Spellbook**: Buscador global de conjuros con filtros por nivel, clase y escuela en `/spellbook`.
- **Integración en Combate**: Añadir monstruos desde el bestiario al tracker de iniciativa.

### 🛡️ Pantalla de DM
- **Calculadora de Ataque**: d20 mínimo necesario para impactar.
- **Gestión de Monedas**: Tracking de tesoro y loot (CP, SP, GP, PP) para NPCs.
- **NPCs Personalizados**: Form extendido con stats, tipo de criatura y loot específico.

### 🧙 Hoja de Personaje
- **Habilidades de Clase**: Rediseño total con `FeatureCard` expandible.
- **Inventario Compacto**: Nueva vista con sistema de monedas integrado.
- **Botones Rápidos**: -5/-1/+1/+5 HP sin abrir modal.
- **Wizard V2**: Paso de trasfondo + modo entrada manual de estadísticas.

---

## [0.6.0] — 2026-05-14 · Rebranding & Mecánicas Core

### 🎨 Rebranding
- El proyecto pasa a ser "La Taberna de Martita" con estética de taberna medieval.

### 🎲 Sistemas de Juego
- **Realtime Sync**: HP y condiciones sincronizados instantáneamente vía Supabase Realtime.
- **Spell Slots**: Tracking de espacios de conjuro (niveles 1-9) con persistencia.
- **Death Saves**: Tracker funcional con persistencia en `sheet_json`.
- **Descanso**: Botones para descanso corto (dados de golpe) y largo (recuperación total).

---

## [0.5.0] — 2026-05-13 · Producción & Dominio Custom

- **Deploy en Vercel**: `la-taberna-de-martita.quest`.
- **Dominio & Email**: Porkbun + Resend (SPF, DKIM, DMARC).
- **Auth Pro**: Password reset completo vía email.
- **SPA 404**: Fix via `vercel.json` rewrites.

---

## [0.4.0] — 2026-05-13 · Pantalla de DM

- **Tracker de Iniciativa**: Orden dinámico, turno actual, NPCs rápidos.
- **Notas de Sesión**: Autoguardado con debounce por campaña.
- **HP Optimista**: Daño/cura con feedback inmediato.

---

## [0.3.0] — 2026-05-13 · Hoja de Personaje Completa

- **Estética de Pergamino**: Bordes quemados, fondo crema, tipografía serif.
- **Retratos con IA**: `fal.ai` (Flux) vía Supabase Edge Functions.
- **Gestión de Combate**: HP, CA, Condiciones (17 estados en español), barra de XP.
- **Inventario**: Sistema de peso (`STR x 15`) y búsqueda en catálogo oficial.

---

## [0.2.0] — 2026-05-13 · Campañas & Personajes Base

- **Campañas**: Crear y unirse por link de invitación (`/join/:id`).
- **RLS**: DM con permisos de escritura sobre HP/Condiciones de PJs de su campaña.

---

## [0.1.0] — 2026-05-13 · Wizard de Creación de Personaje

- **Wizard Multi-paso**: Flujo guiado con D&D 5e API (razas, clases, trasfondo, equipo inicial).
- **sheet_json**: JSONB flexible para estado complejo sin sobrecargar el schema relacional.

---

## [0.0.1] — 2026-05-12 · Auth & Setup

- **Stack**: React 19, TanStack Router, TanStack Query, Tailwind v4.
- **Supabase**: Cliente singleton, tipos TS generados, RLS base.
- **Dev Workflow**: Husky + Commitlint (Conventional Commits).
- **Schema DB**: Tablas iniciales para perfiles, campañas y personajes.
