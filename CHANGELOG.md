# Changelog — La Taberna de Martita

Todos los cambios notables ordenados cronológicamente, reflejando la evolución desde el setup inicial hasta las sesiones de juego reales.

---

## [Unreleased]

### feat
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
