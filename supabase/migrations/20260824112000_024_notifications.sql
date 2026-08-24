-- Notification types, database producers, and realtime publication.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'FOLLOW';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'UNFOLLOW';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'POST_LIKE';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'REEL_LIKE';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'POST_COMMENT';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'REEL_COMMENT';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'COMMENT_REPLY';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'STORY_REPLY';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'NEW_STORY';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'PPV_RECEIVED';

CREATE OR REPLACE FUNCTION public.create_notification(
  recipient_id uuid,
  notification_kind public.notification_type,
  notification_title text,
  notification_body text DEFAULT NULL,
  notification_link text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT recipient_id, notification_kind, notification_title, notification_body, notification_link
  WHERE recipient_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, public.notification_type, text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  actor_name text;
BEGIN
  SELECT p.model_id, actor.name INTO owner_id, actor_name
  FROM public.posts p
  JOIN public.profiles actor ON actor.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    PERFORM public.create_notification(owner_id, 'POST_LIKE', actor_name || ' liked your post', COALESCE((SELECT text FROM public.posts WHERE id = NEW.post_id), ''), '/post/' || NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  actor_name text;
BEGIN
  SELECT p.model_id, actor.name INTO owner_id, actor_name
  FROM public.posts p
  JOIN public.profiles actor ON actor.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    PERFORM public.create_notification(owner_id, 'POST_COMMENT', actor_name || ' commented on your post', NEW.text, '/post/' || NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT name INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
  PERFORM public.create_notification(NEW.following_id, 'FOLLOW', actor_name || ' started following you', NULL, '/profile');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_reel_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  actor_name text;
BEGIN
  SELECT r.model_id, actor.name INTO owner_id, actor_name
  FROM public.reels r
  JOIN public.profiles actor ON actor.id = NEW.user_id
  WHERE r.id = NEW.reel_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    PERFORM public.create_notification(owner_id, 'REEL_LIKE', actor_name || ' liked your Reel', COALESCE((SELECT caption FROM public.reels WHERE id = NEW.reel_id), ''), '/reels/' || NEW.reel_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  actor_name text;
  notification_kind public.notification_type := 'NEW_MESSAGE';
  notification_title text;
BEGIN
  SELECT name INTO actor_name FROM public.profiles WHERE id = NEW.sender_id;
  IF NEW.story_id IS NOT NULL THEN
    notification_kind := 'STORY_REPLY';
    notification_title := actor_name || ' replied to your Story';
  ELSE
    notification_title := actor_name || ' sent you a message';
  END IF;

  FOREACH recipient_id IN ARRAY (SELECT participant_ids FROM public.conversations WHERE id = NEW.conversation_id)
  LOOP
    IF recipient_id <> NEW.sender_id THEN
      PERFORM public.create_notification(recipient_id, notification_kind, notification_title, NEW.text, '/messages?conversationId=' || NEW.conversation_id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscriber_name text;
  model_name text;
BEGIN
  SELECT name INTO subscriber_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT name INTO model_name FROM public.profiles WHERE id = NEW.model_id;
  IF NEW.user_id <> NEW.model_id THEN
    PERFORM public.create_notification(NEW.model_id, 'NEW_SUBSCRIBER', subscriber_name || ' subscribed to you', NULL, '/model/subscribers');
    PERFORM public.create_notification(NEW.user_id, 'SUBSCRIPTION_CONFIRMED', 'Subscription confirmed', 'You subscribed to ' || model_name, '/subscriptions');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_name text;
  model_name text;
BEGIN
  IF NEW.status <> 'COMPLETED' THEN RETURN NEW; END IF;
  SELECT name INTO buyer_name FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.model_id IS NOT NULL THEN
    SELECT name INTO model_name FROM public.profiles WHERE id = NEW.model_id;
    IF NEW.type = 'TIP' AND NEW.user_id <> NEW.model_id THEN
      PERFORM public.create_notification(NEW.model_id, 'TIP_RECEIVED', buyer_name || ' sent you a tip', NEW.description, '/model/earnings');
    ELSIF NEW.type = 'PPV' AND NEW.user_id <> NEW.model_id THEN
      PERFORM public.create_notification(NEW.model_id, 'PPV_RECEIVED', buyer_name || ' unlocked your content', NEW.description, '/model/earnings');
      PERFORM public.create_notification(NEW.user_id, 'PPV_PURCHASE', 'Content unlocked', 'You unlocked content from ' || model_name, '/payments');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_story()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_id uuid;
  model_name text;
BEGIN
  SELECT name INTO model_name FROM public.profiles WHERE id = NEW.model_id;
  FOR follower_id IN SELECT f.follower_id FROM public.follows f WHERE f.following_id = NEW.model_id
  LOOP
    PERFORM public.create_notification(follower_id, 'NEW_STORY', model_name || ' posted a new Story', NEW.text, '/home');
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_post_like ON public.likes;
CREATE TRIGGER notifications_post_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();
DROP TRIGGER IF EXISTS notifications_post_comment ON public.comments;
CREATE TRIGGER notifications_post_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();
DROP TRIGGER IF EXISTS notifications_follow ON public.follows;
CREATE TRIGGER notifications_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_follow();
DROP TRIGGER IF EXISTS notifications_reel_like ON public.reel_likes;
CREATE TRIGGER notifications_reel_like AFTER INSERT ON public.reel_likes FOR EACH ROW EXECUTE FUNCTION public.notify_reel_like();
DROP TRIGGER IF EXISTS notifications_message ON public.messages;
CREATE TRIGGER notifications_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();
DROP TRIGGER IF EXISTS notifications_subscription ON public.subscriptions;
CREATE TRIGGER notifications_subscription AFTER INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.notify_subscription();
DROP TRIGGER IF EXISTS notifications_transaction ON public.transactions;
CREATE TRIGGER notifications_transaction AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_transaction();
DROP TRIGGER IF EXISTS notifications_new_story ON public.stories;
CREATE TRIGGER notifications_new_story AFTER INSERT ON public.stories FOR EACH ROW EXECUTE FUNCTION public.notify_new_story();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
