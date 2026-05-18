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
- **Tab Hechizos**: aplicar lenguaje visual + integrar spell slots con el sistema de paper doll

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

| Item | Prioridad |
|------|-----------|
| Al salir del personaje: volver a la campaña, no al dashboard | Alta |
| XP: sumar al valor actual (no reemplazar) | Alta |
| Objetos: cantidad con +/- (no input directo) | Media |
| Peso al agregar ítem desde catálogo | Media |
| Level up: accesible desde la hoja del jugador sin XP | Media |
| Borrar campañas y personajes desde el dashboard | Media |
| Navegación: "volver" consistente en todas las pantallas | Baja |
| Feedback de guardado en la hoja (actualmente solo HP lo tiene) | Baja |

### 🗺 Features más grandes (largo plazo)

#### Mapas de sesión
- Subir imagen como mapa visible por el party
- Solo el DM puede cambiarla
- v2 (post-MVP): tokens drag-and-drop, fog of war

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
