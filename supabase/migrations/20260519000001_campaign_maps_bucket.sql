-- Bucket de Supabase Storage para mapas de campaña
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-maps',
  'campaign-maps',
  true,
  10485760,  -- 10 MB por archivo
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: DM puede subir/eliminar mapas de su campaña
-- (el path es {campaignId}/{filename})
CREATE POLICY "DM upload campaign maps"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-maps' AND
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id::text = split_part(name, '/', 1)
        AND dm_id = auth.uid()
    )
  );

CREATE POLICY "DM delete campaign maps"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'campaign-maps' AND
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id::text = split_part(name, '/', 1)
        AND dm_id = auth.uid()
    )
  );

-- Política: todos los autenticados pueden leer mapas
CREATE POLICY "Authenticated users read campaign maps"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'campaign-maps');
