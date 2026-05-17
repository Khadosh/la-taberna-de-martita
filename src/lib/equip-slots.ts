export type SlotKey =
  | 'head' | 'cloak' | 'chest' | 'gloves' | 'boots'
  | 'amulet' | 'ring_1' | 'ring_2'
  | 'main_hand' | 'off_hand' | 'ranged'

export const SLOT_LABELS: Record<SlotKey, string> = {
  head:      'Cabeza',
  cloak:     'Capa',
  chest:     'Pecho',
  gloves:    'Guantes',
  boots:     'Botas',
  amulet:    'Amuleto',
  ring_1:    'Anillo I',
  ring_2:    'Anillo II',
  main_hand: 'Arma',
  off_hand:  'Escudo',
  ranged:    'A distancia',
}

export const SLOT_EMPTY_HINT: Record<SlotKey, string> = {
  head:      '⛑',
  cloak:     '▲',
  chest:     '◈',
  gloves:    '✋',
  boots:     '▼',
  amulet:    '◆',
  ring_1:    '○',
  ring_2:    '○',
  main_hand: '⚔',
  off_hand:  '🛡',
  ranged:    '🏹',
}

export function inferSlot(
  itemName: string,
  existingSlots: Partial<Record<SlotKey, unknown>> = {}
): SlotKey | null {
  const s = itemName.toLowerCase()

  if (/helmet|hood|crown|tiara|circlet|\bhat\b|\bcap\b|\bhelm\b|headband|coif/.test(s))
    return 'head'
  if (/\bcloak\b|\bcape\b|\bmantle\b/.test(s))
    return 'cloak'
  if (/\barmou?r\b|breastplate|chain[\s-]?mail|scale[\s-]?mail|ring[\s-]?mail|\bsplint\b|hide armor|padded|\brobe\b|tunic|hauberk/.test(s))
    return 'chest'
  if (/\bgloves\b|gauntlets?|bracers?/.test(s))
    return 'gloves'
  if (/\bboots\b|\bshoes\b|\bslippers\b|greaves/.test(s))
    return 'boots'
  if (/\bamulet\b|necklace|pendant|periapt|medallion/.test(s))
    return 'amulet'
  if (/\bring\b/.test(s))
    return existingSlots.ring_1 ? 'ring_2' : 'ring_1'
  if (/\bshield\b/.test(s))
    return 'off_hand'
  if (/crossbow|\blongbow\b|\bshortbow\b|\bbow\b|\bsling\b|\bblowgun\b/.test(s))
    return 'ranged'
  if (/sword|axe|\bdagger\b|\bmace\b|\bhammer\b|\bflail\b|\bspear\b|\blance\b|\bstaff\b|\bwand\b|quarterstaff|rapier|scimitar|glaive|halberd|\bpike\b|trident|\bclub\b|\bsickle\b|\bwhip\b/.test(s))
    return 'main_hand'

  return null
}
