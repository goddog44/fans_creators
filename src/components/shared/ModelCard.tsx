import { Link } from 'react-router-dom';
import { Users, BadgeCheck, Star } from 'lucide-react';
import type { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ModelCardProps {
  model: User;
  onSubscribe?: (model: User) => void;
  isSubscribed?: boolean;
}

export function ModelCard({ model, onSubscribe, isSubscribed }: ModelCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-200/60 shadow-soft overflow-hidden group hover:shadow-card transition-all duration-300">
      {/* Cover */}
      <Link to={`/model/${model.id}`} className="block relative h-28 overflow-hidden">
        <img src={model.cover || `https://picsum.photos/seed/${model.id}/600/200`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </Link>

      {/* Avatar + Info */}
      <div className="px-4 pb-4 -mt-10 relative">
        <Link to={`/model/${model.id}`}>
          <Avatar src={model.avatar} size="xl" ring className="border-4 border-white rounded-full" />
        </Link>
        <div className="mt-3">
          <Link to={`/model/${model.id}`}>
            <div className="flex items-center gap-1">
              <h3 className="font-display font-bold text-ink-900">{model.name}</h3>
              {model.verified && <BadgeCheck className="w-4 h-4 text-brand-500" />}
            </div>
          </Link>
          <p className="text-sm text-ink-500">@{model.username}</p>
          <p className="text-sm text-ink-600 mt-2 line-clamp-2 leading-relaxed">{model.bio}</p>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {model.subscriberCount?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {model.engagement || 0}% eng.
          </span>
        </div>

        <div className="mt-4">
          {isSubscribed ? (
            <Button variant="outline" className="w-full" size="sm">Subscribed</Button>
          ) : (
            <Button
              className="w-full"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onSubscribe?.(model);
              }}
            >
              Subscribe · ${model.subscriptionPrice}/mo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
