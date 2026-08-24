CREATE TABLE IF NOT EXISTS public.hidden_posts (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY hidden_posts_own ON public.hidden_posts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY blocked_users_own ON public.blocked_users FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.posts WHERE posts.id = comments.post_id AND posts.model_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

CREATE POLICY comments_update_own ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);