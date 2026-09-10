ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.live_viewers (
  live_stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (live_stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.live_likes (
  live_stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (live_stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(trim(text)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_viewers_last_seen ON public.live_viewers(live_stream_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_live_messages_stream_created ON public.live_messages(live_stream_id, created_at);

ALTER TABLE public.live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_viewers_select_active ON public.live_viewers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.live_streams WHERE id = live_stream_id AND status = 'LIVE')
);
CREATE POLICY live_likes_select_active ON public.live_likes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.live_streams WHERE id = live_stream_id AND status = 'LIVE')
);
CREATE POLICY live_likes_insert_own ON public.live_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY live_likes_delete_own ON public.live_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY live_messages_select_active ON public.live_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.live_streams WHERE id = live_stream_id AND status = 'LIVE')
);
CREATE POLICY live_messages_insert_own ON public.live_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_live_viewer_count(target_live_stream_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE active_count integer;
BEGIN
  DELETE FROM public.live_viewers
  WHERE live_stream_id = target_live_stream_id
    AND last_seen_at < now() - interval '45 seconds';
  SELECT count(*)::integer INTO active_count FROM public.live_viewers WHERE live_stream_id = target_live_stream_id;
  UPDATE public.live_streams SET viewer_count = active_count WHERE id = target_live_stream_id AND status = 'LIVE';
  RETURN active_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_live_stream(target_live_stream_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.live_streams WHERE id = target_live_stream_id AND status = 'LIVE') THEN
    RAISE EXCEPTION 'Live stream is not active';
  END IF;
  INSERT INTO public.live_viewers (live_stream_id, user_id, last_seen_at)
  VALUES (target_live_stream_id, auth.uid(), now())
  ON CONFLICT (live_stream_id, user_id) DO UPDATE SET last_seen_at = now();
  RETURN public.refresh_live_viewer_count(target_live_stream_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_live_stream(target_live_stream_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.live_viewers SET last_seen_at = now()
  WHERE live_stream_id = target_live_stream_id AND user_id = auth.uid();
  RETURN public.refresh_live_viewer_count(target_live_stream_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_live_stream(target_live_stream_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.live_viewers WHERE live_stream_id = target_live_stream_id AND user_id = auth.uid();
  RETURN public.refresh_live_viewer_count(target_live_stream_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_live_like(target_live_stream_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE liked_now boolean;
DECLARE total_likes integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.live_likes WHERE live_stream_id = target_live_stream_id AND user_id = auth.uid()) THEN
    DELETE FROM public.live_likes WHERE live_stream_id = target_live_stream_id AND user_id = auth.uid();
    liked_now := false;
  ELSE
    INSERT INTO public.live_likes (live_stream_id, user_id) VALUES (target_live_stream_id, auth.uid());
    liked_now := true;
  END IF;
  SELECT count(*)::integer INTO total_likes FROM public.live_likes WHERE live_stream_id = target_live_stream_id;
  UPDATE public.live_streams SET likes_count = total_likes WHERE id = target_live_stream_id;
  RETURN json_build_object('liked', liked_now, 'count', total_likes);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_live_engagement(target_live_stream_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total_likes integer;
DECLARE user_liked boolean;
DECLARE active_viewers integer;
BEGIN
  SELECT count(*)::integer INTO total_likes FROM public.live_likes WHERE live_stream_id = target_live_stream_id;
  SELECT EXISTS (SELECT 1 FROM public.live_likes WHERE live_stream_id = target_live_stream_id AND user_id = auth.uid()) INTO user_liked;
  active_viewers := public.refresh_live_viewer_count(target_live_stream_id);
  RETURN json_build_object('likes_count', total_likes, 'liked', user_liked, 'viewer_count', active_viewers);
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_streams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
  END IF;
END $$;
