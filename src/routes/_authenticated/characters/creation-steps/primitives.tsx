import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../../../lib/dnd-api'
import type { SpellDetail } from '../../../../lib/dnd-api'

export const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(120,70,20,0.35)',
}

export const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
}

export const btnStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #9B4A10 0%, #7B3408 100%)',
  color: '#f5d9a8',
  border: '1px solid #6B2C06',
  letterSpacing: '0.1em',
}

export function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-800" />
        <p className="text-xs font-display tracking-widest text-stone-500 uppercase whitespace-nowrap">{children}</p>
        <div className="h-px flex-1 bg-stone-800" />
      </div>
    </div>
  )
}

export function SpellInfoButton({ index, onInfo }: { index: string; onInfo: (s: SpellDetail) => void }) {
  const { data: spell } = useQuery({
    queryKey: dndKeys.spell(index),
    queryFn: () => dndApi.spell(index),
  })
  if (!spell) return null
  return (
    <button
      onClick={e => { e.stopPropagation(); onInfo(spell) }}
      className="px-2 py-2 text-stone-600 hover:text-amber-500 transition-colors text-xs"
      title="Ver descripción"
    >
      ℹ
    </button>
  )
}
