# Roadmap — La Taberna de Martita

> Estado actual: MVP funcional en producción (`la-taberna-de-martita.quest`)

---

## Estado del MVP

| Área | Estado |
|------|--------|
| Auth (login, registro, recovery) | ✅ |
| Dashboard | ✅ |
| Creación de personaje (wizard D&D 5e API) | ✅ |
| Hoja de personaje (stats, hechizos, rasgos, pericias) | ✅ |
| Inventario con peso | ✅ |
| Estado de combate (HP optimista, CA, XP, condiciones) | ✅ |
| Retrato (subir o generar con IA) | ✅ |
| Campañas (crear, unirse por invite) | ✅ |
| Pantalla DM (iniciativa, NPCs, notas de sesión) | ✅ |
| Deploy producción + dominio custom + email | ✅ |

---

## 🎯 Prioridad actual: completar el Hub de Campaña

Fase 1 ✅ terminada (2026-05-14) — layout con tab-bar, landing nueva con cards detalladas de PJs/PNJs, migración de la Pantalla DM a la pestaña `Lucha`, skeletons de las 6 pestañas restantes.

Fase 2 ✅ terminada (2026-05-14) — tabla `npcs` + `npc_inventory` en prod, generador completo en `/campaigns/:id/pnj` con shape paralelo a `characters` (campos opcionales), render real en la landing, integración con `Lucha` vía botón **🎭 PNJ campaña** que copia el PNJ persistido al tracker de combate.

### 🍺 Fase 3 — Taberna ✅ terminada (2026-05-14)
- Catálogos hardcodeados: armería (armas + armaduras), pociones, objetos mágicos con precios SRD y pesos.
- Tab "Comprar": el DM (o el jugador para su propio PJ) selecciona un ítem, elige el personaje y confirma → descuenta oro de `sheet_json.currency` e inserta en `character_inventory`.
- Tab "Vender": muestra el inventario de cada PJ; el comerciante paga la mitad del precio de catálogo (mín. 1 PO) → item sale del inventario y se acredita el oro.
- Búsqueda/filtro por nombre dentro de cada categoría.

### 📦 Fase 4 — Objetos ✅ terminada (2026-05-14)
- Catálogo del 5e API vía `/equipment-categories/{id}` con 4 filtros: Armas, Armaduras, Equipo, Herramientas.
- Búsqueda por nombre client-side dentro de cada categoría.
- Panel lateral con detalle del ítem (CA, peso, costo, descripción) y acción "Dar ítem" → inserta en `character_inventory` sin transacción de oro.
- DM puede dar a cualquier PJ; jugadores solo a su propio personaje.

### ✨ Fase 5 — Hechizos embed *(próximo paso)*
- Extraer `<SpellbookPage/>` a componente reusable y montarlo en el tab.

### 😊 Fase 6 — Habilidades
- Referencia rápida para el DM: 18 skills, saving throws, `CONDITIONS`, descansos.

### 🗺 Fase 7 — Mapas
- v1: Supabase Storage + upload + display de imagen como mapa de sesión.
- v2 (post-MVP): tokens drag-and-drop, fog of war.

---

## ⚗️ Ítems personalizados por campaña *(feature GM)*

El DM puede crear ítems únicos atados a una campaña específica (no del catálogo SRD):
- Nombre, descripción, peso, precio, imagen custom
- **Propiedades especiales**: modificadores a stats (+2 STR, etc.), resistencias, bonus de CA, daño adicional, efectos de texto libre
- Disponibles en la Taberna de esa campaña y en el sistema de compraventa
- Persistidos en una tabla `campaign_items` (`campaign_id`, `name`, `description`, `weight_lbs`, `price_gp`, `properties` JSON, `image_url`)
- Los jugadores los ven como cualquier otro ítem del catálogo

---

## 🛒 Sistema de compraventa con aprobación del DM *(feature aparte, alta prioridad)*

El DM habilita un "Modo Tienda" en el inventario de un jugador. El flujo:
1. El jugador ve los items del catálogo (Taberna, Fase 3) disponibles para comprar.
2. Al seleccionar un item, envía una **solicitud de compra** al DM (precio ofrecido, cantidad).
3. El DM ve la solicitud en tiempo real en su pantalla → puede **aceptar** (transfiere oro + agrega item), **rechazar** (con mensaje), o **contra-proponer** precio (regateo).
4. El jugador ve el estado de su solicitud en vivo: pendiente / aceptado / rechazado / nuevo precio.

**Tabla nueva necesaria:** `purchase_requests` con campos `character_id`, `campaign_id`, `item_name`, `price_offered`, `quantity`, `status` (pending/accepted/rejected/countered), `dm_counter_price`, `dm_message`.

**Vinculado con Fase 3 (Taberna)** — los catálogos de la taberna alimentan la tienda del inventario.

---

## Otros pendientes (Sesión 2 feedback)

Bugs y mejoras independientes del hub:
- Al salir del personaje vuelve al dashboard en vez de a la campaña.
- Peso de objetos no aparece en la hoja de algunos PJs.
- Características: mostrar "Bonus de tirada" en vez de repetir el nombre.
- Oro cerca de las características (quick stats strip).
- XP: botón Enter al escribir, sumar al valor actual en vez de reemplazar.
- Objetos: cantidad con +/- (no input directo), peso al agregar.
- PG gestionable desde la pantalla DM (ya parcial).
- Level up: botón accesible desde la hoja del jugador.
- Slots de conjuros: restar al usar conjuro, botón de detalle más visible.
- Borrar campañas y personajes.

---

## Próximo paso lógico: lo que más duele ahora

### 🎲 Tirador de dados (prioridad alta)
No hay dados. Es una app de D&D sin dados — el gap más obvio.
- Tirador flotante: d4, d6, d8, d10, d12, d20, d100
- Historial de tiradas visible para todos en sesión (via Supabase Realtime)
- El GM ve las tiradas del party en la pantalla DM
- Tiradas con nombre ("Ataque con espada larga 1d20+5")

### 🔄 Realtime en sesión (prioridad alta)
Ahora el HP se sincroniza cada 5 segundos con polling.
- Reemplazar `refetchInterval: 5000` por Supabase Realtime channels
- GM ajusta HP → jugador ve el cambio al instante en su hoja
- Base para el chat y el dado compartido

### 💀 Spell slots (prioridad media)
Los personajes con magia no tienen dónde trackear sus slots.
- Slots por nivel (1–9) con contador de usados / disponibles
- Botón de descanso corto / largo para recuperarlos
- Guardado en `characters.sheet_json` (ya existe el campo)

### ⚔️ Descanso corto / largo (prioridad media)
Mecánica core de D&D 5e que falta completamente.
- Descanso corto: recuperar slots de Brujo, Dados de Golpe
- Descanso largo: recuperar todo el HP y slots
- Disponible desde la hoja de personaje y desde la pantalla DM

### 💀 Tiradas de muerte (prioridad media)
Cuando HP llega a 0:
- Modal con 3 círculos de éxito / 3 de fallo
- Guardado en `characters.sheet_json`
- GM lo ve en la pantalla DM

---

## Mejoras UX que no requieren backend

- **Onboarding**: pantalla de bienvenida para usuarios nuevos (sin personajes/campañas)
- **Móvil**: la hoja de personaje no está pensada para pantalla chica
- **Skeleton loaders**: reemplazar "Cargando..." por placeholders animados
- **Error boundaries**: si una query falla, mostrar mensaje útil en lugar de pantalla rota
- **"Sign out" → "Cerrar sesión"**: el botón está en inglés
- **Navegación**: falta botón "volver" en pantalla DM y en wizard
- **Feedback de guardado**: la hoja no avisa cuándo guardó (solo el HP tiene indicador)

---

## Features más grandes (post-MVP)

### 🗺 Mapas
- Subir imagen como mapa de sesión
- Visible para el party (solo GM puede cambiarla)

### 📖 Bestiario
- Buscar monstruos de D&D 5e API ("Goblin", "Dragon Rojo")
- Agregar al tracker de iniciativa desde el resultado con un click
- Reemplaza el input manual "Goblin 25"

### 💬 Chat de sesión
- Canal de texto por sesión
- GM puede hacer anuncios destacados
- Las tiradas de dado aparecen acá automáticamente

### 📜 Historial de sesiones
- Lista de sesiones pasadas por campaña
- Las notas de sesión quedan archivadas y son consultables

### 🎒 Distribución de loot
- GM crea un "tesoro" con items del catálogo
- Jugadores pueden tomar items y van directo a su inventario

### 📄 Export PDF
- Hoja de personaje exportable como PDF estilo D&D

---

## Deuda técnica

- `CONDITIONS_ES` / `CONDITIONS` duplicado en character sheet y session screen → extraer a `lib/dnd-constants.ts`
- `XP_THRESHOLDS` hardcodeado → mover al mismo lugar
- Sin tests (ni unit ni e2e)
- Sin Sentry (error monitoring — estaba en el roadmap original)
- Sin GitHub Actions CI (deploy es manual via push a main)
