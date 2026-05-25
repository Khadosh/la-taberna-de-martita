-- ─── Table: custom_items ─────────────────────────────────────────────────────
-- Pool de objetos mágicos/custom creados por el GM para una campaña.
-- properties JSONB concentra todos los bonuses y efectos especiales.

CREATE TABLE public.custom_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  name          text NOT NULL,
  description   text,
  image_url     text,
  rarity        text NOT NULL DEFAULT 'common'
                  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  item_type     text NOT NULL DEFAULT 'misc'
                  CHECK (item_type IN ('weapon', 'armor', 'accessory', 'consumable', 'misc')),
  weight_lbs    numeric NOT NULL DEFAULT 0,
  properties    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX custom_items_campaign_idx ON public.custom_items (campaign_id);

-- FK opcional en inventario para vincular un item del inventario a un custom_item
ALTER TABLE public.character_inventory
  ADD COLUMN IF NOT EXISTS custom_item_id uuid REFERENCES public.custom_items(id) ON DELETE SET NULL;

-- ─── RLS: custom_items ───────────────────────────────────────────────────────
ALTER TABLE public.custom_items ENABLE ROW LEVEL SECURITY;

-- GM: acceso total (crear, leer, editar, borrar)
CREATE POLICY "custom_items: dm full access"
  ON public.custom_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid())
  );

-- Miembros de la campaña: solo lectura
CREATE POLICY "custom_items: members read"
  ON public.custom_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE campaign_id = custom_items.campaign_id AND user_id = auth.uid()
    )
  );
