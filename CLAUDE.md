# CLAUDE.md — La Taberna de Martita

Este documento sirve como guía de inducción, arquitectura y desarrollo para cualquier IA u desarrollador trabajando en **La Taberna de Martita**, un companion web medieval-fantasy premium para Dungeons & Dragons 5ª Edición (SRD) disponible en [la-taberna-de-martita.quest](https://la-taberna-de-martita.quest).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | React 19, Single Page Application (SPA) sin Server-Side Rendering (SSR) |
| **Enrutador** | TanStack Router v1 (enrutamiento basado en archivos, `src/routes/`) |
| **Data Fetching** | TanStack Query v5 (React Query) |
| **Auth + Base de Datos** | Supabase (Autenticación, Base de datos PostgreSQL con RLS y Realtime Sync) |
| **Estilos** | **Tailwind CSS v4** (`@import "tailwindcss"` en `src/styles.css`) |
| **Build & Bundler** | Vite |
| **Manejador de Paquetes**| pnpm |
| **Despliegue (Deploy)** | Vercel |
| **Base de Reglas D&D**  | [dnd5eapi.co](https://www.dnd5eapi.co) (primaria), Open5e (fallback) |

---

## 🚀 Comandos de Desarrollo

```bash
pnpm dev          # Servidor de desarrollo en http://localhost:5173
pnpm build        # Construye la aplicación para producción (Vite build)
npx tsc --noEmit  # Verifica tipos de TypeScript (correr obligatoriamente antes de commits)
```

### Gestión de Base de Datos (Supabase CLI)
**Regla estricta:** Utilizar siempre Supabase CLI para migraciones. **Nunca usar `psql` directamente** ni aplicar cambios manuales que rompan el historial de migraciones.
```bash
supabase migration new <nombre_migracion>   # Crea una nueva migración SQL
supabase db push                            # Aplica los cambios locales a la base de datos de desarrollo
```

---

## 📦 Características y Capacidades (Features)

El sistema está dividido en varios módulos dinámicos diseñados bajo una dirección de arte medieval. A continuación se detalla cada funcionalidad y el flujo de interacción técnica:

### 1. Panel de Control (Dashboard)
*   **Capacidad:** Pantalla inicial (`src/routes/_authenticated/index.tsx`) donde el usuario gestiona sus campañas (como jugador o DM) y sus personajes.
*   **Interacción:**
    *   **Tus personajes:** Muestra cartas de personajes con su nivel, HP actual en tiempo real y modificadores. Acceso directo a la hoja detallada.
    *   **Campañas - GM:** Permite crear campañas nuevas (`/campaigns/new`) y copiar el enlace de invitación (`/join/$campaignId`) para compartir.
    *   **Campañas - Jugador:** Lista campañas a las que el usuario se ha unido como jugador.
    *   **Accesos rápidos:** Barra superior para acceder al Bestiario, Conjuros o cerrar sesión.

### 2. Creación de Personaje Avanzada
*   **Capacidad:** Wizard guiado (`src/routes/_authenticated/characters/new.tsx`) que consume la API de D&D 5e.
*   **Interacción:**
    *   **Vitral Tripartito:** Interfaz inmersiva (75% clase/raza, 25% trasfondo) con glassmorphism.
    *   **Selección:** Elección de Raza, Clase (con listado de dados de golpe y competencias) y Trasfondo (Background) con ilustraciones premium y límite de atributos base a 15 con modificadores.

### 3. Hoja de Personaje Interactiva (Character Sheet)
*   **Capacidad:** La hoja interactiva (`src/routes/_authenticated/characters/$characterId.tsx`) está dividida en dos secciones principales en escritorio (pergamino claro y marco de madera oscuro).
*   **Estado y Mutabilidad:** Administrado por el hook `useCharacterSheet()`. Modifica la base de datos a través de `patchSheet()` y `patchCharacter()` utilizando **actualizaciones optimistas** vía TanStack Query para evitar latencia (HP lag) en la UI.
*   **Sub-módulos e Interacción:**
    *   **Retrato con IA:** Permite subir una imagen local o generar una ilustración de fantasía usando un servicio de retrato IA integrado.
    *   **Pestaña Resumen (`TabResumen`):**
        *   *Atributos:* Fuerza, Destreza, Constitución, Inteligencia, Sabiduría, Carisma.
        *   *HP & CA:* Edición inline de vida actual, vida máxima y Clase de Armadura (CA).
        *   *XP & Level Up:* Barra de progreso de XP. Si el personaje cumple con el umbral (`XP_THRESHOLDS`), se habilita el modal de **Subida de Nivel** (`level-up-modal.tsx`), el cual permite añadir dados de vida, elegir subclases, dotes de mejora de características (ASI), enemigos predilectos y conjuros nuevos.
        *   *Condiciones (Sellos de Cera):* Wax seals interactivos para aplicar/remover los 17 estados de D&D 5e.
        *   *Mecánicas de Descanso:* Rápido (gasto de dados de golpe `hitDie` para curarse) y Largo (restauración total, casillas de conjuro y dados de golpe).
    *   **Pestaña Pericias (`TabPericias`):** Salvaciones de características y habilidades con sus modificadores calculados automáticamente más competencias y trasfondos.
    *   **Pestaña Hechizos (`TabHechizos`):** Gestión de conjuros aprendidos y slots de hechizos disponibles/usados por nivel.
    *   **Pestaña Historia (`TabHistoria`):** Notas de trasfondo narrativo y opción de borrar el personaje.
    *   **Panel de Inventario e Interactividad (`InventoryPanel`):**
        *   *Paper Doll (Maniquí Humanoide):* Interfaz visual de 11 ranuras de equipamiento (cabeza, cuello, pecho, manos, anillos, pies, etc.).
        *   *Drag & Drop:* Utiliza `@dnd-kit/core` para arrastrar ítems de inventario al maniquí. **Gotcha:** `PointerSensor` debe configurarse con `activationConstraint: { distance: 6 }` para evitar que los clicks actúen como arrastres.
        *   *Control de Carga:* Cálculo dinámico del peso total cargado frente al límite del personaje (Fuerza × 15 lbs).

### 4. La Taberna de Martita (Tavern Services)
*   **Capacidad:** Zona social y de descanso de campaña (`src/routes/_authenticated/campaigns/$campaignId.taberna.tsx`).
*   **Interacción:**
    *   **Bebidas, Comidas y Alojamiento:** Menú de servicios con costo en monedas (oro, plata, cobre). Consumir resta automáticamente el dinero de la ficha del personaje seleccionado, aplica efectos (ganancia de HP, restauración de ranuras por descanso) y escribe un registro automático en el Diario de Aventura.
    *   **Los Establos:** Compra de monturas (caballos, mulas), carruajes y pertrechos de viaje directo de la API de D&D. Al comprar, descuenta el dinero y añade el ítem al inventario del personaje seleccionado.

### 5. Comercio de Campaña (General Trade)
*   **Capacidad:** Sistema comercial unificado (`src/routes/_authenticated/campaigns/$campaignId.comercio.tsx`) con 3 pestañas principales:
*   **Interacción:**
    *   **Adquirir Equipo (Comprar):** Tiendas temáticas (Armería, Alquimia, Sastrería, etc.) que importan ítems directamente de la base de datos de D&D. Permite buscar y adquirir equipamiento para un personaje específico si cuenta con fondos suficientes (calculado vía `toCp` en `src/lib/currency.ts`).
    *   **Vender Botín (Vender):** Los jugadores pueden revender ítems de su inventario a las tiendas a cambio de monedas por el **50% de su valor comercial**.
    *   **Creaciones (GM Only):** Permite al Game Master diseñar ítems customizados, añadirles nombres, descripciones y generar ilustraciones con IA.

### 6. Diario de Campaña (Session Notes)
*   **Capacidad:** Registro colaborativo de bitácoras de juego (`src/routes/_authenticated/campaigns/$campaignId.notas.tsx`).
*   **Interacción:** Creación y edición (CRUD) de notas públicas (visibles para toda la mesa) o privadas (visibles solo para el autor y el DM). Registra la fecha de la sesión y el autor.

### 7. Tablero de Batalla y Pantalla de Combate (Combat Board)
*   **Capacidad:** Sistema de cuadrícula en tiempo real (`src/routes/_authenticated/campaigns/$campaignId.tablero.tsx`) para representar encuentros tácticos.
*   **Interacción:**
    *   **Vista del DM (`DmTableroLayout`):** Controla el mapa de fondo (`dm-map-selector.tsx`), colapsa paneles laterales, añade NPCs a la iniciativa, mueve fichas y despliega plantillas AoE.
    *   **Vista del Jugador (`PlayerTablero`):** Observa la cuadrícula de combate interactiva en tiempo real y el feed de iniciativa.
    *   **Generador de Encuentros Procedural (`encounter-generator-panel.tsx`):** El DM puede seleccionar arquetipos temáticos (ej: "Emboscada Goblin", "Patrulla No-muerta") de entre ~30 disponibles. El generador escala los HP/XP de los monstruos según el nivel de la party y los spawnea directamente a la cuadrícula con roles tácticos diferenciados por colores.
    *   **Sistema de Botín (Loot System):** Integra el motor de recompensas `rollLoot` (`src/loot/roll.ts`). Escala linealmente el oro según el nivel de la party, tira chances de drops mundanos/mágicos del pool temático del arquetipo e inyecta ítems "firma" (Signature Items) con identidad de criatura (ej: Colmillo de Araña, Contrato Infernal).
    *   **Herramientas de Combate:** Resolución de daño, proyección de plantillas de Área de Efecto (Esferas, Cubos, Líneas) con detección automática de tokens, y deducción automática de slots de hechizos al atacar.

### 8. Buscadores y Compendios (Bestiary & Spellbook)
*   **Capacidad:** Bases de datos SRD consultables sin salir de la app (`bestiary.tsx` y `spellbook.tsx`).
*   **Interacción:**
    *   **Bestiario:** Filtro y selección de criaturas de D&D 5e para ver sus estadísticas completas, bloques de atributos, resistencias, sentidos, acciones y habilidades legendarias.
    *   **Conjuros (Spellbook):** Buscador de conjuros con filtros multicriterio por Clase de Lanzador (Bardo, Mago, Clérigo, etc.) y Nivel de Conjuro (Trucos a Nivel 9).

### 9. Dados Flotantes (Dice Module)
*   **Capacidad:** Lanzador tridimensional interactivo (`src/lib/dice/` y `DiceModule`) accesible para todos los jugadores y DMs desde el header de campaña y de personaje.
*   **Interacción:** Permite tirar sets de d4, d6, d8, d10, d12, d20 y d100 de forma rápida con modificadores matemáticos D&D integrados.

---

## 🎨 Sistema de Diseño y Coherencia Visual

Toda la interfaz del proyecto debe ceñirse estrictamente a las especificaciones de diseño detalladas en [design-system.md](file:///Users/joaquinnader/coding/personal/la-taberna-de-martita/docs/design-system.md).

### Metáforas Visuales
1.  **La Mesa de Juego (Estética Oscura/Taberna):**
    *   *Uso:* Fondo global, pantalla de DM, login, bordes de inventario y maniquí.
    *   *Tokens:* `bg-tavern-stone` (`#0c0a09`), `bg-table-wood` (madera real), `text-tavern-gold` (`#d5b88a`) y `shadow-tavern-glow`.
2.  **Documentos de Aventura (Estética Clara/Pergamino):**
    *   *Uso:* Hojas de personaje, compendios, notas e informes.
    *   *Tokens:* `bg-parchment-grid` (cuadrícula sepia), `bg-papyrus-texture` (blend multiply), tipografías en `text-parchment-chocolate` (`#6b4c24`) o `text-parchment-sienna` (`#7a5828`). **Evitar el negro puro (#000) o grises modernos sobre pergamino.**

### Tipografía Semántica
*   `font-display` (*Cinzel*): Títulos principales narrativos, nombres de hechizos/personajes (mayúsculas con tracking ancho).
*   `font-serif` (*Georgia*): Descripciones de habilidades, bitácoras, lore narrativo.
*   `font-mono` (*Monospace*): Números de juego, HP, CA, modificadores de características (ej: `+3`), distancias en pies y niveles.

---

## 🔒 Reglas Críticas de Desarrollo

### 1. Límite Estricto de 500 Líneas por Archivo
**Regla inquebrantable:** Ningún archivo `.tsx` o `.ts` debe exceder las 500 líneas de código.
*   Si un archivo se acerca a este límite, se debe modularizar inmediatamente dividiendo responsabilidades:
    *   Extraer sub-componentes visuales a archivos locales o a `*-sub-components.tsx`.
    *   Mover constantes pesadas o estáticas a `*-constants.ts`.
    *   Mover los SVGs inline masivos a un archivo dedicado `*-icons.tsx` o `components/icons/`.
    *   Extraer la lógica compleja de estado a hooks personalizados `use-*`.

### 2. Gotcha de Bordes en Tailwind v4
En Tailwind v4, aplicar la clase `border` sin color específico hace que este herede `currentColor` del elemento padre. Esto causa inconsistencias visuales sobre fondos claros u oscuros.
*   **Mal:** `<div className="border">`
*   **Bien:** `<div className="border border-parchment-sienna/40">` o `<div className="border border-stone-800">`

### 3. Evitar Estilos en Línea y Mezcla CSS/React
No utilizar estilos inline (`style={{ backgroundColor: '...' }}`) para colores del tema. Emplear únicamente las clases de Tailwind v4 configuradas en el manual de diseño.

### 4. Flujo de Commits
*   Seguir la especificación de **Conventional Commits** (`feat`, `fix`, `refactor`, `chore`, `docs`, `style`).
*   **Actualización obligatoria pre-commit:** Antes de hacer commit, se debe actualizar:
    1.  `CHANGELOG.md`: Añadir entrada bajo la sección `## [Unreleased]`.
    2.  `ROADMAP.md`: Actualizar el progreso o marcar tareas completadas.
*   **No hacer push** sin la aprobación explícita o confirmación del usuario.

### 5. Qué NO hacer
*   No usar `psql` para cambios de base de datos — siempre Supabase CLI.
*   No introducir `!important` para sobreescribir colores de borde.
*   No escribir código sin comentarios justificando el *POR QUÉ* (evitar comentarios obvios del *QUÉ* hace el código).
*   No añadir dependencias externas sin consultar al usuario.
*   No crear frameworks de tests adicionales sin orden explícita.


### 6. Commit rules
*   Hacer `feat / fix / chore / ui` (`sujeto`): `descripcion` one liner
*   Ejemplo: feat(character-sheet): CA auto-calculado
*   NO HACER: co-authored by