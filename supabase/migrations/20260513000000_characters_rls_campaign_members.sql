-- Allow campaign members to see all characters in their campaign
DROP POLICY IF EXISTS "characters_select" ON public.characters;

CREATE POLICY "characters_select" ON public.characters
  FOR SELECT TO authenticated USING (
    -- Own characters
    user_id = auth.uid()
    -- GM of the campaign this character belongs to
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
    -- Fellow player in the same campaign
    OR EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = characters.campaign_id AND user_id = auth.uid()
    )
  );
