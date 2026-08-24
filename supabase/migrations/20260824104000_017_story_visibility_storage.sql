ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'PUBLIC'
  CHECK (visibility IN ('PUBLIC', 'PRIVATE'));

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('IMAGE', 'VIDEO'));
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS duration_hours integer NOT NULL DEFAULT 6 CHECK (duration_hours BETWEEN 1 AND 24);
ALTER TABLE public.stories ALTER COLUMN expires_at SET DEFAULT (now() + interval '6 hours');

DROP POLICY IF EXISTS stories_select_active ON public.stories;
CREATE POLICY stories_select_active ON public.stories
  FOR SELECT TO authenticated
  USING (expires_at > now() AND (visibility = 'PUBLIC' OR model_id = auth.uid()));

DROP POLICY IF EXISTS stories_insert_model ON public.stories;
CREATE POLICY stories_insert_model ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (
    model_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MODEL')
  );

DROP POLICY IF EXISTS story_media_storage_select ON storage.objects;
CREATE POLICY story_media_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-media'
    AND EXISTS (
      SELECT 1 FROM public.stories story
      WHERE story.storage_path = name
        AND story.expires_at > now()
        AND (story.visibility = 'PUBLIC' OR story.model_id = auth.uid())
    )
  );
