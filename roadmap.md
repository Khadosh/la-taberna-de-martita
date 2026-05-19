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
| Taberna (compraventa entre PJs) | ✅ |
| Tirador de dados flotante | ✅ |
| Visual overhaul: papiro, cuero, latón, wax seals | ✅ |
| Realtime sync (HP, condiciones) | ✅ |
| Deploy producción + dominio custom + email | ✅ |

---

## 🎯 Próximas prioridades

### 🎨 Visual — Pulido pendiente (corto plazo)
Continuación del overhaul visual iniciado en v1.0.0:
- ✅ **Ajuste fino del papiro**: balance entre textura visible y legibilidad en todos los tabs
- ✅ **Wax seals**: PNG real, tooltip combinado, botón de quitar más visible
- ✅ **Tab Pericias**: contraste y bordes ajustados al lenguaje visual del pergamino
- ✅ **Inventario**: rediseño con madera y chapas metálicas (`darkFrameStyle`)
- ✅ **Tab Hechizos**: lenguaje visual aplicado (spell slots con gradiente latón, colores cálidos)
- ✅ **Tab Historia**: consistencia visual con SheetRow
- ✅ **Emojis → SVGs**: todos los tabs, botones y acciones usan SVGs inline acordes al pergamino
- ✅ **Tiradas de salvación**: unificadas en stat boxes del Tab Resumen (mod + proficiency)
- **Tab Hechizos**: integrar spell slots con el sistema de paper doll (pendiente)

### ⚔️ Combate — siguiente iteración

#### Tablero compartido jugadores ↔ DM
- ✅ Tab "Tablero" unificado visible para DM y jugadores (reemplaza "Combate" + "Mapas")
- ✅ Tab Combate/Tablero accesible para jugadores (con su ficha movible)
- ✅ Posiciones de tokens persistidas en `board_tokens` y sincronizadas via Supabase Realtime
- ✅ Jugadores mueven su propia ficha; DM mueve cualquier ficha
- ✅ Coordenadas normalizadas (0-1) para consistencia entre pantallas de distinto tamaño
- Pendiente: NPCs ocultos (`is_hidden`) — jugadores no ven fichas con `is_hidden: true`
- Pendiente: HP de enemigos visible/oculto por configuración del DM

#### HP de NPCs desde el tablero
- ✅ Panel lateral derecho con -5/-1/+1/+5 y HP directo por cada NPC activo
- ✅ Botón de eliminar del combate desde el panel lateral
- Pendiente: click en token del tablero → panel flotante inline (más directo que el sidebar)

### 📦 Features de juego (mediano plazo)

#### Dado compartido en sesión
El tirador flotante existe pero las tiradas no son visibles para el resto de la mesa.
- Historial de tiradas visible para todos los conectados a la campaña (Supabase Realtime)
- El DM ve las tiradas del party en la pantalla DM
- Tiradas con etiqueta: "Ataque +3", "Salvación DES", etc.

#### Spell slots integrados al paper doll
- Mostrar slots disponibles/usados desde el panel de inventario
- Click en un slot de hechizo para marcarlo como usado
- Reset en descanso largo (ya existe el handler)

#### Items personalizados por campaña
El DM puede crear ítems únicos atados a la campaña:
- Nombre, descripción, peso, precio, propiedades especiales (`properties` JSON)
- Disponibles en la Taberna de esa campaña
- Tabla `campaign_items` (`campaign_id`, `name`, `properties` JSON)

#### Sistema de compraventa con aprobación del DM
- Jugador envía solicitud de compra → DM acepta/rechaza/contra-propone
- Tabla `purchase_requests` con status (pending/accepted/rejected/countered)

### 🔧 Bugs y UX pendientes (Sesión 2 feedback)

| Item | Estado | Prioridad |
|------|--------|-----------|
| Al salir del personaje: volver a la campaña, no al dashboard | Pendiente | Alta |
| XP: sumar al valor actual (no reemplazar) | ✅ Ya implementado | — |
| Objetos: cantidad con +/- al hacer click | ✅ Ya existe en panel de detalle | — |
| Peso al agregar ítem desde catálogo | ✅ Ya implementado | — |
| Level up: accesible sin XP | ✅ No necesario (wizard ya accesible) | — |
| Borrar personajes desde el dashboard | ✅ Ya existe | — |
| Borrar campañas desde el dashboard | Pendiente | Media |
| Navegación: "volver" consistente en todas las pantallas | Pendiente | Baja |
| Feedback de guardado en la hoja (actualmente solo HP lo tiene) | Pendiente | Baja |

### 🗺 Features más grandes (largo plazo)

#### Tablero de Juego (ex Mapas + Combate)
- ✅ **V1**: Tab unificado visible para DM y jugadores; mapa dinámico (upload a Storage); tokens sincronizados via Realtime; jugadores mueven su propia ficha
- **V2 — Tokens compartidos con iniciativa visible**: mostrar el turno activo a los jugadores; sincronizar el estado de combate (activo/inactivo, turno actual) en Supabase
- **V3 — Fog of war**: máscara oscura sobre el mapa; DM revela zonas progresivamente

#### Historial de sesiones
- Lista de sesiones pasadas por campaña
- Notas archivadas y consultables

#### Distribución de loot
- DM crea un "tesoro" con ítems del catálogo
- Jugadores toman ítems → van directo a su inventario

#### Chat de sesión
- Canal de texto por campaña
- Tiradas de dado aparecen automáticamente
- GM puede hacer anuncios destacados

#### Export PDF
- Hoja de personaje como PDF estilo D&D oficial

---

## Deuda técnica

| Item | Urgencia |
|------|----------|
| Sin tests (unit ni e2e) | Media |
| Sin Sentry / error monitoring | Media |
| Sin GitHub Actions CI (deploy manual via push main) | Baja |
| Componentes de hoja grandes (`$characterId.tsx` > 500 líneas) | Baja |
| `agents.md` desactualizado (refleja estado inicial del proyecto) | Baja |

---

## Descartado / ya no aplica

- SSR / TanStack Start → app 100% autenticada, sin SEO, SPA es suficiente
- Drizzle en runtime → Supabase client directo con tipos generados
- `CONDITIONS_ES` duplicado → ya centralizado en `lib/dnd-constants.ts`
