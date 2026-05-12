-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- PROFILES
-- Any authenticated user can read profiles (needed for showing usernames)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- CAMPAIGNS
-- Any authenticated user can read any campaign (needed for the join-via-link flow)
CREATE POLICY "campaigns_select" ON public.campaigns
  FOR SELECT TO authenticated USING (true);

-- Anyone can create a campaign (they become the DM)
CREATE POLICY "campaigns_insert" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (dm_id = auth.uid());

CREATE POLICY "campaigns_update" ON public.campaigns
  FOR UPDATE TO authenticated USING (dm_id = auth.uid());

CREATE POLICY "campaigns_delete" ON public.campaigns
  FOR DELETE TO authenticated USING (dm_id = auth.uid());

-- CAMPAIGN_PLAYERS
-- DMs and players can see who's in the campaign
CREATE POLICY "campaign_players_select" ON public.campaign_players
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Players can join themselves (invite link); DMs can add players
CREATE POLICY "campaign_players_insert" ON public.campaign_players
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Players can leave; DMs can kick players
CREATE POLICY "campaign_players_delete" ON public.campaign_players
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- CHARACTERS
-- Users see their own; DMs see characters of players in their campaigns
CREATE POLICY "characters_select" ON public.characters
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "characters_insert" ON public.characters
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_update" ON public.characters
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "characters_delete" ON public.characters
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SESSION_NOTES
-- Authors always see their own notes; campaign members see public notes
CREATE POLICY "session_notes_select" ON public.session_notes
  FOR SELECT TO authenticated USING (
    author_id = auth.uid()
    OR (
      NOT is_private
      AND (
        EXISTS (
          SELECT 1 FROM public.campaigns
          WHERE id = campaign_id AND dm_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.campaign_players
          WHERE campaign_id = session_notes.campaign_id AND user_id = auth.uid()
        )
      )
    )
  );

-- Only campaign members (DM or player) can create notes
CREATE POLICY "session_notes_insert" ON public.session_notes
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.campaigns
        WHERE id = campaign_id AND dm_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.campaign_players
        WHERE campaign_id = session_notes.campaign_id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "session_notes_update" ON public.session_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "session_notes_delete" ON public.session_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid());
