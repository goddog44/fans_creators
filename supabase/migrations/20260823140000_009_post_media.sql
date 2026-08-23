-- Store post media as independent ordered records.
ALTER TYPE visibility_type ADD VALUE IF NOT EXISTS 'FOLLOWERS';
ALTER TYPE visibility_type ADD VALUE IF NOT EXISTS 'VIP';

CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO')),
  storage_path text NOT NULL,
  thumbnail_path text,
  position integer NOT NULL DEFAULT 0,
  duration numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, position)
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_position ON public.post_media(post_id, position);
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_media_select_visible ON public.post_media
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));

CREATE POLICY post_media_insert_post_owner ON public.post_media
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id
      AND (p.model_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles profile
        WHERE profile.id = auth.uid() AND profile.role IN ('ADMIN', 'MANAGER')
      ))
  ));

CREATE POLICY post_media_update_post_owner ON public.post_media
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id
      AND (p.model_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles profile
        WHERE profile.id = auth.uid() AND profile.role IN ('ADMIN', 'MANAGER')
      ))
  ));

CREATE POLICY post_media_delete_post_owner ON public.post_media
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id
      AND (p.model_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles profile
        WHERE profile.id = auth.uid() AND profile.role IN ('ADMIN', 'MANAGER')
      ))
  ));

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY post_media_storage_select ON storage.objects FOR SELECT TO public
USING (bucket_id = 'post-media');

CREATE POLICY post_media_storage_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY post_media_storage_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY post_media_storage_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
