import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { type NpcItem } from './tablero-types'
import { formatModInline } from './tablero-types'
import { type useEncounterGenerator, ENVIRONMENTS, LOOT_ITEM_OPTIONS, MONSTER_INDEX, xpAtLevel, hpAtLevel } from './use-encounter-generator'
import type { Difficulty, CreatureRow } from '../../lib/encounter-generator'

interface DmNpcFormProps {
  campaignId: string
  showNpcBar: boolean
  npcInputRef: React.RefObject<HTMLInputElement | null>
  npcInput: string
  setNpcInput: (val: string) => void
  addNpc: () => Promise<void>
  
  showCampaignNpcs: boolean
  setShowCampaignNpcs: React.Dispatch<React.SetStateAction<boolean>>
  campaignNpcSearch: string
  setCampaignNpcSearch: (val: string) => void
  filteredCampaignNpcs: any[]
  addNpcFromCampaign: (n: any) => Promise<void>

  showBestiary: boolean
  setShowBestiary: React.Dispatch<React.SetStateAction<boolean>>
  bestiarySearch: string
  setBestiarySearch: (val: string) => void
  bestiaryQty: number
  setBestiaryQty: (val: number) => void
  filteredMonsters: any[]
  addingMonster: boolean
  addNpcFromMonster: (m: any, qty: number) => Promise<void>

  showNpcForm: boolean
  setShowNpcForm: React.Dispatch<React.SetStateAction<boolean>>
  npcFormName: string
  setNpcFormName: (val: string) => void
  npcFormHp: number
  setNpcFormHp: (val: number) => void
  npcFormAc: number
  setNpcFormAc: (val: number) => void
  npcFormType: string
  setNpcFormType: (val: string) => void
  npcFormAttack: number
  setNpcFormAttack: (val: number) => void
  npcFormDamage: string
  setNpcFormDamage: (val: string) => void
  npcFormItems: NpcItem[]
  addLootItem: () => void
  updateLootItem: (id: string, patch: Partial<NpcItem>) => void
  removeLootItem: (id: string) => void
  createCustomNpc: () => Promise<void>

  // Encounter generator
  encounterGen: ReturnType<typeof useEncounterGenerator>
}

export function DmNpcForm({
  campaignId,
  showNpcBar,
  npcInputRef,
  npcInput,
  setNpcInput,
  addNpc,
  showCampaignNpcs,
  setShowCampaignNpcs,
  campaignNpcSearch,
  setCampaignNpcSearch,
  filteredCampaignNpcs,
  addNpcFromCampaign,
  showBestiary,
  setShowBestiary,
  bestiarySearch,
  setBestiarySearch,
  bestiaryQty,
  setBestiaryQty,
  filteredMonsters,
  addingMonster,
  addNpcFromMonster,
  showNpcForm,
  setShowNpcForm,
  npcFormName,
  setNpcFormName,
  npcFormHp,
  setNpcFormHp,
  npcFormAc,
  setNpcFormAc,
  npcFormType,
  setNpcFormType,
  npcFormAttack,
  setNpcFormAttack,
  npcFormDamage,
  setNpcFormDamage,
  npcFormItems,
  addLootItem,
  updateLootItem,
  removeLootItem,
  createCustomNpc,
  encounterGen,
}: DmNpcFormProps) {
  if (!showNpcBar) return null

  return (
    <>
    <div className="border-b border-stone-800 bg-stone-900 px-4 py-3 space-y-2 shrink-0 max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2">
        <input
          ref={npcInputRef as any}
          value={npcInput}
          onChange={e => setNpcInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && npcInput.trim() && addNpc()}
          placeholder='Nombre [hp]  ej: Goblin 7'
          className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
        />
        <button onClick={addNpc} disabled={!npcInput.trim()}
          className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 font-serif text-sm transition-colors">
          + NPC
        </button>
        <button
          onClick={() => { setShowCampaignNpcs(b => !b); setCampaignNpcSearch(''); setShowBestiary(false); setShowNpcForm(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showCampaignNpcs ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          PNJ campaña
        </button>
        <button
          onClick={() => { setShowBestiary(b => !b); setBestiarySearch(''); setShowNpcForm(false); setShowCampaignNpcs(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showBestiary ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          Bestiario
        </button>
        <button
          onClick={() => { setShowNpcForm(b => !b); setShowBestiary(false); setShowCampaignNpcs(false); encounterGen.closeEncounterGenerator() }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showNpcForm ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          Personalizado
        </button>
        <button
          onClick={() => { encounterGen.showEncounterGenerator ? encounterGen.closeEncounterGenerator() : encounterGen.openEncounterGenerator(); setShowBestiary(false); setShowCampaignNpcs(false); setShowNpcForm(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${encounterGen.showEncounterGenerator ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          Encuentro
        </button>
      </div>

      {showCampaignNpcs && (
        <div className="bg-stone-950 border border-stone-700 p-3 space-y-2">
          <input autoFocus value={campaignNpcSearch} onChange={e => setCampaignNpcSearch(e.target.value)}
            placeholder="Buscar PNJ de campaña..."
            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
          {filteredCampaignNpcs.length === 0 ? (
            <p className="text-xs text-stone-600 font-serif italic px-1 py-2">
              No hay PNJs matching o creados. <Link to="/campaigns/$campaignId/pnj" params={{ campaignId }} className="text-amber-500 underline">Crear uno →</Link>
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto divide-y divide-stone-800">
              {filteredCampaignNpcs.map(n => {
                const stats = n.stats as Record<string, number> | null
                const dexMod = Math.floor((((stats?.dex) ?? 10) - 10) / 2)
                const roleChip = n.role === 'antagonist' ? 'text-red-400' : n.role === 'ally' ? 'text-green-400' : 'text-stone-500'
                return (
                  <li key={n.id}>
                    <button onClick={() => addNpcFromCampaign(n)}
                      className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 font-serif transition-colors flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{n.name}</span>
                        <span className={`text-[10px] tracking-wide uppercase ${roleChip}`}>{n.role}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-500 shrink-0">
                        {n.max_hp != null && <span>{n.max_hp} PG</span>}
                        {n.armor_class != null && <span>CA {n.armor_class}</span>}
                        <span>Ini {formatModInline(dexMod)}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {showBestiary && (
        <div className="bg-stone-950 border border-stone-700 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input autoFocus value={bestiarySearch} onChange={e => setBestiarySearch(e.target.value)}
              placeholder="Buscar monstruo..."
              className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-stone-500 font-serif">×</span>
              <input type="number" min={1} max={10} value={bestiaryQty}
                onChange={e => setBestiaryQty(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-12 px-2 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
          </div>
          {bestiarySearch.trim().length === 0 && (
            <p className="text-xs text-stone-600 font-serif italic px-1">Escribí el nombre del monstruo para buscar.</p>
          )}
          {filteredMonsters.length > 0 && (
            <ul className="max-h-44 overflow-y-auto divide-y divide-stone-800">
              {filteredMonsters.map(m => (
                <li key={m.index}>
                  <button disabled={addingMonster} onClick={() => addNpcFromMonster(m, bestiaryQty)}
                    className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 disabled:opacity-40 font-serif transition-colors flex items-center justify-between">
                    <span>{m.name}{bestiaryQty > 1 ? ` ×${bestiaryQty}` : ''}</span>
                    {addingMonster && <span className="text-xs text-stone-600">...</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {bestiarySearch.trim().length > 0 && filteredMonsters.length === 0 && (
            <p className="text-xs text-stone-600 font-serif italic px-1">Sin resultados.</p>
          )}
        </div>
      )}

      {showNpcForm && (
        <div className="bg-stone-950 border border-stone-700 p-4 space-y-4">
          <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Crear NPC personalizado</p>
          <div>
            <label className="block text-xs text-stone-600 font-serif mb-1">Nombre *</label>
            <input autoFocus value={npcFormName} onChange={e => setNpcFormName(e.target.value)}
              placeholder="Ej: Capitán Grigor"
              className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">HP máx *</label>
              <input type="number" min={1} value={npcFormHp} onChange={e => setNpcFormHp(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">CA</label>
              <input type="number" min={1} value={npcFormAc} onChange={e => setNpcFormAc(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">Tipo</label>
              <input list="npc-types" value={npcFormType} onChange={e => setNpcFormType(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif focus:outline-none focus:border-stone-500" />
              <datalist id="npc-types">
                {['humanoide', 'bestia', 'muerto viviente', 'construcción', 'dragón', 'elemental', 'hada', 'engendro', 'gigante', 'infernal', 'planta'].map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">Bono de ataque</label>
              <div className="flex items-center">
                <span className="px-2 py-1.5 bg-stone-800 border border-r-0 border-stone-700 text-stone-500 text-sm font-mono">+</span>
                <input type="number" value={npcFormAttack} onChange={e => setNpcFormAttack(parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono focus:outline-none focus:border-stone-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">Daño</label>
              <input value={npcFormDamage} onChange={e => setNpcFormDamage(e.target.value)}
                placeholder="ej: 1d8+3 cortante"
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono placeholder-stone-700 focus:outline-none focus:border-stone-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-stone-600 font-serif">Botín</label>
              <button onClick={addLootItem} className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 font-serif transition-colors">
                + Agregar
              </button>
            </div>
            <div className="space-y-1.5">
              {npcFormItems.map(item => (
                <NpcLootItemRow key={item.id} item={item}
                  onUpdate={patch => updateLootItem(item.id, patch)}
                  onRemove={() => removeLootItem(item.id)} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-stone-800">
            <button onClick={() => setShowNpcForm(false)} className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">Cancelar</button>
            <button onClick={createCustomNpc} disabled={!npcFormName.trim() || npcFormHp < 1}
              className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-30 text-amber-100 font-serif text-sm transition-colors">
              Agregar al combate
            </button>
          </div>
        </div>
      )}
    </div>

    {encounterGen.showEncounterGenerator && (
      <EncounterModal encounterGen={encounterGen} />
    )}
    </>
  )
}

function EncounterModal({ encounterGen }: { encounterGen: ReturnType<typeof useEncounterGenerator> }) {
  const { closeEncounterGenerator } = encounterGen

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEncounterGenerator() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeEncounterGenerator])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pb-4">
      <div className="absolute inset-0 bg-black/70" onClick={closeEncounterGenerator} />
      <div className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-stone-950 border border-stone-700 shadow-2xl">
        <div className="flex items-center gap-4 px-5 pt-4 pb-3 border-b border-stone-800 sticky top-0 bg-stone-950 z-10">
          <span className="text-sm tracking-widest text-amber-400/90 uppercase font-serif font-semibold shrink-0">
            Generador Procedural de Encuentros
          </span>
          <div className="flex-1 h-px bg-stone-800" />
          <button onClick={closeEncounterGenerator}
            className="text-stone-600 hover:text-stone-300 font-serif text-base leading-none transition-colors shrink-0">
            ✕
          </button>
        </div>
        <EncounterGeneratorPanel encounterGen={encounterGen} />
      </div>
    </div>
  )
}

import { crLabel as crLabelFn } from '../../lib/encounter-generator'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', deadly: 'Mortal',
}
const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  easy:   'border-green-700 bg-green-950/40 text-green-300',
  medium: 'border-yellow-700 bg-yellow-950/40 text-yellow-300',
  hard:   'border-orange-700 bg-orange-950/40 text-orange-300',
  deadly: 'border-red-700 bg-red-950/40 text-red-300',
}
const DIFFICULTY_FILL: Record<Difficulty | 'trivial', string> = {
  trivial: 'bg-stone-600',
  easy:    'bg-green-600',
  medium:  'bg-yellow-600',
  hard:    'bg-orange-500',
  deadly:  'bg-red-600',
}
const INACTIVE = 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'

const ROLE_COL_HEADER: Record<string, { label: string; color: string }> = {
  melee:   { label: 'Melee',      color: 'text-red-400' },
  ranged:  { label: 'Distancia',  color: 'text-green-400' },
  magic:   { label: 'Magia',      color: 'text-purple-400' },
  support: { label: 'Soporte',    color: 'text-yellow-400' },
}

const ROLE_BADGE: Record<string, string> = {
  melee:   'border-red-800 bg-red-900/40 text-red-300',
  ranged:  'border-green-800 bg-green-900/40 text-green-300',
  magic:   'border-purple-800 bg-purple-900/40 text-purple-300',
  support: 'border-yellow-800 bg-yellow-900/40 text-yellow-300',
}

const DND_IMG_BASE = 'https://www.dnd5eapi.co'

function SpecialAbilityTag({ sa }: { sa: { name: string; desc: string } }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        onClick={e => { e.stopPropagation(); setShow(v => !v) }}
        className="text-[7px] px-1 py-0.5 bg-stone-800 border border-stone-800 text-stone-600 font-serif cursor-help hover:text-stone-400 hover:border-stone-600 transition-colors"
      >
        {sa.name}
      </button>
      {show && (
        <div className="absolute bottom-full left-0 z-50 w-56 p-2 bg-stone-900 border border-stone-600 text-[9px] text-stone-400 font-serif shadow-xl mb-1 pointer-events-none">
          <p className="font-bold text-stone-300 mb-1">{sa.name}</p>
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
        className="w-5 h-5 text-stone-600 hover:text-stone-300 text-base leading-none flex items-center justify-center transition-colors">
        −
      </button>
      <span className={`w-5 text-center text-xs font-mono font-semibold ${value > 0 ? (activeColor ?? 'text-stone-200') : 'text-stone-700'}`}>
        {value > 0 ? value : '—'}
      </span>
      <button onClick={() => onChange(value + 1)}
        className="w-5 h-5 text-stone-600 hover:text-stone-300 text-base leading-none flex items-center justify-center transition-colors">
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
  if (adjustedXp >= thresholds.deadly)      currentDiff = 'deadly'
  else if (adjustedXp >= thresholds.hard)   currentDiff = 'hard'
  else if (adjustedXp >= thresholds.medium) currentDiff = 'medium'
  else if (adjustedXp >= thresholds.easy)   currentDiff = 'easy'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500 font-serif">XP Ajustado</span>
        <span className="text-xs font-mono text-stone-300">{adjustedXp}</span>
      </div>
      <div className="relative h-3 bg-stone-800 border border-stone-700">
        <div className={`absolute inset-y-0 left-0 transition-all duration-300 ${DIFFICULTY_FILL[currentDiff]}`}
          style={{ width: `${fillPct}%` }} />
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <div key={d} className="absolute top-0 bottom-0 w-px bg-stone-500 opacity-60"
            style={{ left: `${pct(thresholds[d])}%` }} />
        ))}
      </div>
      <div className="relative h-4">
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <span key={d} className="absolute text-[9px] text-stone-600 font-mono -translate-x-1/2"
            style={{ left: `${pct(thresholds[d])}%` }}>
            {DIFFICULTY_LABELS[d]}
          </span>
        ))}
      </div>
    </div>
  )
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
type AbilityKey = typeof ABILITY_KEYS[number]

function abMod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
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
      <div className="relative bg-stone-900 border border-stone-700 p-5 w-full max-w-sm space-y-4 z-10 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-serif text-stone-200">{row.name}</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 text-base leading-none">✕</button>
        </div>

        {/* Level */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-stone-500 font-serif w-14 shrink-0">Nivel</label>
          <CountStepper value={level} onChange={v => set({ level: Math.max(1, Math.min(20, v)) })} />
          <span className="text-[10px] font-mono text-stone-600">
            {effectiveHp !== undefined && `PG ${effectiveHp} · `}{effectiveXp} XP
          </span>
        </div>

        {/* Ability scores */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-serif">Estadísticas</label>
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-stone-600 uppercase font-mono">{stat}</span>
                <input
                  type="number" min={1} max={30}
                  value={local[stat] ?? ''}
                  onChange={e => set({ [stat]: parseInt(e.target.value) || undefined })}
                  className="w-full px-0.5 py-0.5 bg-stone-800 border border-stone-700 text-stone-300 text-[10px] font-mono text-center focus:outline-none focus:border-stone-500"
                />
                {local[stat] !== undefined && (
                  <span className="text-[8px] font-mono text-stone-600">{abMod(local[stat]!)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-stone-500 font-serif w-14 shrink-0">Velocidad</label>
          <input
            value={local.speed ?? ''}
            onChange={e => set({ speed: e.target.value })}
            className="flex-1 px-2 py-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs font-mono focus:outline-none focus:border-stone-500"
          />
        </div>

        {/* Special abilities */}
        {local.specialAbilities && local.specialAbilities.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 font-serif">Habilidades especiales</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {local.specialAbilities.map(sa => (
                <div key={sa.name} className="bg-stone-800 border border-stone-700 px-2 py-1.5">
                  <p className="text-[10px] font-bold text-stone-300 font-serif mb-0.5">{sa.name}</p>
                  <p className="text-[9px] text-stone-500 font-serif leading-relaxed">{sa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
          <button onClick={onClose} className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">Cancelar</button>
          <button
            onClick={() => { onUpdate(local); onClose() }}
            className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-serif transition-colors">
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
  const level = unitLevel
  const effectiveHp = row.hp !== undefined ? hpAtLevel(row.hp, level) : undefined

  return (
    <div className="bg-stone-900 border border-stone-700 overflow-hidden flex flex-col hover:border-stone-500 transition-colors group">
      {/* Image — click opens editor */}
      <div className="h-20 bg-stone-800 overflow-hidden flex items-center justify-center relative cursor-pointer" onClick={onEdit}>
        {imgOk
          ? <img src={imgUrl} alt={row.name} onError={() => setImgOk(false)} className="w-full h-full object-cover object-top opacity-80" />
          : <span className="text-stone-700 text-xs font-serif">{row.name.charAt(0)}</span>
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] text-stone-400 bg-stone-900/70 px-1 py-0.5 font-serif">editar</span>
        </div>
      </div>

      <div className="px-2 py-1.5 flex flex-col gap-1">
        {/* Role badge + name */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-[9px] px-1.5 py-0.5 border font-serif tracking-wide shrink-0 ${ROLE_BADGE[role] ?? ''}`}>
            {ROLE_COL_HEADER[role]?.label ?? role}
          </span>
          <span className="text-[10px] text-stone-200 font-serif leading-tight truncate flex-1">
            {row.name}<span className="text-stone-600 ml-0.5 font-mono text-[9px]">#{index + 1}</span>
          </span>
        </div>

        {/* Base stats */}
        <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono text-stone-500">
          <span>CR {crLabelFn(row.cr)}</span>
          <span>CA {row.ac}</span>
          {effectiveHp !== undefined
            ? <span className="text-stone-400">PG {effectiveHp}</span>
            : <span className="text-stone-700 animate-pulse">PG …</span>}
          {row.damageStr !== undefined
            ? <span className="text-stone-400">{row.damageStr}</span>
            : <span className="text-stone-700 animate-pulse">Dmg …</span>}
        </div>

        {/* Ability scores */}
        {row.str !== undefined && (
          <div className="grid grid-cols-6 gap-px">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center">
                <span className="text-[6px] text-stone-700 uppercase font-mono">{stat}</span>
                <span className="text-[8px] text-stone-500 font-mono">{row[stat as AbilityKey] ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Speed */}
        {row.speed && <span className="text-[8px] font-mono text-stone-700">Vel {row.speed}</span>}

        {/* Special abilities with tooltip */}
        {row.specialAbilities && row.specialAbilities.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {row.specialAbilities.slice(0, 3).map(sa => (
              <SpecialAbilityTag key={sa.name} sa={sa} />
            ))}
            {row.specialAbilities.length > 3 && (
              <span className="text-[7px] text-stone-700 font-mono self-center">+{row.specialAbilities.length - 3}</span>
            )}
          </div>
        )}

        {/* Level control */}
        <div className="flex items-center gap-1 border-t border-stone-800/60 pt-1 mt-0.5" onClick={e => e.stopPropagation()}>
          <span className="text-[8px] text-stone-600 font-serif flex-1">Nivel</span>
          <button onClick={() => onLevelChange(-1)}
            className="w-4 h-4 text-stone-600 hover:text-stone-300 text-xs leading-none flex items-center justify-center transition-colors">−</button>
          <span className="text-[9px] font-mono text-amber-500 w-4 text-center">{level}</span>
          <button onClick={() => onLevelChange(1)}
            className="w-4 h-4 text-stone-600 hover:text-stone-300 text-xs leading-none flex items-center justify-center transition-colors">+</button>
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
        className="w-full px-3 py-1.5 bg-transparent border-t border-stone-800 text-stone-400 text-xs font-serif placeholder-stone-700 focus:outline-none focus:text-stone-300 focus:border-stone-600"
      />
      {open && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 bg-stone-900 border border-stone-700 shadow-xl max-h-48 overflow-y-auto">
          {results.map(m => (
            <button key={m.index}
              onMouseDown={e => { e.preventDefault(); onAdd(m.index); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-800 font-serif flex items-center gap-2">
              <span className="flex-1">{m.name}</span>
              <span className="text-stone-600 font-mono text-[10px]">CR {crLabelFn(m.cr)}</span>
              <span className="text-stone-700 font-mono text-[10px]">{m.type}</span>
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
  const editingRow = editingRowId ? rows.find(r => r.id === editingRowId) ?? null : null

  const hasRows = rows.length > 0
  const archetypeList = archetypesForEnv.length > 0 ? archetypesForEnv : availableArchetypes

  return (
    <>
    <div className="p-5 space-y-5">

      {/* ── Zone + Archetype ────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <div className="space-y-1">
          <label className="text-xs text-stone-600 font-serif uppercase tracking-wider">Zona</label>
          <div className="relative">
            <select
              value={selectedEnv}
              onChange={e => setSelectedEnv(e.target.value)}
              className="w-full px-3 py-2 pr-20 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif focus:outline-none focus:border-stone-500 appearance-none cursor-pointer"
            >
              {ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
            </select>
            {archetypesForEnv.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-mono text-stone-500 bg-stone-800 border border-stone-700 px-1.5 py-0.5">
                LVL {Math.min(...archetypesForEnv.map(a => a.levelRange[0]))}-{Math.max(...archetypesForEnv.map(a => a.levelRange[1]))}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-stone-600 font-serif uppercase tracking-wider">Arquetipo</label>
            {selectedArchetypeIds.length > 0 && (
              <span className="text-[10px] text-stone-600 font-serif">{selectedArchetypeIds.length} seleccionado{selectedArchetypeIds.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1 min-h-[36px] px-2 py-1.5 border border-stone-700 bg-stone-950">
            {selectedArchetypeIds.map(id => {
              const arch = archetypeList.find(a => a.id === id) ?? availableArchetypes.find(a => a.id === id)
              if (!arch) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-800 border border-stone-600 text-stone-300 text-[10px] font-serif">
                  {arch.name}
                  <button
                    onClick={() => setSelectedArchetypeIds(selectedArchetypeIds.filter(x => x !== id))}
                    className="text-stone-500 hover:text-stone-200 leading-none ml-0.5">×</button>
                </span>
              )
            })}
            <button
              onClick={() => setArchetypeDropdownOpen(v => !v)}
              className="ml-auto text-stone-600 hover:text-stone-300 text-xs px-1 transition-colors"
            >▼</button>
          </div>
          {archetypeDropdownOpen && (
            <div className="border border-stone-700 bg-stone-950 max-h-36 overflow-y-auto">
              {archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).length === 0 ? (
                <p className="text-xs text-stone-600 font-serif italic px-3 py-2">Todos seleccionados</p>
              ) : archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).map(a => (
                <button key={a.id}
                  onClick={() => { setSelectedArchetypeIds([...selectedArchetypeIds, a.id]); setArchetypeDropdownOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-900 font-serif transition-colors">
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Difficulty + generate ───────────────────────────────────── */}
      <div className="space-y-1">
        <label className="text-xs text-stone-600 font-serif uppercase tracking-wider">Dificultad</label>
        <div className="flex">
          <div className="flex flex-1">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d, i) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 font-serif text-sm transition-colors border-y border-r ${i === 0 ? 'border-l' : ''} ${difficulty === d ? DIFFICULTY_ACTIVE[d] : INACTIVE}`}>
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <button onClick={generateNew} disabled={selectedArchetypeIds.length === 0}
            className="px-6 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-30 border border-amber-700 text-amber-100 font-serif text-sm font-semibold tracking-widest transition-colors ml-2">
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
        {/* ── Creature table ─────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-serif">
              Composición{units.length > 0 ? ` · ${units.length} criatura${units.length !== 1 ? 's' : ''}` : ''}
              {loadingDetails && <span className="ml-2 text-stone-600 italic">cargando stats…</span>}
            </span>
            {hasRows && (
              <button onClick={generateNew} className="text-[10px] text-stone-600 hover:text-stone-400 font-serif transition-colors">
                Regenerar
              </button>
            )}
          </div>
            <div className="border border-stone-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-800">
                    <th className="text-left text-stone-500 font-normal font-serif py-2 pl-3 pr-2">Criatura</th>
                    <th className="text-center text-stone-600 font-normal font-serif py-2 px-2 text-[10px]">Niv.</th>
                    {(['melee', 'ranged', 'magic', 'support'] as const).map(role => (
                      <th key={role} className={`text-center font-normal px-3 py-2 ${ROLE_COL_HEADER[role].color}`}>
                        {ROLE_COL_HEADER[role].label}
                      </th>
                    ))}
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b border-stone-800/50 hover:bg-stone-900/30 transition-colors">
                      <td className="py-2 pl-3 pr-2">
                        <span className="text-stone-300 font-serif">{row.name}</span>
                        <span className="text-stone-600 font-mono ml-1.5 text-[10px]">CR {crLabelFn(row.cr)}</span>
                        {row.hp !== undefined && (
                          <span className="text-stone-600 font-mono ml-1.5 text-[10px]">
                            PG {hpAtLevel(row.hp, row.level ?? 1)}
                          </span>
                        )}
                        <span className="text-stone-700 font-mono ml-1.5 text-[10px]">
                          {xpAtLevel(row.xp, row.level ?? 1)} XP
                        </span>
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
                          className="text-stone-700 hover:text-red-500 transition-colors text-sm leading-none">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <MonsterSearchAdd onAdd={addManualRow} />
            </div>
          </div>

        {hasRows && (
          <>
            {/* ── Individual cards ───────────────────────────────────────── */}
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

            {/* ── XP gauge ───────────────────────────────────────────────── */}
            <XpGauge adjustedXp={adjustedXp} thresholds={thresholds} />

            {/* ── Loot ───────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-serif">Botín</span>
                <button onClick={regenerateLoot} className="text-[10px] text-stone-600 hover:text-stone-400 font-serif transition-colors">
                  Regenerar botín
                </button>
              </div>

              {/* Currency */}
              <div className="flex items-center gap-3">
                {(['gp', 'sp', 'cp'] as const).map(coin => {
                  const labels = { gp: { es: 'po', color: 'text-amber-300' }, sp: { es: 'pp', color: 'text-stone-400' }, cp: { es: 'pc', color: 'text-orange-400' } }
                  const { es, color } = labels[coin]
                  return (
                    <div key={coin} className="flex items-center gap-1.5">
                      <input
                        type="number" min={0}
                        value={loot.currency[coin]}
                        onChange={e => updateCurrency({ [coin]: parseInt(e.target.value) || 0 })}
                        className={`w-14 px-2 py-1 bg-stone-900 border border-stone-700 text-xs font-mono text-center ${color} focus:outline-none focus:border-stone-500`}
                      />
                      <span className={`text-xs font-serif ${color}`}>{es}</span>
                    </div>
                  )
                })}
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {loot.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <select
                      value={item.name}
                      onChange={e => updateItemName(item.id, e.target.value)}
                      className="flex-1 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-serif focus:outline-none focus:border-stone-500 appearance-none cursor-pointer"
                    >
                      {LOOT_ITEM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <CountStepper value={item.qty} onChange={v => updateItemQty(item.id, v)} />
                    <button onClick={() => removeItem(item.id)}
                      className="text-stone-700 hover:text-red-500 transition-colors text-sm shrink-0">×</button>
                  </div>
                ))}
                <button onClick={addItem}
                  className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">
                  + Agregar ítem
                </button>
              </div>
            </div>

            {/* ── Actions ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <button onClick={clearDraft} className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">
                Limpiar
              </button>
              <button onClick={spawnEncounter} disabled={isSpawning || units.length === 0}
                className="px-5 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif text-sm transition-colors flex items-center gap-2">
                {isSpawning && <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />}
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

function NpcLootItemRow({ item, onUpdate, onRemove }: {
  item: NpcItem
  onUpdate: (patch: Partial<NpcItem>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input value={item.name} onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nombre del objeto"
        className="flex-1 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
      <span className="text-xs text-stone-600 shrink-0">×</span>
      <input type="number" min={1} value={item.qty} onChange={e => onUpdate({ qty: parseInt(e.target.value) || 1 })}
        className="w-14 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-mono text-center focus:outline-none focus:border-stone-500" />
      <button onClick={onRemove} className="text-stone-600 hover:text-red-500 transition-colors text-xs font-serif shrink-0">✕</button>
    </div>
  )
}
