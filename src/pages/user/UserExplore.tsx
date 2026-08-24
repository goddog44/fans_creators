import { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Star } from 'lucide-react';
import { RoleShell } from '@/components/layout/RoleShell';
import { ModelCard } from '@/components/shared/ModelCard';
import { Input } from '@/components/ui/Input';
import { Tabs, useTabs } from '@/components/ui/Tabs';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { modelService } from '@/services';
import type { User } from '@/types';

export function UserExplore() {
  const [trending, setTrending] = useState<User[]>([]);
  const [newest, setNewest] = useState<User[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { active, setActive } = useTabs('trending');

  useEffect(() => {
    Promise.all([modelService.getTrending(), modelService.getNewest()]).then(([t, n]) => {
      setTrending(t);
      setNewest(n);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (query.trim()) {
      modelService.search(query).then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);

  const display = query.trim() ? results : active === 'trending' ? trending : newest;

  return (
    <RoleShell>
      <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Explore Creators</h1>
      <p className="text-ink-500 mb-6">Discover and subscribe to amazing creators</p>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search creators..." className="pl-10" />
      </div>

      {!query.trim() && (
        <div className="mb-6">
          <Tabs
            tabs={[
              { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
            ]}
            active={active}
            onChange={setActive}
            variant="pills"
          />
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : display.length === 0 ? (
        <EmptyState title="No creators found" description="Try a different search" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map((m) => (
            <ModelCard key={m.id} model={m} />
          ))}
        </div>
      )}
    </RoleShell>
  );
}
