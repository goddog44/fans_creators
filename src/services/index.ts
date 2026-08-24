import type {
  User,
  Post,
  Comment as PostComment,
  PostMedia,
  Subscription,
  Conversation,
  Message,
  Transaction,
  Payout,
  Notification,
  Report,
  AuditLog,
  Role,
  ContentStatus,
  Visibility,
  Story,
  Reel,
} from '@/types';
import { supabase } from '@/lib/supabase';

// Helper to map database rows to User type
const mapProfile = (row: any): User => ({
  id: row.id,
  email: row.email,
  password: '', // Never expose password from database
  role: row.role,
  name: row.name,
  username: row.username,
  avatar: row.avatar_url || (row.avatar_emoji ? `emoji:${row.avatar_emoji}` : ''),
  avatarEmoji: row.avatar_emoji || undefined,
  cover: row.cover_url,
  bio: row.bio,
  status: row.status,
  verified: row.verified,
  managerId: row.manager_id,
  socialLinks: row.social_links || [],
  subscriptionPrice: row.subscription_price,
  createdAt: row.created_at,
  lastActive: row.last_active,
  subscriberCount: row.subscriber_count,
  postCount: row.post_count,
  engagement: row.engagement,
  revenue: row.revenue,
});

// Helper to map database rows to Post type
const postMediaUrl = (path: string) => supabase.storage.from('post-media').getPublicUrl(path).data.publicUrl;
const isAbsoluteUrl = (value: unknown): value is string => typeof value === 'string' && /^https?:\/\//i.test(value);

const mapPost = (row: any): Post => ({
  id: row.id,
  modelId: row.model_id,
  text: row.text || '',
  media: (row.post_media?.length ? row.post_media : (row.media || []).map((media: any, position: number) => ({
    id: `${row.id}-legacy-${position}`,
    media_type: media.type,
    legacy_url: media.url,
    legacy_thumbnail: media.thumbnail,
    position,
  }))).sort((a: any, b: any) => a.position - b.position).map((media: any): PostMedia => ({
    id: media.id,
    type: media.media_type,
    url: media.legacy_url || (isAbsoluteUrl(media.storage_path) ? media.storage_path : postMediaUrl(media.storage_path)),
    thumbnail: media.legacy_thumbnail || (media.thumbnail_path ? (isAbsoluteUrl(media.thumbnail_path) ? media.thumbnail_path : postMediaUrl(media.thumbnail_path)) : undefined),
    storagePath: isAbsoluteUrl(media.storage_path) ? undefined : media.storage_path,
    thumbnailPath: media.thumbnail_path || undefined,
    position: media.position,
    duration: media.duration || undefined,
  })),
  visibility: row.visibility,
  price: row.price,
  status: row.status,
  likes: row.likes_count || 0,
  comments: [], // Loaded on demand via contentService.getComments()
  bookmarks: row.bookmarks_count || 0,
  tips: row.tips_count || 0,
  createdAt: row.created_at,
  scheduledAt: row.scheduled_at,
  likedByUser: false,
  bookmarkedByUser: false,
});

const withMediaUrls = async (posts: Post[]): Promise<Post[]> => Promise.all(posts.map(async (post) => {
  const media = await Promise.all((post.media || []).map(async (item) => {
    if (!item.storagePath) return item;
    const { data, error } = await supabase.storage.from('post-media').createSignedUrl(item.storagePath, 3600);
    if (error) throw new Error(`Media access failed: ${error.message}`);
    return { ...item, url: data.signedUrl };
  }));
  return { ...post, media };
}));

// Enriches a list of posts with the current user's like/bookmark state.
// Call this after any bulk post fetch that will be rendered with PostCard.
const withUserInteractions = async (posts: Post[]): Promise<Post[]> => {
  if (posts.length === 0) return posts;
  const { likedIds, bookmarkedIds } = await contentService.getUserInteractions(posts.map((p) => p.id));
  return posts.map((p) => ({
    ...p,
    likedByUser: likedIds.has(p.id),
    bookmarkedByUser: bookmarkedIds.has(p.id),
  }));
};

// --- Auth Service ---
export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');

    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error('User profile not found');

    if (profile.status === 'SUSPENDED') throw new Error('Account suspended. Contact support.');
    if (profile.status === 'BLOCKED') throw new Error('Account blocked.');

    return mapProfile(profile);
  },

  async register(data: { name: string; email: string; password: string; role: Role }): Promise<User | null> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          username: data.email.split('@')[0],
          role: data.role,
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Registration failed');

    // The trigger creates the profile. Without an email-confirmation session,
    // RLS correctly prevents the client from reading it until confirmation.
    if (!authData.session) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error('User profile was not created by the database trigger');

    return mapProfile(profile);
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return this.getUserProfile(data.user.id);
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return profile ? mapProfile(profile) : null;
  },

  async setCurrentUser(user: User | null) {
    // This is handled by Supabase Auth session management in the app
  },

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  // Real Supabase recovery flow: the link the user clicks from their email
  // establishes a PASSWORD_RECOVERY session (handled by onAuthStateChange in
  // ResetPasswordPage). By the time this is called there must already be a
  // valid recovery session — no token is passed around by the frontend.
  async resetPassword(password: string): Promise<void> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Your password reset link has expired. Please request a new one.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
};

// --- User Service ---
export const userService = {
  async uploadProfileImage(userId: string, file: File, kind: 'avatar' | 'cover'): Promise<string> {
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image must be smaller than 5 MB');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${kind}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('profile-media').upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
    const updates = kind === 'avatar' ? { avatar: data.publicUrl, avatarEmoji: undefined } : { cover: data.publicUrl };
    const profile = await this.updateProfile(userId, updates);
    return kind === 'avatar' ? profile.avatar : profile.cover || data.publicUrl;
  },

  async setAvatarUrl(userId: string, avatar: string): Promise<User> {
    return this.updateProfile(userId, { avatar, avatarEmoji: undefined });
  },

  async getById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return undefined;
    return data ? mapProfile(data) : undefined;
  },

  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async getByRole(role: Role): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', role);
    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        bio: updates.bio,
        avatar_url: updates.avatar,
        avatar_emoji: updates.avatarEmoji,
        cover_url: updates.cover,
        social_links: updates.socialLinks,
        subscription_price: updates.subscriptionPrice,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapProfile(data);
  },

  async setStatus(id: string, status: User['status']): Promise<User> {
    const { data, error } = await supabase.rpc('admin_set_user_status', {
      target_user_id: id,
      new_status: status,
    });

    if (error) throw new Error(error.message);
    return mapProfile(data);
  },

  async setVerified(id: string, verified: boolean): Promise<User> {
    const { data, error } = await supabase.rpc('admin_set_verified', {
      target_user_id: id,
      is_verified: verified,
    });

    if (error) throw new Error(error.message);
    return mapProfile(data);
  },

  async assignManager(modelId: string, managerId: string): Promise<User> {
    const { data, error } = await supabase.rpc('admin_assign_manager', {
      target_model_id: modelId,
      manager_id: managerId,
    });

    if (error) throw new Error(error.message);
    return mapProfile(data);
  },
};

// --- Manager Service ---
export const managerService = {
  async getModelsByManager(managerId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId)
      .eq('role', 'MODEL');

    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async getManagerStats(managerId: string) {
    const { data: models, error: modelsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId)
      .eq('role', 'MODEL');

    if (modelsError) throw new Error(modelsError.message);

    const modelIds = (models || []).map((m) => m.id);
    if (modelIds.length === 0) {
      return {
        totalModels: 0,
        totalSubscribers: 0,
        revenue: 0,
        monthlyRevenue: 0,
        ppvRevenue: 0,
        tipRevenue: 0,
        subscriptionRevenue: 0,
        newSubscribers: 0,
      };
    }

    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .in('model_id', modelIds)
      .eq('status', 'ACTIVE');

    const { data: txns, error: txnsError } = await supabase
      .from('transactions')
      .select('*')
      .in('model_id', modelIds)
      .eq('status', 'COMPLETED');

    if (subsError || txnsError) throw new Error('Failed to fetch stats');

    const revenue = (txns || []).reduce((sum, t) => sum + Number(t.amount), 0);
    const ppvRev = (txns || [])
      .filter((t) => t.type === 'PPV')
      .reduce((s, t) => s + Number(t.amount), 0);
    const tipRev = (txns || [])
      .filter((t) => t.type === 'TIP')
      .reduce((s, t) => s + Number(t.amount), 0);
    const subRev = (txns || [])
      .filter((t) => t.type === 'SUBSCRIPTION')
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      totalModels: models?.length || 0,
      totalSubscribers: subs?.length || 0,
      revenue,
      monthlyRevenue: revenue * 0.3,
      ppvRevenue: ppvRev,
      tipRevenue: tipRev,
      subscriptionRevenue: subRev,
      newSubscribers: (subs || []).filter((s) => {
        const created = new Date(s.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        return created > thirtyDaysAgo;
      }).length,
    };
  },
};

// --- Model Service ---
export const modelService = {
  async getById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'MODEL')
      .single();

    if (error) return undefined;
    return data ? mapProfile(data) : undefined;
  },

  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'MODEL');
    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async getTrending(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'MODEL')
      .order('subscriber_count', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async getNewest(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'MODEL')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async search(query: string): Promise<User[]> {
    const q = query.toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'MODEL')
      .or(`name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%`);

    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  },

  async getStats(modelId: string) {
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('model_id', modelId)
      .eq('status', 'ACTIVE');

    const { data: txns, error: txnsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('model_id', modelId)
      .eq('status', 'COMPLETED');

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('model_id', modelId);

    if (subsError || txnsError || postsError) throw new Error('Failed to fetch stats');

    const revenue = (txns || []).reduce((s, t) => s + Number(t.amount), 0);
    const ppvRev = (txns || [])
      .filter((t) => t.type === 'PPV')
      .reduce((s, t) => s + Number(t.amount), 0);
    const tipRev = (txns || [])
      .filter((t) => t.type === 'TIP')
      .reduce((s, t) => s + Number(t.amount), 0);
    const subRev = (txns || [])
      .filter((t) => t.type === 'SUBSCRIPTION')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalLikes = (posts || []).reduce((s, p) => s + Number(p.likes_count || 0), 0);

    return {
      totalEarnings: revenue,
      availableBalance: revenue * 0.8,
      pendingBalance: revenue * 0.2,
      subscribers: subs?.length || 0,
      newSubscribers: (subs || []).filter((s) => {
        const created = new Date(s.created_at);
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        return created > sevenDaysAgo;
      }).length,
      engagement: (posts || []).length ? (totalLikes / (posts.length || 1)).toFixed(1) : '0',
      ppvRevenue: ppvRev,
      tipRevenue: tipRev,
      subscriptionRevenue: subRev,
      postCount: posts?.length || 0,
    };
  },
};

// --- Content Service ---
export const contentService = {
  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_media(*)')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return withUserInteractions(await withMediaUrls((data || []).map(mapPost)));
  },

  async getPostsByModel(modelId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_media(*)')
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return withUserInteractions(await withMediaUrls((data || []).map(mapPost)));
  },

  async getFeedPosts(userId: string, page = 0, pageSize = 8): Promise<Post[]> {
    const [{ data: subs }, { data: hidden }, { data: blocked }] = await Promise.all([
      supabase.from('subscriptions').select('model_id').eq('user_id', userId).eq('status', 'ACTIVE'),
      supabase.from('hidden_posts').select('post_id').eq('user_id', userId),
      supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId),
    ]);

    const modelIds = (subs || []).map((s) => s.model_id);
    const hiddenPostIds = (hidden || []).map((item) => item.post_id);
    const blockedModelIds = (blocked || []).map((item) => item.blocked_id);

    let query = supabase.from('posts').select('*, post_media(*)').eq('status', 'PUBLISHED');
    if (hiddenPostIds.length > 0) query = query.not('id', 'in', `(${hiddenPostIds.join(',')})`);
    if (blockedModelIds.length > 0) query = query.not('model_id', 'in', `(${blockedModelIds.join(',')})`);

    if (modelIds.length > 0) {
      query = query.or(`model_id.in.(${modelIds.join(',')}),visibility.eq.PUBLIC`);
    } else {
      query = query.eq('visibility', 'PUBLIC');
    }

    const { data, error } = await query.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw new Error(error.message);
    const posts = (data || []).map(mapPost);
    const now = Date.now();
    posts.sort((left, right) => {
      const leftAge = Math.max(0, now - new Date(left.createdAt).getTime());
      const rightAge = Math.max(0, now - new Date(right.createdAt).getTime());
      const leftWeight = Math.random() * (1 + 1 / (1 + leftAge / 86400000));
      const rightWeight = Math.random() * (1 + 1 / (1 + rightAge / 86400000));
      return rightWeight - leftWeight;
    });
    return withUserInteractions(await withMediaUrls(posts));
  },

  async getById(id: string): Promise<Post | undefined> {
    const { data, error } = await supabase.from('posts').select('*, post_media(*)').eq('id', id).single();

    if (error) return undefined;
    if (!data) return undefined;
    const [post] = await withUserInteractions(await withMediaUrls([mapPost(data)]));
    return post;
  },

  async createPost(data: { modelId: string; text: string; visibility: Visibility; price?: number; scheduledAt?: string; mediaFiles?: File[] }): Promise<Post> {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        model_id: data.modelId,
        text: data.text,
        visibility: data.visibility,
        price: data.price,
        status: data.scheduledAt ? 'DRAFT' : 'PUBLISHED',
        scheduled_at: data.scheduledAt,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    try {
      for (const [position, file] of (data.mediaFiles || []).entries()) {
        const uploaded = await this.uploadMedia(file, data.modelId, post.id);
        const { error: mediaError } = await supabase.from('post_media').insert({
          post_id: post.id,
          media_type: uploaded.type,
          storage_path: uploaded.storagePath,
          thumbnail_path: null,
          position,
          duration: uploaded.duration,
        });
        if (mediaError) throw new Error(mediaError.message);
      }
    } catch (uploadError) {
      await supabase.from('posts').delete().eq('id', post.id);
      throw uploadError;
    }

    const { data: completePost, error: completeError } = await supabase.from('posts').select('*, post_media(*)').eq('id', post.id).single();
    if (completeError) throw new Error(completeError.message);
    return (await withMediaUrls([mapPost(completePost)]))[0];
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update({
        text: updates.text,
        visibility: updates.visibility,
        price: updates.price,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPost(data);
  },

  // Used by a model changing the status of their OWN post (e.g. publishing a
  // draft). Allowed directly by the posts_update_own RLS policy.
  async setStatus(id: string, status: ContentStatus): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPost(data);
  },

  // Used by admin/manager moderation actions on OTHER models' posts. Goes
  // through the SECURITY DEFINER RPC, which enforces that a manager can only
  // moderate posts belonging to models assigned to them.
  async moderateStatus(id: string, status: ContentStatus): Promise<Post> {
    const { data, error } = await supabase.rpc('admin_update_post_status', {
      target_post_id: id,
      new_status: status,
    });

    if (error) throw new Error(error.message);
    return mapPost(data);
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async toggleLike(postId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('likes').delete().eq('id', existing.id);
      if (error) throw new Error(error.message);
      return false;
    }

    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.user.id });
    if (error) throw new Error(error.message);
    return true;
  },

  async toggleBookmark(postId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
      if (error) throw new Error(error.message);
      return false;
    }

    const { error } = await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.user.id });
    if (error) throw new Error(error.message);
    return true;
  },

  async getBookmarkedPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('post_id, posts(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const rows: any[] = (data || []).filter((r: any) => r.posts);
    const posts = await withMediaUrls(rows.map((r: any) => mapPost(r.posts)));
    return withUserInteractions(posts);
  },

  async removeBookmark(postId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.user.id);

    if (error) throw new Error(error.message);
  },

  // Which of the given posts the current user has liked/bookmarked. Used to
  // seed initial like/bookmark state instead of always defaulting to false.
  async getUserInteractions(postIds: string[]): Promise<{ likedIds: Set<string>; bookmarkedIds: Set<string> }> {
    if (postIds.length === 0) return { likedIds: new Set(), bookmarkedIds: new Set() };

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { likedIds: new Set(), bookmarkedIds: new Set() };

    const [{ data: likes, error: likesError }, { data: bookmarks, error: bookmarksError }] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', user.user.id).in('post_id', postIds),
      supabase.from('bookmarks').select('post_id').eq('user_id', user.user.id).in('post_id', postIds),
    ]);

    if (likesError) throw new Error(likesError.message);
    if (bookmarksError) throw new Error(bookmarksError.message);

    return {
      likedIds: new Set((likes || []).map((l) => l.post_id)),
      bookmarkedIds: new Set((bookmarks || []).map((b) => b.post_id)),
    };
  },

  async getComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('id, user_id, text, created_at, profiles:user_id (name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      text: row.text,
      createdAt: row.created_at,
      userName: row.profiles?.name,
      userAvatar: row.profiles?.avatar_url,
    }));
  },

  // userId is intentionally NOT a parameter: the comment author is always
  // the authenticated caller, never a value supplied by the frontend.
  async addComment(postId: string, text: string): Promise<PostComment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.user.id, text })
      .select('id, user_id, text, created_at, profiles:user_id (name, avatar_url)')
      .single();

    if (error) throw new Error(error.message);

    const row: any = data;
    return {
      id: row.id,
      userId: row.user_id,
      text: row.text,
      createdAt: row.created_at,
      userName: row.profiles?.name,
      userAvatar: row.profiles?.avatar_url,
    };
  },

  async updateComment(commentId: string, text: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('comments').update({ text }).eq('id', commentId).eq('user_id', user.user.id);
    if (error) throw new Error(error.message);
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);
  },

  async hidePost(postId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('hidden_posts').upsert({ post_id: postId, user_id: user.user.id });
    if (error) throw new Error(error.message);
  },

  async blockUser(blockedUserId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    if (user.user.id === blockedUserId) throw new Error('You cannot block yourself');
    const { error } = await supabase.from('blocked_users').upsert({ blocker_id: user.user.id, blocked_id: blockedUserId });
    if (error) throw new Error(error.message);
  },

  async sendTip(postId: string, modelId: string, amount: number): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    if (user.user.id === modelId) throw new Error('You cannot tip your own post');
    if (!(amount > 0)) throw new Error('Tip amount must be greater than 0');

    const { error } = await supabase.from('transactions').insert({
      user_id: user.user.id,
      model_id: modelId,
      type: 'TIP',
      amount,
      status: 'COMPLETED',
      description: `Tip on post ${postId}`,
    });
    if (error) throw new Error(`Tip failed: ${error.message}`);

    const { error: countError } = await supabase.rpc('increment_tips_count', { target_post_id: postId });
    if (countError) throw new Error(countError.message);
  },

  async uploadMedia(file: File, modelId: string, postId?: string): Promise<{ type: 'IMAGE' | 'VIDEO'; storagePath: string; duration?: number }> {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Only images and videos are allowed');
    if (file.size > 250 * 1024 * 1024) throw new Error('Media must be smaller than 250 MB');
    const ext = file.name.split('.').pop();
    const path = `${modelId}/${postId || 'draft'}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('post-media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
    if (type === 'IMAGE') return { type, storagePath: path };

    const duration = await new Promise<number | undefined>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(Number.isFinite(video.duration) ? video.duration : undefined); };
      video.onerror = () => { URL.revokeObjectURL(video.src); resolve(undefined); };
      video.src = URL.createObjectURL(file);
    });
    return { type, storagePath: path, duration };
  },
};

// --- Subscription Service ---
export const subscriptionService = {
  async getByUser(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      status: row.status,
      price: row.price,
      plan: row.plan,
      startedAt: row.started_at,
      renewsAt: row.renews_at,
      cancelledAt: row.cancelled_at,
    }));
  },

  async getByModel(modelId: string): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('model_id', modelId);
    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      status: row.status,
      price: row.price,
      plan: row.plan,
      startedAt: row.started_at,
      renewsAt: row.renews_at,
      cancelledAt: row.cancelled_at,
    }));
  },

  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      status: row.status,
      price: row.price,
      plan: row.plan,
      startedAt: row.started_at,
      renewsAt: row.renews_at,
      cancelledAt: row.cancelled_at,
    }));
  },

  async subscribe(userId: string, modelId: string, plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY', price: number): Promise<Subscription> {
    const planDays = plan === 'MONTHLY' ? 30 : plan === 'QUARTERLY' ? 90 : 365;
    const renewsAt = new Date(Date.now() + planDays * 86400000).toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        model_id: modelId,
        status: 'ACTIVE',
        price,
        plan,
        renews_at: renewsAt,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create transaction record. Any failure here must not be swallowed --
    // a subscription that exists with no matching transaction is a
    // reconciliation bug that's very hard to spot later.
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      model_id: modelId,
      type: 'SUBSCRIPTION',
      amount: price,
      status: 'COMPLETED',
      description: `Subscription - ${plan}`,
    });
    if (txError) throw new Error(`Subscription created but transaction record failed: ${txError.message}`);

    return {
      id: data.id,
      userId: data.user_id,
      modelId: data.model_id,
      status: data.status,
      price: data.price,
      plan: data.plan,
      startedAt: data.started_at,
      renewsAt: data.renews_at,
      cancelledAt: data.cancelled_at,
    };
  },

  async cancel(id: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      modelId: data.model_id,
      status: data.status,
      price: data.price,
      plan: data.plan,
      startedAt: data.started_at,
      renewsAt: data.renews_at,
      cancelledAt: data.cancelled_at,
    };
  },

  async isSubscribed(userId: string, modelId: string): Promise<boolean> {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('model_id', modelId)
      .eq('status', 'ACTIVE')
      .single();

    return !!data;
  },
};

// --- Message Service ---
export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false });

    if (error) throw new Error(error.message);

    const conversations = data || [];
    if (conversations.length === 0) return [];

    // The stored `unread_count` column is shared by both participants and
    // cannot represent "unread for me" vs "unread for them" at the same
    // time, so it's not trustworthy. Compute the real per-user unread count
    // from messages (unread + not sent by me) instead.
    const ids = conversations.map((c) => c.id);
    const { data: unread, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .eq('read', false)
      .neq('sender_id', userId);

    if (unreadError) throw new Error(unreadError.message);

    const unreadCounts = new Map<string, number>();
    (unread || []).forEach((m) => {
      unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) || 0) + 1);
    });

    return conversations.map((row) => ({
      id: row.id,
      participantIds: row.participant_ids,
      lastMessageAt: row.last_message_at,
      unreadCount: unreadCounts.get(row.id) || 0,
    }));
  },

  // Finds an existing 1:1 conversation between the two users, or creates one.
  async getOrCreateConversation(userId: string, otherId: string): Promise<Conversation> {
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .contains('participant_ids', [otherId]);

    if (findError) throw new Error(findError.message);

    // participant_ids is unordered/arbitrary length in principle, so filter
    // client-side for an exact 1:1 match rather than trusting containment
    // alone (which would also match a future group conversation).
    const match = (existing || []).find((c) => c.participant_ids.length === 2);
    if (match) {
      return {
        id: match.id,
        participantIds: match.participant_ids,
        lastMessageAt: match.last_message_at,
        unreadCount: 0,
      };
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ participant_ids: [userId, otherId] })
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    return {
      id: created.id,
      participantIds: created.participant_ids,
      lastMessageAt: created.last_message_at,
      unreadCount: 0,
    };
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      type: row.type,
      text: row.text,
      mediaUrl: row.media_url,
      price: row.price,
      unlocked: row.unlocked,
      read: row.read,
      createdAt: row.created_at,
      storyId: row.story_id || undefined,
      reelId: row.reel_id || undefined,
      editedAt: row.edited_at || undefined,
      deletedAt: row.deleted_at || undefined,
    }));
  },

  // Subscribes to new messages inserted into a conversation via Supabase
  // Realtime. Returns an unsubscribe function.
  subscribeToMessages(conversationId: string, onInsert: (message: Message) => void): () => void {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as any;
          onInsert({
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            type: row.type,
            text: row.text,
            mediaUrl: row.media_url,
            price: row.price,
            unlocked: row.unlocked,
            read: row.read,
            createdAt: row.created_at,
            storyId: row.story_id || undefined,
            reelId: row.reel_id || undefined,
            editedAt: row.edited_at || undefined,
            deletedAt: row.deleted_at || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async sendMessage(conversationId: string, senderId: string, data: { type: Message['type']; text?: string; mediaUrl?: string; price?: number; storyId?: string; reelId?: string }): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        type: data.type,
        text: data.text,
        media_url: data.mediaUrl,
        price: data.price,
        unlocked: data.type !== 'PPV',
        story_id: data.storyId,
        reel_id: data.reelId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update last_message_at -- errors here must not be swallowed, since a
    // silently-failed update means the conversation list sorts/shows stale
    // data with no indication anything went wrong.
    const { error: convError } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
    if (convError) throw new Error(`Message sent but failed to update conversation: ${convError.message}`);

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      text: message.text,
      mediaUrl: message.media_url,
      price: message.price,
      unlocked: message.unlocked,
      type: message.type,
      read: message.read,
      createdAt: message.created_at,
      storyId: message.story_id || undefined,
      reelId: message.reel_id || undefined,
      editedAt: message.edited_at || undefined,
      deletedAt: message.deleted_at || undefined,
    };
  },

  async updateMessage(messageId: string, senderId: string, text: string): Promise<Message> {
    const { data, error } = await supabase.from('messages').update({ text, edited_at: new Date().toISOString() }).eq('id', messageId).eq('sender_id', senderId).select().single();
    if (error) throw new Error(error.message);
    return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, type: data.type, text: data.text, mediaUrl: data.media_url, price: data.price, unlocked: data.unlocked, read: data.read, createdAt: data.created_at, storyId: data.story_id || undefined, reelId: data.reel_id || undefined, editedAt: data.edited_at || undefined, deletedAt: data.deleted_at || undefined };
  },

  async deleteMessage(messageId: string, senderId: string): Promise<void> {
    const { error } = await supabase.from('messages').update({ text: null, media_url: null, deleted_at: new Date().toISOString() }).eq('id', messageId).eq('sender_id', senderId);
    if (error) throw new Error(error.message);
  },

  // Unlocking a PPV message is done by whoever is viewing it (the
  // recipient), never the original sender. The RLS check on messages_update
  // already ensures only a conversation participant can call this; we
  // additionally guard against the sender trying to "unlock" (and thus pay
  // for) their own message.
  async unlockMessage(messageId: string): Promise<Message> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: existing, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    if (existing.sender_id === user.user.id) throw new Error('You cannot unlock your own message');
    if (existing.unlocked) {
      return {
        id: existing.id,
        conversationId: existing.conversation_id,
        senderId: existing.sender_id,
        type: existing.type,
        text: existing.text,
        mediaUrl: existing.media_url,
        price: existing.price,
        unlocked: existing.unlocked,
        read: existing.read,
        createdAt: existing.created_at,
      };
    }

    const { data: message, error } = await supabase
      .from('messages')
      .update({ unlocked: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create transaction for PPV unlock: the payer is the unlocker
    // (current user), the recipient of the funds is the message sender.
    if (message.price && message.price > 0) {
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.user.id,
        model_id: message.sender_id,
        type: 'PPV',
        amount: message.price,
        status: 'COMPLETED',
        description: 'PPV Message unlock',
      });
      if (txError) throw new Error(`Message unlocked but transaction failed: ${txError.message}`);
    }

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      type: message.type,
      text: message.text,
      mediaUrl: message.media_url,
      price: message.price,
      unlocked: message.unlocked,
      read: message.read,
      createdAt: message.created_at,
    };
  },

  async markRead(conversationId: string, userId: string): Promise<void> {
    // Mark every message in this conversation NOT sent by the caller as
    // read -- this is what actually drives the per-user unread count
    // computed in getConversations().
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  },
};

// --- Transaction Service ---
export const transactionService = {
  async getByUser(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      type: row.type,
      amount: row.amount,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
    }));
  },

  async getByModel(modelId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      type: row.type,
      amount: row.amount,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
    }));
  },

  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      modelId: row.model_id,
      type: row.type,
      amount: row.amount,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
    }));
  },

  async createTip(userId: string, modelId: string, amount: number): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        model_id: modelId,
        type: 'TIP',
        amount,
        status: 'COMPLETED',
        description: 'Tip to creator',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      modelId: data.model_id,
      type: data.type,
      amount: data.amount,
      status: data.status,
      description: data.description,
      createdAt: data.created_at,
    };
  },

  async createPPV(userId: string, modelId: string, amount: number): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        model_id: modelId,
        type: 'PPV',
        amount,
        status: 'COMPLETED',
        description: 'PPV Content purchase',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      modelId: data.model_id,
      type: data.type,
      amount: data.amount,
      status: data.status,
      description: data.description,
      createdAt: data.created_at,
    };
  },
};

// --- Payout Service ---
export const payoutService = {
  async getByUser(userId: string): Promise<Payout[]> {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      status: row.status,
      method: row.method,
      createdAt: row.created_at,
    }));
  },

  async getAll(): Promise<Payout[]> {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      status: row.status,
      method: row.method,
      createdAt: row.created_at,
    }));
  },

  async requestPayout(userId: string, amount: number, method: string): Promise<Payout> {
    const { data, error } = await supabase
      .from('payouts')
      .insert({
        user_id: userId,
        amount,
        method,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      status: data.status,
      method: data.method,
      createdAt: data.created_at,
    };
  },

  async setStatus(id: string, status: Payout['status']): Promise<Payout> {
    const { data, error } = await supabase.rpc('admin_update_payout_status', {
      target_payout_id: id,
      new_status: status,
    });

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      status: data.status,
      method: data.method,
      createdAt: data.created_at,
    };
  },
};

// --- Notification Service ---
export const notificationService = {
  async getByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      body: row.body || '',
      read: row.read,
      link: row.link,
      createdAt: row.created_at,
    }));
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
    return count || 0;
  },

  subscribeToUser(userId: string, onNotification: (notification: Notification) => void): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
        onNotification({
          id: row.id,
          userId: row.user_id,
          type: row.type,
          title: row.title,
          body: row.body || '',
          read: row.read,
          link: row.link,
          createdAt: row.created_at,
        });
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  },
};

// --- Report Service ---
export const reportService = {
  async getAll(): Promise<Report[]> {
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      reporterId: row.reporter_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async create(data: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<Report> {
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: data.reporterId,
        entity_type: data.entityType,
        entity_id: data.entityId,
        reason: data.reason,
        description: data.description,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: report.id,
      reporterId: report.reporter_id,
      entityType: report.entity_type,
      entityId: report.entity_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.created_at,
    };
  },

  async setStatus(id: string, status: Report['status']): Promise<Report> {
    const { data, error } = await supabase.rpc('admin_update_report_status', {
      target_report_id: id,
      new_status: status,
    });

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      reporterId: data.reporter_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      reason: data.reason,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
    };
  },
};

// --- Audit Log Service ---
export const auditService = {
  async getAll(): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      ip: row.ip,
      createdAt: row.created_at,
    }));
  },

  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      ip: entry.ip,
    });

    if (error) throw new Error(error.message);
  },
};

export const storyService = {
  mapStory(story: any): Story {
    const createdAt = story.created_at;
    const expiresAt = story.expires_at;
    const durationHours = story.duration_hours || Math.max(1, (new Date(expiresAt).getTime() - new Date(createdAt).getTime()) / 3600000);
    return { id: story.id, modelId: story.model_id, text: story.text, createdAt, expiresAt, durationHours, mediaType: story.media_type || undefined, mediaUrl: story.media_url || undefined, storagePath: story.storage_path || undefined, visibility: story.visibility || 'PUBLIC', background: story.background || undefined };
  },

  async getByModel(modelId: string): Promise<Story[]> {
    const { data, error } = await supabase.from('stories').select('*').eq('model_id', modelId).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return this.withMediaUrls((data || []).map(this.mapStory));
  },

  async getActive(): Promise<Story[]> {
    const { data, error } = await supabase.from('stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return this.withMediaUrls((data || []).map(this.mapStory));
  },

  async withMediaUrls(stories: Story[]): Promise<Story[]> {
    return Promise.all(stories.map(async (story) => {
      if (!story.storagePath) return story;
      const { data, error } = await supabase.storage.from('post-media').createSignedUrl(story.storagePath, 3600);
      if (error) throw new Error(error.message);
      return { ...story, mediaUrl: data.signedUrl };
    }));
  },

  async create(modelId: string, text: string, durationHours = 6, mediaFile?: File, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC', background = 'linear-gradient(135deg, #111827, #374151)'): Promise<Story> {
    const safeDuration = Math.min(24, Math.max(1, durationHours));
    let mediaType: 'IMAGE' | 'VIDEO' | undefined;
    let storagePath: string | undefined;
    if (mediaFile) {
      const uploaded = await contentService.uploadMedia(mediaFile, modelId, `story-${crypto.randomUUID()}`);
      mediaType = uploaded.type;
      storagePath = uploaded.storagePath;
    }
    const { data, error } = await supabase.from('stories').insert({ model_id: modelId, text, duration_hours: safeDuration, media_type: mediaType, storage_path: storagePath, visibility, background }).select().single();
    if (error) {
      if (storagePath) await supabase.storage.from('post-media').remove([storagePath]);
      throw new Error(error.message);
    }
    const [story] = await this.withMediaUrls([this.mapStory(data)]);
    return story;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getViewedIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase.from('story_views').select('story_id').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return new Set((data || []).map((row) => row.story_id));
  },

  async markViewed(storyId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('story_views').upsert({ story_id: storyId, user_id: userId }, { onConflict: 'story_id,user_id' });
    if (error) throw new Error(error.message);
  },
};

export const followService = {
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    const { data, error } = await supabase.from('follows').select('follower_id').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  },

  async toggle(followingId: string): Promise<boolean> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');
    if (authUser.user.id === followingId) throw new Error('You cannot follow yourself');
    const existing = await supabase.from('follows').select('follower_id').eq('follower_id', authUser.user.id).eq('following_id', followingId).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', authUser.user.id).eq('following_id', followingId);
      if (error) throw new Error(error.message);
      return false;
    }
    const { error } = await supabase.from('follows').insert({ follower_id: authUser.user.id, following_id: followingId });
    if (error) throw new Error(error.message);
    return true;
  },
};

export const reelService = {
  mapReel(row: any, mediaUrl: string): Reel {
    return { id: row.id, modelId: row.model_id, caption: row.caption || '', hashtags: row.hashtags || [], visibility: row.visibility, mediaUrl, storagePath: row.storage_path, createdAt: row.created_at, views: row.views_count || 0 };
  },

  async getAll(): Promise<Reel[]> {
    const { data, error } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return Promise.all((data || []).map(async (row) => {
      const signed = await supabase.storage.from('post-media').createSignedUrl(row.storage_path, 3600);
      if (signed.error) throw new Error(signed.error.message);
      return this.mapReel(row, signed.data.signedUrl);
    }));
  },

  async create(modelId: string, file: File, caption: string, hashtags: string[], visibility: Visibility): Promise<Reel> {
    if (!file.type.startsWith('video/')) throw new Error('A Reel must be a video');
    const uploaded = await contentService.uploadMedia(file, modelId, `reel-${crypto.randomUUID()}`);
    const { data, error } = await supabase.from('reels').insert({ model_id: modelId, caption, hashtags, visibility, storage_path: uploaded.storagePath }).select().single();
    if (error) {
      await supabase.storage.from('post-media').remove([uploaded.storagePath]);
      throw new Error(error.message);
    }
    const signed = await supabase.storage.from('post-media').createSignedUrl(uploaded.storagePath, 3600);
    if (signed.error) throw new Error(signed.error.message);
    return this.mapReel(data, signed.data.signedUrl);
  },

  async toggleLike(reelId: string): Promise<boolean> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');
    const existing = await supabase.from('reel_likes').select('reel_id').eq('reel_id', reelId).eq('user_id', authUser.user.id).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) { await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', authUser.user.id); return false; }
    const { error } = await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: authUser.user.id });
    if (error) throw new Error(error.message);
    return true;
  },

  async toggleBookmark(reelId: string): Promise<boolean> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');
    const existing = await supabase.from('reel_bookmarks').select('reel_id').eq('reel_id', reelId).eq('user_id', authUser.user.id).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) { await supabase.from('reel_bookmarks').delete().eq('reel_id', reelId).eq('user_id', authUser.user.id); return false; }
    const { error } = await supabase.from('reel_bookmarks').insert({ reel_id: reelId, user_id: authUser.user.id });
    if (error) throw new Error(error.message);
    return true;
  },

  async countView(reelId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_reel_views', { target_reel_id: reelId });
    if (error) throw new Error(error.message);
  },
};