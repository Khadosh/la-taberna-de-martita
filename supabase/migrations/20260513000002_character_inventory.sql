CREATE TABLE public.character_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_lbs NUMERIC(6,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "inventory_all_owner" ON public.character_inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
  );

-- Campaign members can read
CREATE POLICY "inventory_select_campaign" ON public.character_inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_id
      AND (
        EXISTS (SELECT 1 FROM public.campaigns WHERE id = c.campaign_id AND dm_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.campaign_players WHERE campaign_id = c.campaign_id AND user_id = auth.uid())
      )
    )
  );
