ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reel_id uuid REFERENCES public.reels(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_reel_id ON public.messages(reel_id);