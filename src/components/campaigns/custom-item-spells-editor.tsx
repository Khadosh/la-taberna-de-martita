import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { RECHARGE_LABELS, type SpellCharge } from '../../lib/custom-items'
import { INPUT_CLS } from './custom-item-form-state'

type Props = {
  spells: SpellCharge[]
  onChange: (spells: SpellCharge[]) => void
}

const COLUMNS = 'grid grid-cols-[1fr_56px_56px_1fr_24px] gap-1.5'

export function CustomItemSpellsEditor({ spells, onChange }: Props) {
  const [spellSearches, setSpellSearches] = useState<Record<number, string>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set())

  const { data: allSpells } = useQuery({
    queryKey: dndKeys.allSpells,
    queryFn: dndApi.allSpells,
    staleTime: Infinity,
  })

  const openDropdown = (i: number) =>
    setOpenDropdowns(s => new Set(s).add(i))

  const closeDropdown = (i: number) =>
    setOpenDropdowns(s => { const n = new Set(s); n.delete(i); return n })

  const addSpell = () =>
    onChange([...spells, { name: '', level: 1, charges: 1, recharge: 'dawn' }])

  const patchSpell = (i: number, key: keyof SpellCharge, val: string | number) =>
    onChange(spells.map((s, j) => j === i ? { ...s, [key]: val } : s))

  const removeSpell = (i: number) =>
    onChange(spells.filter((_, j) => j !== i))

  return (
    <div className="flex flex-col gap-2 pl-5">
      {spells.length > 0 && (
        <div className={`${COLUMNS} px-0.5`}>
          {['Hechizo', 'Nivel', 'Cargas', 'Recarga', ''].map(h => (
            <span key={h} className="text-stone-600 text-[10px] uppercase font-semibold">{h}</span>
          ))}
        </div>
      )}

      {spells.map((spell, i) => {
        const search = spellSearches[i] ?? spell.name
        const filtered = openDropdowns.has(i) && search.length >= 2
          ? (allSpells?.results ?? [])
              .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 8)
          : []

        return (
          <div key={i} className={`${COLUMNS} items-center`}>
            <div className="relative">
              <input
                value={search}
                onChange={e => {
                  setSpellSearches(s => ({ ...s, [i]: e.target.value }))
                  patchSpell(i, 'name', e.target.value)
                }}
                onFocus={() => openDropdown(i)}
                // El delay deja que el onMouseDown de la opción corra antes de
                // que el dropdown se desmonte.
                onBlur={() => setTimeout(() => closeDropdown(i), 150)}
                placeholder="Buscar hechizo..."
                className={INPUT_CLS}
                autoComplete="off"
              />
              {filtered.length > 0 && (
                <ul className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-white border border-stone-300 rounded shadow-lg max-h-40 overflow-y-auto">
                  {filtered.map(s => (
                    <li key={s.index}>
                      <button
                        type="button"
                        className="w-full text-left px-2.5 py-1.5 text-sm text-stone-700 hover:bg-amber-50 transition-colors"
                        onMouseDown={async () => {
                          closeDropdown(i)
                          patchSpell(i, 'name', s.name)
                          setSpellSearches(prev => ({ ...prev, [i]: s.name }))
                          try {
                            const detail = await dndApi.spell(s.index)
                            patchSpell(i, 'level', detail.level)
                          } catch { /* no-op */ }
                        }}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="number" min={0} max={9}
              value={spell.level}
              onChange={e => patchSpell(i, 'level', parseInt(e.target.value) || 0)}
              className={INPUT_CLS}
            />
            <input
              type="number" min={1}
              value={spell.charges}
              onChange={e => patchSpell(i, 'charges', parseInt(e.target.value) || 1)}
              className={INPUT_CLS}
            />
            <select
              value={spell.recharge}
              onChange={e => patchSpell(i, 'recharge', e.target.value as SpellCharge['recharge'])}
              className={INPUT_CLS}
            >
              {(Object.entries(RECHARGE_LABELS) as [SpellCharge['recharge'], string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="button" onClick={() => removeSpell(i)}
              className="text-stone-600 hover:text-red-400 text-sm transition-colors">✕</button>
          </div>
        )
      })}

      <button type="button" onClick={addSpell}
        className="text-xs text-stone-500 hover:text-stone-700 transition-colors text-left">
        + Agregar hechizo
      </button>
    </div>
  )
}
