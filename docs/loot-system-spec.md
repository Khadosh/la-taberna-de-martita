# Sistema de Loot para Arquetipos de Encuentros

## Contexto

El proyecto tiene un sistema de arquetipos de encuentros en `archetypes.ts` (o equivalente). Cada `Archetype` representa una composición temática de monstruos (ej: "Emboscada Goblin", "Patrulla No-muerta") con un `pool` de entries, un rango de nivel y un environment. Los monstruos se referencian por `index` siguiendo el catálogo de [dnd5eapi.co](https://www.dnd5eapi.co/api/2014/monsters).

Estado actual del tipo `Archetype`:

```typescript
export type Archetype = {
  id: string
  name: string
  environment: string
  levelRange: [number, number]
  pool: ArchetypeEntry[]
}
```

Hay ~30 arquetipos definidos cubriendo Bosque, Subterráneo, Cripta, Planicie, Castillo, Averno, Costa y Montaña.

## Objetivo

Agregar un sistema de loot randomizable que:

1. Se asocie al arquetipo (no al monstruo individual).
2. Escale con el nivel del party.
3. Soporte tanto items mundanos (equipment) como mágicos (con rareza).
4. Tenga identidad temática por arquetipo (un goblin no dropea lo mismo que un cultista).
5. Sea testeable (RNG inyectable).
6. Pueble su catálogo desde dnd5eapi.co con un script de ingest one-shot.

## Decisiones de diseño (ya tomadas, no abrir debate)

| # | Decisión | Razón |
|---|----------|-------|
| 1 | Loot vive en el arquetipo, no en `ArchetypeEntry` | El contexto define el botín, no la criatura aislada |
| 2 | Tiers propios (`mundane`/`uncommon`/`rare`/`epic`/`legendary`) | El CR oficial es ruido para gameplay |
| 3 | Mapeo desde rarity de dnd5eapi | `common→mundane`, `uncommon→uncommon`, `rare→rare`, `very rare→epic`, `legendary→legendary` |
| 4 | Escalado de oro lineal con multiplicador opcional | Predecible para balanceo |
| 5 | Probabilidad híbrida: `chance` global por drop + `weight` por item | Dos perillas, máxima expresividad |
| 6 | Drops divididos en `commonDrops` y `encounterDrops` | Loot individual vs tesoro de grupo |
| 7 | `signature` items para identidad temática | Cada arquetipo tiene "su" item raro firma |
| 8 | Compatibilidad item↔monstruo individual: **fuera de scope v1** | Empezar simple, sumar cuando duela |
| 9 | Catálogo de items pre-ingestado a JSON local | No depender de la API en runtime |

## Estructura de archivos propuesta

```
src/
  archetypes.ts          # existente, sólo se le agrega el campo `loot?`
  loot/
    types.ts             # tipos del sistema
    roll.ts              # rollLoot + helpers
    items.json           # generado por ingest
    profiles/
      bosque.ts          # LootProfiles agrupados por environment
      subterraneo.ts
      cripta.ts
      planicie.ts
      castillo.ts
      averno.ts
      costa.ts
      montana.ts
      index.ts           # re-export + función attachLootToArchetypes()
scripts/
  ingest-loot.ts         # script one-shot para poblar items.json
```

Si preferís un solo archivo `loot.ts` para arrancar, también es válido. Modularizá después si crece.

---

## Tipos (`src/loot/types.ts`)

```typescript
export type LootTier =
  | 'mundane'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'

export type LootCategory =
  | 'weapon'
  | 'armor'
  | 'consumable'   // potions
  | 'scroll'
  | 'gem'
  | 'art'
  | 'trinket'
  | 'quest'        // mapas, llaves, items narrativos

export type LootItem = {
  index: string         // id compatible con dnd5eapi (equipment o magic-items)
  name: string
  tier: LootTier
  category: LootCategory
  weight?: number       // peso para selección ponderada dentro del pool (default 1)
}

export type LootDrop = {
  pool: LootItem[]
  chance: number                 // 0-1, probabilidad de que el drop ocurra
  rollCount?: [number, number]   // cuántos items se tiran si ocurre (default [1, 1])
  minLevel?: number              // gate por nivel (ej: drops raros desde nivel 4)
}

export type LootProfile = {
  goldRange: [number, number]                       // rango base, se escala
  goldScale?: (level: number) => number             // default: l => Math.max(1, l)
  commonDrops: LootDrop[]                           // "lo que llevan encima"
  encounterDrops: LootDrop[]                        // "el tesoro del grupo / jefe"
  signature?: {
    items: LootItem[]
    chance: number                                  // 0-1
  }
}
```

Extender el tipo `Archetype` existente:

```typescript
export type Archetype = {
  id: string
  name: string
  environment: string
  levelRange: [number, number]
  pool: ArchetypeEntry[]
  loot?: LootProfile   // opcional para retrocompatibilidad
}
```

---

## Función de roll (`src/loot/roll.ts`)

```typescript
import type { Archetype } from '../archetypes'
import type { LootItem, LootProfile } from './types'

export type RollCtx = {
  partyLevel: number
  rng?: () => number   // inyectable para tests deterministas
}

export type LootResult = {
  gold: number
  items: Array<{ item: LootItem; quantity: number }>
}

export function rollLoot(arch: Archetype, ctx: RollCtx): LootResult {
  const rng = ctx.rng ?? Math.random
  const out: LootResult = { gold: 0, items: [] }
  if (!arch.loot) return out

  const { loot } = arch
  const level = clamp(ctx.partyLevel, arch.levelRange[0], arch.levelRange[1])

  // Gold
  const [gMin, gMax] = loot.goldRange
  const scale = (loot.goldScale ?? defaultGoldScale)(level)
  out.gold = Math.floor((gMin + rng() * (gMax - gMin)) * scale)

  // Drops (common + encounter se procesan igual; la separación es semántica)
  const allDrops = [...loot.commonDrops, ...loot.encounterDrops]
  for (const drop of allDrops) {
    if (drop.minLevel && level < drop.minLevel) continue
    if (rng() > drop.chance) continue
    const [min, max] = drop.rollCount ?? [1, 1]
    const count = min + Math.floor(rng() * (max - min + 1))
    for (let i = 0; i < count; i++) {
      const item = pickWeighted(drop.pool, rng)
      if (item) mergeItem(out.items, item)
    }
  }

  // Signature
  if (loot.signature && rng() < loot.signature.chance) {
    const item = pickWeighted(loot.signature.items, rng)
    if (item) mergeItem(out.items, item)
  }

  return out
}

// ── Helpers ────────────────────────────────────────────────────────────────

function defaultGoldScale(level: number): number {
  return Math.max(1, level)
}

function pickWeighted(pool: LootItem[], rng: () => number): LootItem | null {
  if (!pool.length) return null
  const total = pool.reduce((s, i) => s + (i.weight ?? 1), 0)
  let r = rng() * total
  for (const i of pool) {
    r -= i.weight ?? 1
    if (r <= 0) return i
  }
  return pool[pool.length - 1]
}

function mergeItem(arr: LootResult['items'], item: LootItem) {
  const existing = arr.find(e => e.item.index === item.index)
  if (existing) existing.quantity++
  else arr.push({ item, quantity: 1 })
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
```

---

## Ingest de items (`scripts/ingest-loot.ts`)

Script one-shot. Corré con `npx tsx scripts/ingest-loot.ts` o equivalente. Genera `src/loot/items.json`.

```typescript
/**
 * Pobla src/loot/items.json desde dnd5eapi.co.
 * Endpoints relevantes:
 *  - /api/2014/equipment-categories/{weapon|armor|potion|scroll}  -> equipment listado por categoría
 *  - /api/2014/magic-items                                        -> lista de magic items
 *  - /api/2014/magic-items/{index}                                -> detalle con rarity
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://www.dnd5eapi.co/api/2014'

type LootTier = 'mundane' | 'uncommon' | 'rare' | 'epic' | 'legendary'
type LootCategory =
  | 'weapon' | 'armor' | 'consumable' | 'scroll'
  | 'gem' | 'art' | 'trinket' | 'quest'

type LootItem = {
  index: string
  name: string
  tier: LootTier
  category: LootCategory
}

const RARITY_TO_TIER: Record<string, LootTier> = {
  'Common': 'mundane',
  'Uncommon': 'uncommon',
  'Rare': 'rare',
  'Very Rare': 'epic',
  'Legendary': 'legendary',
  'Artifact': 'legendary',
}

const EQUIPMENT_CATEGORIES: Array<{ slug: string; category: LootCategory }> = [
  { slug: 'weapon', category: 'weapon' },
  { slug: 'armor', category: 'armor' },
  { slug: 'potion', category: 'consumable' },
  { slug: 'scroll', category: 'scroll' },
]

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

async function ingestEquipment(): Promise<LootItem[]> {
  const items: LootItem[] = []
  for (const { slug, category } of EQUIPMENT_CATEGORIES) {
    const data = await fetchJson<{ equipment: Array<{ index: string; name: string }> }>(
      `${BASE}/equipment-categories/${slug}`,
    )
    for (const e of data.equipment) {
      items.push({ index: e.index, name: e.name, tier: 'mundane', category })
    }
  }
  return items
}

async function ingestMagicItems(): Promise<LootItem[]> {
  const list = await fetchJson<{ results: Array<{ index: string; name: string }> }>(
    `${BASE}/magic-items`,
  )

  const items: LootItem[] = []
  // Concurrency limit suave para no ahogar la API
  const CONCURRENCY = 8
  for (let i = 0; i < list.results.length; i += CONCURRENCY) {
    const batch = list.results.slice(i, i + CONCURRENCY)
    const detailed = await Promise.all(
      batch.map(r =>
        fetchJson<{ index: string; name: string; rarity?: { name: string }; equipment_category?: { index: string } }>(
          `${BASE}/magic-items/${r.index}`,
        ),
      ),
    )
    for (const d of detailed) {
      const tier = RARITY_TO_TIER[d.rarity?.name ?? 'Common'] ?? 'uncommon'
      const category = mapMagicCategory(d.equipment_category?.index)
      items.push({ index: d.index, name: d.name, tier, category })
    }
  }
  return items
}

function mapMagicCategory(catIndex?: string): LootCategory {
  switch (catIndex) {
    case 'weapon': return 'weapon'
    case 'armor': return 'armor'
    case 'potion': return 'consumable'
    case 'scroll': return 'scroll'
    case 'wondrous-items': return 'trinket'
    default: return 'trinket'
  }
}

async function main() {
  console.log('Ingesting equipment...')
  const equipment = await ingestEquipment()
  console.log(`  -> ${equipment.length} items`)

  console.log('Ingesting magic items...')
  const magic = await ingestMagicItems()
  console.log(`  -> ${magic.length} items`)

  const all = [...equipment, ...magic]
  // Dedupe por index (los magic-items y equipment pueden solaparse en algunos casos)
  const map = new Map<string, LootItem>()
  for (const i of all) map.set(i.index, i)
  const out = Array.from(map.values()).sort((a, b) => a.index.localeCompare(b.index))

  const target = resolve('src/loot/items.json')
  writeFileSync(target, JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} items -> ${target}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
```

---

## Ejemplo de LootProfile completo (`src/loot/profiles/bosque.ts`)

Aplicado a "Emboscada Goblin":

```typescript
import type { LootProfile } from '../types'

export const EMBOSCADA_GOBLIN_LOOT: LootProfile = {
  goldRange: [5, 25],
  goldScale: l => l * 1.2,
  commonDrops: [
    {
      chance: 0.85,
      rollCount: [1, 3],
      pool: [
        { index: 'shortbow', name: 'Arco corto', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'scimitar', name: 'Cimitarra', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.4,
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable' },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.25,
      minLevel: 2,
      pool: [
        { index: 'spell-scroll-magic-missile', name: 'Pergamino: Proyectil Mágico', tier: 'uncommon', category: 'scroll' },
        { index: 'cloak-of-elvenkind', name: 'Capa élfica', tier: 'rare', category: 'armor', weight: 0.3 },
      ],
    },
  ],
  signature: {
    chance: 0.15,
    items: [
      { index: 'goblin-totem', name: 'Tótem goblin tallado', tier: 'uncommon', category: 'trinket' },
    ],
  },
}
```

Y el ensamble en `profiles/index.ts`:

```typescript
import type { Archetype } from '../../archetypes'
import { ARCHETYPES } from '../../archetypes'
import { EMBOSCADA_GOBLIN_LOOT } from './bosque'
// ... resto de imports

const LOOT_BY_ARCHETYPE_ID: Record<string, LootProfile> = {
  'emboscada-goblin': EMBOSCADA_GOBLIN_LOOT,
  // ... resto
}

export function getArchetypesWithLoot(): Archetype[] {
  return ARCHETYPES.map(a => ({
    ...a,
    loot: LOOT_BY_ARCHETYPE_ID[a.id],
  }))
}
```

---

## Guía temática por arquetipo

Tabla de referencia para que los LootProfiles tengan identidad. No es prescriptiva, es orientativa.

| Arquetipo | Mundano dominante | Rareza temática | Signature sugerido |
|-----------|-------------------|-----------------|--------------------|
| `emboscada-goblin` | arcos cortos, cimitarras, cuero | scrolls de bajo nivel | tótem goblin |
| `patrulla-bosque` | espadas, armaduras ligeras | potions, scrolls | mapa de patrullaje |
| `nido-aranas` | poco mundano, telas | poison potions | colmillo de araña |
| `manada-lobos` | nada de equipo | nada mágico (bestias) | colmillo/pelaje |
| `depredadores-bosque` | nada de equipo | nada mágico | pelaje, garras |
| `tribu-kobold` | dagas, hondas | trampas, potions | escama de kobold |
| `guardia-duergar` | warhammers, escudos | items resistentes al fuego | runa enana |
| `guardia-orco` | greataxes, javelins | potions de fuerza | tótem orco |
| `cueva-aberrante` | nada de equipo | scrolls raros | ojo aberrante |
| `nido-murcielagos` | nada | nada | ala de murciélago |
| `patrulla-no-muerta` | armas oxidadas | scrolls necróticos | hueso rúnico |
| `guardia-cripta` | armas antiguas | items con maldición leve | sello funerario |
| `horda-zombies` | armas degradadas | nada | jirón de mortaja |
| `culto-oscuro` | dagas ceremoniales | scrolls oscuros, potions | sello del culto |
| `espectros-umbral` | nada | gems espectrales | gema fantasmal |
| `banda-bandoleros` | variado (lo robado) | items urbanos | cofre con monedas |
| `tribu-orco` | greataxes, javelins | items bárbaros | trofeo de guerra |
| `rastreadores-gnoll` | bows, scimitars | potions tóxicas | collar de huesos |
| `jinetes-lobos` | lanzas, arcos cortos | potions de velocidad | estandarte goblin |
| `mercenarios-elite` | armas y armaduras de calidad | items profesionales | sello de gremio |
| `guardia-real` | espadas largas, escudos, armaduras pesadas | items nobles | sello real |
| `espias-infiltrados` | dagas, ballestas ligeras | potions de sigilo | documento sellado |
| `cultistas-torre` | dagas ceremoniales | scrolls arcanos | grimorio del culto |
| `guardianes-magicos` | nada mundano (constructos) | items mágicos varios | núcleo arcano |
| `elementales-fuego` | nada mundano | items resistentes al fuego | esencia ígnea |
| `legiones-infernales` | nada mundano | items infernales raros | contrato infernal |
| `piratas-corsarios` | sables, pistolas si aplica | gemas, art objects | mapa de tesoro |
| `sahuagin-raid` | tridentes, redes | items acuáticos | perla negra |
| `gigantes-colinas` | clavas enormes | items oversize | runa rúnica |
| `vuelo-griffons` | nada mundano | items aéreos | pluma de griffon |

---

## Plan de implementación

1. **Tipos primero.** Crear `src/loot/types.ts` con los tipos exactos del doc.
2. **Extender `Archetype`** con el campo `loot?: LootProfile`. No tocar el resto.
3. **Implementar `rollLoot`** con sus helpers en `src/loot/roll.ts`. Función pura, RNG inyectable.
4. **Tests unitarios de `rollLoot`** con RNG determinístico (ver sección Tests).
5. **Ingest one-shot.** Implementar y correr `scripts/ingest-loot.ts`. Verificar que `items.json` tenga ~400-500 entries.
6. **LootProfiles por environment.** Implementar los 8 archivos en `profiles/`. Arrancar por Bosque (5 arquetipos) como prueba de concepto, validar visualmente algunos rolls, luego replicar a los otros 7 environments.
7. **Ensamble.** `profiles/index.ts` exporta `getArchetypesWithLoot()`.
8. **Integración.** Reemplazar imports de `ARCHETYPES` por `getArchetypesWithLoot()` donde corresponda en el resto del proyecto.

---

## Tests sugeridos

`src/loot/roll.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'   // o jest, según stack
import { rollLoot } from './roll'
import type { Archetype } from '../archetypes'

const stubArchetype: Archetype = {
  id: 'test',
  name: 'Test',
  environment: 'Test',
  levelRange: [1, 5],
  pool: [],
  loot: {
    goldRange: [10, 20],
    commonDrops: [
      {
        chance: 1,
        pool: [{ index: 'item-a', name: 'A', tier: 'mundane', category: 'weapon' }],
      },
    ],
    encounterDrops: [],
  },
}

describe('rollLoot', () => {
  it('es determinista con RNG fijo', () => {
    const rng = () => 0.5
    const r1 = rollLoot(stubArchetype, { partyLevel: 3, rng })
    const r2 = rollLoot(stubArchetype, { partyLevel: 3, rng })
    expect(r1).toEqual(r2)
  })

  it('respeta minLevel en drops', () => {
    const arch: Archetype = {
      ...stubArchetype,
      loot: {
        ...stubArchetype.loot!,
        commonDrops: [
          {
            chance: 1,
            minLevel: 5,
            pool: [{ index: 'rare-item', name: 'R', tier: 'rare', category: 'weapon' }],
          },
        ],
      },
    }
    const result = rollLoot(arch, { partyLevel: 2, rng: () => 0 })
    expect(result.items).toEqual([])
  })

  it('escala oro con goldScale', () => {
    const arch: Archetype = {
      ...stubArchetype,
      loot: {
        ...stubArchetype.loot!,
        goldRange: [10, 10],
        goldScale: l => l * 2,
      },
    }
    const r = rollLoot(arch, { partyLevel: 3, rng: () => 0 })
    expect(r.gold).toBe(60)   // (10 + 0) * 6
  })

  it('devuelve loot vacío si el arquetipo no tiene profile', () => {
    const arch: Archetype = { ...stubArchetype, loot: undefined }
    const r = rollLoot(arch, { partyLevel: 3 })
    expect(r).toEqual({ gold: 0, items: [] })
  })
})
```

---

## Fuera de scope (v1)

Cosas que **no** se implementan en esta iteración. Anotadas para no perder el rastro:

- Compatibilidad item↔monstruo individual (que un ogre no dropee daga goblin).
- Loot por `ArchetypeEntry` (loot diferenciado del jefe del encuentro).
- Items con "maldición" o efectos especiales.
- Persistencia de drops por sesión (qué se dropeó ya).
- UI de visualización del loot.
- I18n del campo `name` de los items (vienen en inglés desde la API; si se necesita traducción, hacer pass post-ingest).

---

## Notas operativas

- El script de ingest tira ~400 requests a dnd5eapi.co. Está limitado a concurrencia 8. Si la API responde con 429, bajá a 4.
- `items.json` debería terminar en ~50-80 KB. Si crece mucho más, considerar splittearlo por categoría.
- El campo `name` viene en inglés de la API. Los LootProfiles ejemplo usan nombres en español manualmente — está bien para items signature, pero los items "comunes" referenciados por `index` van a coincidir con el `name` inglés del JSON si los lookeás. Definir si querés un mapeo ES o no.
