ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS duration_hours integer NOT NULL DEFAULT 6
  CHECK (duration_hours BETWEEN 1 AND 24);

ALTER TABLE public.stories
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '6 hours');

CREATE OR REPLACE FUNCTION public.set_story_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.duration_hours := LEAST(24, GREATEST(1, COALESCE(NEW.duration_hours, 6)));
  NEW.expires_at := COALESCE(NEW.created_at, now()) + make_interval(hours => NEW.duration_hours);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_set_expiration ON public.stories;
CREATE TRIGGER stories_set_expiration
  BEFORE INSERT OR UPDATE OF created_at, duration_hours ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_expiration();