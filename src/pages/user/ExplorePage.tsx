import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { modelService } from '@/services';
import type { User } from '@/types';
import { ModelCard } from '@/components/shared/ModelCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, useTabs } from '@/components/ui/Tabs';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';

export function ExplorePage() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<User[]>([]);
  const [newest, setNewest] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
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
      modelService.search(query).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const display = query.trim() ? searchResults : active === 'trending' ? trending : newest;

  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg text-ink-900">CreatorHub</span>
          </Link>

          {user ? (
            <Link
              to={user.role === 'USER' ? '/feed' : '/dashboard'}
              className="flex items-center gap-2"
            >
              <Avatar src={user.avatar} size="sm" />
              <span className="text-sm font-semibold text-ink-900">{user.name}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-2">Explore Creators</h1>
        <p className="text-ink-500 mb-6">Discover amazing creators to subscribe to</p>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search creators by name, username, or bio..." className="pl-10" />
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
          <EmptyState title="No creators found" description="Try a different search term" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {display.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}