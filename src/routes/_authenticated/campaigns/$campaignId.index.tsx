import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { ABILITY_LABELS } from '../../../lib/dnd-api'
import { getSpellSlots } from '../../../lib/dnd-constants'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/')({
  component: CampaignHubLanding,
})

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

// First 2 base class features per class, low-level approximation
const CLASS_BASE_FEATURES: Record<string, string[]> = {
  barbarian: ['Rabia', 'Defensa sin armadura'],
  bard: ['Inspiración bárdica', 'Magia bárdica'],
  cleric: ['Magia divina', 'Dominio divino'],
  druid: ['Magia druídica', 'Druídico'],
  fighter: ['Estilo de combate', 'Recuperación'],
  monk: ['Defensa sin armadura', 'Artes marciales'],
  paladin: ['Sentido divino', 'Imposición de manos'],
  ranger: ['Favored Enemy', 'Natural Explorer'],
  rogue: ['Ataque furtivo 1d6', 'Acción astuta'],
  sorcerer: ['Hechicería', 'Magia espontánea'],
  warlock: ['Magia de pacto', 'Patrón otherworldly'],
  wizard: ['Recuperación arcana', 'Magia arcana'],
}

const abilityMod = (score: number) => Math.floor((score - 10) / 2)
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`)
const profBonusForLevel = (level: number) => Math.floor((level - 1) / 4) + 2

type Character = {
  id: string
  name: string
  race: string
  class: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  user_id: string
  sheet_json: {
    saving_throws?: string[]
    max_hp?: number
    hit_die?: number
    skill_proficiencies?: string[]
    currency?: { gold: number; silver: number; copper: number }
  }
  profiles?: { username: string | null } | null
}

function CampaignHubLanding() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*, profiles!characters_user_id_profiles_id_fk(username)')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">

      {/* PJs */}
      <section>
        <SectionHeader icon="📜" label="PJs" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map(c => (
            <CharacterCard key={c.id} character={c} isOwn={c.user_id === session.user.id} />
          ))}
          <AddSlot label="+ agregar personaje" hint="Compartí el invite con tu party" />
        </div>
      </section>

      {/* PNJs */}
      <section>
        <SectionHeader icon="😈" label="PNJs" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AddSlot
            label="+ generar PNJ"
            hint="Próximamente: generador desde la pestaña 'Generador de PNJ'"
            to="/campaigns/$campaignId/pnj"
            params={{ campaignId }}
          />
        </div>
      </section>

    </main>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CharacterCard({ character, isOwn }: { character: Character; isOwn: boolean }) {
  const { stats, sheet_json: sheet, level, class: cls } = character

  const dexMod = abilityMod(stats.dex ?? 10)
  const conMod = abilityMod(stats.con ?? 10)
  const wisMod = abilityMod(stats.wis ?? 10)
  const strMod = abilityMod(stats.str ?? 10)

  const prof = profBonusForLevel(level)
  const hitDie = sheet.hit_die ?? 8
  const estimatedMax = hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
  const maxHp = sheet.max_hp ?? Math.max(estimatedMax, character.current_hp ?? 0)
  const currentHp = character.current_hp ?? maxHp
  const hpPct = Math.max(0, Math.min((currentHp / maxHp) * 100, 100))
  const ac = character.armor_class ?? (10 + dexMod)
  const passivePerception = 10 + wisMod + (sheet.skill_proficiencies?.includes('perception') ? prof : 0)

  // GACO simplified: prof + best of str/dex
  const gaco = prof + Math.max(strMod, dexMod)

  const savings = (sheet.saving_throws ?? [])
    .map(ab => {
      const mod = abilityMod(stats[ab] ?? 10) + prof
      return `${(ABILITY_LABELS[ab] ?? ab).toUpperCase()} ${formatMod(mod)}`
    })
    .join(' · ')

  const classFeatures = CLASS_BASE_FEATURES[cls.toLowerCase()] ?? []
  const slots = getSpellSlots(cls, level)
  const firstSlotLevel = slots.findIndex(n => n > 0)
  const playerName = character.profiles?.username
  const initials = (playerName?.[0] ?? character.name[0] ?? '?').toUpperCase() + (character.name.split(' ')[1]?.[0]?.toUpperCase() ?? '')

  return (
    <Link
      to="/characters/$characterId"
      params={{ characterId: character.id }}
      className="relative block hover:scale-[1.005] transition-transform"
    >
      <Frame>
        <div className="p-4 space-y-3">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-display font-bold text-stone-900 leading-tight truncate">{character.name}</h3>
              <p className="text-xs italic text-stone-600 capitalize mt-0.5">
                {character.race} · {cls} · Nv. {level}
              </p>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full bg-stone-900 text-amber-100 flex items-center justify-center text-[10px] font-bold tracking-wider">
                {initials}
              </div>
              <p className="text-[10px] text-stone-600 mt-1 italic">{isOwn ? 'tu PJ' : playerName ?? 'Jugador'}</p>
            </div>
          </div>

          <Divider />

          {/* HP */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-[10px] font-display tracking-widest text-stone-600 uppercase">Puntos de Golpe</p>
              <p className="text-sm font-mono">
                <span className="text-base font-bold text-stone-900">{currentHp}</span>
                <span className="text-stone-600"> / {maxHp} máx.</span>
              </p>
            </div>
            <div className="h-2 bg-stone-300/60 rounded-sm overflow-hidden border border-stone-400/40">
              <div
                className={`h-full ${hpPct > 50 ? 'bg-red-900' : hpPct > 25 ? 'bg-amber-700' : 'bg-red-700'}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* CA / Iniciativa / Percepción */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="CA" value={ac} caption="Ataques enemi." />
            <StatBox label="Iniciativa" value={formatMod(dexMod)} caption="Orden de turnos" />
            <StatBox label="Perc. Pasiva" value={passivePerception} caption="Sin tirada" />
          </div>

          {/* Características */}
          <BlockHeader>Características</BlockHeader>
          <div className="grid grid-cols-6 gap-1">
            {STAT_KEYS.map(k => {
              const score = stats[k] ?? 10
              const mod = abilityMod(score)
              return (
                <div key={k} className="text-center bg-amber-100/60 border border-stone-400/40 py-1">
                  <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                  <p className="text-base font-bold text-stone-900 leading-tight">{score}</p>
                  <p className="text-[10px] font-mono text-stone-700">{formatMod(mod)}</p>
                </div>
              )
            })}
          </div>

          {/* Combate y competencia */}
          <BlockHeader>Combate y competencia</BlockHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Bon. Competencia" value={formatMod(prof)} caption="Pruebas y ataques" />
            <InfoBox label="GACO" value={formatMod(gaco)} caption="Ataque con arma" />
          </div>

          {/* Salvaciones y clase */}
          <BlockHeader>Salvaciones y clase</BlockHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoBox
              label="Salvaciones"
              value={savings || '—'}
              caption="Conjuros y trampas"
              compact
            />
            <InfoBox
              label="Rasgos de Clase"
              value={
                <div className="space-y-0.5">
                  {classFeatures.map(f => (
                    <p key={f} className="text-[11px] leading-tight text-stone-800">{f}</p>
                  ))}
                  <p className="text-[10px] italic text-stone-500 leading-tight">Improvisar situaciones</p>
                </div>
              }
              compact
            />
          </div>

          {/* Spell slots */}
          <BlockHeader>Espacios de Conjuro</BlockHeader>
          {firstSlotLevel === -1 ? (
            <p className="text-[11px] italic text-stone-600 bg-amber-100/50 border border-stone-400/40 px-2 py-1.5">
              Sin acceso{cls.toLowerCase() === 'rogue' ? ' — disponible desde Nv. 3 (Arcane Trickster)' : ''}
              {cls.toLowerCase() === 'fighter' ? ' — disponible desde Nv. 3 (Eldritch Knight)' : ''}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 bg-amber-100/50 border border-stone-400/40 px-2 py-1.5">
              {slots.map((count, idx) =>
                count > 0 ? (
                  <span key={idx} className="text-[11px] font-mono text-stone-800">
                    Nv {idx + 1}: <span className="font-bold">{count}</span>
                  </span>
                ) : null
              )}
            </div>
          )}

        </div>
      </Frame>
    </Link>
  )
}

// ── Decorative wrappers ──────────────────────────────────────────────────────

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ background: 'rgba(255, 248, 230, 0.6)' }}>
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
      <div className="border border-stone-400/30">
        {children}
      </div>
    </div>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positions: Record<typeof pos, string> = {
    tl: 'top-[-3px] left-[-3px] border-t-2 border-l-2',
    tr: 'top-[-3px] right-[-3px] border-t-2 border-r-2',
    bl: 'bottom-[-3px] left-[-3px] border-b-2 border-l-2',
    br: 'bottom-[-3px] right-[-3px] border-b-2 border-r-2',
  }
  return <span className={`absolute w-3 h-3 border-stone-900 ${positions[pos]} pointer-events-none`} />
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-400/40">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-display tracking-[0.25em] uppercase text-stone-700">{label}</h2>
    </div>
  )
}

function BlockHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-[9px] font-display tracking-[0.2em] uppercase text-stone-600 pt-1">
      {children}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-stone-400/40" />
}

function StatBox({ label, value, caption }: { label: string; value: string | number; caption: string }) {
  return (
    <div className="text-center bg-amber-100/60 border border-stone-400/40 py-1.5 px-1">
      <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase leading-tight">{label}</p>
      <p className="text-lg font-bold text-stone-900 font-mono leading-tight my-0.5">{value}</p>
      <p className="text-[9px] italic text-stone-600 leading-tight">{caption}</p>
    </div>
  )
}

function InfoBox({
  label,
  value,
  caption,
  compact,
}: {
  label: string
  value: React.ReactNode
  caption?: string
  compact?: boolean
}) {
  return (
    <div className="bg-amber-100/60 border border-stone-400/40 px-2 py-1.5">
      <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase">{label}</p>
      {typeof value === 'string' || typeof value === 'number' ? (
        <p className={`${compact ? 'text-xs' : 'text-base font-bold'} font-mono text-stone-900 leading-tight`}>
          {value}
        </p>
      ) : (
        <div className="mt-0.5">{value}</div>
      )}
      {caption && <p className="text-[9px] italic text-stone-600 leading-tight mt-0.5">{caption}</p>}
    </div>
  )
}

function AddSlot({
  label,
  hint,
  to,
  params,
}: {
  label: string
  hint?: string
  to?: '/campaigns/$campaignId/pnj'
  params?: { campaignId: string }
}) {
  const content = (
    <div className="border-2 border-dashed border-stone-500/40 rounded-sm flex flex-col items-center justify-center min-h-[180px] text-center px-4 py-8 hover:border-stone-700/60 hover:bg-amber-100/30 transition-colors">
      <p className="text-sm italic font-serif text-stone-700">{label}</p>
      {hint && <p className="text-xs text-stone-500 mt-1.5 max-w-[180px]">{hint}</p>}
    </div>
  )
  if (to && params) return <Link to={to} params={params}>{content}</Link>
  return content
}
