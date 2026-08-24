CREATE TABLE IF NOT EXISTS public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'PUBLIC',
  storage_path text NOT NULL,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reel_likes (
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (reel_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.reel_bookmarks (
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (reel_id, user_id)
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY reel_likes_all ON public.reel_likes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reel_bookmarks_all ON public.reel_bookmarks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reels_select_visible ON public.reels FOR SELECT TO authenticated USING (
  visibility = 'PUBLIC' OR model_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY reels_insert_model ON public.reels FOR INSERT TO authenticated WITH CHECK (
  model_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MODEL')
);
CREATE POLICY reels_update_owner ON public.reels FOR UPDATE TO authenticated USING (model_id = auth.uid()) WITH CHECK (model_id = auth.uid());
CREATE POLICY reels_delete_owner ON public.reels FOR DELETE TO authenticated USING (model_id = auth.uid());

DROP POLICY IF EXISTS reel_media_storage_select ON storage.objects;
CREATE POLICY reel_media_storage_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'post-media' AND EXISTS (
    SELECT 1 FROM public.reels reel WHERE reel.storage_path = name AND
      (reel.visibility = 'PUBLIC' OR reel.model_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')))
  )
);

CREATE OR REPLACE FUNCTION public.increment_reel_views(target_reel_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE reels SET views_count = views_count + 1 WHERE id = target_reel_id;
$$;