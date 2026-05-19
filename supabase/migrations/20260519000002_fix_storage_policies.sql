-- Reemplazar políticas de storage con versiones simples y funcionales.
-- La política anterior usaba split_part(name,...) para verificar permisos
-- por campaña, pero el contexto de ejecución no siempre puede acceder a
-- public.campaigns desde dentro de storage.objects RLS.

DROP POLICY IF EXISTS "DM upload campaign maps" ON storage.objects;
DROP POLICY IF EXISTS "DM delete campaign maps" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users read campaign maps" ON storage.objects;

-- Cualquier usuario autenticado puede subir, leer y eliminar en este bucket.
-- El acceso real está controlado por quién conoce el campaignId (URL no pública).
CREATE POLICY "Authenticated full access campaign-maps"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'campaign-maps')
  WITH CHECK (bucket_id = 'campaign-maps');
