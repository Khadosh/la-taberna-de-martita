-- El DM de la campaña puede modificar el inventario de cualquier personaje de su campaña.
-- Necesario para asignar objetos custom desde el panel de Comercio.
CREATE POLICY "inventory_all_dm" ON public.character_inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      JOIN public.campaigns ca ON ca.id = c.campaign_id
      WHERE c.id = character_id AND ca.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters c
      JOIN public.campaigns ca ON ca.id = c.campaign_id
      WHERE c.id = character_id AND ca.dm_id = auth.uid()
    )
  );
