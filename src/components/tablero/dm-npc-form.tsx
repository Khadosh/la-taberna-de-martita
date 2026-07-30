import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { type NpcItem } from './tablero-types'
import { formatModInline } from './tablero-types'
import { type useEncounterGenerator } from './use-encounter-generator'
import { EncounterModal } from './encounter-modal'
import { useT } from '../../i18n'

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
  npcFormSpells: string[]
  npcFormWeapons: { id: string; name: string; damage: string }[]
  npcFormEquipment: string
  setNpcFormEquipment: (val: string) => void
  addLootItem: () => void
  updateLootItem: (id: string, patch: Partial<NpcItem>) => void
  removeLootItem: (id: string) => void
  addFormWeapon: () => void
  updateFormWeapon: (id: string, patch: Partial<{ name: string; damage: string }>) => void
  removeFormWeapon: (id: string) => void
  addFormSpell: (spell: string) => void
  removeFormSpell: (spell: string) => void
  createCustomNpc: () => Promise<void>

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
  npcFormSpells,
  npcFormWeapons,
  npcFormEquipment,
  setNpcFormEquipment,
  addLootItem,
  updateLootItem,
  removeLootItem,
  addFormWeapon,
  updateFormWeapon,
  removeFormWeapon,
  addFormSpell,
  removeFormSpell,
  createCustomNpc,
  encounterGen,
}: DmNpcFormProps) {
  const [spellSearch, setSpellSearch] = useState('')
  const t = useT()
  const { data: allSpellsData } = useQuery({
    queryKey: dndKeys.allSpells,
    queryFn: dndApi.allSpells,
    staleTime: Infinity,
  })

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
          placeholder={t('board.npcQuickPlaceholder')}
          className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
        />
        <button onClick={addNpc} disabled={!npcInput.trim()}
          className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 font-serif text-sm transition-colors">
          {t('board.addNpc')}
        </button>
        <button
          onClick={() => { setShowCampaignNpcs(b => !b); setCampaignNpcSearch(''); setShowBestiary(false); setShowNpcForm(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showCampaignNpcs ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          {t('board.campaignNpcs')}
        </button>
        <button
          onClick={() => { setShowBestiary(b => !b); setBestiarySearch(''); setShowNpcForm(false); setShowCampaignNpcs(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showBestiary ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          {t('board.bestiary')}
        </button>
        <button
          onClick={() => { setShowNpcForm(b => !b); setShowBestiary(false); setShowCampaignNpcs(false); encounterGen.closeEncounterGenerator() }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showNpcForm ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          {t('board.custom')}
        </button>
        <button
          onClick={() => { encounterGen.showEncounterGenerator ? encounterGen.closeEncounterGenerator() : encounterGen.openEncounterGenerator(); setShowBestiary(false); setShowCampaignNpcs(false); setShowNpcForm(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${encounterGen.showEncounterGenerator ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          {t('board.encounter')}
        </button>
      </div>

      {showCampaignNpcs && (
        <div className="bg-stone-950 border border-stone-700 p-3 space-y-2">
          <input autoFocus value={campaignNpcSearch} onChange={e => setCampaignNpcSearch(e.target.value)}
            placeholder={t('board.searchCampaignNpc')}
            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
          {filteredCampaignNpcs.length === 0 ? (
            <p className="text-xs text-stone-600 font-serif italic px-1 py-2">
              {t('board.noCampaignNpcs')} <Link to="/campaigns/$campaignId/pnj" params={{ campaignId }} className="text-amber-500 underline">{t('board.createOne')}</Link>
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
                        {n.armor_class != null && <span>{t('sheet.armorClass')} {n.armor_class}</span>}
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
              placeholder={t('board.searchMonster')}
              className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-stone-500 font-serif">×</span>
              <input type="number" min={1} max={10} value={bestiaryQty}
                onChange={e => setBestiaryQty(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-12 px-2 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
          </div>
          {bestiarySearch.trim().length === 0 && (
            <p className="text-xs text-stone-600 font-serif italic px-1">{t('board.typeMonsterName')}</p>
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
            <p className="text-xs text-stone-600 font-serif italic px-1">{t('board.noResults')}</p>
          )}
        </div>
      )}

      {showNpcForm && (
        <div className="bg-stone-950 border border-stone-700 p-4 space-y-4">
          <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">{t('board.createCustomNpc')}</p>
          <div>
            <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcName')}</label>
            <input autoFocus value={npcFormName} onChange={e => setNpcFormName(e.target.value)}
              placeholder={t('board.npcNamePlaceholder')}
              className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcMaxHp')}</label>
              <input type="number" min={1} value={npcFormHp} onChange={e => setNpcFormHp(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">CA</label>
              <input type="number" min={1} value={npcFormAc} onChange={e => setNpcFormAc(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcType')}</label>
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
              <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcAttackBonus')}</label>
              <div className="flex items-center">
                <span className="px-2 py-1.5 bg-stone-800 border border-r-0 border-stone-700 text-stone-500 text-sm font-mono">+</span>
                <input type="number" value={npcFormAttack} onChange={e => setNpcFormAttack(parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono focus:outline-none focus:border-stone-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcDamage')}</label>
              <input value={npcFormDamage} onChange={e => setNpcFormDamage(e.target.value)}
                placeholder={t('board.npcDamagePlaceholder')}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono placeholder-stone-700 focus:outline-none focus:border-stone-500" />
            </div>
          </div>
          
          {/* Weapons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-stone-600 font-serif">{t('board.npcWeapons')}</label>
              <button type="button" onClick={addFormWeapon} className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 font-serif transition-colors cursor-pointer">
                + Agregar Arma
              </button>
            </div>
            <div className="space-y-1.5">
              {npcFormWeapons.map(w => (
                <div key={w.id} className="flex gap-2 items-center">
                  <input
                    value={w.name}
                    onChange={e => updateFormWeapon(w.id, { name: e.target.value })}
                    placeholder={t('board.npcWeaponNamePlaceholder')}
                    className="flex-1 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
                  />
                  <input
                    value={w.damage}
                    onChange={e => updateFormWeapon(w.id, { damage: e.target.value })}
                    placeholder={t('board.npcWeaponDamagePlaceholder')}
                    className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-mono text-center focus:outline-none focus:border-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeFormWeapon(w.id)}
                    className="text-stone-600 hover:text-red-500 text-xs font-serif shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Spells */}
          <div>
            <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcSpellbook')}</label>
            <div className="relative">
              <input
                value={spellSearch}
                onChange={e => setSpellSearch(e.target.value)}
                placeholder={t('board.npcSpellSearch')}
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
              />
              {spellSearch.trim().length > 1 && (
                <div className="absolute left-0 right-0 mt-1 z-30 bg-stone-900 border border-stone-750 max-h-40 overflow-y-auto shadow-lg divide-y divide-stone-800">
                  {allSpellsData?.results
                    .filter(s => s.name.toLowerCase().includes(spellSearch.toLowerCase()))
                    .slice(0, 8)
                    .map(spell => (
                      <button
                        key={spell.index}
                        type="button"
                        onClick={() => {
                          addFormSpell(spell.index)
                          setSpellSearch('')
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-850 font-serif transition-colors cursor-pointer"
                      >
                        {spell.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
            {npcFormSpells.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {npcFormSpells.map(sIndex => (
                  <span
                    key={sIndex}
                    className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-900 bg-amber-900/10 text-amber-500 text-xs rounded capitalize font-serif"
                  >
                    {sIndex.replace(/-/g, ' ')}
                    <button
                      type="button"
                      onClick={() => removeFormSpell(sIndex)}
                      className="text-[9px] text-amber-600 hover:text-red-400 font-bold ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Equipment Notes */}
          <div>
            <label className="block text-xs text-stone-600 font-serif mb-1">{t('board.npcEquipment')}</label>
            <textarea
              value={npcFormEquipment}
              onChange={e => setNpcFormEquipment(e.target.value)}
              rows={2}
              placeholder={t('board.npcEquipmentPlaceholder')}
              className="w-full p-2.5 bg-stone-900 border border-stone-700 text-stone-200 text-xs font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-stone-600 font-serif">{t('board.npcLoot')}</label>
              <button onClick={addLootItem} className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 font-serif transition-colors">
                + {t('board.npcAdd')}
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
            <button onClick={() => setShowNpcForm(false)} className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">{t('common.cancel')}</button>
            <button onClick={createCustomNpc} disabled={!npcFormName.trim() || npcFormHp < 1}
              className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-30 text-amber-100 font-serif text-sm transition-colors">
              {t('board.addToCombat')}
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

function NpcLootItemRow({ item, onUpdate, onRemove }: {
  item: NpcItem
  onUpdate: (patch: Partial<NpcItem>) => void
  onRemove: () => void
}) {
  const t = useT()
  return (
    <div className="flex items-center gap-2">
      <input value={item.name} onChange={e => onUpdate({ name: e.target.value })}
        placeholder={t('board.npcItemNamePlaceholder')}
        className="flex-1 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
      <span className="text-xs text-stone-600 shrink-0">×</span>
      <input type="number" min={1} value={item.qty} onChange={e => onUpdate({ qty: parseInt(e.target.value) || 1 })}
        className="w-14 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-mono text-center focus:outline-none focus:border-stone-500" />
      <button onClick={onRemove} className="text-stone-600 hover:text-red-500 transition-colors text-xs font-serif shrink-0">✕</button>
    </div>
  )
}
