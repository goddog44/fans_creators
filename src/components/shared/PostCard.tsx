import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, DollarSign, Lock, MoreHorizontal, BadgeCheck } from 'lucide-react';
import type { Post, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { contentService, subscriptionService } from '@/services';
import { formatTimeAgo } from '@/lib/format';

interface PostCardProps {
  post: Post;
  model?: User;
  currentUser?: User | null;
  isSubscribed?: boolean;
  onUnlock?: (post: Post) => void;
}

export function PostCard({ post, model, currentUser, isSubscribed, onUnlock }: PostCardProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [showShare, setShowShare] = useState(false);

  const isLocked = (post.visibility === 'PPV' || post.visibility === 'SUBSCRIBERS') && !isSubscribed;

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    await contentService.likePost(post.id);
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    await contentService.bookmarkPost(post.id);
    toast(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await contentService.addComment(post.id, currentUser?.id || 'u-user-1', commentText);
    setCommentText('');
    toast('Comment posted');
  };

  const handleTip = async () => {
    setShowTip(false);
    toast(`$${tipAmount} tip sent to ${model?.name}!`, 'success');
  };

  const handleShare = () => {
    setShowShare(false);
    toast('Link copied to clipboard', 'info');
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-200/60 shadow-soft overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/model/${post.modelId}`} className="flex items-center gap-3">
          <Avatar src={model?.avatar || ''} size="md" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-ink-900 text-sm">{model?.name}</span>
              {model?.verified && <BadgeCheck className="w-4 h-4 text-brand-500" />}
            </div>
            <p className="text-xs text-ink-500">@{model?.username} · {formatTimeAgo(post.createdAt)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {post.visibility === 'PPV' && <Badge tone="brand"><DollarSign className="w-3 h-3" /> ${post.price}</Badge>}
          {post.visibility === 'SUBSCRIBERS' && <Badge tone="info">Subscribers</Badge>}
          <button className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-ink-400" />
          </button>
        </div>
      </div>

      {/* Text */}
      {post.text && <p className="px-4 pb-3 text-sm text-ink-800 leading-relaxed">{post.text}</p>}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="relative">
          {isLocked ? (
            <div className="relative aspect-[4/3] bg-ink-900 flex flex-col items-center justify-center">
              <img src={post.media[0].thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
              <div className="relative z-10 text-center px-6">
                <Lock className="w-10 h-10 text-white/80 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">
                  {post.visibility === 'PPV' ? `Unlock for $${post.price}` : 'Subscribers only'}
                </p>
                <p className="text-white/60 text-xs mb-4">Subscribe to {model?.name} to view this content</p>
                <Button size="sm" onClick={() => onUnlock?.(post)}>
                  {post.visibility === 'PPV' ? `Unlock for $${post.price}` : 'Subscribe'}
                </Button>
              </div>
            </div>
          ) : (
            <img src={post.media[0].url} alt="" className="w-full max-h-[600px] object-cover" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-600 transition-colors">
            <Heart className={`w-5 h-5 ${liked ? 'fill-brand-500 text-brand-500' : ''}`} />
            {likeCount}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors">
            <MessageCircle className="w-5 h-5" />
            {post.comments.length}
          </button>
          <button onClick={() => setShowShare(true)} className="text-ink-600 hover:text-ink-900 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTip(true)} className="flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-success-600 transition-colors">
            <DollarSign className="w-4 h-4" />
            Tip
          </button>
          <button onClick={handleBookmark} className="text-ink-600 hover:text-ink-900 transition-colors">
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-ink-900 text-ink-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-ink-100 pt-3 space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`} size="sm" />
              <div className="flex-1 bg-ink-50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-ink-700">{c.userId === 'u-user-1' ? 'You' : 'User'}</p>
                <p className="text-sm text-ink-800">{c.text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Avatar src={currentUser?.avatar || ''} size="sm" />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-ink-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>
      )}

      {/* Tip Modal */}
      <Modal open={showTip} onClose={() => setShowTip(false)} title={`Tip ${model?.name}`} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[2, 5, 10, 15, 25, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => setTipAmount(amt)}
                className={`h-12 rounded-xl font-semibold text-sm transition-all ${
                  tipAmount === amt ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Custom amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">$</span>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(Number(e.target.value))}
                className="w-full h-10 pl-7 pr-3 rounded-xl border border-ink-300 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>
          <Button onClick={handleTip} className="w-full" size="lg">Send ${tipAmount} Tip</Button>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Share" size="sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-ink-50 rounded-xl">
            <input readOnly value={`creatorhub.com/post/${post.id}`} className="flex-1 bg-transparent text-sm outline-none text-ink-600" />
            <Button size="sm" onClick={handleShare}>Copy</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
