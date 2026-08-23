import type {
  User,
  Post,
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
} from '@/types';
import * as db from '@/data/mockData';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

let currentUser: User | null = null;

// --- Auth Service ---
export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    if (user.status === 'SUSPENDED') throw new Error('Account suspended. Contact support.');
    if (user.status === 'BLOCKED') throw new Error('Account blocked.');
    currentUser = clone(user);
    return clone(user);
  },

  async register(data: { name: string; email: string; password: string; role: Role }): Promise<User> {
    await delay(300);
    if (db.users.some((u) => u.email === data.email)) throw new Error('Email already registered');
    const user: User = {
      id: `u-new-${Date.now()}`,
      email: data.email,
      password: data.password,
      role: data.role,
      name: data.name,
      username: data.email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    db.users.push(user);
    currentUser = clone(user);
    return clone(user);
  },

  async logout(): Promise<void> {
    await delay(100);
    currentUser = null;
  },

  getCurrentUser(): User | null {
    return currentUser ? clone(currentUser) : null;
  },

  setCurrentUser(user: User | null) {
    currentUser = user ? clone(user) : null;
  },

  async forgotPassword(email: string): Promise<void> {
    await delay();
    // mock — always succeeds
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await delay();
  },

  demoAccounts(): { email: string; password: string; role: Role; name: string }[] {
    return [
      { email: 'admin@creatorhub.com', password: 'admin123', role: 'ADMIN', name: 'Admin' },
      { email: 'sarah.manager@creatorhub.com', password: 'manager123', role: 'MANAGER', name: 'Sarah (Manager)' },
      { email: 'emma.model@creatorhub.com', password: 'model123', role: 'MODEL', name: 'Emma Rose (Model)' },
      { email: 'john.user@email.com', password: 'user123', role: 'USER', name: 'John (User)' },
    ];
  },
};

// --- User Service ---
export const userService = {
  async getById(id: string): Promise<User | undefined> {
    await delay(100);
    return clone(db.users.find((u) => u.id === id));
  },

  async getAll(): Promise<User[]> {
    await delay();
    return clone(db.users);
  },

  async getByRole(role: Role): Promise<User[]> {
    await delay();
    return clone(db.users.filter((u) => u.role === role));
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    await delay();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.users[idx] = { ...db.users[idx], ...updates };
    return clone(db.users[idx]);
  },

  async setStatus(id: string, status: User['status']): Promise<User> {
    await delay();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.users[idx].status = status;
    return clone(db.users[idx]);
  },

  async setVerified(id: string, verified: boolean): Promise<User> {
    await delay();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.users[idx].verified = verified;
    return clone(db.users[idx]);
  },

  async assignManager(modelId: string, managerId: string): Promise<User> {
    await delay();
    const idx = db.users.findIndex((u) => u.id === modelId);
    if (idx === -1) throw new Error('Model not found');
    db.users[idx].managerId = managerId;
    return clone(db.users[idx]);
  },
};

// --- Manager Service (scope-aware) ---
export const managerService = {
  async getModelsByManager(managerId: string): Promise<User[]> {
    await delay();
    return clone(db.users.filter((u) => u.role === 'MODEL' && u.managerId === managerId));
  },

  async getManagerStats(managerId: string) {
    await delay();
    const models = db.users.filter((u) => u.role === 'MODEL' && u.managerId === managerId);
    const modelIds = models.map((m) => m.id);
    const subs = db.subscriptions.filter((s) => modelIds.includes(s.modelId) && s.status === 'ACTIVE');
    const txns = db.transactions.filter((t) => t.modelId && modelIds.includes(t.modelId) && t.status === 'COMPLETED');
    const revenue = txns.reduce((sum, t) => sum + t.amount, 0);
    const ppvRev = txns.filter((t) => t.type === 'PPV').reduce((s, t) => s + t.amount, 0);
    const tipRev = txns.filter((t) => t.type === 'TIP').reduce((s, t) => s + t.amount, 0);
    const subRev = txns.filter((t) => t.type === 'SUBSCRIPTION').reduce((s, t) => s + t.amount, 0);
    return {
      totalModels: models.length,
      totalSubscribers: subs.length,
      revenue,
      monthlyRevenue: revenue * 0.3,
      ppvRevenue: ppvRev,
      tipRevenue: tipRev,
      subscriptionRevenue: subRev,
      newSubscribers: 3,
    };
  },
};

// --- Model Service ---
export const modelService = {
  async getById(id: string): Promise<User | undefined> {
    await delay(100);
    return clone(db.users.find((u) => u.id === id && u.role === 'MODEL'));
  },

  async getAll(): Promise<User[]> {
    await delay();
    return clone(db.users.filter((u) => u.role === 'MODEL'));
  },

  async getTrending(): Promise<User[]> {
    await delay();
    return clone(db.users.filter((u) => u.role === 'MODEL').sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0)));
  },

  async getNewest(): Promise<User[]> {
    await delay();
    return clone(db.users.filter((u) => u.role === 'MODEL').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async search(query: string): Promise<User[]> {
    await delay(200);
    const q = query.toLowerCase();
    return clone(
      db.users.filter(
        (u) =>
          u.role === 'MODEL' &&
          (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q))
      )
    );
  },

  async getStats(modelId: string) {
    await delay();
    const subs = db.subscriptions.filter((s) => s.modelId === modelId && s.status === 'ACTIVE');
    const txns = db.transactions.filter((t) => t.modelId === modelId && t.status === 'COMPLETED');
    const revenue = txns.reduce((s, t) => s + t.amount, 0);
    const ppvRev = txns.filter((t) => t.type === 'PPV').reduce((s, t) => s + t.amount, 0);
    const tipRev = txns.filter((t) => t.type === 'TIP').reduce((s, t) => s + t.amount, 0);
    const subRev = txns.filter((t) => t.type === 'SUBSCRIPTION').reduce((s, t) => s + t.amount, 0);
    const posts = db.posts.filter((p) => p.modelId === modelId);
    return {
      totalEarnings: revenue,
      availableBalance: revenue * 0.8,
      pendingBalance: revenue * 0.2,
      subscribers: subs.length,
      newSubscribers: 2,
      engagement: posts.length ? (posts.reduce((s, p) => s + p.likes, 0) / posts.length).toFixed(1) : '0',
      ppvRevenue: ppvRev,
      tipRevenue: tipRev,
      subscriptionRevenue: subRev,
      postCount: posts.length,
    };
  },
};

// --- Content Service ---
export const contentService = {
  async getPosts(): Promise<Post[]> {
    await delay();
    return clone(db.posts);
  },

  async getPostsByModel(modelId: string): Promise<Post[]> {
    await delay();
    return clone(db.posts.filter((p) => p.modelId === modelId));
  },

  async getFeedPosts(userId: string): Promise<Post[]> {
    await delay();
    const userSubs = db.subscriptions.filter((s) => s.userId === userId && s.status === 'ACTIVE');
    const modelIds = userSubs.map((s) => s.modelId);
    return clone(db.posts.filter((p) => modelIds.includes(p.modelId) || p.visibility === 'PUBLIC'));
  },

  async getById(id: string): Promise<Post | undefined> {
    await delay(100);
    return clone(db.posts.find((p) => p.id === id));
  },

  async createPost(data: { modelId: string; text: string; visibility: Visibility; price?: number; scheduledAt?: string }): Promise<Post> {
    await delay(300);
    const post: Post = {
      id: `p-${Date.now()}`,
      modelId: data.modelId,
      text: data.text,
      visibility: data.visibility,
      price: data.price,
      status: data.scheduledAt ? 'DRAFT' : 'PUBLISHED',
      scheduledAt: data.scheduledAt,
      likes: 0,
      comments: [],
      bookmarks: 0,
      tips: 0,
      createdAt: new Date().toISOString(),
    };
    db.posts.unshift(post);
    return clone(post);
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    await delay();
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Post not found');
    db.posts[idx] = { ...db.posts[idx], ...updates };
    return clone(db.posts[idx]);
  },

  async setStatus(id: string, status: ContentStatus): Promise<Post> {
    await delay();
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Post not found');
    db.posts[idx].status = status;
    return clone(db.posts[idx]);
  },

  async deletePost(id: string): Promise<void> {
    await delay();
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx !== -1) db.posts.splice(idx, 1);
  },

  async likePost(id: string): Promise<void> {
    await delay(50);
    const p = db.posts.find((p) => p.id === id);
    if (p) p.likes++;
  },

  async bookmarkPost(id: string): Promise<void> {
    await delay(50);
    const p = db.posts.find((p) => p.id === id);
    if (p) p.bookmarks++;
  },

  async addComment(postId: string, userId: string, text: string): Promise<void> {
    await delay(100);
    const p = db.posts.find((p) => p.id === postId);
    if (p) p.comments.push({ id: `c-${Date.now()}`, userId, text, createdAt: new Date().toISOString() });
  },
};

// --- Subscription Service ---
export const subscriptionService = {
  async getByUser(userId: string): Promise<Subscription[]> {
    await delay();
    return clone(db.subscriptions.filter((s) => s.userId === userId));
  },

  async getByModel(modelId: string): Promise<Subscription[]> {
    await delay();
    return clone(db.subscriptions.filter((s) => s.modelId === modelId));
  },

  async getAll(): Promise<Subscription[]> {
    await delay();
    return clone(db.subscriptions);
  },

  async subscribe(userId: string, modelId: string, plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY', price: number): Promise<Subscription> {
    await delay(400);
    const sub: Subscription = {
      id: `s-${Date.now()}`,
      userId,
      modelId,
      status: 'ACTIVE',
      price,
      plan,
      startedAt: new Date().toISOString(),
      renewsAt: new Date(Date.now() + (plan === 'MONTHLY' ? 30 : plan === 'QUARTERLY' ? 90 : 365) * 86400000).toISOString(),
    };
    db.subscriptions.push(sub);
    const txn: Transaction = {
      id: `t-${Date.now()}`,
      userId,
      modelId,
      type: 'SUBSCRIPTION',
      amount: price,
      status: 'COMPLETED',
      description: `Subscription - ${plan}`,
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(txn);
    return clone(sub);
  },

  async cancel(id: string): Promise<Subscription> {
    await delay();
    const idx = db.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');
    db.subscriptions[idx].status = 'CANCELLED';
    db.subscriptions[idx].cancelledAt = new Date().toISOString();
    return clone(db.subscriptions[idx]);
  },

  async isSubscribed(userId: string, modelId: string): Promise<boolean> {
    await delay(50);
    return db.subscriptions.some((s) => s.userId === userId && s.modelId === modelId && s.status === 'ACTIVE');
  },
};

// --- Message Service ---
export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    await delay();
    return clone(db.conversations.filter((c) => c.participantIds.includes(userId)));
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    await delay();
    return clone(db.messages.filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  },

  async sendMessage(conversationId: string, senderId: string, data: { type: Message['type']; text?: string; mediaUrl?: string; price?: number }): Promise<Message> {
    await delay(150);
    const msg: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId,
      type: data.type,
      text: data.text,
      mediaUrl: data.mediaUrl,
      price: data.price,
      unlocked: data.type !== 'PPV',
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(msg);
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (conv) conv.lastMessageAt = msg.createdAt;
    return clone(msg);
  },

  async unlockMessage(messageId: string): Promise<Message> {
    await delay(400);
    const idx = db.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');
    db.messages[idx].unlocked = true;
    const txn: Transaction = {
      id: `t-${Date.now()}`,
      userId: db.messages[idx].senderId,
      type: 'PPV',
      amount: db.messages[idx].price || 0,
      status: 'COMPLETED',
      description: 'PPV Message unlock',
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(txn);
    return clone(db.messages[idx]);
  },

  async markRead(conversationId: string, userId: string): Promise<void> {
    await delay(50);
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (conv) conv.unreadCount = 0;
  },
};

// --- Transaction Service ---
export const transactionService = {
  async getByUser(userId: string): Promise<Transaction[]> {
    await delay();
    return clone(db.transactions.filter((t) => t.userId === userId));
  },

  async getByModel(modelId: string): Promise<Transaction[]> {
    await delay();
    return clone(db.transactions.filter((t) => t.modelId === modelId));
  },

  async getAll(): Promise<Transaction[]> {
    await delay();
    return clone(db.transactions);
  },

  async createTip(userId: string, modelId: string, amount: number): Promise<Transaction> {
    await delay(400);
    const txn: Transaction = {
      id: `t-${Date.now()}`,
      userId,
      modelId,
      type: 'TIP',
      amount,
      status: 'COMPLETED',
      description: `Tip to creator`,
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(txn);
    return clone(txn);
  },

  async createPPV(userId: string, modelId: string, amount: number): Promise<Transaction> {
    await delay(400);
    const txn: Transaction = {
      id: `t-${Date.now()}`,
      userId,
      modelId,
      type: 'PPV',
      amount,
      status: 'COMPLETED',
      description: 'PPV Content purchase',
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(txn);
    return clone(txn);
  },
};

// --- Payout Service ---
export const payoutService = {
  async getByUser(userId: string): Promise<Payout[]> {
    await delay();
    return clone(db.payouts.filter((p) => p.userId === userId));
  },

  async getAll(): Promise<Payout[]> {
    await delay();
    return clone(db.payouts);
  },

  async requestPayout(userId: string, amount: number, method: string): Promise<Payout> {
    await delay(400);
    const payout: Payout = {
      id: `po-${Date.now()}`,
      userId,
      amount,
      status: 'PENDING',
      method,
      createdAt: new Date().toISOString(),
    };
    db.payouts.push(payout);
    return clone(payout);
  },

  async setStatus(id: string, status: Payout['status']): Promise<Payout> {
    await delay();
    const idx = db.payouts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Payout not found');
    db.payouts[idx].status = status;
    return clone(db.payouts[idx]);
  },
};

// --- Notification Service ---
export const notificationService = {
  async getByUser(userId: string): Promise<Notification[]> {
    await delay();
    return clone(db.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async markRead(id: string): Promise<void> {
    await delay(50);
    const n = db.notifications.find((n) => n.id === id);
    if (n) n.read = true;
  },

  async markAllRead(userId: string): Promise<void> {
    await delay(100);
    db.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(50);
    return db.notifications.filter((n) => n.userId === userId && !n.read).length;
  },
};

// --- Report Service ---
export const reportService = {
  async getAll(): Promise<Report[]> {
    await delay();
    return clone(db.reports);
  },

  async create(data: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<Report> {
    await delay(300);
    const report: Report = {
      ...data,
      id: `r-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    db.reports.push(report);
    return clone(report);
  },

  async setStatus(id: string, status: Report['status']): Promise<Report> {
    await delay();
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Report not found');
    db.reports[idx].status = status;
    return clone(db.reports[idx]);
  },
};

// --- Audit Log Service ---
export const auditService = {
  async getAll(): Promise<AuditLog[]> {
    await delay();
    return clone(db.auditLogs);
  },

  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    db.auditLogs.unshift({ ...entry, id: `al-${Date.now()}`, createdAt: new Date().toISOString() });
  },
};
