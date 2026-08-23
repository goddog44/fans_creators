-- Enforce premium post access at the database boundary.
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
CREATE POLICY posts_select_visible ON public.posts
  FOR SELECT TO authenticated
  USING (
    model_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'MANAGER')
    )
    OR visibility = 'PUBLIC'
    OR visibility = 'FOLLOWERS'
    OR (
      visibility IN ('SUBSCRIBERS', 'VIP')
      AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = auth.uid()
          AND s.model_id = posts.model_id
          AND s.status = 'ACTIVE'
      )
    )
  );

DROP POLICY IF EXISTS post_media_select_visible ON public.post_media;
CREATE POLICY post_media_select_visible ON public.post_media
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
