import { useRef, useState } from 'react';
import { Camera, ImagePlus, Smile } from 'lucide-react';
import type { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services';
import { useToast } from '@/context/ToastContext';

const emojis = ['😊', '😎', '🥰', '🤩', '😇', '🫶', '🔥', '✨', '💜', '🌟', '🎨', '🎧'];

export function ProfileMediaEditor({ user, onUpdated }: { user: User; onUpdated: (updates: Partial<User>) => void }) {
  const { toast } = useToast();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'avatar' | 'cover' | null>(null);

  const upload = async (file: File | undefined, kind: 'avatar' | 'cover') => {
    if (!file) return;
    setBusy(kind);
    try {
      const url = await userService.uploadProfileImage(user.id, file, kind);
      onUpdated(kind === 'avatar' ? { avatar: url, avatarEmoji: undefined } : { cover: url });
      toast(`${kind === 'avatar' ? 'Profile photo' : 'Cover photo'} updated`);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const chooseEmoji = async (emoji: string) => {
    setBusy('avatar');
    try {
      await userService.setAvatarEmoji(user.id, emoji);
      onUpdated({ avatar: '', avatarEmoji: emoji });
      toast('Profile emoji updated');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not update emoji', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative h-32 rounded-xl overflow-hidden bg-ink-900">
        {user.cover && <img src={user.cover} alt="" className="w-full h-full object-cover" />}
        <button type="button" onClick={() => coverInput.current?.click()} className="absolute top-3 right-3 p-2 rounded-xl bg-black/45 text-white hover:bg-black/65" title="Change cover photo">
          <ImagePlus className="w-4 h-4" />
        </button>
        <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], 'cover')} />
      </div>
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} emoji={user.avatarEmoji} size="xl" ring />
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => avatarInput.current?.click()} loading={busy === 'avatar'}>
            <Camera className="w-4 h-4" /> Photo de profil
          </Button>
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], 'avatar')} />
          <p className="text-xs text-ink-500 mt-2">JPG, PNG ou WEBP, 5 MB maximum</p>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-2"><Smile className="w-4 h-4" /> Choisir un emoji</div>
        <div className="flex flex-wrap gap-2">
          {emojis.map((emoji) => <button type="button" key={emoji} onClick={() => chooseEmoji(emoji)} className={`w-10 h-10 rounded-xl text-xl hover:bg-brand-50 ${user.avatarEmoji === emoji ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-ink-100'}`}>{emoji}</button>)}
        </div>
      </div>
    </div>
  );
}