-- Premium post media must not be publicly addressable.
UPDATE storage.buckets SET public = false WHERE id = 'post-media';
DROP POLICY IF EXISTS post_media_storage_select ON storage.objects;
CREATE POLICY post_media_storage_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'post-media'
  AND EXISTS (
    SELECT 1
    FROM public.post_media media
    JOIN public.posts post ON post.id = media.post_id
    WHERE media.storage_path = name
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
  )
);
