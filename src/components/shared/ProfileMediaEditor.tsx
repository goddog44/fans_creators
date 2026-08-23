import { useRef, useState } from 'react';
import { Camera, ImagePlus, UserRound } from 'lucide-react';
import type { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services';
import { useToast } from '@/context/ToastContext';

const avatarSeeds = ['sophia_lane', 'emma_rose', 'luna_sky', 'aria_moon', 'mia_stone', 'noah_lane', 'alex_river', 'jordan_wave'];

const avatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=50&backgroundColor=ffdfbf`;

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

  const chooseAvatar = async (avatar: string) => {
    setBusy('avatar');
    try {
      await userService.setAvatarUrl(user.id, avatar);
      onUpdated({ avatar, avatarEmoji: undefined });
      toast('Avatar updated');
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
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-2"><UserRound className="w-4 h-4" /> Choisir un avatar</div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {avatarSeeds.map((seed) => {
            const avatar = avatarUrl(seed);
            return <button type="button" key={seed} onClick={() => chooseAvatar(avatar)} disabled={busy === 'avatar'} className={`rounded-full p-0.5 hover:bg-brand-100 ${user.avatar === avatar ? 'bg-brand-500 ring-2 ring-brand-500 ring-offset-2' : 'bg-ink-100'}`} title={`Avatar ${seed}`} aria-label={`Choose avatar ${seed}`}><img src={avatar} alt="" className="w-full aspect-square rounded-full" /></button>;
          })}
        </div>
      </div>
    </div>
  );
}