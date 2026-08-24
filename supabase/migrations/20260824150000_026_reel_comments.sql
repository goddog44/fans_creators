ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.reel_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON public.reel_comments(reel_id);
CREATE TABLE IF NOT EXISTS public.reel_comment_likes (
  comment_id uuid NOT NULL REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY reel_comments_select ON public.reel_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY reel_comments_insert_own ON public.reel_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY reel_comments_update_own ON public.reel_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY reel_comments_delete_author_or_owner ON public.reel_comments FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.reels WHERE reels.id = reel_comments.reel_id AND reels.model_id = auth.uid())
);
CREATE POLICY reel_comment_likes_select ON public.reel_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY reel_comment_likes_own ON public.reel_comment_likes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_reel_comment_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
    UPDATE public.reel_comments SET likes_count = likes_count WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reels SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.reel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE OR REPLACE FUNCTION public.update_reel_comment_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.reel_comments SET likes_count = GREATEST(likes_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END, 0)
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.comment_id ELSE OLD.comment_id END;
  RETURN CASE WHEN TG_OP = 'INSERT' THEN NEW ELSE OLD END;
END;
$$;
DROP TRIGGER IF EXISTS reel_comments_count_trigger ON public.reel_comments;
CREATE TRIGGER reel_comments_count_trigger AFTER INSERT OR DELETE ON public.reel_comments FOR EACH ROW EXECUTE FUNCTION public.update_reel_comment_counts();
DROP TRIGGER IF EXISTS reel_comment_likes_count_trigger ON public.reel_comment_likes;
CREATE TRIGGER reel_comment_likes_count_trigger AFTER INSERT OR DELETE ON public.reel_comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_reel_comment_like_count();