# La Taberna de Martita

App companion para sesiones de Dungeons & Dragons 5e. Pensada para jugar en mesa con el DM y los jugadores cada uno en su dispositivo.

**Producción:** [la-taberna-de-martita.quest](https://la-taberna-de-martita.quest)

---

## Qué hace

### Para los jugadores
- Hoja de personaje completa con pergamino interactivo (stats, HP, CA, XP, condiciones, hechizos, pericias)
- Inventario visual con paper doll drag & drop y 11 slots de equipo
- Condiciones representadas con sellos de cera SVG
- Level up, death saves, spell slots, descansos

### Para el Dungeon Master
- Hub de campaña con pestañas dedicadas
- Tracker de iniciativa en tiempo real con NPCs y bestiary integrado
- Generador de PNJs persistentes por campaña
- Calculadora de ataque (d20 mínimo necesario vs CA objetivo)
- Taberna con sistema de compraventa (dar ítems a personajes)
- Notas de sesión con autoguardado
- Vista del party completo con HP/condiciones de todos los PJs

### Compartido
- Sincronización en tiempo real vía Supabase Realtime
- Tirador de dados flotante (d4 a d100)
- Compendio: bestiario y grimorio buscables con datos de la API oficial de D&D 5e

---

## Stack

| | |
|---|---|
| Framework | React 19, SPA pura |
| Router | TanStack Router v1 (file-based) |
| Data | TanStack Query v5 + Supabase JS |
| Auth + DB | Supabase (Auth + Postgres + RLS + Realtime) |
| Estilos | Tailwind CSS v4 |
| Build | Vite |
| Deploy | Vercel |
| D&D data | [dnd5eapi.co](https://www.dnd5eapi.co) |

---

## Correr localmente

```bash
pnpm install
pnpm dev          # localhost:5173
```

Variables de entorno necesarias en `.env.local`:

```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## Estructura

```
src/
├── lib/
│   ├── supabase.ts          # cliente singleton
│   ├── dnd-api.ts           # wrappers fetch + query keys
│   ├── dnd-constants.ts     # XP thresholds, CONDITIONS, spell slots
│   ├── equip-slots.ts       # SlotKey, inferSlot(), SLOT_LABELS
│   └── dice/                # módulo de dados (rollDice)
├── routes/
│   ├── _authenticated/      # todas las rutas protegidas
│   │   ├── index.tsx        # dashboard
│   │   ├── characters/      # hoja de personaje
│   │   └── campaigns/       # hub de campaña + pantalla DM
│   └── auth/                # login, registro
└── components/
    └── character-sheet/     # todos los componentes de la hoja
```

---

## Documentación interna

- [`CLAUDE.md`](./CLAUDE.md) — instrucciones para Claude Code (stack, gotchas, convenciones)
- [`CHANGELOG.md`](./CHANGELOG.md) — historial de cambios por versión
- [`roadmap.md`](./roadmap.md) — estado actual y próximos pasos

---

## Licencia y atribuciones

El código fuente está bajo [licencia MIT](./LICENSE).

Las reglas de juego provienen del System Reference Document 5.1, publicado por
Wizards of the Coast bajo Creative Commons Attribution 4.0:

> This work includes material taken from the System Reference Document 5.1
> ("SRD 5.1") by Wizards of the Coast LLC and available at
> https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is
> licensed under the Creative Commons Attribution 4.0 International License
> available at https://creativecommons.org/licenses/by/4.0/legalcode.

Proyecto no oficial, sin afiliación ni respaldo de Wizards of the Coast ni de
Hasbro. El detalle completo de fuentes, assets y tipografías de terceros está en
[`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md).
