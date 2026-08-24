CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_select_authenticated ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY follows_insert_own ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY follows_delete_own ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());