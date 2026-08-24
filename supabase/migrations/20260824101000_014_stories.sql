CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_model_expires ON public.stories(model_id, expires_at DESC);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY stories_select_active ON public.stories
  FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE POLICY stories_insert_model ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (
    model_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MODEL')
  );

CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE TO authenticated
  USING (model_id = auth.uid());
