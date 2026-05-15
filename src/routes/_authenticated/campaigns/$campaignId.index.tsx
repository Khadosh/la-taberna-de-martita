import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { ABILITY_LABELS } from '../../../lib/dnd-api'
import { getSpellSlots } from '../../../lib/dnd-constants'
import { CLASS_ICONS } from '../../../lib/class-meta'
import type { Tables } from '../../../lib/database.types'

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

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
  })

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

  const { data: npcs = [] } = useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  if (!campaign) return null

  const isGm = campaign.dm_id === session.user.id

  if (isGm) return <GmView campaignId={campaignId} characters={characters} npcs={npcs} />
  return <PlayerView campaignId={campaignId} characters={characters} userId={session.user.id} />
}

// ── GM View ──────────────────────────────────────────────────────────────────

function GmView({ campaignId, characters, npcs }: { campaignId: string; characters: Character[]; npcs: any[] }) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      <section>
        <SectionHeader icon="🎯" label="Herramientas DM" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { to: '/campaigns/$campaignId/lucha', icon: '⚔️', label: 'Combate', hint: 'Iniciativa y encuentros' },
            { to: '/campaigns/$campaignId/pnj', icon: '👤', label: 'PNJs', hint: 'Generar antagonistas' },
            { to: '/campaigns/$campaignId/mapas', icon: '🗺️', label: 'Mapas', hint: 'Gestionar locaciones' },
            { to: '/campaigns/$campaignId/taberna', icon: '🍺', label: 'Taberna', hint: 'Generador de ambiente' },
          ] as { to: '/campaigns/$campaignId/lucha' | '/campaigns/$campaignId/pnj' | '/campaigns/$campaignId/mapas' | '/campaigns/$campaignId/taberna'; icon: string; label: string; hint: string }[]).map(tool => (
            <Link key={tool.to} to={tool.to} params={{ campaignId }} className="block border border-stone-400/30 bg-amber-100/40 hover:bg-amber-100/70 transition-colors p-4 text-center">
              <span className="text-2xl block mb-1">{tool.icon}</span>
              <p className="text-sm font-display font-bold text-stone-900">{tool.label}</p>
              <p className="text-[11px] italic text-stone-600 mt-0.5">{tool.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader icon="📜" label={`Party · ${characters.length} PJ${characters.length !== 1 ? 's' : ''}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map(c => <CharacterCard key={c.id} character={c} isOwn={false} />)}
          <AddSlot label="+ agregar personaje" hint="Compartí el invite con tu party" />
        </div>
      </section>

      <section>
        <SectionHeader icon="😈" label={`PNJs · ${npcs.length}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {npcs.map((npc: any) => <NpcLandingCard key={npc.id} npc={npc} campaignId={campaignId} />)}
          <AddSlot label="+ generar PNJ" hint="Crea antagonistas, aliados y neutrales" to="/campaigns/$campaignId/pnj" params={{ campaignId }} />
        </div>
      </section>
    </main>
  )
}

// ── Player View ───────────────────────────────────────────────────────────────

function PlayerView({ campaignId: _campaignId, characters, userId }: { campaignId: string; characters: Character[]; userId: string }) {
  const myCharacter = characters.find(c => c.user_id === userId)
  const partyMembers = characters.filter(c => c.user_id !== userId)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex gap-8 items-start">

        {/* Left: my character */}
        <div className="flex-1 min-w-0">
          <SectionHeader icon="🧙" label="Mi Personaje" />
          {myCharacter
            ? <CharacterCard character={myCharacter} isOwn />
            : (
              <div className="border-2 border-dashed border-stone-500/40 flex flex-col items-center justify-center min-h-[120px] text-center px-4 py-8">
                <p className="text-sm italic font-serif text-stone-700">Todavía no tenés un personaje en esta campaña</p>
                <p className="text-xs text-stone-500 mt-1.5">Pedile al DM que te comparta el invite</p>
              </div>
            )
          }
        </div>

        {/* Right: party vertical list */}
        {partyMembers.length > 0 && (
          <div className="w-64 shrink-0">
            <SectionHeader icon="📜" label={`Party · ${partyMembers.length}`} />
            <div className="flex flex-col gap-3">
              {partyMembers.map(c => <PartyMemberCard key={c.id} character={c} />)}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}


// ── Party Member Card (player-visible, HP bar only) ───────────────────────────

function PartyMemberCard({ character }: { character: Character }) {
  const { stats, level, class: cls, sheet_json: sheet } = character
  const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
  const hitDie = sheet.hit_die ?? 8
  const estimatedMax = hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
  const maxHp = sheet.max_hp ?? estimatedMax
  const currentHp = character.current_hp ?? maxHp
  const hpPct = Math.max(0, Math.min((currentHp / maxHp) * 100, 100))
  return (
    <Frame>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-display font-bold text-stone-900 leading-tight">{character.name}</h3>
            <p className="text-xs italic text-stone-600 capitalize">{character.race} · {cls} · Nv. {level}</p>
          </div>
          <p className="text-[11px] text-stone-500 italic shrink-0">{character.profiles?.username ?? 'Jugador'}</p>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-[10px] font-display tracking-widest text-stone-600 uppercase">PG</p>
            <p className="text-xs font-mono text-stone-800">{currentHp} / {maxHp}</p>
          </div>
          <div className="h-1.5 bg-stone-300/60 rounded-sm overflow-hidden border border-stone-400/40">
            <div className={`h-full ${hpPct > 50 ? 'bg-red-900' : hpPct > 25 ? 'bg-amber-700' : 'bg-red-700'}`} style={{ width: `${hpPct}%` }} />
          </div>
        </div>
      </div>
    </Frame>
  )
}

// ── NPC Card (landing) ───────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, { label: string; chip: string }> = {
  antagonist: { label: 'Antagonista', chip: 'bg-red-900/30 border-red-800/40 text-red-900' },
  ally: { label: 'Aliado', chip: 'bg-green-900/20 border-green-800/40 text-green-900' },
  neutral: { label: 'Neutral', chip: 'bg-stone-200 border-stone-400 text-stone-700' },
}

function NpcLandingCard({ npc, campaignId }: { npc: Tables<'npcs'>; campaignId: string }) {
  const stats = npc.stats as Record<string, number> | null
  const role = ROLE_STYLES[npc.role] ?? ROLE_STYLES.neutral
  const icon = npc.class ? CLASS_ICONS[npc.class] ?? '👤' : '👤'
  const hpPct = npc.max_hp && npc.current_hp != null
    ? Math.max(0, Math.min((npc.current_hp / npc.max_hp) * 100, 100))
    : null

  return (
    <Link to="/campaigns/$campaignId/pnj" params={{ campaignId }} className="block hover:scale-[1.005] transition-transform">
      <Frame>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className={`inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border ${role.chip} mb-1`}>
                {role.label}
              </span>
              {npc.is_hidden && (
                <span className="ml-1 inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border border-stone-700 text-stone-700 bg-stone-200 mb-1">
                  oculto
                </span>
              )}
              <h3 className="text-lg font-display font-bold text-stone-900 leading-tight truncate">{npc.name}</h3>
              {(npc.race || npc.class) && (
                <p className="text-xs italic text-stone-600 capitalize">
                  {[npc.race, npc.class, `Nv. ${npc.level}`].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <span className="text-2xl shrink-0">{icon}</span>
          </div>

          {hpPct != null && npc.max_hp != null && (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-[10px] font-display tracking-widest text-stone-600 uppercase">PG</p>
                <p className="text-sm font-mono">
                  <span className="font-bold text-stone-900">{npc.current_hp}</span>
                  <span className="text-stone-600"> / {npc.max_hp}</span>
                </p>
              </div>
              <div className="h-1.5 bg-stone-300/60 rounded-sm overflow-hidden border border-stone-400/40">
                <div className={`h-full ${hpPct > 50 ? 'bg-red-900' : hpPct > 25 ? 'bg-amber-700' : 'bg-red-700'}`} style={{ width: `${hpPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-stone-700">
            {npc.armor_class != null && <span>🛡 CA {npc.armor_class}</span>}
            {npc.attack_bonus != null && <span>⚔ {formatMod(npc.attack_bonus)}</span>}
            {npc.damage && <span className="text-stone-600">{npc.damage}</span>}
          </div>

          {stats && (
            <div className="grid grid-cols-6 gap-1">
              {STAT_KEYS.map(k => (
                <div key={k} className="text-center bg-amber-100/40 border border-stone-400/30 py-0.5">
                  <p className="text-[8px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                  <p className="text-[11px] font-mono text-stone-900">{formatMod(abilityMod(stats[k] ?? 10))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Frame>
    </Link>
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
