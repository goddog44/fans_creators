import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BadgeCheck, Users, Star, Calendar, Link2, Heart, Share2, MoreHorizontal, Lock, DollarSign, MessageCircle } from 'lucide-react';
import { RoleShell } from '@/components/layout/RoleShell';
import { StoryViewer } from '@/components/shared/StoryViewer';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, useTabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { PostCard } from '@/components/shared/PostCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { modelService, contentService, followService, storyService, subscriptionService, userService, messageService } from '@/services';
import type { Story, User, Post } from '@/types';
import { formatTimeAgo, formatDate } from '@/lib/format';

export function ModelProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [model, setModel] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { active, setActive } = useTabs('posts');
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [plan, setPlan] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [subscribing, setSubscribing] = useState(false);
  const [profileStory, setProfileStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      modelService.getById(id),
      contentService.getPostsByModel(id),
      user ? subscriptionService.isSubscribed(user.id, id) : Promise.resolve(false),
      storyService.getByModel(id),
      user ? followService.isFollowing(user.id, id) : Promise.resolve(false),
    ]).then(([m, p, subbed, stories, isFollowing]) => {
      setModel(m || null);
      setPosts(p);
      setIsSubscribed(subbed);
      setProfileStory(stories[0] || null);
      setFollowing(isFollowing);
      setLoading(false);
    });
  }, [id, user]);

  const handleSubscribe = async () => {
    if (!user || !model) return;
    setSubscribing(true);
    const price = plan === 'MONTHLY' ? model.subscriptionPrice || 0 : plan === 'QUARTERLY' ? (model.subscriptionPrice || 0) * 3 * 0.9 : (model.subscriptionPrice || 0) * 12 * 0.8;
    await subscriptionService.subscribe(user.id, model.id, plan, Number(price.toFixed(2)));
    setIsSubscribed(true);
    setSubscribing(false);
    setShowSubscribe(false);
    toast(`Subscribed to ${model.name}!`, 'success');
  };

  const handleMessage = async () => {
    if (!user || !model) return;
    try {
      const conv = await messageService.getOrCreateConversation(user.id, model.id);
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start conversation', 'error');
    }
  };

  const handleFollow = async () => {
    if (!user || !model || followBusy) return;
    setFollowBusy(true);
    try {
      setFollowing(await followService.toggle(model.id));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not update follow', 'error');
    } finally {
      setFollowBusy(false);
    }
  };

  const Shell = RoleShell;
  const replyToStory = async (text: string) => {
    if (!user || !profileStory || !model) return;
    const conversation = await messageService.getOrCreateConversation(user.id, model.id);
    await messageService.sendMessage(conversation.id, user.id, { type: 'TEXT', text: `[Story ${profileStory.id}] ${text}`, storyId: profileStory.id });
    toast('Story reply sent', 'success');
  };

  if (loading) return <Shell><LoadingState /></Shell>;
  if (!model) return <Shell><EmptyState title="Creator not found" /></Shell>;

  const planPrice = plan === 'MONTHLY' ? model.subscriptionPrice || 0 : plan === 'QUARTERLY' ? (model.subscriptionPrice || 0) * 3 * 0.9 : (model.subscriptionPrice || 0) * 12 * 0.8;

  return (
    <Shell>
      {/* Cover */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-16 bg-ink-200">
        <img src={model.cover || `https://picsum.photos/seed/${model.id}/1200/400`} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 -mt-24 sm:-mt-20 px-2 relative">
        {profileStory ? (
          <button type="button" onClick={() => setSelectedStory(profileStory)} className="rounded-full bg-gradient-to-tr from-brand-500 via-danger-500 to-accent-500 p-1" aria-label={`View ${model.name}'s story`}>
            <Avatar src={model.avatar} emoji={model.avatarEmoji} size="2xl" className="border-4 border-white rounded-full flex-shrink-0" />
          </button>
        ) : (
          <Avatar src={model.avatar} size="2xl" ring className="border-4 border-white rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 sm:pb-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink-900">{model.name}</h1>
            {model.verified && <BadgeCheck className="w-5 h-5 text-brand-500" />}
          </div>
          <p className="text-ink-500">@{model.username}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-ink-600">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {model.subscriberCount?.toLocaleString() || 0} subscribers</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {model.engagement || 0}% engagement</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {formatDate(model.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:pb-2">
          <Button variant="outline" size="md"><Share2 className="w-4 h-4" /></Button>
          {user && user.id !== model.id && (
            <Button variant="outline" size="md" onClick={handleMessage}><MessageCircle className="w-4 h-4" /></Button>
          )}
          {user && user.id !== model.id && <Button variant="outline" size="md" onClick={handleFollow} loading={followBusy}>{following ? 'Following' : 'Follow'}</Button>}
          {isSubscribed ? (
            <Button variant="outline" size="md">Subscribed</Button>
          ) : (
            <Button size="md" onClick={() => setShowSubscribe(true)}>Subscribe · ${model.subscriptionPrice}/mo</Button>
          )}
        </div>
      </div>

      {/* Bio */}
      {model.bio && (
        <p className="text-sm text-ink-700 mb-4 max-w-2xl leading-relaxed">{model.bio}</p>
      )}

      {/* Social links */}
      {model.socialLinks && model.socialLinks.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          {model.socialLinks.map((link) => (
            <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-600 transition-colors">
              <Link2 className="w-4 h-4" /> {link.platform}
            </a>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'posts', label: 'Posts', count: posts.length },
            { id: 'media', label: 'Media' },
            { id: 'about', label: 'About' },
          ]}
          active={active}
          onChange={setActive}
        />
      </div>

      {/* Tab content */}
      {active === 'posts' && (
        <div className="space-y-4 max-w-2xl">
          {posts.length === 0 ? (
            <EmptyState title="No posts yet" description="This creator hasn't posted any content" />
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} model={model} currentUser={user} isSubscribed={isSubscribed} />
            ))
          )}
        </div>
      )}

      {active === 'media' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.filter((p) => p.media).length === 0 ? (
            <EmptyState title="No media yet" />
          ) : (
            posts.filter((p) => p.media).map((post) => (
              <div key={post.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                <img src={post.media![0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {(post.visibility === 'PPV' || post.visibility === 'SUBSCRIBERS') && !isSubscribed && (
                  <div className="absolute inset-0 bg-ink-950/60 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {active === 'about' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">About {model.name}</h3>
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Username</dt><dd className="text-sm font-semibold text-ink-900">@{model.username}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Subscribers</dt><dd className="text-sm font-semibold text-ink-900">{model.subscriberCount?.toLocaleString() || 0}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Posts</dt><dd className="text-sm font-semibold text-ink-900">{model.postCount || posts.length}</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Engagement</dt><dd className="text-sm font-semibold text-ink-900">{model.engagement || 0}%</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Subscription</dt><dd className="text-sm font-semibold text-ink-900">${model.subscriptionPrice}/month</dd></div>
            <div className="flex justify-between"><dt className="text-sm text-ink-500">Joined</dt><dd className="text-sm font-semibold text-ink-900">{formatDate(model.createdAt)}</dd></div>
          </dl>
        </Card>
      )}

      {/* Subscribe Modal */}
      <Modal open={showSubscribe} onClose={() => setShowSubscribe(false)} title={`Subscribe to ${model.name}`} size="md">
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { val: 'MONTHLY' as const, label: 'Monthly', price: model.subscriptionPrice || 0, desc: 'Billed every month' },
              { val: 'QUARTERLY' as const, label: 'Quarterly', price: Number(((model.subscriptionPrice || 0) * 3 * 0.9).toFixed(2)), desc: 'Save 10%' },
              { val: 'YEARLY' as const, label: 'Yearly', price: Number(((model.subscriptionPrice || 0) * 12 * 0.8).toFixed(2)), desc: 'Save 20%' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setPlan(p.val)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  plan === p.val ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-ink-900">{p.label}</p>
                  <p className="text-xs text-ink-500">{p.desc}</p>
                </div>
                <p className="font-display font-bold text-ink-900">${p.price}</p>
              </button>
            ))}
          </div>

          <div className="p-3 bg-ink-50 rounded-xl">
            <p className="text-xs text-ink-500 mb-2">Payment method</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <div className="w-8 h-5 rounded bg-gradient-to-r from-brand-500 to-brand-700" />
              •••• 4242
            </div>
          </div>

          <Button onClick={handleSubscribe} className="w-full" size="lg" loading={subscribing}>
            Subscribe for ${planPrice.toFixed(2)}
          </Button>
          <p className="text-xs text-center text-ink-400">By subscribing, you agree to the terms. Cancel anytime.</p>
        </div>
      </Modal>
      <StoryViewer story={selectedStory} model={model} onClose={() => setSelectedStory(null)} onReply={replyToStory} />
    </Shell>
  );
}