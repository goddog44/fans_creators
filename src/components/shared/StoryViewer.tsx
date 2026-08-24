import { X } from 'lucide-react';
import type { Story, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface StoryViewerProps {
  story: Story | null;
  model?: User;
  onClose: () => void;
}

export function StoryViewer({ story, model, onClose }: StoryViewerProps) {
  if (!story || !model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" role="dialog" aria-modal="true" aria-label={`${model.name}'s story`}>
      <div className="relative flex h-[min(720px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-ink-900 shadow-2xl">
        <div className="absolute left-4 right-4 top-4 z-10 h-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-full origin-left animate-[story-progress_6s_linear_forwards] bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between p-5 pt-8 text-white">
          <div className="flex items-center gap-3">
            <Avatar src={model.avatar} emoji={model.avatarEmoji} size="sm" ring />
            <div>
              <p className="text-sm font-semibold">{model.name}</p>
              <p className="text-xs text-white/60">@{model.username}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close story">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <p className="whitespace-pre-wrap text-xl font-medium leading-relaxed text-white">{story.text}</p>
        </div>
      </div>
    </div>
  );
}
