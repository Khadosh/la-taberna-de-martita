import { Link } from '@tanstack/react-router'
import { type NpcItem } from './tablero-types'
import { formatModInline } from './tablero-types'

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
}: DmNpcFormProps) {
  if (!showNpcBar) return null

  return (
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
          onClick={() => { setShowNpcForm(b => !b); setShowBestiary(false); setShowCampaignNpcs(false) }}
          className={`px-3 py-2 font-serif text-sm transition-colors border ${showNpcForm ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
        >
          Personalizado
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
