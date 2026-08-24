import { Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Story, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface StoryViewerProps {
  story: Story | null;
  model?: User;
  onClose: () => void;
  onReply?: (text: string, story: Story) => Promise<void>;
  stories?: Story[];
  models?: Record<string, User>;
  onSeen?: (story: Story) => void;
}

export function StoryViewer({ story, model, onClose, onReply, stories = [], models = {}, onSeen }: StoryViewerProps) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const sequence = story ? (stories.length > 0 ? stories : [story]) : [];
  const [index, setIndex] = useState(0);
  const currentStory = sequence[index] || story;
  const currentModel = currentStory ? (models[currentStory.modelId] || model) : undefined;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!story) return;
    setIndex(Math.max(0, sequence.findIndex((item) => item.id === story.id)));
  }, [sequence, story]);
  useEffect(() => {
    if (!currentStory) return;
    onSeen?.(currentStory);
    if (currentStory.mediaType !== 'VIDEO') {
      const timer = window.setTimeout(() => setIndex((value) => value + 1), 6000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [currentStory, onSeen]);
  useEffect(() => { if (index >= sequence.length) onClose(); }, [index, sequence.length, onClose]);

  const submitReply = async () => {
    if (!onReply || !reply.trim() || sending) return;
    setSending(true);
    try { await onReply(reply.trim(), currentStory); setReply(''); } finally { setSending(false); }
  };

  const goPrevious = () => setIndex((value) => value > 0 ? value - 1 : value);
  const goNext = () => setIndex((value) => value + 1);
  if (!currentStory || !currentModel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" role="dialog" aria-modal="true" aria-label={`${currentModel.name}'s story`}>
      <div className="relative flex h-[min(720px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-ink-900 shadow-2xl">
        <div className="absolute left-4 right-4 top-4 z-10 h-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-full origin-left animate-[story-progress_6s_linear_forwards] bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between p-5 pt-8 text-white">
          <div className="flex items-center gap-3">
            <Avatar src={currentModel.avatar} emoji={currentModel.avatarEmoji} size="sm" ring />
            <div>
              <p className="text-sm font-semibold">{currentModel.name}</p>
              <p className="text-xs text-white/60">@{currentModel.username}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close story">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex flex-1 items-center justify-center p-8 text-center" style={!currentStory.mediaUrl ? { background: currentStory.background } : undefined}>
          <button type="button" onClick={goPrevious} className="absolute inset-y-0 left-0 z-10 w-1/3" aria-label="Previous story" />
          <button type="button" onClick={goNext} className="absolute inset-y-0 right-0 z-10 w-1/3" aria-label="Next story" />
          {currentStory.mediaUrl ? (currentStory.mediaType === 'VIDEO' ? (
            <video ref={videoRef} src={currentStory.mediaUrl} autoPlay controls playsInline onEnded={goNext} className="max-h-full max-w-full rounded-2xl object-contain" />
          ) : (
            <img src={currentStory.mediaUrl} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
          )) : (
            <p className={`whitespace-pre-wrap text-xl font-medium leading-relaxed ${currentStory.background === '#f8fafc' ? 'text-ink-900' : 'text-white'}`}>{currentStory.text}</p>
          )}
          {currentStory.mediaUrl && currentStory.text && <p className="absolute bottom-8 left-8 right-8 rounded-xl bg-black/55 p-3 text-center text-base text-white">{currentStory.text}</p>}
        </div>
        {onReply && <form onSubmit={(event) => { event.preventDefault(); void submitReply(); }} className="flex gap-2 border-t border-white/10 bg-ink-950/80 p-4"><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this story..." className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none" /><button type="submit" disabled={!reply.trim() || sending} className="rounded-full bg-brand-500 p-2 text-white disabled:opacity-50" aria-label="Send story reply"><Send className="h-4 w-4" /></button></form>}
      </div>
    </div>
  );
}
