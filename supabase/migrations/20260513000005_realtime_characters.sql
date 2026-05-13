-- Enable Realtime for characters table so HP/conditions/slots propagate instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
