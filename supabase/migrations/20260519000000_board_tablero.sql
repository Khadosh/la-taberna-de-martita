-- ─── Tablero de Juego ────────────────────────────────────────────────────────
-- Posiciones de tokens sincronizadas + mapa activo por campaña.

-- Mapa activo en la campaña (URL de Supabase Storage o URL externa)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS active_map_url text;

-- ─── board_tokens ─────────────────────────────────────────────────────────────
-- Una fila por token activo en el tablero. Persiste entre sesiones.
-- entity_id = character uuid (kind=player) o npc local id (kind=npc)

CREATE TABLE IF NOT EXISTS public.board_tokens (
  campaign_id   uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  entity_id     text        NOT NULL,
  kind          text        NOT NULL CHECK (kind IN ('player', 'npc')),
  label         text        NOT NULL DEFAULT '',
  current_hp    integer,
  max_hp        integer,
  portrait_url  text,
  x             float       NOT NULL DEFAULT 0,
  y             float       NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, entity_id)
);

ALTER TABLE public.board_tokens ENABLE ROW LEVEL SECURITY;

-- DM tiene acceso total
CREATE POLICY "board_tokens_dm_all" ON public.board_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Jugadores pueden leer todos los tokens de su campaña
CREATE POLICY "board_tokens_players_select" ON public.board_tokens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = board_tokens.campaign_id AND user_id = auth.uid()
    )
  );

-- Jugadores pueden mover su propio token (kind=player, entity_id = su character id)
CREATE POLICY "board_tokens_player_move_own" ON public.board_tokens
  FOR UPDATE TO authenticated
  USING (
    kind = 'player' AND
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE id::text = entity_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    kind = 'player' AND
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE id::text = entity_id AND user_id = auth.uid()
    )
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
