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

## 🎯 Próximas prioridades (Propuestas Futuras)

### 🎲 1. Dado compartido e interactivo (1-Way Player-to-DM)
Sincronización de dados en mesa integrada al tablero de combate del DM (documentado detalladamente en [shared-dice-proposal.md](file:///Users/joaquinnader/Documents/web/personales/dungeonsanddragons/tavern-app/docs/shared-dice-proposal.md)):
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

---

## 🗺 Features más grandes (largo plazo)

### Mapas de sesión (Combat Grid, Zoom/Pan & AoE Templates)
- ✅ Subir imagen como mapa visible por el party.
- ✅ Solo el DM puede cambiarla.
- ✅ Tokens drag-and-drop en tiempo real.
- ✅ Cuadrícula de combate interactiva y zoomeable.
- ✅ Cálculo de distancia y rango de ataque (Melee, Arco, Lanzamiento).
- ✅ Proyección de áreas de efecto de hechizos (Esfera, Cubo, Línea) con detección de blancos en área.
- ✅ Resolución y log de combate con soporte para curaciones y daño multi-objetivo.

### Historial de sesiones
- Lista de sesiones pasadas por campaña.
- Notas archivadas y consultables.

### Distribución de loot
- DM crea un "tesoro" con ítems del catálogo.
- Jugadores toman ítems → van directo a su inventario.
