CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Live now',
  description text NOT NULL DEFAULT '',
  visibility visibility_type NOT NULL DEFAULT 'PUBLIC',
  status text NOT NULL DEFAULT 'LIVE' CHECK (status IN ('LIVE', 'ENDED', 'SCHEDULED')),
  started_at timestamptz,
  ended_at timestamptz,
  thumbnail_url text,
  viewer_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_streams_select_visible ON public.live_streams FOR SELECT TO authenticated USING (
  status IN ('LIVE', 'SCHEDULED')
  AND (
    visibility = 'PUBLIC'
    OR model_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
  )
);

CREATE POLICY live_streams_insert_owner ON public.live_streams FOR INSERT TO authenticated WITH CHECK (
  model_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MODEL')
);

CREATE POLICY live_streams_update_owner ON public.live_streams FOR UPDATE TO authenticated USING (model_id = auth.uid()) WITH CHECK (model_id = auth.uid());
CREATE POLICY live_streams_delete_owner ON public.live_streams FOR DELETE TO authenticated USING (model_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_live_streams_model_status ON public.live_streams(model_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_status_active ON public.live_streams(status, created_at DESC);
