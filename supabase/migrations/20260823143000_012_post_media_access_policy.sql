-- Do not expose media metadata for posts the viewer cannot access.
DROP POLICY IF EXISTS post_media_select_visible ON public.post_media;
CREATE POLICY post_media_select_visible ON public.post_media
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.posts post
    WHERE post.id = post_id
      AND (
        post.model_id = auth.uid()
        OR post.visibility IN ('PUBLIC', 'FOLLOWERS')
        OR EXISTS (
          SELECT 1 FROM public.profiles profile
          WHERE profile.id = auth.uid() AND profile.role IN ('ADMIN', 'MANAGER')
        )
        OR (
          post.visibility IN ('SUBSCRIBERS', 'VIP')
          AND EXISTS (
            SELECT 1 FROM public.subscriptions subscription
            WHERE subscription.user_id = auth.uid()
              AND subscription.model_id = post.model_id
              AND subscription.status = 'ACTIVE'
          )
        )
      )
  ));
