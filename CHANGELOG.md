# Changelog — La Taberna de Martita

Todos los cambios notables ordenados cronológicamente, reflejando la evolución desde el setup inicial hasta las sesiones de juego reales.

---

## [0.8.0] — 2026-05-14 · Hub de Campaña con Pestañas DM

Rediseño de `/campaigns/:id` como hub del DM con barra de pestañas dedicadas para cada herramienta de partida.

### 🎨 Layout & Landing
- **Layout de Hub**: `/campaigns/:id` ahora es un layout con header (Dashboard + nombre + Pantalla DM) y tab-bar persistente sobre fondo pergamino cuadriculado.
- **Cards detalladas de PJs**: Reemplazo de las cards planas por tarjetas estilo hoja de personaje con esquinas decoradas — PG con barra, CA / Iniciativa / Percepción Pasiva, las 6 características con modificadores, Bonus de Competencia, GACO, Salvaciones, Rasgos de Clase y Espacios de Conjuro.
- **Sección PNJs**: Slot vacío en la landing con CTA al generador (placeholder hasta Fase 2).

### 🗂 Pestañas (rutas hijas, deep-linkables)
- `Lucha` — migración de la pantalla DM (1100+ líneas: iniciativa, NPCs, bestiary picker, notas, calc. de ataque, descansos) desde `/campaigns/:id/session` a `/campaigns/:id/lucha`.
- `Generador de PNJ`, `Hechizos`, `Objetos`, `Habilidades`, `Taberna`, `Mapas` — skeletons navegables con tarjeta "Próximamente" + descripción del roadmap.
- **Hechizos** ya enlaza al `/spellbook` global como atajo.

### 🧹 Limpieza
- Eliminado `$campaignId_.session.tsx` (ruta huérfana sin layout compartido).
- Header propio de la pantalla DM reducido a action bar (descanso largo + combate); la navegación la aporta el layout.

---

## [0.7.0] — 2026-05-14 · Feedback Sesión 1 & Compendio

Basado en el feedback de la primera sesión de juego real con el party.

### 📖 Compendio y Bestiario
- **Bestiario completo**: Nueva sección `/bestiary` con búsqueda de monstruos de D&D 5e API y visualización de stat blocks (HP, CA, acciones, habilidades).
- **Spellbook (Libro de Hechizos)**: Buscador global de conjuros con filtros por nivel, clase y escuela en `/spellbook`.
- **Integración en Combate**: Posibilidad de añadir monstruos directamente desde el bestiario al tracker de iniciativa del DM.

### 🛡️ Pantalla de DM (Mejoras)
- **Calculadora de Ataque**: Indicador del d20 mínimo necesario para impactar basado en el bono de ataque del NPC vs CA del objetivo.
- **Gestión de Monedas**: Tracking de tesoro y loot (CP, SP, GP, PP) para NPCs.
- **NPCs Personalizados**: Formulario extendido para crear NPCs con stats, tipo de criatura y loot específico.
- **Visibilidad**: Fix de privacidad en notas y limpieza de interfaz para el GM.

### 🧙 Hoja de Personaje & Wizard
- **Habilidades de Clase**: Rediseño total con `FeatureCard` expandible para leer detalles de rasgos y subclases.
- **Inventario Compacto**: Nueva vista de inventario optimizada con sistema de monedas integrado.
- **Botones Rápidos**: Acceso directo para curar o dañar HP sin abrir el modal.
- **Wizard V2**: Añadido paso de trasfondo (Background) y modo de entrada manual de estadísticas (Standard Array / Point Buy / Manual).

---

## [0.6.0] — 2026-05-14 · Rebranding & Mecánicas Core

### 🎨 Rebranding Atmosférico
- **Nueva Identidad**: El proyecto pasa de ser una app genérica a "La Taberna de Martita".
- **Visuales**: Reemplazo de iconos genéricos por señales de taberna colgantes, favicons personalizados y estética de madera/hierro.
- **UX Móvil**: Primera ronda de ajustes responsivos para que la hoja sea usable en teléfonos.

### 🎲 Sistemas de Juego Avanzados
- **Realtime Sync**: Sincronización instantánea de HP y condiciones entre DM y Jugadores vía Supabase Realtime (adiós al polling).
- **Spell Slots**: Sistema de tracking de espacios de conjuro (niveles 1-9) con persistencia en DB.
- **Mecánicas de Descanso**: Implementación de botones para Descanso Corto y Largo, automatizando la recuperación de HP y slots.
- **Death Saves**: Tracker de tiradas de salvación contra la muerte funcional cuando el personaje cae a 0 HP.

---

## [0.5.0] — 2026-05-13 · Producción & Dominio Custom

- **Deploy en Vercel**: Configuración de entorno de producción (`la-taberna-de-martita.quest`).
- **Dominio & Email**: Integración con Porkbun y Resend para emails transaccionales (SPF, DKIM, DMARC).
- **Auth Pro**: Flujo de recuperación de contraseña (password reset) completamente funcional vía email.
- **Infra**: Fix de SPA 404 en refresh mediante `vercel.json` con rewrites.

---

## [0.4.0] — 2026-05-13 · Pantalla de DM

- **Ruta de Sesión**: Panel exclusivo para el Game Master con vista de party completa.
- **Tracker de Iniciativa**: Sistema de orden dinámico, resaltado de turno actual y soporte para NPCs rápidos.
- **Notas de Sesión**: Editor con autoguardado (debounce 1.5s) persistente por campaña.
- **HP Optimista**: Sincronización de daño/cura con feedback inmediato en la pantalla del DM.

---

## [0.3.0] — 2026-05-13 · Hoja de Personaje Completa

- **Estética de Pergamino**: Rediseño visual con bordes quemados, fondo crema y tipografía serif.
- **Retratos con IA**: Integración con `fal.ai` (Flux) vía Supabase Edge Functions para generar retratos basados en raza/clase.
- **Gestión de Combate**: HP, CA, Condiciones (17 estados en español) y barra de XP con umbrales de nivel (1-20).
- **Inventario**: Sistema de peso (`STR x 15`) y búsqueda en catálogo oficial de equipo.

---

## [0.2.0] — 2026-05-13 · Campañas & Personajes Base

- **Sistema de Campañas**: Creación de campañas y links de invitación (`/join/:id`).
- **Gestión de Miembros**: Los jugadores pueden unir sus personajes a campañas.
- **Seguridad (RLS)**: El DM tiene permisos de escritura sobre HP/Condiciones de los personajes de su campaña.

---

## [0.1.0] — 2026-05-13 · Wizard de Creación de Personaje

- **Wizard Multi-paso**: Flujo guiado consultando la D&D 5e API para traer razas, rasgos, clases y equipo inicial.
- **JSON Flexible**: Implementación de `sheet_json` para guardar el estado complejo del personaje sin sobrecargar el esquema relacional.

---

## [0.0.1] — 2026-05-12 · Auth & Setup

- **Stack Inicial**: React 19, TanStack Router (file-based), TanStack Query y Tailwind v4.
- **Supabase**: Cliente singleton, generación de tipos de TypeScript y políticas RLS base.
- **Dev Workflow**: Configuración de Husky y Commitlint para estandarizar Conventional Commits.
- **Esquema DB**: Tablas iniciales para perfiles, campañas y personajes.
