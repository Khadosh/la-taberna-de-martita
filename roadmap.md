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
