ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS background text NOT NULL DEFAULT 'linear-gradient(135deg, #111827, #374151)';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_story_id ON public.messages(story_id);
