import { useEffect, useRef, useState } from 'react';
import { Bookmark, Heart, Maximize2, MoreHorizontal, Send, Share2, Volume2, VolumeX } from 'lucide-react';
import type { Reel, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { contentService, followService, messageService, reelService, reportService } from '@/services';
import { Link, useNavigate } from 'react-router-dom';
import { profilePath, reelPath } from '@/lib/contentRoutes';

export function ReelCard({ reel, creator, currentUser }: { reel: Reel; creator?: User; currentUser?: User | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(!!reel.likedByUser);
  const [saved, setSaved] = useState(!!reel.bookmarkedByUser);
  const [muted, setMuted] = useState(true);
  const [following, setFollowing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewed, setViewed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void video.play().catch(() => {});
        if (!viewed) { setViewed(true); void reelService.countView(reel.id); }
      } else video.pause();
    }, { threshold: 0.7 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [reel.id, viewed]);

  const share = async () => {
    const url = `${window.location.origin}${reelPath(reel.id)}`;
    if (navigator.share) await navigator.share({ title: creator?.name, text: reel.caption, url }).catch(() => {});
    else await navigator.clipboard.writeText(url);
    toast('Reel link copied', 'info');
  };

  const toggleFollow = async () => { if (creator && currentUser) setFollowing(await followService.toggle(creator.id)); };
  const toggleLike = async () => { if (currentUser) setLiked(await reelService.toggleLike(reel.id)); };
  const toggleSave = async () => { if (currentUser) setSaved(await reelService.toggleBookmark(reel.id)); };
  const sendToCreator = async () => {
    if (!currentUser || !creator) return;
    const conversation = await messageService.getOrCreateConversation(currentUser.id, creator.id);
    await messageService.sendMessage(conversation.id, currentUser.id, { type: 'VIDEO', text: reel.caption, mediaUrl: reel.mediaUrl, reelId: reel.id });
    toast('Reel sent in private message', 'success');
    navigate('/messages', { state: { conversationId: conversation.id } });
  };
  const report = async () => {
    if (!currentUser) return;
    await reportService.create({ reporterId: currentUser.id, entityType: 'REEL', entityId: reel.id, reason: 'OTHER', description: 'Reported from Reel options' });
    setMenuOpen(false);
    toast('Reel reported', 'info');
  };
  const blockCreator = async () => {
    if (!creator) return;
    await contentService.blockUser(creator.id);
    setMenuOpen(false);
    toast('Creator blocked', 'info');
  };

  return <article className="relative mx-auto h-[min(78vh,760px)] w-full max-w-[430px] snap-start overflow-hidden rounded-3xl bg-black shadow-card">
    <video ref={videoRef} src={reel.mediaUrl} muted={muted} loop playsInline preload="metadata" className="h-full w-full object-cover" onClick={() => setMuted((value) => !value)} />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-28 text-white">
      <div className="pointer-events-auto flex items-center gap-3"><Link to={creator ? profilePath(creator.id) : '#'}><Avatar src={creator?.avatar || ''} size="md" /></Link><Link to={creator ? profilePath(creator.id) : '#'} className="font-semibold">{creator?.name}</Link><Button size="sm" variant="outline" onClick={toggleFollow} className="border-white/50 bg-white/10 text-white">{following ? 'Following' : 'Follow'}</Button></div>
      <p className="mt-3 text-sm">{reel.caption}</p><p className="mt-1 text-xs text-white/75">{reel.hashtags.join(' ')}</p>
    </div>
    <div className="absolute bottom-6 right-3 flex flex-col items-center gap-3 text-white"><button onClick={toggleLike} aria-label="Like Reel"><Heart className={`h-6 w-6 ${liked ? 'fill-brand-500 text-brand-500' : ''}`} /></button><button onClick={toggleSave} aria-label="Save Reel"><Bookmark className={`h-6 w-6 ${saved ? 'fill-white' : ''}`} /></button><button onClick={share} aria-label="Share Reel"><Share2 className="h-6 w-6" /></button><button onClick={sendToCreator} aria-label="Send Reel in private message"><Send className="h-6 w-6" /></button><button onClick={() => setMuted((value) => !value)} aria-label="Toggle sound">{muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}</button><button onClick={() => videoRef.current?.requestFullscreen()} aria-label="Fullscreen"><Maximize2 className="h-6 w-6" /></button><button onClick={() => setMenuOpen((value) => !value)} aria-label="Reel options"><MoreHorizontal className="h-6 w-6" /></button></div>
    {menuOpen && <div className="absolute right-12 bottom-5 z-10 w-36 rounded-xl bg-white py-1 text-sm text-ink-800 shadow-card"><button onClick={() => { setMenuOpen(false); void share(); }} className="block w-full px-3 py-2 text-left hover:bg-ink-50">Copy link</button><button onClick={() => void report()} className="block w-full px-3 py-2 text-left hover:bg-ink-50">Report</button>{creator && creator.id !== currentUser?.id && <button onClick={() => void blockCreator()} className="block w-full px-3 py-2 text-left text-danger-600 hover:bg-danger-50">Block creator</button>}</div>}
  </article>;
}