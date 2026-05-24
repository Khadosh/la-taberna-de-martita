import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import type { Pos } from './combat-types'
import { TOKEN_SIZE } from './combat-helpers'

export function useCombatSpell({
  effSelectedSpellIndex,
  toPos,
  aoeActive,
  aoePosition,
  setAoeType,
  setAoeRadius,
  setAoeActive,
  setAoePosition,
}: {
  effSelectedSpellIndex: string | null
  toPos: Pos | null
  aoeActive: boolean
  aoePosition: Pos | null
  setAoeType: (t: 'circle' | 'cube' | 'cone' | 'line') => void
  setAoeRadius: (r: number) => void
  setAoeActive: (v: boolean) => void
  setAoePosition: (pos: Pos | null) => void
}) {
  const { data: spellDetail } = useQuery({
    queryKey: dndKeys.spell(effSelectedSpellIndex ?? ''),
    queryFn: () => dndApi.spell(effSelectedSpellIndex!),
    enabled: !!effSelectedSpellIndex,
    staleTime: Infinity,
  })

  const parsedSpellConfig = useMemo(() => {
    if (!spellDetail) return null
    const descText = spellDetail.desc?.join(' ').toLowerCase() ?? ''

    let type: 'circle' | 'cube' | 'cone' | 'line' = 'circle'
    let size = 20
    let hasAoe = false

    if (descText.includes('sphere') || descText.includes('radius') || descText.includes('esfera') || descText.includes('radio')) {
      type = 'circle'; hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(radius|esfera|radio|sphere)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('cone') || descText.includes('cono')) {
      type = 'cone'; hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(cone|cono)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('cube') || descText.includes('cubo')) {
      type = 'cube'; hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(cube|cubo)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('line') || descText.includes('línea')) {
      type = 'line'; hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(line|línea)/)
      if (match) size = parseInt(match[1])
    }

    let saveAbility: string | null = null
    if (descText.includes('saving throw') || descText.includes('salvación') || descText.includes('salva de')) {
      if (descText.includes('dexterity') || descText.includes('destreza')) saveAbility = 'DES'
      else if (descText.includes('constitution') || descText.includes('constitución')) saveAbility = 'CON'
      else if (descText.includes('wisdom') || descText.includes('sabiduría')) saveAbility = 'SAB'
      else if (descText.includes('strength') || descText.includes('fuerza')) saveAbility = 'FUE'
      else if (descText.includes('intelligence') || descText.includes('inteligencia')) saveAbility = 'INT'
      else if (descText.includes('charisma') || descText.includes('carisma')) saveAbility = 'CAR'
    }

    const isHealing = spellDetail.name.toLowerCase().includes('cure') ||
      spellDetail.name.toLowerCase().includes('heal') ||
      spellDetail.name.toLowerCase().includes('curar') ||
      spellDetail.name.toLowerCase().includes('sana') ||
      descText.includes('regains') || descText.includes('recupera')

    return { type, size, hasAoe, saveAbility, isHealing }
  }, [spellDetail])

  useEffect(() => {
    if (!parsedSpellConfig) return
    if (parsedSpellConfig.hasAoe) {
      setAoeType(parsedSpellConfig.type)
      setAoeRadius(parsedSpellConfig.size)
      setAoeActive(true)
    } else {
      setAoeActive(false)
    }
  }, [parsedSpellConfig])

  useEffect(() => {
    if (aoeActive && toPos && !aoePosition) {
      setAoePosition({ x: toPos.x + TOKEN_SIZE / 2, y: toPos.y + TOKEN_SIZE / 2 })
    }
  }, [aoeActive, toPos, aoePosition])

  return { spellDetail, parsedSpellConfig }
}
