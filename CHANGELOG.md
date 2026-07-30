# Changelog — La Taberna de Martita

Todos los cambios notables ordenados cronológicamente, reflejando la evolución desde el setup inicial hasta las sesiones de juego reales.

---

## [Unreleased]

### feat
- **Internacionalización**: módulo propio tipado en `src/i18n/`. El catálogo español es la fuente de verdad y el inglés se tipa contra él (`Record<TranslationKey, string>`), así que una traducción faltante rompe el typecheck en vez de renderizar la clave cruda en producción. Incluye interpolación `{nombre}`, plurales por sufijo `_other`, persistencia, selector ES/EN y sincronización del atributo `lang` del documento — que además es requisito de accesibilidad, porque los lectores de pantalla eligen la voz a partir de él. Login migrado y verificado en ambos idiomas; quedan 57 archivos.
- **Términos del SRD localizados** (`src/lib/dnd-terms.ts`): los nombres de las 18 pericias y de las 6 características estaban duplicados como mapas `SKILL_NAMES_ES` en cuatro archivos y `STAT_LABELS` en dos más. Ahora son un único mapa `Localized` que se resuelve con `useLoc()`. No van al catálogo de `src/i18n/` porque no son texto de interfaz sino contenido de juego indexado por la clave del SRD (`animal-handling`, `sleight-of-hand`), igual que los trasfondos.
- **Modal de subida de nivel y fila de PV/CA/PX traducidos**: incluye la mejora de características, la pista de PV con el rango y el promedio, y los tooltips de competencia con armadura.
- **Wizard de creación y módulo de PNJs traducidos**: los pasos 2 a 6 (atributos, competencias, conjuros, resumen), el modal de detalle de raza/clase/trasfondo, el formulario de PNJ completo y las tarjetas de PNJ. Con esto no queda texto de interfaz sin traducir.
- **Razas y clases localizadas** (`RACE_NAMES`, `CLASS_NAMES` en `src/lib/dnd-terms.ts`): las 9 razas jugables y las 12 clases del SRD. `localizedTerm()` acepta tanto el índice del SRD (`half-orc`) como el nombre ya formateado (`Half-Orc`) y devuelve el valor original si no lo conoce — así un monstruo usado como raza de PNJ sigue funcionando sin tener que traducir 300 criaturas.
- **Seed de desarrollo** (`supabase/seed.sql`): campaña jugable con DM, dos jugadores, tres personajes de clases distintas con inventario y equipo puesto, PNJs, encuentro sobre el tablero y notas. Se aplica con `supabase db reset`.

### fix
- **Accesibilidad: 100% de controles accesibles** (medido con `scripts/audit-a11y.mjs` sobre 11 rutas).
  - Las 128 tarjetas de selección del wizard eran `<div onClick>` con el botón de info anidado adentro: no recibían foco, no respondían a Enter ni Espacio, y anidaban un control dentro de otro. Reescritas como radios nativos dentro de `<label>` en `selection-card.tsx` — navegación con flechas, agrupación y anuncio de estado sin JavaScript. De paso desaparecieron los `e.stopPropagation()` que hacían falta por el anidamiento.
  - `aria-label` en los 6 campos de estadísticas del formulario de PNJ, los 2 filtros del grimorio, el tamaño de celda del tablero, el nivel del wizard y el botón de apariencia de los dados.
- **Cobertura de íconos del SRD: 86% → 99%** (291 de 294 ítems). La cascada semántica exigía palabra completa, así que `Greatclub`, `Dancing Sword`, `Armor, +1` y 38 más caían al emoji. Se agregaron redes de último recurso al final de la cascada, donde no interfieren con las reglas específicas.

### refactor
- **Sistema de íconos migrado de BG3 a game-icons.net**: se eliminaron los 3.328 assets scrapeados de Baldur's Gate 3 (45 MB, licencia dudosa) y los mapas `bg3-icon-map.ts` / `bg3-spell-map.ts` (3.045 entradas). En su lugar, 129 SVGs de [game-icons.net](https://game-icons.net) bajo CC-BY-3.0 (536 KB), generados por `scripts/build-game-icons.mjs`.
  - La resolución pasa a ser **puramente semántica**: 111 conceptos de equipo, 16 trasfondos y 8 escuelas de magia. Los conjuros se resuelven por escuela en vez de por nombre — el SRD tiene 300+ hechizos pero solo 8 escuelas.
  - Nuevo componente `GameIcon`: renderiza el SVG como máscara CSS sobre `bg-current` en vez de `<img>`, así el ícono hereda el color del tema y el mismo asset lee bien sobre pergamino claro y madera oscura. Antes eran PNGs de color fijo.
  - El chunk `item-icons` (233 KB) desaparece del bundle.

### chore
- **Optimización de `public/`: 94 MB → 14 MB.**
  - Eliminados 15 MB de assets huérfanos sin ninguna referencia en el código: 10 sprite sheets de íconos (`armor.png`, `jewelry.png`, `weapons.png` y 7 más), `races/miniaturas.png`, `pnj_bg.png`, `tavern_bg.png`, `comercio_bg.png` y `Fondo DM.png`.
  - Las 29 ilustraciones sin canal alfa se recomprimieron a JPEG (26 MB → 12 MB) vía `scripts/optimize-images.mjs`. Eran arte generado guardado como PNG, que para imagen fotográfica pesa ~1 byte por píxel. Las 26 que tienen transparencia se conservan como PNG.
  - `wax seal (1).png` renombrado a `wax-seal.png`: los espacios y paréntesis obligaban a escapar la URL en cada uso.

### docs
- **Capturas reproducibles en ambos idiomas** (`scripts/capture-screenshots.mjs`): 17 pantallas contra el stack local, a `docs/screenshots/{es,en}/`. El idioma se fija con `addInitScript` antes de que arranque React — sin eso el navegador headless lo deduce de `navigator.language` y las capturas dejan de ser comparables entre corridas.
  - Incluye el flujo de subida de nivel con sus **dos actores**: el DM otorga la experiencia (el botón `+ XP` solo existe para él) y el jugador decide qué gana con ella. El script no confirma la subida a propósito, así el seed queda estable y se puede volver a correr sin resetear la base.
  - El otorgamiento calcula la **diferencia hasta el umbral**, no una cantidad fija: el DM solo puede sumar experiencia, así que un delta fijo la haría crecer en cada corrida hasta dejar la captura con un número absurdo. Si detecta que la ficha ya viene de otra corrida, avisa que hay que resetear el seed.
- **Comparación con D&D Beyond** (`docs/dnd-beyond-comparison.md`): borrador de trabajo con los hallazgos de haber usado D&D Beyond en mesa real para contrastarlo contra esta app. Registra la tesis (ficha como documento vs. ficha como escena; entre sesiones vs. mesa en vivo), los 7 hallazgos ordenados por qué tan bien aguantan una repregunta, y las secciones obligatorias de dónde gana D&D Beyond y de asimetría de escala.
- **Roadmap de ingeniería**: agregada una sección con las fases 0 a 4 (higiene defensiva, motor de reglas como paquete puro, verificabilidad con tests + CI, sistemas distribuidos y accesibilidad, internacionalización), cada una con criterio de "terminado cuando". Documenta el trabajo que no agrega features pero hace el proyecto verificable.
- **Licencia y atribuciones**: agregado `LICENSE` (MIT) para el código propio y `ATTRIBUTIONS.md` con la atribución literal que exige CC-BY-4.0 para el SRD 5.1, más las fuentes de la API de reglas, tipografías y assets 3D. El README incorpora la nota de atribución y el disclaimer de no afiliación con Wizards of the Coast. Antes de esto el proyecto incumplía la licencia del SRD.
- **Paths locales filtrados**: `roadmap.md` linkeaba a `shared-dice-proposal.md` con una URL `file:///Users/...` absoluta y `.claude/skills/run/SKILL.md` hardcodeaba el home del autor. Ambos ahora son relativos / `$HOME`.

### refactor
- **Split `custom-item-form.tsx`** de 602 a 313 líneas: `custom-item-form-state.ts` (tipos, `EMPTY_FORM`, `formToProperties`, `itemToForm` y las constantes de clases), `custom-item-image-panel.tsx` (subida y generación de imagen) y `custom-item-spells-editor.tsx` (tabla de hechizos con autocomplete).
- **Split `$campaignId.comercio.tsx`** de 599 a 79 líneas: `comercio/use-comercio.ts` (estado, queries y las transacciones de compra/venta), `comercio/comercio-buy-tab.tsx` y `comercio/comercio-sell-tab.tsx`.
- **Split `$campaignId.taberna.tsx`** de 553 a 87 líneas: `taberna/use-taberna.ts` (estado, queries, consumo de servicios y compra en establos), `taberna/taberna-menu-list.tsx` y `taberna/taberna-checkout-panel.tsx`.
- Con esto ningún archivo del proyecto viola la regla de 500 líneas de `CLAUDE.md`.

### fix
- **Asteriscos literales en Comercio**: el texto del 50% de reventa usaba sintaxis Markdown dentro de JSX, así que se renderizaba como `**50% de su valor...**`. Ahora usa `<strong>`.
- **Posiciones de fichas al reconectar**: al conectarse al tablero, las fichas ahora aparecen donde quedaron en la sesión anterior. El load inicial de `board_tokens` ahora también puebla `externalPositions` con los `x`,`y` guardados en DB (antes solo se actualizaba por eventos Realtime UPDATE). Además, el effect que aplica posiciones externas usa `requestAnimationFrame` para reintentar si el board aún no tiene ancho medido.

### feat
- **Drag en tiempo real bidireccional**: el movimiento de fichas se transmite en ambas direcciones. Jugadores ven el drag del DM (feature anterior) y el DM + otros jugadores ven el drag de cada jugador sobre su propia ficha. El canal `campaign-board` recibe `token-dragging` de todos; el DM mergea `livePositions` (broadcast) sobre `externalPositions` (DB) antes de pasarlas al board.

### feat
- **Drag en tiempo real para jugadores**: el movimiento de fichas del DM ahora se transmite a jugadores durante el drag (no solo al soltar). Usa Supabase broadcast con throttle de 40ms (~25fps), cero escrituras a DB durante el arrastre. `use-board-interaction` emite `onTokenDragging` → `use-combat-broadcast` lo envía como evento `token-dragging` → `player-tablero` lo aplica a `externalPositions` inmediatamente.

### refactor
- **Split `use-dm-tablero.ts`** de 638 a 396 líneas extrayendo tres módulos: `use-tablero-data.ts` (queries, realtime y helpers de HP), `use-combat-broadcast.ts` (canal Supabase Realtime para sincronización con jugadores) y `tablero-board-utils.ts` (funciones puras async para DB de board_tokens). `LogEntry` movido a `tablero-types.ts`.

### refactor
- **Auditoría y limpieza de CLAUDE.md**: documentadas features faltantes (Hub de Campaña, PNJ Generator, BG3 icon system, loot profiles, reset-password), corregida descripción del wizard de creación de personaje (Vitral es la columna de preview, no el layout completo), regla 500 líneas con excepción para auto-generados, reglas de commits unificadas, link a design-system corregido a ruta relativa.
- **Split de `step1-basic-info.tsx`**: extraídas constantes de flavor a `step1-constants.ts` y componentes `DetailModal`/`TraitItem` a `detail-modal.tsx`. Archivo reducido de 708 a 481 líneas.
- **Eliminados exports vacíos**: `parchmentStyle: {}` y `dmStyle: {}` removidos de `$campaignId.tsx`; import limpiado en `$campaignId.habilidades.tsx`.
- **Eliminado código muerto**: `step3-background.tsx` (background integrado en step1 desde hace varias sesiones).

### feat
- **Panel flotante de jugador en el tablero**: botón trigger con avatar del personaje pegado al borde derecho del board. Al hacer click se desliza un panel oscuro (340px) sobre el tablero sin reducir su tamaño. 4 tabs: Personaje (HP con controles ±1/±5, CA, stats grid, condiciones toggleables, equipamiento resumido), Inventario (InventoryPanel completo con drag & drop y paper doll), Conjuros (TabHechizos con preparados y spell slots), Notas (lista de campaña + formulario para agregar). El board queda siempre visible e interactivo detrás del panel.

### feat
- **HP sync en tiempo real para jugadores**: el tablero del jugador ahora suscribe a cambios en `characters` vía Supabase Realtime. Cuando el DM aplica daño o cura desde el tablero o la hoja, el HP del token del jugador se actualiza automáticamente sin recargar.
- **Agrupación de NPCs por encuentro generado**: los NPCs spawneados desde el generador de encuentros se agrupan visualmente en la barra lateral del DM con un header "EMBOSCADA GOBLIN" (nombre del arquetipo). Pasar el mouse sobre el header ilumina todos los tokens del grupo en el tablero simultáneamente. NPCs agregados individualmente siguen apareciendo sin grupo. Persiste en `board_tokens.spawn_group` y `archetype_label` (nueva migración).
- **Daño de arma en popup de combate**: el popup de ataque ahora consulta la API de D&D para obtener el dado de daño del arma equipada (`damage_dice`). Para ataques cuerpo a cuerpo usa STR, armas a distancia DEX, armas con fineza el mayor de STR/DEX. El botón de tirar daño ya genera el resultado automáticamente con modificador incluido.
- **Sistema de conjuros: conocidos + preparados**: pestaña Hechizos rediseñada con dos capas. Botón "＋ Conjuro" abre un panel modal con la lista completa de la clase para agregar/quitar conjuros conocidos (backfill para personajes ya creados). Para clases preparadas (Mago/Clérigo/Druida/Paladín) aparece un toggle ★ por hechizo no-cantrip con contador "X/Y preparados" (Y = stat relevante + nivel). Para clases conocidas (Ranger, Bardo, etc.) todos los conjuros aprendidos están siempre disponibles. El dropdown de combate usa `prepared_spells` si está definido, sino cae al listado completo.
- **CA automática al equipar armadura o escudo**: al comprar armadura desde el comercio, las notas del ítem se prefijan con la CA en el formato que `toggleEquip` interpreta (`CA 14 + DES (máx 2)` para media, `CA 16` para pesada, `Escudo +2` para escudos). Equipar el ítem desde la hoja actualiza automáticamente el valor de CA del personaje. Desequipar revierte la CA correctamente (armadura → base 10+DES; escudo → resta el bonus guardado en `sheet_json.shield_bonus`). El escudo se detecta por slot `off_hand` (más robusto que parsear el texto de las notas).

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
