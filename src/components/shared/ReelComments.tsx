import { useEffect, useState } from 'react';
import { Heart, Pencil, Reply, Send, Trash2, X } from 'lucide-react';
import type { ReelComment, User } from '@/types';
import { reelService } from '@/services';
import { useToast } from '@/context/ToastContext';

interface ReelCommentsProps {
  reelId: string;
  currentUser?: User | null;
  ownerId?: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

export function ReelComments({ reelId, currentUser, ownerId, onClose, onCountChange }: ReelCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string>();
  const [editing, setEditing] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void reelService.getComments(reelId).then((items) => {
      setComments(items);
      onCountChange(items.length);
    }).catch((error) => toast(error instanceof Error ? error.message : 'Could not load comments', 'error')).finally(() => setLoading(false));
  }, [reelId, onCountChange, toast]);

  const submit = async () => {
    if (!currentUser || !text.trim() || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await reelService.updateComment(editing, text.trim());
        setComments((items) => items.map((comment) => comment.id === editing ? { ...comment, text: text.trim() } : comment));
        setEditing(undefined);
      } else {
        const comment = await reelService.addComment(reelId, text.trim(), replyTo);
        setComments((items) => [...items, comment]);
        onCountChange(comments.length + 1);
        setReplyTo(undefined);
      }
      setText('');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save comment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      await reelService.deleteComment(commentId);
      setComments((items) => items.filter((comment) => comment.id !== commentId));
      onCountChange(Math.max(0, comments.length - 1));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not delete comment', 'error');
    }
  };

  const like = async (comment: ReelComment) => {
    if (!currentUser) return;
    try {
      const liked = await reelService.toggleCommentLike(comment.id);
      setComments((items) => items.map((item) => item.id === comment.id ? { ...item, likedByUser: liked, likes: Math.max(0, item.likes + (liked ? 1 : -1)) } : item));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not like comment', 'error');
    }
  };

  return (
    <section className="absolute inset-x-2 bottom-2 z-20 max-h-[62%] overflow-hidden rounded-2xl bg-white text-ink-900 shadow-2xl" aria-label="Reel comments">
      <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <h2 className="font-semibold">Comments</h2>
        <button type="button" onClick={onClose} aria-label="Close comments"><X className="h-5 w-5" /></button>
      </header>
      <div className="max-h-64 overflow-y-auto p-3">
        {loading ? <p className="py-6 text-center text-sm text-ink-500">Loading comments...</p> : comments.length === 0 ? <p className="py-6 text-center text-sm text-ink-500">No comments yet.</p> : comments.map((comment) => (
          <div key={comment.id} className={`mb-3 ${comment.parentId ? 'ml-6' : ''}`}>
            <div className="flex gap-2">
              <img src={comment.userAvatar || '/image-removebg-preview.png'} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className="min-w-0 flex-1 rounded-xl bg-ink-50 px-3 py-2">
                <p className="text-xs font-semibold">{comment.userName || 'User'}</p>
                <p className="text-sm break-words">{comment.text}</p>
              </div>
            </div>
            <div className="ml-9 mt-1 flex items-center gap-3 text-xs text-ink-500">
              <button type="button" onClick={() => void like(comment)} className={comment.likedByUser ? 'font-semibold text-brand-600' : ''}><Heart className={`mr-1 inline h-3 w-3 ${comment.likedByUser ? 'fill-current' : ''}`} />{comment.likes}</button>
              {currentUser && <button type="button" onClick={() => { setReplyTo(comment.id); setEditing(undefined); setText(''); }}><Reply className="mr-1 inline h-3 w-3" />Reply</button>}
              {(comment.userId === currentUser?.id || ownerId === currentUser?.id) && <button type="button" onClick={() => { setEditing(comment.id); setReplyTo(undefined); setText(comment.text); }} aria-label="Edit comment"><Pencil className="h-3 w-3" /></button>}
              {(comment.userId === currentUser?.id || ownerId === currentUser?.id) && <button type="button" onClick={() => void remove(comment.id)} aria-label="Delete comment"><Trash2 className="h-3 w-3 text-danger-600" /></button>}
            </div>
          </div>
        ))}
      </div>
      {currentUser && <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="border-t border-ink-100 p-3">
        {(replyTo || editing) && <div className="mb-2 flex items-center justify-between text-xs text-ink-500"><span>{editing ? 'Editing comment' : 'Replying to comment'}</span><button type="button" onClick={() => { setReplyTo(undefined); setEditing(undefined); setText(''); }}><X className="h-3 w-3" /></button></div>}
        <div className="flex gap-2"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a comment..." className="min-w-0 flex-1 rounded-full border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500" /><button type="submit" disabled={!text.trim() || saving} className="rounded-full bg-brand-500 p-2 text-white disabled:opacity-50" aria-label="Send comment"><Send className="h-4 w-4" /></button></div>
      </form>}
    </section>
  );
}
