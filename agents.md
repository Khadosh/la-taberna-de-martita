# AGENTS.md — Tavern App (D&D 5e Companion)

> Durable project context. Actualizar con cada decisión arquitectónica relevante, gotcha encontrado o cambio de rumbo.

---

## 🎯 Brief del producto

App companion para sesiones de Dungeons & Dragons 5ª edición.  
El **Dungeon Master** y los **jugadores** se loguean, cada uno con su rol.  
Funcionalidades core:

- Creación de personajes de forma interactiva (guiada, divertida, con datos reales de 5e)
- Hojas de personaje persistentes y editables
- Sistema de notas/anotaciones por sesión (DM y jugadores)
- Integración con API pública de D&D 5e para traer hechizos, clases, razas, pericias, etc.
- Reutilización del módulo de tirada de dados ya existente (ver sección **Código reutilizado**)

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

> **Por qué SPA y no TanStack Start:** app 100% autenticada, sin páginas públicas indexables. SSR no aporta nada y agrega riesgo de breaking changes de un framework en beta.  
> **Por qué Drizzle solo en dev:** no hay servidor Node donde correrlo en runtime. Se usa para definir el schema y correr migraciones; el acceso a datos usa el Supabase client directamente.  
> **Por qué dos APIs de 5e:** `dnd5eapi.co` tiene mejor cobertura de SRD base (clases, razas, hechizos, equipo). Open5e agrega contenido de terceros. Usar dnd5eapi.co como primaria; Open5e como fallback o enriquecimiento.

---

## 📁 Estructura del proyecto

```
tavern-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # cliente Supabase singleton
│   │   ├── dnd-api/             # wrappers fetch + TanStack Query keys
│   │   └── dice/                # módulo rollDice (a extraer del repo existente)
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

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** va en el cliente ni en el repo. Solo si se agregan edge functions propias.

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

> `sheet_json` es un JSONB que guarda el estado completo de la hoja de personaje (HP, hechizos preparados, inventario, etc.). Drizzle lo tipea con `$type<CharacterSheet>()`.  
> `is_private` en notas permite que el DM tenga anotaciones que los jugadores no ven.

---

## 🎲 Código reutilizado — Módulo de dados

Tengo una app existente con lógica de tirada de dados. Pasos para integrarlo:

1. Copiar/extraer el módulo a `src/lib/dice/`
2. Exponer una API limpia: `rollDice(notation: string): DiceResult` — donde `notation` es estándar (`"2d6+3"`, `"1d20"`, etc.)
3. El componente visual de tirada se monta en la hoja de personaje y en el panel de sesión
4. **No reescribir lo que ya funciona.** Si hay dependencias propias, evaluarlas antes de extraer.

**Repo fuente del dado:** `[COMPLETAR]`  
**Dependencias que arrastra:** `[COMPLETAR]`

---

## 🧙 Creación de personaje — flujo interactivo

El objetivo es que crear un personaje sea un momento, no un formulario.  
Propuesta de flujo en pasos con TanStack Form + datos reales de la API:

```
1. ¿Cómo te llamás?          → nombre + apodo opcional
2. ¿Quién sos?               → selección de Raza (desde dnd5eapi) con descripción y traits
3. ¿Qué hacés?               → selección de Clase con flavor text, hit die, proficiencias
4. Tu historia               → origen (Background) + textarea de backstory libre
5. Tus números               → tirada interactiva de stats (usa el módulo de dados) o point buy
6. Hechizos iniciales        → si la clase es spellcaster, selector con búsqueda desde API
7. Resumen y confirmación    → hoja preview antes de guardar
```

Cada paso valida con TanStack Form. El estado del wizard se acumula en un objeto que al final hace un solo INSERT en `characters` via Supabase client.

---

## 👥 Roles y permisos (Supabase RLS)

```sql
-- Players solo ven sus propios personajes
-- DM ve todos los personajes de su campaña
-- Notas privadas solo las ve el autor (o el DM si es DM)
```

Configurar Row Level Security en Supabase directamente.  
RLS es la red de seguridad real — no hay servidor propio que filtre.

---

## 📡 Integración D&D 5e API

Wrapper en `src/lib/dnd-api/`:

```ts
// Endpoints principales a wrappear:
GET /races          → lista de razas
GET /races/{index}  → detalle con traits
GET /classes        → lista de clases
GET /classes/{index}/levels/1  → features de nivel 1
GET /spells         → lista con filtros (por clase, nivel)
GET /spells/{index} → detalle completo
GET /skills         → pericias
GET /equipment      → equipo básico
```

Cachear con TanStack Query (`staleTime: Infinity` para datos de reglas — no cambian).  
No guardar en DB los datos de la API, solo referencias por `index` string.

---

## 🔭 Decisiones arquitectónicas clave

- **SPA sin SSR** — app 100% autenticada, sin páginas públicas. SSR agrega complejidad innecesaria.
- **Supabase Auth** maneja sesiones. El rol DM/Player se guarda en `user_metadata` o en una tabla `profiles` con FK a `auth.users`.
- **Drizzle solo para schema y migraciones** — runtime usa Supabase client con tipos generados (`supabase gen types typescript`).
- **sheet_json como JSONB** evita over-engineering de schema para un MVP. Si el modelo crece, migrar a columnas explícitas.
- **API de D&D es read-only y pública** — no necesita proxy propio a menos que haya problemas de CORS en producción.
- **Dados en cliente** — la lógica de `rollDice` es pura, no necesita ir al servidor.

---

## ⚠️ Gotchas conocidos

- Supabase tiene **dos URLs de conexión**: usar el **pooler** en `DATABASE_URL` para queries de runtime, la **direct** en `DIRECT_DATABASE_URL` solo para `drizzle-kit push` / `migrate`. Mezclarlas rompe cosas.
- `dnd5eapi.co` sirve imágenes desde rutas relativas (`/api/images/...`). Prefijar con `https://www.dnd5eapi.co`.
- TanStack Form v1 tiene API distinta a v0 — no mezclar documentación.
- corepack en Node 24 tiene bug de verificación de firma con pnpm. Fix: `npm install -g pnpm --force`.
- El build strip devtools automáticamente (`@tanstack/devtools-vite`) — no condicionar manualmente con `import.meta.env.DEV`.

---

## 🛠 Reglas de Commits (Husky + Commitlint)

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

**Formato:** `<type>: <subject>`

- **Tipos permitidos:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`.
- **Reglas:**
  - `subject` en minúsculas.
  - Sin punto final.
  - Máximo 72 caracteres.

**Ejemplo:**
`chore: basic project setup`

---

## 📝 Changelog

- **2026-05-11**: `chore: basic project setup` (Scaffold, Supabase client, TanStack Router/Query/Form).

---

## 🗺 Roadmap / próximos pasos

- [x] Scaffold SPA (Vite + TanStack Router file-based)
- [x] Instalar dependencias: TanStack Query/Form, Supabase, Sentry, Drizzle dev
- [x] `.env` con Supabase URL + anon key
- [x] `src/lib/supabase.ts` — cliente singleton
- [x] QueryClient cableado en `main.tsx` + context en router
- [ ] Configurar Supabase Auth (email/password, magic link)
- [ ] Tabla `profiles` + RLS básico
- [ ] Schema Drizzle + primera migración (`drizzle-kit push`)
- [ ] Auth flow: login, registro, redirect post-login
- [ ] Rutas protegidas (guard con sesión Supabase)
- [ ] Wrapper dnd5eapi + primeras queries con TanStack Query
- [ ] Wizard de creación de personaje (pasos 1–5)
- [ ] Hoja de personaje (vista + edición)
- [ ] Notas de sesión
- [ ] Integrar módulo de dados existente
- [ ] Hechizos en personaje (paso 6 del wizard)
- [ ] Sentry configurado y probado

*Última actualización: scaffold inicial completado + reglas de commit y changelog*
