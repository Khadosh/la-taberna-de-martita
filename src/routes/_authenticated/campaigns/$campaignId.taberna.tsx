import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/taberna')({
  component: Taberna,
})

// ── Types ─────────────────────────────────────────────────────────────────────

type CostUnit = 'gp' | 'sp' | 'cp'
type CurrencyKey = 'gold' | 'silver' | 'copper'
type Currency = { gold: number; silver: number; copper: number }

type Character = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  user_id: string
  sheet_json: {
    max_hp?: number
    hit_die?: number
    currency?: Currency
    spell_slots_used?: Record<string, number>
    death_saves?: any
    hit_dice_used?: number
  }
}

interface ServiceItem {
  id: string
  name: string
  cost: number
  unit: CostUnit
  icon: string
  description: string
  benefit: string
  applyEffect: (char: Character) => {
    hpGain?: number
    tempHpGain?: number
    triggerLongRest?: boolean
    logMsg: string
  }
}

// ── Services Catalog ──────────────────────────────────────────────────────────

const DRINKS: ServiceItem[] = [
  {
    id: 'beer',
    name: 'Jarra de Cerveza Rústica',
    cost: 2,
    unit: 'cp',
    icon: '🍺',
    description: 'Bebida rústica y barata de cebada. Algo amarga pero reconfortante.',
    benefit: 'Efecto: Diversión y dolor de cabeza al despertar.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} chocó jarras y bebió una Cerveza Rústica! Siente un leve zumbido en la cabeza.`
    })
  },
  {
    id: 'mead',
    name: 'Hidromiel de la Casa (Receta de Martita)',
    cost: 5,
    unit: 'cp',
    icon: '🍯',
    description: 'Fermentada con miel silvestre de los bosques locales. Dulce y espirituosa.',
    benefit: 'Efecto: Restaura 1 PG de forma inmediata al beber.',
    applyEffect: (char) => ({
      hpGain: 1,
      logMsg: `¡${char.name} bebió la famosa Hidromiel de Martita! Se siente reenergizado (+1 PG).`
    })
  },
  {
    id: 'wine',
    name: 'Copa de Vino de Alto Hort',
    cost: 1,
    unit: 'sp',
    icon: '🍷',
    description: 'Cosecha de uvas selectas del valle de Hort. Deja un regusto a moras y especias.',
    benefit: 'Efecto: Otorga +1 a tiradas de Carisma por la siguiente hora.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} saboreó un Vino de Alto Hort! Un calor placentero relaja su lengua (+1 a tiradas de Carisma por 1 hora).`
    })
  },
  {
    id: 'dwarf_spirit',
    name: 'Licor de Fuego Enano',
    cost: 5,
    unit: 'sp',
    icon: '🥃',
    description: 'Fuerte como el yunque. Quema la garganta y calienta hasta los huesos más fríos.',
    benefit: 'Efecto: Ventaja en salvaciones de Fuerza pero desventaja en Destreza por 1 hora.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} tragó un Licor de Fuego Enano de un solo golpe! Siente la solidez de la piedra en los músculos (Ventaja en Fuerza, Desventaja en Destreza por 1 hora).`
    })
  },
  {
    id: 'holy_water',
    name: 'Agua Sagrada de Manantial',
    cost: 1,
    unit: 'gp',
    icon: '🧪',
    description: 'Agua bendecida por clérigos de la luz, destilada en frascos limpios.',
    benefit: 'Efecto: Sana 2d4+2 PG (cura heridas como una poción ligera).',
    applyEffect: (char) => {
      const roll = Math.ceil(Math.random() * 4) + Math.ceil(Math.random() * 4) + 2
      return {
        hpGain: roll,
        logMsg: `¡${char.name} bebió Agua Sagrada de Manantial! Sus heridas se cierran con un destello brillante (+${roll} PG).`
      }
    }
  }
]

const FOODS: ServiceItem[] = [
  {
    id: 'broth',
    name: 'Caldo de Sobras de la Olla',
    cost: 3,
    unit: 'cp',
    icon: '🥣',
    description: 'Una mezcla misteriosa hervida a fuego lento. Llena el estómago si no preguntas qué contiene.',
    benefit: 'Efecto: Calienta las entrañas. Sin beneficios adicionales.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} comió un plato de Caldo de Sobras! Está caliente y algo grasoso.`
    })
  },
  {
    id: 'stew',
    name: 'Estofado de Jabalí Silvestre',
    cost: 1,
    unit: 'sp',
    icon: '🍲',
    description: 'Guiso espeso de carne magra de jabalí con tubérculos y hierbas de monte.',
    benefit: 'Efecto: Nutritivo. Otorga +2 PG temporales al comer.',
    applyEffect: (char) => ({
      tempHpGain: 2,
      logMsg: `¡${char.name} disfrutó de un plato de Estofado de Jabalí! Se siente robusto y satisfecho (+2 PG Temporales).`
    })
  },
  {
    id: 'roast',
    name: 'Asado de Quimera Especiado',
    cost: 5,
    unit: 'sp',
    icon: '🍖',
    description: 'Carne exótica sazonada con especias picantes del desierto y asada a fuego directo.',
    benefit: 'Efecto: Otorga +5 PG temporales debido al vigor exótico.',
    applyEffect: (char) => ({
      tempHpGain: 5,
      logMsg: `¡${char.name} devoró el Asado de Quimera Especiado! Una explosión de sabor vigorizante (+5 PG Temporales).`
    })
  },
  {
    id: 'feast',
    name: 'Banquete de Héroes del Gremio',
    cost: 10,
    unit: 'gp',
    icon: '🍽️',
    description: 'Una mesa repleta de las mejores carnes, panes, quesos y pasteles, bendecida para dar vigor.',
    benefit: 'Efecto: Otorga ventaja en salvaciones contra veneno y miedo por 8 horas, y +10 PG temporales.',
    applyEffect: (char) => ({
      tempHpGain: 10,
      logMsg: `¡${char.name} celebró con el Banquete de Héroes! La comida mística purifica su cuerpo (+10 PG Temporales y ventaja contra Veneno/Miedo por 8 horas).`
    })
  }
]

const LODGINGS: ServiceItem[] = [
  {
    id: 'stables',
    name: 'Paja junto al Establo',
    cost: 2,
    unit: 'cp',
    icon: '🐎',
    description: 'Un espacio templado cerca de los animales. Huele a estiércol y hay pulgas, pero es barato.',
    benefit: 'Efecto: Restaura HP pero no recuperas Dados de Golpe por la incomodidad.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} pasó la noche en las caballerizas! Descansó a medias entre relinchos y picaduras de pulga.`
    })
  },
  {
    id: 'shared',
    name: 'Catre en Habitación Compartida',
    cost: 1,
    unit: 'sp',
    icon: '🛏️',
    description: 'Habitación ruidosa con otras diez personas roncando. Las camas son algo duras.',
    benefit: 'Efecto: Realiza un Descanso Largo estándar (HP máximo y restaura la mitad de tus Dados de Golpe).',
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: `¡${char.name} durmió en la habitación compartida! Completó un Descanso Largo estándar.`
    })
  },
  {
    id: 'private',
    name: 'Habitación Privada Confortable',
    cost: 5,
    unit: 'sp',
    icon: '🔑',
    description: 'Habitación individual con cerrojo, chimenea y una cama mullida de plumas.',
    benefit: 'Efecto: Descanso Largo. Cura un nivel de fatiga / condición simple.',
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: `¡${char.name} durmió plácidamente en una cómoda habitación privada! Completó un Descanso Largo.`
    })
  },
  {
    id: 'suite',
    name: 'Suite Real de la Taberna',
    cost: 2,
    unit: 'gp',
    icon: '👑',
    description: 'La mejor habitación. Sábanas de seda fina, baño de agua caliente tina y licor de cortesía.',
    benefit: 'Efecto: Descanso Largo. Cura fatiga y condiciones y otorga +5 PG temporales al despertar.',
    applyEffect: (char) => ({
      triggerLongRest: true,
      tempHpGain: 5,
      logMsg: `¡${char.name} se hospedó con lujos reales en la Suite de la Taberna! Despierta completamente renovado (+5 PG Temporales).`
    })
  }
]

// ── Currency Conversion Helpers ──────────────────────────────────────────────

const UNIT_MAP: Record<CostUnit, CurrencyKey> = { gp: 'gold', sp: 'silver', cp: 'copper' }
const UNIT_LABEL: Record<CostUnit, string> = { gp: 'MO', sp: 'MP', cp: 'MC' }

function toCp(qty: number, unit: CostUnit) {
  if (unit === 'gp') return qty * 100
  if (unit === 'sp') return qty * 10
  return qty
}

function formatCost(qty: number, unit: string) {
  return `${qty} ${UNIT_LABEL[unit as CostUnit] ?? unit.toUpperCase()}`
}

function maxHpFor(c: Character) {
  const sheet = c.sheet_json
  if (sheet.max_hp != null) return sheet.max_hp
  // Fallback calculation
  const stats = c.stats as Record<string, number> | null
  const conMod = Math.floor((((stats?.con) ?? 10) - 10) / 2)
  const hitDie = sheet.hit_die ?? 8
  const level = c.level ?? 1
  return hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
}

function Taberna() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<'drinks' | 'foods' | 'lodging'>('drinks')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [consumeCharId, setConsumeCharId] = useState<string>('')
  
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch campaign info (check if GM)
  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('dm_id').eq('id', campaignId).single()
      return data
    },
  })

  // Fetch campaign characters
  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, race, level, stats, current_hp, user_id, sheet_json, campaign_id')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  const isGm = campaign?.dm_id === session.user.id
  const ownChar = characters.find(c => c.user_id === session.user.id)
  const buyableChars = isGm ? characters : (ownChar ? [ownChar] : [])

  const currentServices = {
    drinks: DRINKS,
    foods: FOODS,
    lodging: LODGINGS,
  }[activeCategory]

  const handleSelectService = (serv: ServiceItem) => {
    setSelectedService(serv)
    setConsumeCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  // ── ORDER & CONSUME ACTION ────────────────────────────────────────────────

  const handleOrder = async () => {
    if (!selectedService || !consumeCharId) return
    const char = characters.find(c => c.id === consumeCharId)
    if (!char) return

    const currency = char.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
    const charTotalCp = toCp(currency.gold, 'gp') + toCp(currency.silver, 'sp') + toCp(currency.copper, 'cp')
    const costCp = toCp(selectedService.cost, selectedService.unit)

    if (charTotalCp < costCp) {
      setError(`${char.name} no tiene suficientes fondos (necesita ${formatCost(selectedService.cost, selectedService.unit)}).`)
      return
    }

    setLoading(true)
    setError(null)

    // 1. Calculate new currency balance
    const currencyKey = UNIT_MAP[selectedService.unit]
    const updatedCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) - selectedService.cost }

    // 2. Apply mechanical benefits
    const maxHp = maxHpFor(char)
    const currentHp = char.current_hp ?? maxHp
    const effect = selectedService.applyEffect(char)

    let finalHp = currentHp
    if (effect.hpGain) {
      finalHp = Math.min(maxHp, currentHp + effect.hpGain)
    }

    // Prepare character sheet updates
    const nextSheetJson = {
      ...char.sheet_json,
      currency: updatedCurrency,
    }

    // Apply resting mechanics if requested
    if (effect.triggerLongRest) {
      finalHp = maxHp
      nextSheetJson.spell_slots_used = {}
      nextSheetJson.death_saves = undefined
      nextSheetJson.hit_dice_used = 0
    }

    // Write updates to DB
    const { error: dbErr } = await supabase
      .from('characters')
      .update({
        current_hp: finalHp,
        sheet_json: nextSheetJson as any
      })
      .eq('id', consumeCharId)

    if (dbErr) {
      setError('Error al actualizar la ficha del personaje.')
      setLoading(false)
      return
    }

    // Optional: Write log message to session notes so it's logged persistently!
    await supabase.from('session_notes').insert({
      campaign_id: campaignId,
      author_id: session.user.id,
      title: '🍺 Consumo en Taberna',
      body: effect.logMsg,
      is_private: false,
    })

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['character', consumeCharId] })

    setSuccessMsg(effect.logMsg)
    setSelectedService(null)
    setLoading(false)
  }

  const tavernBgStyle: React.CSSProperties = {
    backgroundImage: `url('/assets/images/tavern_bg.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto text-stone-200 bg-stone-950" style={tavernBgStyle}>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      
      {/* Decorative tavern ambiance banner */}
      <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-lg border border-stone-850 shadow-2xl bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,40,0.03)_1px,_transparent_1px)_0_0_/_20px_20px]" />
        
        {/* Hearth glowing fireplace simulation */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-orange-950/40 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="absolute bottom-6 left-6 z-10 space-y-1">
          <span className="text-[10px] tracking-widest text-amber-500 font-serif uppercase font-bold">Servicios del Establecimiento</span>
          <h2 className="text-3xl font-display tracking-widest text-stone-100 uppercase">La Taberna de Martita</h2>
          <p className="text-xs font-serif italic text-stone-400">
            Un fuego crepitante, cerveza bien fría y catres limpios para reposar el cansancio del viaje.
          </p>
        </div>
        <span className="absolute right-8 bottom-6 text-7xl opacity-10 pointer-events-none">🍺</span>
      </div>

      {successMsg && (
        <div className="mb-6 px-4 py-3 border border-amber-700 bg-stone-950 text-amber-200 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-lg leading-none text-amber-600 hover:text-amber-300 transition-colors">&times;</button>
        </div>
      )}

      {/* Category Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-850">
        {(['drinks', 'foods', 'lodging'] as const).map(cat => {
          const labels = { drinks: '🍺 Bebidas', foods: '🍲 Comidas', lodging: '🛏️ Alojamiento' }
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedService(null); setError(null) }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
                activeCategory === cat
                  ? 'border-amber-600 text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              {labels[cat]}
            </button>
          )
        })}
      </div>

      {/* Services Grid & Interactive Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Services Menu List */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentServices.map(serv => (
              <button
                key={serv.id}
                onClick={() => handleSelectService(serv)}
                className={`text-left p-4 border rounded-lg transition-all flex items-start gap-4 ${
                  selectedService?.id === serv.id
                    ? 'bg-amber-950 border-amber-500 text-amber-100 shadow-lg'
                    : 'bg-stone-950 border-stone-850 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                }`}
              >
                <span className="text-3xl bg-stone-950 p-2 border border-stone-800 rounded">{serv.icon}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate text-stone-100">{serv.name}</span>
                    <span className="font-mono text-xs font-bold text-amber-500 shrink-0">{formatCost(serv.cost, serv.unit)}</span>
                  </div>
                  <p className="text-xs text-stone-400 font-serif leading-relaxed line-clamp-2">{serv.description}</p>
                  <p className="text-[10px] text-amber-500 font-serif italic">{serv.benefit}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Service Checkout Box */}
        {selectedService && (
          <div className="w-full lg:w-80 shrink-0">
            <div className="relative bg-stone-950 border border-stone-800 p-5 rounded-lg space-y-4 shadow-xl">
              <button onClick={() => setSelectedService(null)} className="absolute top-3 right-3 text-stone-500 hover:text-stone-300 text-lg leading-none">✕</button>

              <div className="flex items-start gap-3">
                <span className="text-4xl bg-stone-950 p-2.5 rounded border border-stone-800 shrink-0">{selectedService.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-stone-200 leading-tight pr-5">{selectedService.name}</h3>
                  <span className="font-mono text-xs text-amber-500 font-bold block mt-1">{formatCost(selectedService.cost, selectedService.unit)}</span>
                </div>
              </div>

              <p className="text-xs font-serif text-stone-400 leading-relaxed border-t border-b border-stone-850 py-3">
                {selectedService.description}
              </p>

              <div className="bg-amber-950 border border-amber-900 p-3 rounded">
                <span className="text-[10px] font-display font-semibold uppercase text-amber-500 block mb-1">Efecto Especial</span>
                <p className="text-xs text-stone-300 font-serif italic">{selectedService.benefit}</p>
              </div>

              {buyableChars.length > 0 ? (
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">Consumidor:</span>
                  <div className="space-y-1.5">
                    {buyableChars.map(c => {
                      const cur = c.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
                      const charCp = toCp(cur.gold, 'gp') + toCp(cur.silver, 'sp') + toCp(cur.copper, 'cp')
                      const costCp = toCp(selectedService.cost, selectedService.unit)
                      const canAfford = charCp >= costCp
                      const maxHp = maxHpFor(c)
                      
                      return (
                        <label key={c.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                          consumeCharId === c.id ? 'border-amber-500 bg-amber-950' : 'border-stone-850 bg-stone-950 hover:bg-stone-900'
                        } ${!canAfford ? 'opacity-40' : ''}`}>
                          <input
                            type="radio" name="consume-char" value={c.id}
                            checked={consumeCharId === c.id}
                            onChange={() => { setConsumeCharId(c.id); setError(null) }}
                            className="accent-amber-500"
                            disabled={!canAfford}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-stone-200 block truncate font-semibold">{c.name}</span>
                            <span className="text-[10px] text-stone-400 block font-mono">HP: {c.current_hp ?? maxHp}/{maxHp}</span>
                          </div>
                          <span className={`font-mono text-[10px] shrink-0 ${canAfford ? 'text-amber-500' : 'text-red-500'}`}>
                            {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {error && <p className="text-xs font-serif text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-1.5 rounded">{error}</p>}
                  
                  <button
                    onClick={handleOrder}
                    disabled={loading || !consumeCharId}
                    className="w-full py-2.5 text-xs font-serif bg-amber-900 hover:bg-amber-850 text-amber-100 rounded border border-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold uppercase tracking-wider"
                  >
                    {loading ? 'Preparando Orden…' : `Ordenar & Consumir`}
                  </button>
                </div>
              ) : (
                <p className="text-xs font-serif text-stone-500 italic">No posees personajes en esta campaña.</p>
              )}
            </div>
          </div>
        )}

      </div>
      </main>
    </div>
  )
}
