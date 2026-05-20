import type { ReactElement } from 'react'

/**
 * SVG icon map for D&D 5e item stat badges.
 * All icons use a 12×12 viewBox, stroke-based, currentColor.
 * Keys: weapon property indices, weapon_category, weapon_range, armor_category.
 */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const STAT_ICONS: Record<string, ReactElement> = {

  // ── Weapon properties ────────────────────────────────────────────────────

  /** Finesse: thin rapier blade – precision & elegance */
  finesse: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1L7 4.5H5L6 1Z" />
      <line x1="6" y1="4.5" x2="6" y2="10" />
      <line x1="4.5" y1="6" x2="7.5" y2="6" />
      <circle cx="6" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),

  /** Light: feather – weightless */
  light: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1C9 3 9.5 7 6 11" />
      <path d="M6 1C3 3 2.5 7 6 11" />
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="4.5" y1="4" x2="6" y2="5" />
      <line x1="4" y1="6.5" x2="6" y2="7.5" />
      <line x1="7.5" y1="4" x2="6" y2="5" />
      <line x1="8" y1="6.5" x2="6" y2="7.5" />
    </svg>
  ),

  /** Heavy: anvil – massive & cumbersome */
  heavy: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M2 5H10V8H2Z" />
      <path d="M3 8H9L8.5 10.5H3.5Z" />
      <line x1="1" y1="5" x2="11" y2="5" />
      <path d="M4 5V3.5H8V5" />
    </svg>
  ),

  /** Loading: hourglass – slow to reload */
  loading: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M2 1H10M2 11H10" />
      <path d="M3 1L6 5.5L9 1" />
      <path d="M3 11L6 6.5L9 11" />
      <path d="M4.5 6.5H7.5" strokeWidth={0.8} />
    </svg>
  ),

  /** Monk: open palm – unarmed/ki weapon */
  monk: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M4 6V3a1 1 0 012 0v3" />
      <path d="M6 5.5V2.5a1 1 0 012 0V6" />
      <path d="M8 5.5V4a1 1 0 012 0v3c0 2.5-2 4-4 4S2 9 2 7V6a1 1 0 012 0v1" />
    </svg>
  ),

  /** Reach: extending arrow – extra range in melee */
  reach: (
    <svg viewBox="0 0 12 12" {...S}>
      <line x1="1" y1="6" x2="11" y2="6" />
      <path d="M7.5 3.5L11 6L7.5 8.5" />
      <line x1="1" y1="4" x2="1" y2="8" />
    </svg>
  ),

  /** Special: 4-point star – unique rule */
  special: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1L7 5H11L8 7.5L9 11L6 8.5L3 11L4 7.5L1 5H5Z" />
    </svg>
  ),

  /** Thrown: parabolic arc – can be thrown */
  thrown: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M1.5 9.5Q5 1.5 10.5 4.5" />
      <path d="M8.5 2.5L10.5 4.5L8.5 6" />
    </svg>
  ),

  /** Two-Handed: two grip bars – requires both hands */
  'two-handed': (
    <svg viewBox="0 0 12 12" {...S}>
      <line x1="3.5" y1="2" x2="3.5" y2="10" strokeWidth={1.6} />
      <line x1="8.5" y1="2" x2="8.5" y2="10" strokeWidth={1.6} />
      <line x1="2" y1="5" x2="5" y2="5" />
      <line x1="7" y1="5" x2="10" y2="5" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="7" y1="8" x2="10" y2="8" />
    </svg>
  ),

  /** Versatile: split diamond – one or two hands */
  versatile: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1L11 6L6 11L1 6Z" />
      <line x1="1" y1="6" x2="11" y2="6" />
      <line x1="6" y1="1" x2="6" y2="11" strokeDasharray="2 1.5" />
    </svg>
  ),

  /** Ammunition: arrow – requires ammo */
  ammunition: (
    <svg viewBox="0 0 12 12" {...S}>
      <line x1="1.5" y1="6" x2="9.5" y2="6" />
      <path d="M7 3.5L10.5 6L7 8.5" />
      <line x1="1.5" y1="4.5" x2="1.5" y2="7.5" />
    </svg>
  ),

  // ── Weapon categories ────────────────────────────────────────────────────

  /** Simple: plain dagger – basic weapons */
  Simple: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1L6.8 4H5.2L6 1Z" />
      <line x1="6" y1="4" x2="6" y2="9" />
      <line x1="4" y1="6" x2="8" y2="6" />
      <path d="M5 9H7L6 11Z" fill="currentColor" stroke="none" />
    </svg>
  ),

  /** Martial: crossed swords – trained weapons */
  Martial: (
    <svg viewBox="0 0 12 12" {...S}>
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
      <line x1="1" y1="3.5" x2="3.5" y2="1" />
      <line x1="11" y1="8.5" x2="8.5" y2="11" />
    </svg>
  ),

  // ── Weapon range ─────────────────────────────────────────────────────────

  /** Melee: sword at close range */
  Melee: (
    <svg viewBox="0 0 12 12" {...S}>
      <line x1="1" y1="6" x2="8" y2="6" />
      <path d="M6 3.5L9.5 6L6 8.5" />
      <path d="M10 3Q12 6 10 9" />
    </svg>
  ),

  /** Ranged: bow & arrow */
  Ranged: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M3 1.5C1 4 1 8 3 10.5" />
      <line x1="3" y1="1.5" x2="3" y2="10.5" />
      <line x1="3" y1="6" x2="10" y2="6" />
      <path d="M7.5 3.5L10.5 6L7.5 8.5" />
    </svg>
  ),

  // ── Armor categories ─────────────────────────────────────────────────────

  /** Light: flowing leather – agile, minimal */
  'Light Armor': (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1C8 1 10 2.5 10 5C10 8 8 10.5 6 11C4 10.5 2 8 2 5C2 2.5 4 1 6 1Z" />
      <path d="M4 4.5C5 3.5 7 3.5 8 4.5" />
    </svg>
  ),

  /** Medium: scale mail – balanced protection */
  'Medium Armor': (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M2 4Q4 2 6 4Q8 2 10 4" />
      <path d="M1.5 6.5Q3.5 4.5 5.5 6.5Q7.5 4.5 9.5 6.5" />
      <path d="M2 9Q4 7 6 9Q8 7 10 9" />
    </svg>
  ),

  /** Heavy: full plate – maximum protection */
  'Heavy Armor': (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M2 2H10V8L8 10H4L2 8Z" />
      <line x1="2" y1="5" x2="10" y2="5" />
      <line x1="6" y1="2" x2="6" y2="5" />
      <line x1="3" y1="8" x2="9" y2="8" />
    </svg>
  ),

  /** Shield */
  Shield: (
    <svg viewBox="0 0 12 12" {...S}>
      <path d="M6 1L11 3.5V7C11 9.5 8.5 11 6 11C3.5 11 1 9.5 1 7V3.5Z" />
      <path d="M6 3L6 9M3.5 5L8.5 5" />
    </svg>
  ),

}
