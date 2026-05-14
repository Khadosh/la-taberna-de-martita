-- ─── NPCs ────────────────────────────────────────────────────────────────────
-- Persistent non-player characters owned by the campaign (not by a player).
-- Shape mirrors `characters` but everything except (campaign_id, name) is optional,
-- so the DM can create a "quick" NPC with just a name or a fully-fleshed one.

CREATE TABLE public.npcs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name          text NOT NULL,

  -- Identity (all optional)
  race          text,
  class         text,
  level         integer NOT NULL DEFAULT 1,
  role          text NOT NULL DEFAULT 'neutral'
                CHECK (role IN ('antagonist', 'ally', 'neutral')),
  portrait_url  text,

  -- Stats — defaults to 10s so a "quick NPC" is valid without touching anything
  stats         jsonb NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',

  -- Combat (manual fields — NPCs don't derive from class like PCs do)
  current_hp    integer,
  max_hp        integer,
  armor_class   integer,
  attack_bonus  integer,
  damage        text,          -- e.g. "1d8+2"
  conditions    text[] NOT NULL DEFAULT '{}',

  -- Extras
  backstory     text,
  notes         text,           -- DM-only notes (privacy enforced in app, see RLS for visibility)
  sheet_json    jsonb NOT NULL DEFAULT '{}',
  is_hidden     boolean NOT NULL DEFAULT false,  -- if true, players can't see this NPC

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX npcs_campaign_idx ON public.npcs (campaign_id);


-- ─── NPC Inventory ───────────────────────────────────────────────────────────
-- Loot table for NPCs — what they drop when they die (or carry, narratively).
-- Parallel to character_inventory.

CREATE TABLE public.npc_inventory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id       uuid NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  name         text NOT NULL,
  weight_lbs   numeric(6,2) NOT NULL DEFAULT 0,
  quantity     integer NOT NULL DEFAULT 1,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX npc_inventory_npc_idx ON public.npc_inventory (npc_id);


-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER npcs_touch_updated_at
  BEFORE UPDATE ON public.npcs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ─── RLS: npcs ───────────────────────────────────────────────────────────────

ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

-- DM sees all NPCs of their campaigns; players see only non-hidden NPCs of campaigns they're in.
CREATE POLICY "npcs_select" ON public.npcs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
    OR (
      NOT is_hidden
      AND EXISTS (
        SELECT 1 FROM public.campaign_players
        WHERE campaign_id = npcs.campaign_id AND user_id = auth.uid()
      )
    )
  );

-- Only DM can create / update / delete NPCs in their campaigns.
CREATE POLICY "npcs_insert" ON public.npcs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "npcs_update" ON public.npcs
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "npcs_delete" ON public.npcs
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );


-- ─── RLS: npc_inventory ──────────────────────────────────────────────────────

ALTER TABLE public.npc_inventory ENABLE ROW LEVEL SECURITY;

-- DM can do everything on inventory of their NPCs.
CREATE POLICY "npc_inventory_all_dm" ON public.npc_inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.npcs n
      JOIN public.campaigns c ON c.id = n.campaign_id
      WHERE n.id = npc_id AND c.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.npcs n
      JOIN public.campaigns c ON c.id = n.campaign_id
      WHERE n.id = npc_id AND c.dm_id = auth.uid()
    )
  );

-- Players in the campaign can read inventory of non-hidden NPCs (loot at death is gameplay).
CREATE POLICY "npc_inventory_select_players" ON public.npc_inventory
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.npcs n
      WHERE n.id = npc_id
        AND NOT n.is_hidden
        AND EXISTS (
          SELECT 1 FROM public.campaign_players
          WHERE campaign_id = n.campaign_id AND user_id = auth.uid()
        )
    )
  );


-- ─── Realtime ────────────────────────────────────────────────────────────────
-- So HP / conditions on NPCs propagate live to all clients in session.

ALTER PUBLICATION supabase_realtime ADD TABLE public.npcs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.npc_inventory;
