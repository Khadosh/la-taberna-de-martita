import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { Corner, SectionHeader, AddSlot } from '../../../components/campaigns/hub-primitives'
import { type Character, CharacterCard, NpcLandingCard, PartyMemberCard } from '../../../components/campaigns/hub-cards'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/')({
  component: CampaignHubLanding,
})

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

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative">
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />
        {isGm
          ? <GmView campaignId={campaignId} characters={characters} npcs={npcs} />
          : <PlayerView campaignId={campaignId} characters={characters} userId={session.user.id} />
        }
      </div>
    </div>
  )
}

function GmView({ campaignId, characters, npcs }: { campaignId: string; characters: Character[]; npcs: any[] }) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
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

function PlayerView({ campaignId: _campaignId, characters, userId }: { campaignId: string; characters: Character[]; userId: string }) {
  const myCharacter = characters.find(c => c.user_id === userId)
  const partyMembers = characters.filter(c => c.user_id !== userId)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex gap-8 items-start">
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
