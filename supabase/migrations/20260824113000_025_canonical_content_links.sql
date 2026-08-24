UPDATE public.notifications
SET link = replace(link, '/reels/', '/reel/')
WHERE link LIKE '/reels/%';
