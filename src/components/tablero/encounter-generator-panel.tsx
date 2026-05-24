import { useState, useEffect, useRef } from 'react'
import { type useEncounterGenerator, ENVIRONMENTS, LOOT_ITEM_OPTIONS, MONSTER_INDEX, xpAtLevel, hpAtLevel } from './use-encounter-generator'
import { type Difficulty, type CreatureRow, crLabel as crLabelFn } from '../../lib/encounter-generator'
import { CornerBracket } from '../combat/combat-helpers'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', deadly: 'Mortal',
}
const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  easy: 'border-emerald-700 bg-emerald-950/60 text-emerald-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  medium: 'border-amber-700 bg-amber-950/60 text-amber-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  hard: 'border-orange-800 bg-orange-950/60 text-orange-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  deadly: 'border-red-950 bg-red-950/60 text-red-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
}
const INACTIVE = 'border-[#3c2414] bg-[#1a0f07]/50 text-stone-400 hover:border-[#8a6b3e] hover:text-[#d5b88a]'

const ROLE_COL_HEADER: Record<string, { label: string; color: string }> = {
  melee: { label: 'Melee', color: 'text-red-400' },
  ranged: { label: 'Distancia', color: 'text-emerald-400' },
  magic: { label: 'Magia', color: 'text-purple-400' },
  support: { label: 'Soporte', color: 'text-amber-400' },
}
const ROLE_BADGE: Record<string, string> = {
  melee: 'border-[#852a2a] bg-[#f8d7d7] text-[#852a2a]',
  ranged: 'border-[#2a6b4c] bg-[#d7f8e7] text-[#2a6b4c]',
  magic: 'border-[#552a85] bg-[#ebd7f8] text-[#552a85]',
  support: 'border-[#6b552a] bg-[#f8ebd7] text-[#6b552a]',
}

const DND_IMG_BASE = 'https://www.dnd5eapi.co'

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
type AbilityKey = typeof ABILITY_KEYS[number]

function abMod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function getEnvironmentIconSvg(env: string, className = "w-4 h-4") {
  switch (env) {
    case 'Bosque':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M12 5L7 11h3.5v4H8l4 5 4-5h-2.5v-4H17L12 5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9l-3.5 5H8v3H6.5l3.5 4.5 3.5-4.5h-1.5v-3h2.5L9 9Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <path d="M6 19h12" strokeLinecap="round" opacity="0.5" />
          <path d="M8 20l1-2M15 20l-1-2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )
    case 'Subterráneo':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M6 2l1 4 1-4M9 2l1.5 5L12 2M13 2l2 6 2-6M18 2l.5 3 .5-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 22l1-4.5L7.5 22M8.5 22l3-6 3 6M15.5 22l2.5-7.5 2 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11.5" cy="10" r="0.75" fill="currentColor" />
          <path d="M14 11l1-2-1.5-1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M12 12v2" strokeLinecap="round" opacity="0.8" />
        </svg>
      )
    case 'Cripta':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 22V10a8 8 0 0116 0v12" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M7 22v-9a5 5 0 0110 0v9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v8M10 11h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 16h6" strokeLinecap="round" opacity="0.7" />
          <path d="M3 22h18" strokeLinecap="round" />
          <path d="M5 20h2M17 20h2" strokeLinecap="round" opacity="0.6" />
          <circle cx="12" cy="4.5" r="1.5" strokeLinecap="round" />
          <path d="M11 6h2" strokeLinecap="round" />
        </svg>
      )
    case 'Planicie':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M2 14c4-3 10-1 14 2s6-2 6-2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17c6 2 12-2 20 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx="12" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3v2M7.5 5.5l1.5 1.5M16.5 5.5l-1.5 1.5M6 9h2M16 9h2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M5 19v-4M5 15l-1-1.5M5 16l1-1M19 19v-3M19 16l-1-1M19 17l1-1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )
    case 'Castillo':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M5 20V9l1-1h2.5l1 1v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 20V9l1-1H19l1 1v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 11v9h6v-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8h3.5M14.5 8h4.5" strokeLinecap="round" />
          <path d="M11 20v-4a1 1 0 012 0v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 11V5l3 1.5L12 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'Averno':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity="0.4" />
          <path d="M12 22C7.58 22 4 18.42 4 14c0-4.5 3-7.5 6-11 0 3 .5 5 1.5 6 1.8-2 3.3-5.5 5.5-6.5-.5 3.5 1 5.5 2 7 2.2 3.3 3 6.5 3 10.5 0 4.42-3.58 8-8 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18c-2.21 0-4-1.79-4-4 0-2.5 2-4.5 4-7 0 2 1 3.5 2 4.5.5-1 1-2.5 1.5-3 .5 2 1 3.5 1 5 0 2.21-1.79 4-4.5 4Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M6 19h12" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'Costa':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M2 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 18c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M3 21c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <path d="M18 15V8l-3 4-2-6-1 9" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx="6" cy="7" r="2" strokeLinecap="round" />
          <path d="M6 3v2M3 7h2M8 7h2" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'Montaña':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M12 4L3 19h18L12 4Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 4v15" strokeLinecap="round" opacity="0.5" />
          <path d="M7 11.5L14.5 19H12" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M17 12.5L11.5 19h4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M9 8c2.5-1 3.5.5 5 0 .75 1.25 1.5 1.5.5 2.5-1-1-3-1.5-5.5-2.5Z" fill="currentColor" stroke="none" opacity="0.8" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      )
  }
}

function getArchetypeIcon(id: string, className = "w-3.5 h-3.5") {
  switch (id) {
    case 'emboscada-goblin':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 20l4-4 12-12-3-3L5 13l-4 4 3 3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 5l4 4M2 22l2-2" strokeLinecap="round" />
          <path d="M9 11l-3 3" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'patrulla-bosque':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 18c3-3 3-9 0-12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6l12 6-12 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <path d="M4 12h16M17 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'nido-aranas':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3l18 18M21 3L3 21M12 2v20M2 12h20" strokeLinecap="round" opacity="0.4" />
          <path d="M12 6c3 0 6 3 6 6s-3 6-6 6-6-3-6-6 3-6 6-6z" strokeLinecap="round" />
          <path d="M12 9c1.5 0 3 1.5 3 3s-1.5 3-3 3-3-1.5-3-3 1.5-3 3-3z" strokeLinecap="round" opacity="0.7" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'manada-lobos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M20 20c-2-2-4-2-6-4-1.5-1.5-2.5-3.5-2.5-5.5 0-2.5.5-3.5 2.5-5 1.5-1 3-2.5 3-2.5s-2 .5-3 1.5c-2 2-3 4-5.5 3-1.5-.5-3.5 0-3.5 0s1.5 1.5 1 3c-.5 1-1.5 1-2 2s-.5 2 1.5 2.5c1.5.5 2.5 2 2.5 3.5s1 3.5 3 4.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'depredadores-bosque':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 3c0 4 2 9 4 14M11 4c0 5 1 10 3 14M16 3c0 6 0 11 1 15" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 19l1 2M12 20l1 2M16 20l1 2" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'tribu-kobold':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 14V8a3 3 0 016 0v6M9 10H6l-2-2M15 10h3l2-2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 14c0 1.5 1 3 3 3s3-1.5 3-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 17v3M13 17v3" strokeLinecap="round" />
        </svg>
      )
    case 'guardia-duergar':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 9h12v4H6V9z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 13v9M12 9V2" strokeLinecap="round" />
          <path d="M18 11h2M4 11h2" strokeLinecap="round" />
          <path d="M9 9l3-4 3 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      )
    case 'guardia-orco':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20" strokeLinecap="round" />
          <path d="M12 5c-3-2-6-1-7 2s1 6 7 4M12 5c3-2 6-1 7 2s-1 6-7 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 21h4" strokeLinecap="round" />
        </svg>
      )
    case 'cueva-aberrante':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <path d="M8 8C6 6 3 7 3 7M16 8c2-2 5-1 5-1M8 16c-2 2-5 1-5 1M16 16c2 2 5 1 5 1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 4C12 2 10 2 10 2M12 20c0 2 2 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'nido-murcielagos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 10c-2-2-5-2-7 0 1 2 3 3 7 1.5 4 1.5 6 .5 7-1.5-2-2-5-2-7 0z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14c-1-1-3-1-4 0 .5 1 1.5 1.5 4 1 2.5 1.5 3.5 1 4 0-1-1-3-1-4 0z" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      )
    case 'patrulla-no-muerta':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 15l4-4 4 4M8 13l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <path d="M12 2v9M10 5h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 11l-3 6M12 11l3 6M12 15h-4M12 15h4" strokeLinecap="round" />
        </svg>
      )
    case 'guardia-cripta':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M5 21V8a7 7 0 0114 0v13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 13h6M12 10v6" strokeLinecap="round" />
          <path d="M3 21h18" strokeLinecap="round" />
        </svg>
      )
    case 'horda-zombies':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 22v-6l-2-2 1-3 3 1v10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 22v-8l-2-3 2-2 2 2v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 22v-5l-1-2 1-3 2 1v9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'culto-oscuro':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 4C9.5 4 8 6 8 8.5c0 3.5 2.5 5.5 4 7.5 1.5-2 4-4 4-7.5C16 6 14.5 4 12 4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 21c0-5 3-7 6-7s6 2 6 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 9v3" strokeLinecap="round" opacity="0.8" />
        </svg>
      )
    case 'espectros-umbral':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 12c-2-2-4 0-4 3 0 4 4 6 4 6M15 10c-2-2-4 0-4 3 0 4 4 6 4 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12V6c0-2 2-3 3-3s3 1 3 3v6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      )
    case 'banda-bandoleros':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 20L20 4M20 20L4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 6l4-4M6 14l-4 4M10 6l4 4M8 10l2-2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )
    case 'tribu-orco':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M6 9V7M18 9V7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10c0 4 3 7 6 7s6-3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10h14" strokeLinecap="round" />
          <path d="M8 17l-2 4M16 17l2 4" strokeLinecap="round" />
        </svg>
      )
    case 'rastreadores-gnoll':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 18L18 6" strokeLinecap="round" />
          <circle cx="5" cy="19" r="1.5" fill="currentColor" />
          <path d="M18 6c1 1.5 2.5 1.5 3 0s-.5-2.5-3-0z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 4l-2 2M20 8l2-2" strokeLinecap="round" />
        </svg>
      )
    case 'jinetes-lobos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M3 21L21 3" strokeLinecap="round" />
          <path d="M17 3l4 4M15 5l2 2" strokeLinecap="round" />
          <path d="M9 13c-2 0-4 1-5 3M11 11c1 2 0 4-3 5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )
    case 'mercenarios-elite':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 4a5 5 0 00-5 5v5h10V9a5 5 0 00-5-5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9h6M8 12h8" strokeLinecap="round" />
          <path d="M5 21l3-3M19 21l-3-3" strokeLinecap="round" />
        </svg>
      )
    case 'guardia-real':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 8h6M10 11h4M12 8v5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        </svg>
      )
    case 'espias-infiltrados':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 3a6 6 0 00-6 6c0 4.5 3.5 6 6 9 2.5-3 6-4.5 6-9a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <path d="M8 21l8-4" strokeLinecap="round" opacity="0.7" />
        </svg>
      )
    case 'cultistas-torre':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 22V10l2-2h2l2 2v12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="5" r="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5h8M12 3v4" strokeLinecap="round" opacity="0.7" />
          <path d="M11 14h2" strokeLinecap="round" />
        </svg>
      )
    case 'guardianes-magicos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v12M10 5h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 8l6 6M5 10l3-1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M18 8l-6 6M19 10l-3-1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )
    case 'elementales-fuego':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C9 5 8 9 8 13a4 4 0 008 0c0-4-1-8-4-11z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 7c-2 2-3 4-3 6a3 3 0 006 0c0-2-1-4-3-6z" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        </svg>
      )
    case 'legiones-infernales':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v17M8 5V2h8v3M12 22a2 2 0 11-2-2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5c1 3 7 3 8 0" strokeLinecap="round" />
        </svg>
      )
    case 'piratas-corsarios':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v15M6 10c0 4 3 7 6 7s6-3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 10h4M16 10h4M9 5h6" strokeLinecap="round" />
          <circle cx="12" cy="4" r="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'sahuagin-raid':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M8 6h8M8 6V3M16 6V3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      )
    case 'gigantes-colinas':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 3c-4.5 0-9 2-9 6.5s3.5 5.5 8 5.5 10-2 10-6.5S16.5 3 12 3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM16 12a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" opacity="0.6" />
          <path d="M8 21l8-4" strokeLinecap="round" />
        </svg>
      )
    case 'vuelo-griffons':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 8c4.5-2 6 .5 8 2.5 2-2 3.5-4.5 8-2.5-.5 3.5-2.5 6-8 7.5-5.5-1.5-7.5-4-8-7.5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14v5M10 21l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      )
  }
}

function CrossedSwordsIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 20 L20 4 M20 20 L4 4" />
      <path d="M15 3 L21 6 L18 9 L15 6 Z" fill="currentColor" />
      <path d="M9 3 L3 6 L6 9 L9 6 Z" fill="currentColor" />
    </svg>
  )
}

function RangedBowIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18 L18 6" />
      <path d="M18 6 H13 M18 6 V11" />
      <path d="M18 18 A 12 12 0 0 1 18 6" />
    </svg>
  )
}

function MagicStaffIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L12 22" />
      <circle cx="12" cy="4" r="2.5" fill="currentColor" />
      <path d="M9.5 4 C 8.5 7, 15.5 7, 14.5 4" />
    </svg>
  )
}

function SupportShieldIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 s8-4 8-10 V5 l-8-3-8 3 v7 c0 6 8 10 8 10 z" />
      <path d="M12 6 v10 M8 11 h8" />
    </svg>
  )
}

const ROLE_ICONS = {
  melee: <CrossedSwordsIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />,
  ranged: <RangedBowIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  magic: <MagicStaffIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
  support: <SupportShieldIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
}

function SkullIcon({ className = "w-3.5 h-3.5", color = "#bc9434" }: { className?: string; color?: string }) {
  return (
    <svg className={className} style={{ color }} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c-4.963 0-9 4.037-9 9 0 2.223.82 4.25 2.164 5.823l.016.015c.162.19.4.305.654.305h.332c.553 0 1-.447 1-1v-1c0-.553.447-1 1-1h6c.553 0 1 .447 1 1v1c0 .553.447 1 1 1h.332c.254 0 .492-.115.654-.305l.016-.015C21.18 15.25 22 13.223 22 11c0-4.963-4.037-9-9-9zm-3.5 10c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
    </svg>
  )
}

function SpecialAbilityTag({ sa }: { sa: { name: string; desc: string } }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        onClick={e => { e.stopPropagation(); setShow(v => !v) }}
        className="text-[7px] px-1 py-0.5 bg-[#eae0cb] border border-[#b8a983] text-[#1c0d02] hover:bg-[#1c0d02] hover:text-[#f5ecd5] font-serif cursor-help transition-all rounded-sm leading-none"
      >
        {sa.name}
      </button>
      {show && (
        <div className="absolute bottom-full left-0 z-50 w-56 p-2 bg-[#1c1208] border border-[#8a6b3e] text-[9px] text-[#e0d1b8] font-serif shadow-xl mb-1 pointer-events-none rounded-sm">
          <p className="font-bold text-[#d5b88a] mb-1">{sa.name}</p>
          <p className="leading-relaxed">{sa.desc}</p>
        </div>
      )}
    </div>
  )
}

function CountStepper({ value, onChange, activeColor }: { value: number; onChange: (v: number) => void; activeColor?: string }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <button onClick={() => onChange(Math.max(0, value - 1))}
        className="w-5 h-5 text-[#bc9434] hover:text-[#d5b88a] text-base leading-none flex items-center justify-center transition-colors cursor-pointer select-none">
        −
      </button>
      <span className={`w-5 text-center text-xs font-mono font-semibold ${value > 0 ? (activeColor ?? 'text-[#e0d1b8]') : 'text-stone-700'}`}>
        {value > 0 ? value : '—'}
      </span>
      <button onClick={() => onChange(value + 1)}
        className="w-5 h-5 text-[#bc9434] hover:text-[#d5b88a] text-base leading-none flex items-center justify-center transition-colors cursor-pointer select-none">
        +
      </button>
    </div>
  )
}

function XpGauge({ adjustedXp, thresholds }: { adjustedXp: number; thresholds: Record<Difficulty, number> }) {
  const maxDisplay = Math.max(thresholds.deadly * 1.5, adjustedXp * 1.1, 1)
  const fillPct = Math.min((adjustedXp / maxDisplay) * 100, 100)
  const pct = (v: number) => Math.min((v / maxDisplay) * 100, 98)

  let currentDiff: Difficulty | 'trivial' = 'trivial'
  if (adjustedXp >= thresholds.deadly) currentDiff = 'deadly'
  else if (adjustedXp >= thresholds.hard) currentDiff = 'hard'
  else if (adjustedXp >= thresholds.medium) currentDiff = 'medium'
  else if (adjustedXp >= thresholds.easy) currentDiff = 'easy'

  const fillGradients = {
    trivial: 'linear-gradient(90deg, rgba(120,113,108,0.4) 0%, rgba(168,162,158,0.8) 100%)',
    easy: 'linear-gradient(90deg, rgba(16,185,129,0.4) 0%, rgba(52,211,153,0.8) 100%)',
    medium: 'linear-gradient(90deg, rgba(245,158,11,0.4) 0%, rgba(251,191,36,0.8) 100%)',
    hard: 'linear-gradient(90deg, rgba(249,115,22,0.4) 0%, rgba(251,146,60,0.8) 100%)',
    deadly: 'linear-gradient(90deg, rgba(239,68,68,0.4) 0%, rgba(248,113,113,0.8) 100%)',
  }

  const activeColors = {
    trivial: '#78716c',
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#f97316',
    deadly: '#ef4444',
  }

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>XP Ajustado</span>
        <span className="text-xs font-mono font-bold" style={{ color: activeColors[currentDiff] }}>
          {adjustedXp} ({DIFFICULTY_LABELS[currentDiff as Difficulty] ?? 'Trivial'})
        </span>
      </div>
      <div
        className="relative h-4 bg-[#20120a] border border-[#5a3c1e] rounded-sm overflow-hidden"
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.05)'
        }}
      >
        {/* Laurel leaves pattern (background) */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
          <defs>
            <pattern id="laurel-xp" width="16" height="12" patternUnits="userSpaceOnUse">
              <path d="M 1 6 Q 4 3 8 6 Q 4 9 1 6" fill="#bc9434" />
              <path d="M 15 6 Q 12 3 8 6 Q 12 9 15 6" fill="#bc9434" />
              <line x1="0" y1="6" x2="16" y2="6" stroke="#bc9434" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#laurel-xp)" />
        </svg>

        {/* Fill container */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            background: fillGradients[currentDiff],
            boxShadow: `0 0 6px ${activeColors[currentDiff]}, 0 0 12px rgba(255,255,255,0.15)`,
          }}
        />

        {/* Sliding dial pointer (exactly like an antique slider indicator) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-6 transition-all duration-500 ease-out pointer-events-none"
          style={{
            left: `${fillPct}%`,
            zIndex: 10,
            background: 'linear-gradient(135deg, #d5b88a 0%, #bc9434 50%, #8a6b3e 100%)',
            border: '1.5px solid #1a0f07',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
            clipPath: 'polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)',
          }}
        />

        {/* Threshold mark lines */}
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <div
            key={d}
            className="absolute top-0 bottom-0 w-0.5 bg-[#5a3c1e]"
            style={{
              left: `${pct(thresholds[d])}%`,
              boxShadow: '0 0 2px rgba(0,0,0,0.8)'
            }}
          />
        ))}
      </div>
      <div className="relative h-4">
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <span
            key={d}
            className="absolute text-[8px] font-mono -translate-x-1/2"
            style={{
              left: `${pct(thresholds[d])}%`,
              color: '#8a6b3e',
            }}
          >
            {DIFFICULTY_LABELS[d]}
          </span>
        ))}
      </div>
    </div>
  )
}

function MonsterRowEditorModal({ row, onClose, onUpdate }: {
  row: CreatureRow
  onClose: () => void
  onUpdate: (patch: Partial<CreatureRow>) => void
}) {
  const [local, setLocal] = useState<CreatureRow>({ ...row })
  const level = local.level ?? 1
  const effectiveHp = local.hp !== undefined ? hpAtLevel(local.hp, level) : undefined
  const effectiveXp = xpAtLevel(row.xp, level)
  const set = (patch: Partial<CreatureRow>) => setLocal(prev => ({ ...prev, ...patch }))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative p-5 w-full max-w-sm space-y-4 z-10 overflow-y-auto max-h-[90vh] shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
          border: '6px solid #23140a',
          borderRadius: '8px',
          boxShadow: '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.9), 0 0 0 1px #120a05',
        }}
      >
        <CornerBracket rotation={0} />
        <CornerBracket rotation={270} />
        <CornerBracket rotation={90} />
        <CornerBracket rotation={180} />

        <div className="flex items-center justify-between border-b border-[#3c2414] pb-2">
          <span className="text-sm font-serif font-bold text-[#d5b88a]">{row.name}</span>
          <button
            onClick={onClose}
            className="text-[#bc9434] hover:text-[#d5b88a] text-base leading-none transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8a6b3e] font-serif w-14 shrink-0">Nivel</label>
          <CountStepper value={level} onChange={v => set({ level: Math.max(1, Math.min(20, v)) })} />
          <span className="text-[10px] font-mono text-[#d5b88a]/70">
            {effectiveHp !== undefined && `PG ${effectiveHp} · `}{effectiveXp} XP
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#8a6b3e] font-serif">Estadísticas</label>
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-[#8a6b3e] uppercase font-mono">{stat}</span>
                <input
                  type="number" min={1} max={30}
                  value={local[stat] ?? ''}
                  onChange={e => set({ [stat]: parseInt(e.target.value) || undefined })}
                  className="w-full px-0.5 py-0.5 bg-black/40 border border-[#3c2414] text-[#d5b88a] text-[10px] font-mono text-center focus:outline-none focus:border-[#bc9434] no-spinners rounded-sm"
                />
                {local[stat] !== undefined && (
                  <span className="text-[8px] font-mono text-[#8a6b3e]/60">{abMod(local[stat]!)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8a6b3e] font-serif w-14 shrink-0">Velocidad</label>
          <input
            value={local.speed ?? ''}
            onChange={e => set({ speed: e.target.value })}
            className="flex-1 px-2 py-1 bg-black/40 border border-[#3c2414] text-[#e0d1b8] text-xs font-mono focus:outline-none focus:border-[#bc9434] rounded-sm"
          />
        </div>

        {local.specialAbilities && local.specialAbilities.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-[#8a6b3e] font-serif">Habilidades especiales</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {local.specialAbilities.map(sa => (
                <div key={sa.name} className="bg-black/30 border border-[#3c2414] px-2 py-1.5 rounded-sm">
                  <p className="text-[10px] font-bold text-[#d5b88a] font-serif mb-0.5">{sa.name}</p>
                  <p className="text-[9px] text-[#e0d1b8]/70 font-serif leading-relaxed">{sa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#3c2414]">
          <button
            onClick={onClose}
            className="text-xs text-[#8a6b3e] hover:text-[#bc9434] font-serif transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onUpdate(local); onClose() }}
            className="px-4 py-1.5 border font-serif text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-sm"
            style={{
              background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
              borderColor: '#bc9434',
              color: '#ffffff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)'}
            onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)'}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

function MonsterCard({ row, role, index, unitLevel, onEdit, onLevelChange }: {
  row: CreatureRow; role: string; index: number; unitLevel: number
  onEdit: () => void
  onLevelChange: (delta: number) => void
}) {
  const imgUrl = `${DND_IMG_BASE}/api/2014/images/monsters/${row.monsterIndex}.png`
  const [imgOk, setImgOk] = useState(true)
  const effectiveHp = row.hp !== undefined ? hpAtLevel(row.hp, unitLevel) : undefined

  return (
    <div
      onClick={onEdit}
      className="parchment-card border rounded-sm overflow-hidden flex flex-col transition-all duration-300 relative cursor-pointer"
      style={{
        background: 'linear-gradient(to bottom, #fcf8ee, #f5eedc)',
        borderColor: '#b8a983',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(250,235,215,0.5)',
      }}
    >
      {/* Tiny corner bracket designs inside the parchment note */}
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-[#b8a983]/60 pointer-events-none" />

      {/* Image container */}
      <div className="h-20 bg-[#f1ebd9] overflow-hidden flex items-center justify-center relative">
        {imgOk
          ? <img src={imgUrl} alt={row.name} onError={() => setImgOk(false)} className="w-full h-full object-cover object-top opacity-90 transition-all duration-300 card-image" />
          : <span className="text-[#5c4322] text-xs font-serif font-bold">{row.name.charAt(0)}</span>
        }
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
      </div>

      <div className="px-2 py-1.5 flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1 flex-wrap justify-between">
          <span className="text-[10px] text-[#1c0d02] font-serif leading-tight truncate flex-1 font-bold">
            {row.name.toUpperCase()}<span className="text-[#8a6b3e] ml-0.5 font-mono text-[9px]">#{index + 1}</span>
          </span>
          <span className={`text-[7px] px-1 py-0.5 border font-serif tracking-wide shrink-0 rounded-sm font-semibold flex items-center gap-0.5 ${ROLE_BADGE[role] ?? ''}`}>
            {ROLE_ICONS[role as keyof typeof ROLE_ICONS]}
            <span>{ROLE_COL_HEADER[role]?.label ?? role}</span>
          </span>
        </div>

        {/* Stats Grid styled like a real physical paper card */}
        <div className="grid grid-cols-2 gap-x-2 text-[9px] font-mono text-[#5c4322] border-t border-b border-[#b8a983]/40 py-1">
          <div className="flex justify-between border-r border-[#b8a983]/20 pr-1">
            <span>CR</span>
            <strong className="text-[#1c0d02]">{crLabelFn(row.cr)}</strong>
          </div>
          <div className="flex justify-between pl-1">
            <span>CA</span>
            <strong className="text-[#1c0d02]">{row.ac}</strong>
          </div>
          <div className="flex justify-between border-r border-[#b8a983]/20 pr-1">
            <span>PG</span>
            {effectiveHp !== undefined
              ? <strong className="text-[#1c0d02]">{effectiveHp}</strong>
              : <span className="text-stone-400 animate-pulse">…</span>}
          </div>
          <div className="flex justify-between pl-1">
            <span>Dmg</span>
            {row.damageStr !== undefined
              ? <strong className="text-[#1c0d02]">{row.damageStr}</strong>
              : <span className="text-stone-400 animate-pulse">…</span>}
          </div>
        </div>

        {row.str !== undefined && (
          <div className="grid grid-cols-6 gap-px">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center">
                <span className="text-[6px] text-[#8a6b3e] uppercase font-mono font-bold">{stat}</span>
                <span className="text-[8px] text-[#2d1808] font-mono font-bold">{row[stat as AbilityKey] ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        {row.speed && <span className="text-[7px] font-mono text-[#5c4322]">Velocidad: {row.speed}</span>}

        {row.specialAbilities && row.specialAbilities.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {row.specialAbilities.slice(0, 3).map(sa => (
              <SpecialAbilityTag key={sa.name} sa={sa} />
            ))}
            {row.specialAbilities.length > 3 && (
              <span className="text-[7px] text-[#8a6b3e] font-mono self-center ml-0.5 font-bold">+{row.specialAbilities.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 border-t border-[#b8a983]/40 pt-1 mt-0.5" onClick={e => e.stopPropagation()}>
          <span className="text-[8px] text-[#5c4322] font-serif flex-1 font-semibold">Nivel</span>
          <button onClick={() => onLevelChange(-1)}
            className="w-4 h-4 text-[#8a6b3e] hover:text-[#1c0d02] text-xs leading-none flex items-center justify-center transition-colors cursor-pointer font-bold select-none">−</button>
          <span className="text-[9px] font-mono text-[#1c0d02] w-4 text-center font-bold">{unitLevel}</span>
          <button onClick={() => onLevelChange(1)}
            className="w-4 h-4 text-[#8a6b3e] hover:text-[#1c0d02] text-xs leading-none flex items-center justify-center transition-colors cursor-pointer font-bold select-none">+</button>
        </div>
      </div>
    </div>
  )
}

function MonsterSearchAdd({ onAdd }: { onAdd: (idx: string) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const results = query.trim().length >= 2
    ? MONSTER_INDEX.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="+ Agregar monstruo…"
        className="w-full px-3 py-1.5 bg-black/30 border-t border-[#3c2414] text-[#d5b88a] text-xs font-serif placeholder-stone-600 focus:outline-none focus:text-[#e0d1b8] focus:border-[#bc9434]"
      />
      {open && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 bg-[#1c1208] border border-[#8a6b3e] shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {results.map(m => (
            <button key={m.index}
              onMouseDown={e => { e.preventDefault(); onAdd(m.index); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#e0d1b8] hover:bg-[#2c1a0e] hover:text-[#d5b88a] font-serif flex items-center gap-2 cursor-pointer">
              <span className="flex-1">{m.name}</span>
              <span className="text-[#8a6b3e] font-mono text-[10px]">CR {crLabelFn(m.cr)}</span>
              <span className="text-stone-500 font-mono text-[10px]">{m.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EncounterGeneratorPanel({ encounterGen }: { encounterGen: ReturnType<typeof useEncounterGenerator> }) {
  const {
    selectedEnv, setSelectedEnv,
    selectedArchetypeIds, setSelectedArchetypeIds,
    difficulty, setDifficulty,
    rows, units, loot,
    noResults, isSpawning, loadingDetails,
    adjustedXp, thresholds,
    availableArchetypes, archetypesForEnv,
    generateNew, updateRowCount, updateRowLevel, updateUnitLevel, updateRowField, removeRow, addManualRow,
    updateCurrency, updateItemQty, updateItemName, removeItem, addItem,
    regenerateLoot, clearDraft, spawnEncounter,
  } = encounterGen

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [archetypeDropdownOpen, setArchetypeDropdownOpen] = useState(false)
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
  const editingRow = editingRowId ? rows.find(r => r.id === editingRowId) ?? null : null

  const envRef = useRef<HTMLDivElement>(null)
  const archetypeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (envRef.current && !envRef.current.contains(e.target as Node)) {
        setEnvDropdownOpen(false)
      }
      if (archetypeRef.current && !archetypeRef.current.contains(e.target as Node)) {
        setArchetypeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasRows = rows.length > 0
  const archetypeList = archetypesForEnv.length > 0 ? archetypesForEnv : availableArchetypes

  const totalCompositionXp = rows.reduce((acc, row) => {
    const rowCount = (['melee', 'ranged', 'magic', 'support'] as const).reduce((sum, r) => sum + row.counts[r], 0)
    return acc + xpAtLevel(row.xp, row.level ?? 1) * rowCount
  }, 0)

  return (
    <>
      <div className="p-5 space-y-5">

        {/* Zone + Archetype */}
        <div className="grid grid-cols-[1.2fr_2fr] gap-4">
          <div className="space-y-1 relative" ref={envRef}>
            <div className="flex items-center justify-between h-5">
              <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider leading-none">Zona</label>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setEnvDropdownOpen(v => !v)}
                className="w-full h-[38px] flex items-center justify-between pl-3 pr-3 bg-black/40 border border-[#3c2414] hover:border-[#bc9434] text-[#d5b88a] text-xs font-serif focus:outline-none focus:border-[#bc9434] cursor-pointer rounded-sm text-left transition-colors relative"
              >
                <div className="flex items-center gap-2">
                  {getEnvironmentIconSvg(selectedEnv, "w-4 h-4 text-[#bc9434] shrink-0")}
                  <span>{selectedEnv}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {archetypesForEnv.length > 0 && (
                    <span className="text-[9px] font-mono text-[#bc9434] bg-[#2a1a0e] border border-[#5a3c1e] px-1.5 py-0.5 rounded-sm">
                      LVL {Math.min(...archetypesForEnv.map(a => a.levelRange[0]))}-{Math.max(...archetypesForEnv.map(a => a.levelRange[1]))}
                    </span>
                  )}
                  <span className="text-[10px] text-[#bc9434]">▼</span>
                </div>
              </button>
            </div>

            {envDropdownOpen && (
              <div className="border border-[#5a3c1e] bg-[#1a0f07] rounded-sm absolute left-0 z-30 shadow-2xl mt-1.5 w-[380px] p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {ENVIRONMENTS.map(env => {
                    const isSelected = selectedEnv === env
                    const envDesc: Record<string, string> = {
                      'Bosque': 'Bosques salvajes y senderos umbríos',
                      'Subterráneo': 'Cavernas profundas y túneles oscuros',
                      'Cripta': 'Catacumbas antiguas y profanadas',
                      'Planicie': 'Llanuras abiertas y campos de batalla',
                      'Castillo': 'Fortalezas de piedra y pasillos reales',
                      'Averno': 'Tierras infernales de fuego y azufre',
                      'Costa': 'Acantilados y playas de agua salada',
                      'Montaña': 'Picos elevados y senderos rocosos'
                    }
                    return (
                      <button
                        key={env}
                        type="button"
                        onClick={() => {
                          setSelectedEnv(env)
                          setEnvDropdownOpen(false)
                        }}
                        className={`flex items-center gap-2 p-1.5 bg-black/40 border transition-all rounded-sm text-left group cursor-pointer ${
                          isSelected
                            ? 'border-[#bc9434] bg-[#2c1a0e]/40 shadow-[0_0_8px_rgba(188,148,52,0.25)]'
                            : 'border-[#3c2414] hover:border-[#8a6b3e] hover:bg-[#2c1a0e]/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#2a1a0e] border-[#bc9434] text-[#d5b88a]'
                            : 'bg-black/20 border-[#3c2414] text-[#8a6b3e] group-hover:text-[#bc9434] group-hover:border-[#8a6b3e]'
                        }`}>
                          {getEnvironmentIconSvg(env, "w-4 h-4 shrink-0")}
                        </div>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className={`text-[11px] font-serif font-bold transition-colors ${
                            isSelected ? 'text-[#d5b88a]' : 'text-[#e0d1b8] group-hover:text-[#d5b88a]'
                          }`}>
                            {env}
                          </span>
                          <span className="text-[8px] text-stone-500 font-serif leading-none truncate">
                            {envDesc[env] ?? ''}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1 relative" ref={archetypeRef}>
            <div className="flex items-center justify-between h-5">
              <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider leading-none">Arquetipo</label>
              {selectedArchetypeIds.length > 0 && (
                <span className="text-[10px] text-[#8a6b3e]/70 font-serif leading-none">{selectedArchetypeIds.length} seleccionado{selectedArchetypeIds.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 min-h-[38px] px-2 py-1 border border-[#3c2414] bg-black/30 rounded-sm w-full relative">
              {selectedArchetypeIds.length === 0 && (
                <span className="text-xs text-stone-600 font-serif italic pl-1">Seleccionar arquetipos...</span>
              )}
              {selectedArchetypeIds.map(id => {
                const arch = archetypeList.find(a => a.id === id) ?? availableArchetypes.find(a => a.id === id)
                if (!arch) return null
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2c1a0e] border border-[#5a3c1e] text-[#d5b88a] text-[10px] font-serif rounded-sm h-[26px]">
                    {getArchetypeIcon(id, "w-3 h-3 text-[#bc9434] shrink-0")}
                    <span>{arch.name}</span>
                    <button
                      onClick={() => setSelectedArchetypeIds(selectedArchetypeIds.filter(x => x !== id))}
                      className="text-[#bc9434] hover:text-red-400 leading-none ml-0.5 cursor-pointer">×</button>
                  </span>
                )
              })}
              <button
                onClick={() => setArchetypeDropdownOpen(v => !v)}
                className="ml-auto text-[#bc9434] hover:text-[#d5b88a] text-xs px-1 transition-colors cursor-pointer"
              >▼</button>
            </div>
            {archetypeDropdownOpen && (
              <div className="border border-[#5a3c1e] bg-[#1a0f07] max-h-56 overflow-y-auto custom-scrollbar rounded-sm absolute left-0 right-0 z-30 shadow-2xl mt-1.5 p-1 space-y-0.5">
                {archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).length === 0 ? (
                  <p className="text-xs text-[#8a6b3e] font-serif italic px-3 py-2 text-center">Todos seleccionados</p>
                ) : archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).map(a => (
                  <button key={a.id}
                    onClick={() => { setSelectedArchetypeIds([...selectedArchetypeIds, a.id]); setArchetypeDropdownOpen(false) }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#e0d1b8] hover:bg-[#2c1a0e] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer flex items-center gap-2.5 rounded-sm border border-transparent hover:border-[#8a6b3e]/40">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black/30 border border-[#3c2414] text-[#bc9434] shrink-0">
                      {getArchetypeIcon(a.id, "w-3 h-3")}
                    </div>
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-[8px] font-mono text-[#8a6b3e] bg-[#2a1a0e] border border-[#3c2414] px-1 py-0.5 rounded-sm">
                      NIV {a.levelRange[0]}-{a.levelRange[1]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Difficulty + generate */}
        <div className="space-y-1">
          <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider">Dificultad</label>
          <div className="flex">
            <div className="flex flex-1">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d, i) => {
                const skullColors = {
                  easy: '#10b981',
                  medium: '#d97706',
                  hard: '#ea580c',
                  deadly: '#dc2626',
                }
                return (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 font-serif text-xs transition-colors border-y border-r cursor-pointer flex items-center justify-center gap-1.5 ${i === 0 ? 'border-l rounded-l-sm' : ''} ${i === 3 ? 'rounded-r-sm' : ''} ${difficulty === d ? DIFFICULTY_ACTIVE[d] : INACTIVE}`}
                    style={{ borderColor: '#3c2414' }}
                  >
                    <SkullIcon color={skullColors[d]} className="w-3.5 h-3.5 shrink-0" />
                    <span>{DIFFICULTY_LABELS[d]}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={generateNew}
              disabled={selectedArchetypeIds.length === 0}
              className="px-6 py-2 border font-serif text-sm font-semibold tracking-widest transition-all ml-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              style={{
                background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
                borderColor: '#bc9434',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
              }}
              onMouseOver={e => { if (selectedArchetypeIds.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)' }}
              onMouseOut={e => { if (selectedArchetypeIds.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)' }}
            >
              GENERAR
            </button>
          </div>
        </div>

        {noResults && (
          <p className="text-xs text-red-400 font-serif italic">
            Sin monstruos disponibles para este arquetipo y nivel del grupo.
          </p>
        )}

        <>
          {/* Creature table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>
                Composición{units.length > 0 ? ` · ${units.length} criatura${units.length !== 1 ? 's' : ''}` : ''}
                {loadingDetails && <span className="ml-2 text-[#bc9434] italic animate-pulse">cargando stats…</span>}
              </span>
              {hasRows && (
                <button onClick={generateNew} className="text-[10px] text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                  Regenerar
                </button>
              )}
            </div>
            <div className="border border-[#3c2414] bg-black/20 rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#3c2414] bg-black/30">
                    <th className="text-left text-[#8a6b3e] font-normal font-serif py-2 pl-3 pr-2">Criatura</th>
                    <th className="text-center text-[#8a6b3e] font-normal font-serif py-2 px-2 text-[10px]">Niv.</th>
                    {(['melee', 'ranged', 'magic', 'support'] as const).map(role => (
                      <th key={role} className="text-center font-normal px-2 py-2">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {ROLE_ICONS[role]}
                          <span className="hidden sm:inline text-[#8a6b3e]">{ROLE_COL_HEADER[role].label}</span>
                        </div>
                      </th>
                    ))}
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b border-[#23140a]/60 hover:bg-[#2c1a0e]/20 transition-colors">
                      <td className="py-2 pl-3 pr-2">
                        <div className="flex items-center gap-2">
                          {/* Tiny round token portrait */}
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#8a6b3e] bg-[#1a0f07] shrink-0 relative">
                            <img
                              src={`${DND_IMG_BASE}/api/2014/images/monsters/${row.monsterIndex}.png`}
                              alt={row.name}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[#d5b88a] font-serif font-bold text-[11px]">{row.name}</span>
                              <span className="text-[#8a6b3e] font-mono text-[9px]">CR {crLabelFn(row.cr)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-stone-500 font-mono mt-0.5">
                              {row.hp !== undefined && <span>PG {hpAtLevel(row.hp, row.level ?? 1)}</span>}
                              <span>·</span>
                              <span>{xpAtLevel(row.xp, row.level ?? 1)} XP</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <CountStepper
                          value={row.level ?? 1}
                          onChange={v => updateRowLevel(row.id, v - (row.level ?? 1))}
                        />
                      </td>
                      {(['melee', 'ranged', 'magic', 'support'] as const).map(role => (
                        <td key={role} className="px-1 py-1.5 text-center">
                          <CountStepper
                            value={row.counts[role]}
                            activeColor={ROLE_COL_HEADER[role].color}
                            onChange={v => updateRowCount(row.id, role, v - row.counts[role])}
                          />
                        </td>
                      ))}
                      <td className="py-2 pr-2 text-center">
                        <button onClick={() => removeRow(row.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm leading-none cursor-pointer">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-t border-[#3c2414] text-[9px] font-mono text-[#d5b88a]">
                <MonsterSearchAdd onAdd={addManualRow} />
                <span>TOTAL XP: {totalCompositionXp}</span>
              </div>
            </div>
          </div>

          {hasRows && (
            <>
              {/* Individual cards */}
              <div className="grid grid-cols-3 gap-2">
                {rows.flatMap(row =>
                  (['melee', 'ranged', 'magic', 'support'] as const).flatMap(role =>
                    Array.from({ length: row.counts[role] }, (_, i) => {
                      const unitLevel = row.unitLevels?.[`${role}-${i}`] ?? row.level ?? 1
                      return (
                        <MonsterCard key={`${row.id}-${role}-${i}`} row={row} role={role} index={i}
                          unitLevel={unitLevel}
                          onEdit={() => setEditingRowId(row.id)}
                          onLevelChange={delta => updateUnitLevel(row.id, role, i, delta)} />
                      )
                    })
                  )
                )}
              </div>

              <XpGauge adjustedXp={adjustedXp} thresholds={thresholds} />

              {/* Loot */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#bc9434]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>Botín</span>
                  </div>
                  <button onClick={regenerateLoot} className="text-[10px] text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                    Regenerar botín
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {(['gp', 'sp', 'cp'] as const).map(coin => {
                    const labels = {
                      gp: { es: 'po', color: 'text-amber-300', focus: 'focus:border-amber-400', coinBg: 'from-yellow-300 to-amber-500 border-amber-600' },
                      sp: { es: 'pp', color: 'text-stone-300', focus: 'focus:border-stone-400', coinBg: 'from-stone-200 to-stone-400 border-stone-500' },
                      cp: { es: 'pc', color: 'text-orange-400', focus: 'focus:border-orange-500', coinBg: 'from-orange-300 to-orange-600 border-orange-700' }
                    }
                    const { es, color, focus, coinBg } = labels[coin]
                    return (
                      <div key={coin} className="flex items-center gap-1.5">
                        <input
                          type="number" min={0}
                          value={loot.currency[coin]}
                          onChange={e => updateCurrency({ [coin]: parseInt(e.target.value) || 0 })}
                          className={`w-14 px-2 py-1 bg-black/40 border border-[#3c2414] text-xs font-mono text-center ${color} focus:outline-none ${focus} no-spinners rounded-sm`}
                        />
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${coinBg} border shadow-sm`} />
                          <span className={`text-[10px] font-serif ${color}`}>{es}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-1.5">
                  {loot.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <select
                        value={item.name}
                        onChange={e => updateItemName(item.id, e.target.value)}
                        className="flex-1 px-2 py-1 bg-black/40 border border-[#3c2414] text-[#d5b88a] text-xs font-serif focus:outline-none focus:border-[#bc9434] appearance-none cursor-pointer rounded-sm"
                      >
                        {LOOT_ITEM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <CountStepper value={item.qty} onChange={v => updateItemQty(item.id, v)} />
                      <button onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm shrink-0 cursor-pointer">×</button>
                    </div>
                  ))}
                  <button onClick={addItem}
                    className="text-xs text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                    + Agregar ítem
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3c2414] mt-2">
                <button
                  onClick={clearDraft}
                  className="text-xs text-[#8a6b3e] hover:text-[#bc9434] font-serif transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar
                </button>
                <button
                  onClick={spawnEncounter}
                  disabled={isSpawning || units.length === 0}
                  className="px-5 py-2 border font-serif text-sm font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                  style={{
                    background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
                    borderColor: '#bc9434',
                    color: '#ffffff',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
                  }}
                  onMouseOver={e => { if (!isSpawning && units.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)' }}
                  onMouseOut={e => { if (!isSpawning && units.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)' }}
                >
                  {isSpawning ? (
                    <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-[#fcd34d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <polygon points="12,2 22,7.5 22,16.5 12,22 2,16.5 2,7.5" />
                      <polygon points="12,2 12,8 2,7.5" />
                      <polygon points="12,2 12,8 22,7.5" />
                      <polygon points="12,8 22,7.5 17,14" />
                      <polygon points="12,8 2,7.5 7,14" />
                      <polygon points="12,8 7,14 17,14" />
                      <polygon points="7,14 17,14 12,22" />
                      <polygon points="2,16.5 7,14 12,22" />
                      <polygon points="22,16.5 17,14 12,22" />
                      <polygon points="2,7.5 2,16.5 7,14" />
                      <polygon points="22,7.5 22,16.5 17,14" />
                    </svg>
                  )}
                  Invocar al tablero
                </button>
              </div>
            </>
          )}
        </>
      </div>

      {editingRow && (
        <MonsterRowEditorModal
          row={editingRow}
          onClose={() => setEditingRowId(null)}
          onUpdate={patch => updateRowField(editingRow.id, patch)}
        />
      )}
    </>
  )
}

export function EncounterModal({ encounterGen }: { encounterGen: ReturnType<typeof useEncounterGenerator> }) {
  const { closeEncounterGenerator } = encounterGen

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEncounterGenerator() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeEncounterGenerator])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={closeEncounterGenerator} />
      <div
        className="relative w-full max-w-3xl flex flex-col shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
          border: '8px solid #23140a',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
        }}
      >
        <style>{`
          /* Hide HTML5 Up/Down Spinners */
          .no-spinners::-webkit-outer-spin-button,
          .no-spinners::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .no-spinners {
            -moz-appearance: textfield;
          }
          /* Custom scrollbar for premium theme */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(26, 15, 7, 0.4);
            border-left: 1px solid #23140a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #3c2414;
            border: 2px solid rgba(26, 15, 7, 0.4);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #8a6b3e;
          }
          /* Hover effects for premium parchment cards */
          .parchment-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .parchment-card:hover {
            transform: translateY(-2px);
            border-color: #bc9434;
            box-shadow: 0 10px 25px rgba(188, 148, 52, 0.35), inset 0 0 14px rgba(188, 148, 52, 0.2);
          }
          .parchment-card .card-image {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .parchment-card:hover .card-image {
            opacity: 1;
          }
        `}</style>
        <CornerBracket rotation={0} />
        <CornerBracket rotation={270} />
        <CornerBracket rotation={90} />
        <CornerBracket rotation={180} />

        {/* Header - Sticky/Fixed at the top of the modal */}
        <div
          className="flex items-center gap-4 px-5 pt-4 pb-3 border-b z-10"
          style={{
            borderBottomColor: '#23140a',
            background: 'rgba(21, 12, 7, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span
            className="text-sm tracking-widest uppercase font-serif font-semibold shrink-0"
            style={{
              color: '#d5b88a',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            Generador Procedural de Encuentros
          </span>
          <div className="flex-1 h-px bg-[#3c2414]" />
          <button
            onClick={closeEncounterGenerator}
            className="hover:text-stone-300 font-serif text-base leading-none transition-colors shrink-0 cursor-pointer"
            style={{ color: '#bc9434' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Panel Area */}
        <div className="overflow-y-auto max-h-[80vh] custom-scrollbar">
          <EncounterGeneratorPanel encounterGen={encounterGen} />
        </div>
      </div>
    </div>
  )
}
