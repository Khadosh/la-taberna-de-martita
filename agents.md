# AGENTS.md — Tavern App (D&D 5e Companion)

> Durable project context. Actualizar con cada decisión arquitectónica relevante, gotcha encontrado o cambio de rumbo.

---

## 🎯 Brief del producto

App companion para sesiones de Dungeons & Dragons 5ª edición.  
El **Dungeon Master** y los **jugadores** se loguean, cada uno con su rol.  
Funcionalidades core:

- Creación de personajes de forma interactiva (guiada, con datos reales de la API de 5e).
- Hojas de personaje persistentes y editables con estética premium.
- Sistema de notas/anotaciones por sesión (DM y jugadores).
- Integración con API pública de D&D 5e (`dnd5eapi.co` + `Open5e`) para traer hechizos, clases, razas, pericias, etc.
- Sistema de dados 3D con físicas integrado en la hoja de personaje y la pantalla de combate.

---

## 🛠 Stack

| Capa | Tecnología |
|---|---|
| Tipo de app | **SPA pura** (sin SSR — app 100% autenticada, sin SEO) |
| Scaffold | `create-tsrouter-app` → template `react-file-router` |
| Router | TanStack Router v1 (file-based) |
| Data fetching | TanStack Query v5 |
| Forms | TanStack Form v1 |
| Auth + DB | Supabase (Auth client SDK + Postgres con RLS) |
| Schema / migraciones | Drizzle ORM + drizzle-kit (solo dev-time, no runtime) |
| Runtime DB access | Supabase JS client (`supabase.from(...)`) con tipos generados |
| Estilos | Tailwind CSS v4 |
| Monitoring | Sentry |
| Package manager | pnpm |
| D&D data | [dnd5eapi.co](https://www.dnd5eapi.co) (primaria) / [Open5e](https://api.open5e.com/v1) (fallback/enriquecimiento) |

> **Por qué SPA y no TanStack Start:** app 100% autenticada, sin páginas públicas indexables. SSR no aporta nada y agrega riesgo de breaking changes.  
> **Por qué Drizzle solo en dev:** no hay servidor Node donde correrlo en runtime. Se usa para definir el schema y correr migraciones; el acceso a datos usa el Supabase client directamente.  
> **Por qué dos APIs de 5e:** `dnd5eapi.co` tiene mejor cobertura de SRD base. Open5e agrega contenido de terceros.

---

## 📁 Estructura del proyecto

```
tavern-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # cliente Supabase singleton
│   │   ├── dnd-api/             # wrappers fetch + TanStack Query keys
│   │   └── dice/                # módulo rollDice (dados 3D con físicas react-three-cannon)
│   ├── routes/
│   │   ├── __root.tsx           # layout raíz, QueryClientProvider context
│   │   ├── index.tsx            # landing / redirect
│   │   ├── auth/                # login, registro
│   │   └── app/                 # rutas protegidas (characters, notes, etc.)
│   └── main.tsx                 # QueryClient + RouterProvider
├── drizzle/
│   └── schema.ts                # definición de tablas (solo para drizzle-kit)
└── .env                         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.
```

---

## 🔐 Variables de entorno

```env
# Supabase (configuradas)
VITE_SUPABASE_URL=https://qakjuxhgkxzzynllsotm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # anon key, segura en cliente

# Solo para drizzle-kit push/migrate — obtener desde Supabase dashboard
DATABASE_URL=          # pooler URL
DIRECT_DATABASE_URL=   # direct URL

# D&D API
VITE_DND_API_BASE=https://www.dnd5eapi.co/api
VITE_OPEN5E_API_BASE=https://api.open5e.com/v1
```

---

## 🗄 Schema de base de datos (Drizzle)

```ts
// Roles: 'dm' | 'player'
// Un usuario puede ser DM en una campaña y player en otra

campaigns         { id, name, dm_id, created_at }
campaign_players  { campaign_id, user_id, joined_at }
characters        { id, user_id, campaign_id, name, race, class, level, stats, backstory, sheet_json, created_at, updated_at }
session_notes     { id, campaign_id, author_id, title, body, is_private, session_date, created_at }
```

---

## 🎲 Módulo de dados interactivo y compartido (Futuro)

El sistema de dados 3D utiliza Three.js y react-three-cannon para físicas reales. Hay una propuesta de diseño para tiradas de dados compartidas (1-way de jugadores a DM) y click-to-roll interactivo documentada en [shared-dice-proposal.md](file:///Users/joaquinnader/Documents/web/personales/dungeonsanddragons/tavern-app/docs/shared-dice-proposal.md).

---

## 🧙 Creación de personaje — flujo interactivo

```
1. ¿Cómo te llamás?          → nombre + apodo opcional
2. ¿Quién sos?               → selección de Raza con descripción y traits
3. ¿Qué hacés?               → selección de Clase con flavor text, hit die, proficiencias
4. Tu historia               → origen (Background) + backstory libre
5. Tus números               → tirada interactiva de stats o point buy
6. Hechizos iniciales        → selector con búsqueda desde API
7. Resumen y confirmación    → hoja preview antes de guardar
```

---

## 👥 Roles y permisos (Supabase RLS)

- Players solo ven sus propios personajes y campañas a las que están unidos.
- DM ve todos los personajes y notas de su campaña.
- RLS configurado en Supabase a nivel de base de datos para todas las tablas core.

---

## 🛠 Reglas de Commits (Husky + Commitlint)

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

**Formato:** `<type>: <subject>`

- **Tipos permitidos:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`.
- **Reglas:**
  - `subject` en minúsculas y sin punto final.
  - Máximo 72 caracteres.

---

## 📝 Changelog

- **2026-05-22**: `feat: implement zoomable grid, action mode selector, and AoE templates on combat board`
  - ✅ Implementado sistema de zoom y paneo interactivo en el tablero táctico con posicionamiento preciso.
  - ✅ Añadido cuadriculado (grid) ajustable (tamaño y desplazamiento horizontal/vertical) con medición de distancias en pies (regla Chebyshev de D&D 5e).
  - ✅ Creado selector de 4 modos de acción (Melee, Rango, Lanzar, Conjuro) con validación inteligente de rangos y desventajas.
  - ✅ Integración con inventario del personaje (armas cuerpo a cuerpo/rango y objetos arrojadizos) y conjuros conocidos.
  - ✅ Proyección visual de plantillas de área de efecto (AoE): Esferas, Cubos y Líneas con detección automática de blancos dentro del área.
  - ✅ Soporte para conjuros de curación (botón verde de curación que suma pg en lugar de restarlos) y resolución en lote.
  - ✅ Deducción automática de casillas de conjuro (spell slots) al lanzar conjuros desde el tablero de combate.
  - ✅ Agrupación jerárquica de conjuros por nivel en el selector utilizando optgroups de HTML.
  - ✅ Clamping y limitación dinámica del popup de ataque para asegurar contención total en el viewport.
- **2026-05-20**: `feat: add inventory item stats panel with svg icon badges`
  - ✅ Al seleccionar un item del inventario, se fetchea `GET /api/2014/equipment/{index}` (TanStack Query, caché 10 min, lazy).
  - ✅ Panel muestra stat pills: daño (armas), CA + bonus DES (armaduras), categoría, rango, propiedades, costo.
  - ✅ Creado `stat-icons.tsx` con 20 SVG inline (11 propiedades de arma: finesse, light, heavy, two-handed, versatile, reach, thrown, ammunition, loading, monk, special + Simple/Martial + Melee/Ranged + Light/Medium/Heavy Armor + Shield).
  - ✅ `dnd-api.ts`: `equipmentDetail` migrado a endpoint `/api/2014/`.
- **2026-05-20**: `feat: improve equipment icon matching and generate custom icons`
  - ✅ Implemented whole-word matching helper `hasWords` in `src/lib/item-icons.ts` to solve false-positive substring matches (e.g. hempen, tinderbox, caltrops).
  - ✅ Generated 7 premium custom inventory icons (Thieves' Tools, Alchemist's Supplies, Poisoner's Kit, Herbalism Kit, Caltrops, Tinderbox, Hempen Rope) matching the game's fantasy style.
  - ✅ Updated docs with detail proposals and verified clean production compilation build.
- **2026-05-20**: `docs: add shared-dice-proposal and update documentation`
  - ✅ Guardada la propuesta de sincronización de dados en `docs/shared-dice-proposal.md`.
  - ✅ Configurado comando de automatización `/push` (en formato de skill para el LLM).
- **2026-05-14**: `feat: complete session 1 feedback loop & rebranding`
  - ✅ Rebranding: "La Taberna de Martita" con estética de papiro, madera y metal.
  - ✅ Sistemas: Realtime sync, Bestiario, Spellbook y mecánicas de descanso.
  - ✅ UX/UI: Rediseño de habilidades, inventario compacto y wizard v2.
- **2026-05-13**: `feat: production launch & dm screen`
  - ✅ GM: Pantalla de sesión con iniciativa y notas.

---

## 🗺 Roadmap

El seguimiento de tareas y próximos pasos se encuentra en [roadmap.md](file:///Users/joaquinnader/Documents/web/personales/dungeonsanddragons/tavern-app/roadmap.md).
