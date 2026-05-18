// Helpers para calcular bono de ataque usando datos de la D&D 5e API.
// La categoría, rango y propiedades (finesse, etc.) vienen del API — no se encodean aquí.
// Lo único local: mapear nombres de items → slug de la API.

import type { EquipmentItem } from './dnd-api'

// ── Slug mapping: nombre de item → índice API ─────────────────────────────────
// Multi-word primero para evitar matches parciales incorrectos.
const SLUG_MAP: [RegExp, string][] = [
  // Armas simples
  [/light[\s-]?crossbow|ballesta[\s-]?ligera/i,           'light-crossbow'],
  [/light[\s-]?hammer|martillo[\s-]?ligero/i,             'light-hammer'],
  [/greatclub|gran[\s-]?porra/i,                          'greatclub'],
  [/handaxe|hacha[\s-]?de[\s-]?mano/i,                   'handaxe'],
  [/quarterstaff|bast[oó]n[\s-]?largo/i,                  'quarterstaff'],
  [/\bjavelin\b|\bjabalina\b/i,                           'javelin'],
  [/\bdagger\b|\bdaga\b|\bpu[ñn]al\b/i,                  'dagger'],
  [/\bsickle\b|\bhoz\b/i,                                 'sickle'],
  [/\bspear\b|\blanza\b/i,                                'spear'],
  [/\bdart\b|\bdardo\b/i,                                 'dart'],
  [/\bsling\b|\bhonda\b/i,                                'sling'],
  [/\bmace\b|\bmaza\b/i,                                  'mace'],
  [/\bclub\b|\bporra\b/i,                                 'club'],
  // Armas marciales
  [/hand[\s-]?crossbow|ballesta[\s-]?de[\s-]?mano/i,     'hand-crossbow'],
  [/heavy[\s-]?crossbow|ballesta[\s-]?pesada/i,           'heavy-crossbow'],
  [/war[\s-]?pick|pico[\s-]?de[\s-]?guerra/i,            'war-pick'],
  [/warhammer|war[\s-]?hammer|martillo[\s-]?de[\s-]?guerra/i, 'warhammer'],
  [/greatsword|espad[oó]n/i,                              'greatsword'],
  [/longsword|espada[\s-]?larga/i,                        'longsword'],
  [/shortsword|espada[\s-]?corta/i,                       'shortsword'],
  [/longbow|arco[\s-]?largo/i,                            'longbow'],
  [/shortbow|arco[\s-]?corto/i,                           'shortbow'],
  [/greataxe|gran[\s-]?hacha/i,                           'greataxe'],
  [/battleaxe|hacha[\s-]?de[\s-]?batalla/i,              'battleaxe'],
  [/morningstar|estrella[\s-]?de[\s-]?la[\s-]?ma[ñn]ana/i, 'morningstar'],
  [/\bblowgun\b|\bcerbatana\b/i,                          'blowgun'],
  [/\bglaive\b/i,                                         'glaive'],
  [/\bhalberd\b|\bhal[bv]erda\b/i,                       'halberd'],
  [/\blance\b/i,                                          'lance'],
  [/\bmaul\b/i,                                           'maul'],
  [/\bpike\b|\bpica\b/i,                                  'pike'],
  [/\brapier\b|\bestoque\b/i,                             'rapier'],
  [/\bscimitar\b|\bcimitarra\b/i,                         'scimitar'],
  [/\btrident\b|\btridente\b/i,                           'trident'],
  [/\bwhip\b|\bl[áa]tigo\b/i,                            'whip'],
  [/\bnet\b/i,                                            'net'],
  [/\bflail\b|\bmayal\b/i,                                'flail'],
  // Fallback genérico (al final)
  [/crossbow|ballesta/i,                                   'light-crossbow'],
  [/\baxe\b|\bhacha\b/i,                                  'battleaxe'],
  [/sword|espada/i,                                        'longsword'],
  [/bow|arco/i,                                            'longbow'],
]

/** Intenta mapear un nombre de item (libre) al índice de la D&D API. */
export function guessWeaponSlug(itemName: string): string | null {
  for (const [pattern, slug] of SLUG_MAP) {
    if (pattern.test(itemName)) return slug
  }
  return null
}

// ── Proficiencia ──────────────────────────────────────────────────────────────

/** Usa los datos del API (weapon_category: 'Simple' | 'Martial') para chequear proficiencia. */
export function isWeaponProficient(
  weaponCategory: string,
  classProfIndexes: string[],
  extraWeaponProfs: string[],
  weaponName: string,
): boolean {
  const cat = weaponCategory.toLowerCase()
  // Proficiencia amplia
  if (classProfIndexes.includes('martial-weapons')) return true
  if (cat === 'simple' && classProfIndexes.includes('simple-weapons')) return true
  // Proficiencia específica (e.g. 'daggers' → matchea 'dagger' en el nombre)
  const lower = weaponName.toLowerCase()
  if (classProfIndexes.some(idx => lower.includes(idx.replace(/-/g, ' ').replace(/s$/, '')))) return true
  // Proficiencias manuales extra del personaje
  if (extraWeaponProfs.some(p => lower.includes(p.toLowerCase()))) return true
  return false
}

export function isArmorProficient(armorCategory: string, classProfIndexes: string[]): boolean {
  if (classProfIndexes.includes('all-armor')) return true
  if (classProfIndexes.includes('heavy-armor')) return true
  if (armorCategory === 'Pesada') return false
  if (classProfIndexes.includes('medium-armor')) return true
  if (armorCategory === 'Media') return false
  return classProfIndexes.includes('light-armor')
}

export function isShieldProficient(classProfIndexes: string[]): boolean {
  return classProfIndexes.includes('shields') || classProfIndexes.includes('all-armor')
}

// ── Cálculo de GACO ───────────────────────────────────────────────────────────

export interface AttackBonusResult {
  bonus:       number
  abilityUsed: 'str' | 'dex'
  proficient:  boolean
  weaponName:  string
  known:       boolean  // false = no se encontró el arma en la API
}

/**
 * Calcula el bono de ataque a partir de datos reales de la API.
 * - weapon_range === 'Ranged' → usa DEX
 * - properties includes 'finesse' → usa el mayor de STR/DEX
 * - caso default → usa STR
 */
export function calcAttackBonus(
  weaponName: string,
  apiData: Pick<EquipmentItem, 'weapon_category' | 'weapon_range' | 'properties'> | null | undefined,
  strMod: number,
  dexMod: number,
  profBonus: number,
  classProfIndexes: string[],
  extraWeaponProfs: string[],
): AttackBonusResult {
  if (!apiData?.weapon_category) {
    return { bonus: strMod, abilityUsed: 'str', proficient: false, weaponName, known: false }
  }

  const isFinesse = apiData.properties?.some(p => p.index === 'finesse') ?? false
  const isRanged  = apiData.weapon_range === 'Ranged'

  const abilityUsed: 'str' | 'dex' =
    isRanged  ? 'dex' :
    isFinesse ? (dexMod >= strMod ? 'dex' : 'str') :
    'str'

  const abilityMod = abilityUsed === 'dex' ? dexMod : strMod
  const proficient = isWeaponProficient(apiData.weapon_category, classProfIndexes, extraWeaponProfs, weaponName)

  return {
    bonus: abilityMod + (proficient ? profBonus : 0),
    abilityUsed,
    proficient,
    weaponName,
    known: true,
  }
}
