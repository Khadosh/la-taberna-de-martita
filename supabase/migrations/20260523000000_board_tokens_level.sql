ALTER TABLE public.board_tokens
  ADD COLUMN IF NOT EXISTS npc_level smallint;
