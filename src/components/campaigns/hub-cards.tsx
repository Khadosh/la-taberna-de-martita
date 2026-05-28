import { Link } from '@tanstack/react-router'
import { ABILITY_LABELS } from '../../lib/dnd-api'
import { getSpellSlots } from '../../lib/dnd-constants'
import { CLASS_ICONS } from '../../lib/class-meta'
import type { Tables } from '../../lib/database.types'
import { Frame, Divider, BlockHeader, StatBox, InfoBox } from './hub-primitives'
import { BACKGROUNDS } from '../../lib/dnd-backgrounds'

export type Character = {
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
    background?: string
    expertise?: string[]
  }
  profiles?: { username: string | null } | null
}

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

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

const ROLE_STYLES: Record<string, { label: string; chip: string }> = {
  antagonist: { label: 'Antagonista', chip: 'bg-red-900/30 border-red-800/40 text-red-900' },
  ally: { label: 'Aliado', chip: 'bg-green-900/20 border-green-800/40 text-green-900' },
  neutral: { label: 'Neutral', chip: 'bg-stone-200 border-stone-400 text-stone-700' },
}

const abilityMod = (score: number) => Math.floor((score - 10) / 2)
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`)
const profBonusForLevel = (level: number) => Math.floor((level - 1) / 4) + 2

export function PartyMemberCard({ character }: { character: Character }) {
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

export function NpcLandingCard({ npc, campaignId }: { npc: Tables<'npcs'>; campaignId: string }) {
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
            {icon.startsWith('/') ? (
              <img
                src={icon}
                className="w-8 h-8 rounded-full border border-stone-300 bg-stone-950 object-cover object-center shrink-0"
                alt=""
              />
            ) : (
              <span className="text-2xl shrink-0">{icon}</span>
            )}
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

export function CharacterCard({ character, isOwn }: { character: Character; isOwn: boolean }) {
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
  const bgKey = sheet.background
  const bgDetail = bgKey ? BACKGROUNDS[bgKey] : null
  const bgSkills = bgDetail?.skills?.map(s => s.toLowerCase().replace(/\s+/g, '-')) ?? []

  const hasPerceptionProf =
    (sheet.skill_proficiencies ?? []).includes('skill-perception') ||
    (sheet.skill_proficiencies ?? []).includes('perception') ||
    bgSkills.includes('perception')

  const hasPerceptionExpertise =
    (sheet.expertise ?? []).includes('skill-perception') ||
    (sheet.expertise ?? []).includes('perception')

  const passivePerception = 10 + wisMod + (hasPerceptionProf ? prof : 0) + (hasPerceptionExpertise ? prof : 0)
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

          <div className="grid grid-cols-3 gap-2">
            <StatBox label="CA" value={ac} caption="Ataques enemi." />
            <StatBox label="Iniciativa" value={formatMod(dexMod)} caption="Orden de turnos" />
            <StatBox label="Perc. Pasiva" value={passivePerception} caption="Sin tirada" />
          </div>

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

          <BlockHeader>Combate y competencia</BlockHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Bon. Competencia" value={formatMod(prof)} caption="Pruebas y ataques" />
            <InfoBox label="GACO" value={formatMod(gaco)} caption="Ataque con arma" />
          </div>

          <BlockHeader>Salvaciones y clase</BlockHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Salvaciones" value={savings || '—'} caption="Conjuros y trampas" compact />
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
