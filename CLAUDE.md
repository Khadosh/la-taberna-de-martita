# CLAUDE.md — La Taberna de Martita

Instrucciones de trabajo para Claude Code. Leer antes de tocar cualquier archivo.

---

## Stack

| Capa | Tech |
|---|---|
| Framework | React 19, SPA pura (sin SSR) |
| Router | TanStack Router v1 (file-based, `src/routes/`) |
| Data fetching | TanStack Query v5 |
| Auth + DB | Supabase (Auth + Postgres con RLS) |
| Estilos | **Tailwind CSS v4** (`@import "tailwindcss"`) |
| Build | Vite |
| Package manager | pnpm |
| Deploy | Vercel → `la-taberna-de-martita.quest` |
| D&D data | dnd5eapi.co (primaria), Open5e (fallback) |

---

## Comandos

```bash
pnpm dev          # dev server en localhost:5173
pnpm build        # build producción
npx tsc --noEmit  # verificar tipos (correr antes de commitear)
```

**Migraciones Supabase:** siempre usar `supabase` CLI, **nunca `psql`**.

```bash
supabase migration new <nombre>
supabase db push
```

---

## Arquitectura clave

### Rutas protegidas
Todas las rutas de la app viven bajo `src/routes/_authenticated/`. El layout raíz en `__root.tsx` maneja auth.

### Datos de personaje
- `characters.stats` → JSONB `Record<string, number>` (str, dex, con, int, wis, cha)
- `characters.sheet_json` → JSONB tipado como `SheetJson` (ver `src/components/character-sheet/types.ts`)
- `character_inventory` → tabla separada con join por `character_id`
- Equipo equipado: `sheet_json.equipped_items: string[]` + `sheet_json.equipped_slots: Partial<Record<SlotKey, string>>`

### Optimistic updates
`patchSheet()` en `$characterId.tsx` usa `queryClient.setQueryData()` antes de la llamada Supabase para respuesta inmediata.

### D&D API
Wrappers en `src/lib/dnd-api.ts` con TanStack Query keys en `dndKeys`. `staleTime: Infinity` para datos de reglas (nunca cambian).

---

## Gotchas críticos y Sistema de Diseño

### Coherencia Visual y Clases de Tailwind v4
Toda la interfaz del proyecto debe ceñirse estrictamente a las especificaciones de diseño detalladas en [design-system.md](file:///Users/joaquinnader/coding/personal/la-taberna-de-martita/docs/design-system.md). 

**Regla:** Para cualquier color de texto, fondo o borde, utilizar las clases del tema de Tailwind v4 (`bg-tavern-stone`, `text-tavern-gold`, `border-parchment-sienna/40`, etc.) definidas en `@theme` en `src/styles.css`. **Evitar estilos en línea (`style={{ }}`) o colores planos genéricos de Tailwind.**

### Tailwind v4 — Bordes
En Tailwind v4, si aplicas la clase `border` sin especificar un color, el borde heredará `currentColor` del texto del elemento padre. Para evitar esto, especifica siempre el color del borde utilizando las clases del tema:
```tsx
// MAL — hereda currentColor y se ve inconsistente
<div className="border">

// BIEN — color controlado por el sistema de diseño
<div className="border border-parchment-sienna/40">
```

### Drag & Drop (`@dnd-kit`)
- `PointerSensor` con `activationConstraint: { distance: 6 }` para evitar activación accidental
- IDs de draggable: `inventory-${item.id}` | `slot-${slotKey}`
- `ActiveDrag` type: `{ kind: 'inventory' | 'slot'; itemId: string; itemName: string; fromSlot?: SlotKey }`
- Compatibilidad de slots: `inferSlot(itemName)` en `src/lib/equip-slots.ts`; si retorna `null`, mostrar `SlotPickerModal`

### `$characterId.tsx` — rutas con `$`
Git requiere escape: `git add "src/routes/_authenticated/characters/\$characterId.tsx"`

### Supabase Realtime
Ya configurado en `$characterId.tsx` con `supabase.channel()`. Invalida el query al recibir cambios de Postgres.

---

## Estructura de componentes — Hoja de Personaje

```
src/components/character-sheet/
├── types.ts              # SheetJson, InfoModalData, etc.
├── sheet-primitives.tsx  # sheetStyle, mapBgStyle, SheetLabel, SheetRow, QuickPill, SheetTabBar
├── sheet-badges.tsx      # TraitBadge, FeatureCard, InfoModal
├── condition-seals.tsx   # WaxSeal SVG para condiciones (17 condiciones D&D 5e)
├── tab-resumen.tsx       # Tab principal: stats, HP/CA/XP, class features, condiciones
├── tab-pericias.tsx      # Pericias y saving throws
├── tab-hechizos.tsx      # Gestión de hechizos y spell slots
├── tab-historia.tsx      # Backstory y borrar personaje
├── paper-doll.tsx        # Humanoid SVG con 11 slots de equipo + drag & drop
├── inventory-panel.tsx   # Panel derecho: paper doll + grid de inventario + catálogo
└── level-up-modal.tsx    # Modal de subida de nivel
```

El padre de todos es `src/routes/_authenticated/characters/$characterId.tsx` que mantiene todo el estado y handlers.

---

## Sistema visual

### Fondo pergamino (`sheetStyle`)
- `backgroundColor: '#f0e4c8'` + `backgroundImage: url('/assets/images/papiro.png')`
- `backgroundBlendMode: 'multiply'` con `backgroundSize: '105% auto'`
- El 5% de zoom corta los bordes negros del PNG

### Tab bar de cuero
Gradiente `#3a2410 → #271608` con tachones de latón via `radial-gradient` en `backgroundImage`.

### Stat boxes metálicas
- Cuerpo: gradiente oscuro basado en valor del stat (`statBodyRgb(val)`)
- Badge del modificador: coloreado rojo→gris→verde según el mod (`modBadgeColors(mod)`)
- Bevel metalico: `box-shadow` con `inset` claro arriba-izquierda, oscuro abajo-derecha

### Wax seals (condiciones)
Tres capas CSS: sombra difusa + anillo exterior de cera + disco central con gradiente radial. Ícono SVG embossed encima. Ver `condition-seals.tsx`.

### Inventario (panel derecho)
`darkFrameStyle` — oscuro, madera, sin parchment. Deliberadamente diferente al sheet.

---

## Convenciones de commit

Conventional Commits: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`

```bash
git commit -m "feat: descripción corta en minúsculas sin punto final"
```

**Antes de cada commit**, actualizar obligatoriamente:
1. `CHANGELOG.md` — agregar entrada bajo `## [Unreleased]` con el tipo y descripción del cambio
2. `ROADMAP.md` — marcar como completado o actualizar el ítem correspondiente si aplica

**No commitear** cambios visuales experimentales hasta que el usuario los apruebe.
**No pushear** sin confirmación explícita del usuario.

---

## Límite de 500 líneas por archivo

**Regla estricta:** ningún archivo `.tsx` o `.ts` puede superar 500 líneas.

Cuando un archivo se acerca o supera el límite:
1. Identificar grupos de funciones/componentes cohesivos y extraerlos a archivos separados.
2. Constantes compartidas entre varios archivos nuevos → archivo `*-constants.ts` dedicado.
3. Iconos SVG inline masivos → archivo `*-icons.tsx` dedicado.
4. Sub-componentes de UI sin estado propio del padre → archivo `*-sub-components.tsx` o nombre descriptivo.
5. Verificar con `wc -l <archivo>` antes de commitear.

**Patrón de nombramiento para splits:**
```
encounter-generator-panel.tsx   → componente principal (< 500 líneas)
encounter-constants.ts          → constantes compartidas
encounter-icons.tsx             → SVGs y componentes de íconos
encounter-sub-components.tsx    → componentes auxiliares pequeños
monster-card.tsx                → componentes de tarjeta específicos
encounter-modal.tsx             → modal wrapper
```

---

## No hacer

- No usar `psql` para migraciones — siempre `supabase CLI`
- No agregar `!important` ni clases Tailwind para colores de borde (ver gotcha arriba)
- No commitear automáticamente — siempre confirmar con el usuario primero
- No crear archivos de documentación sin que el usuario los pida
- No agregar comentarios de código salvo para WHY no-obvio
- No usar emojis en el código ni en respuestas salvo que el usuario los use
- No crear tests sin pedido explícito (no hay infrastructure de testing activa)
- **No dejar archivos de más de 500 líneas** — refactorizar antes de commitear
