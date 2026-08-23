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
  Comment,
} from '@/types';

const now = Date.now();
const days = (n: number) => new Date(now - n * 86400000).toISOString();
const hours = (n: number) => new Date(now - n * 3600000).toISOString();
const mins = (n: number) => new Date(now - n * 60000).toISOString();
const futureDays = (n: number) => new Date(now + n * 86400000).toISOString();

const avatar = (seed: string, size = 200) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=50&backgroundColor=ffd5dc,ffdfbf,d1f4d9,bfe9ff,e8d1ff`;
const cover = (seed: string) =>
  `https://picsum.photos/seed/${seed}/1200/400`;

// --- Users ---
export const users: User[] = [
  // Admin
  {
    id: 'u-admin',
    email: 'admin@creatorhub.com',
    password: 'admin123',
    role: 'ADMIN',
    name: 'System Admin',
    username: 'admin',
    avatar: avatar('admin'),
    status: 'ACTIVE',
    createdAt: days(400),
    lastActive: mins(2),
  },
  // Managers
  {
    id: 'u-mgr-1',
    email: 'sarah.manager@creatorhub.com',
    password: 'manager123',
    role: 'MANAGER',
    name: 'Sarah Mitchell',
    username: 'sarah_mgr',
    avatar: avatar('sarah_mgr'),
    cover: cover('sarah_mgr'),
    bio: 'Talent manager for top-tier creators. 5+ years building creator brands.',
    status: 'ACTIVE',
    createdAt: days(300),
    lastActive: mins(15),
  },
  {
    id: 'u-mgr-2',
    email: 'david.manager@creatorhub.com',
    password: 'manager123',
    role: 'MANAGER',
    name: 'David Chen',
    username: 'david_mgr',
    avatar: avatar('david_mgr'),
    cover: cover('david_mgr'),
    bio: 'Managing elite talent across lifestyle and fitness niches.',
    status: 'ACTIVE',
    createdAt: days(250),
    lastActive: hours(3),
  },
  // Models — Manager 1
  {
    id: 'u-model-1',
    email: 'emma.model@creatorhub.com',
    password: 'model123',
    role: 'MODEL',
    name: 'Emma Rose',
    username: 'emma_rose',
    avatar: avatar('emma_rose'),
    cover: cover('emma_rose'),
    bio: 'Lifestyle & fashion content creator ✨ Sharing my daily life, outfits, and behind-the-scenes.',
    status: 'ACTIVE',
    verified: true,
    managerId: 'u-mgr-1',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com' },
      { platform: 'Twitter', url: 'https://twitter.com' },
    ],
    subscriptionPrice: 12.99,
    createdAt: days(200),
    lastActive: mins(30),
    subscriberCount: 4820,
    postCount: 156,
    engagement: 8.4,
    revenue: 28450,
  },
  {
    id: 'u-model-2',
    email: 'luna.model@creatorhub.com',
    password: 'model123',
    role: 'MODEL',
    name: 'Luna Sky',
    username: 'luna_sky',
    avatar: avatar('luna_sky'),
    cover: cover('luna_sky'),
    bio: 'Fitness coach & wellness advocate 💪 Daily workouts and healthy living tips.',
    status: 'ACTIVE',
    verified: true,
    managerId: 'u-mgr-1',
    socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com' }],
    subscriptionPrice: 15.99,
    createdAt: days(180),
    lastActive: hours(1),
    subscriberCount: 6230,
    postCount: 203,
    engagement: 9.1,
    revenue: 41200,
  },
  {
    id: 'u-model-3',
    email: 'aria.model@creatorhub.com',
    password: 'model123',
    role: 'MODEL',
    name: 'Aria Belle',
    username: 'aria_belle',
    avatar: avatar('aria_belle'),
    cover: cover('aria_belle'),
    bio: 'Travel photographer 🌍 Exploring the world one city at a time.',
    status: 'ACTIVE',
    verified: false,
    managerId: 'u-mgr-1',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com' },
      { platform: 'YouTube', url: 'https://youtube.com' },
    ],
    subscriptionPrice: 9.99,
    createdAt: days(120),
    lastActive: hours(6),
    subscriberCount: 2150,
    postCount: 78,
    engagement: 6.2,
    revenue: 12800,
  },
  // Models — Manager 2
  {
    id: 'u-model-4',
    email: 'sophia.model@creatorhub.com',
    password: 'model123',
    role: 'MODEL',
    name: 'Sophia Lane',
    username: 'sophia_lane',
    avatar: avatar('sophia_lane'),
    cover: cover('sophia_lane'),
    bio: 'Beauty & makeup artist 💄 Tutorials, reviews, and glam transformations.',
    status: 'ACTIVE',
    verified: true,
    managerId: 'u-mgr-2',
    socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com' }],
    subscriptionPrice: 11.99,
    createdAt: days(160),
    lastActive: mins(45),
    subscriberCount: 5400,
    postCount: 134,
    engagement: 7.8,
    revenue: 32100,
  },
  {
    id: 'u-model-5',
    email: 'mia.model@creatorhub.com',
    password: 'model123',
    role: 'MODEL',
    name: 'Mia Fox',
    username: 'mia_fox',
    avatar: avatar('mia_fox'),
    cover: cover('mia_fox'),
    bio: 'Gaming & cosplay 🎮 Streaming, costume builds, and geek culture.',
    status: 'ACTIVE',
    verified: false,
    managerId: 'u-mgr-2',
    socialLinks: [
      { platform: 'Twitch', url: 'https://twitch.tv' },
      { platform: 'Twitter', url: 'https://twitter.com' },
    ],
    subscriptionPrice: 8.99,
    createdAt: days(90),
    lastActive: hours(2),
    subscriberCount: 3100,
    postCount: 92,
    engagement: 10.2,
    revenue: 18600,
  },
  // Regular Users
  {
    id: 'u-user-1',
    email: 'john.user@email.com',
    password: 'user123',
    role: 'USER',
    name: 'John Carter',
    username: 'john_c',
    avatar: avatar('john_c'),
    bio: 'Just here for the content.',
    status: 'ACTIVE',
    createdAt: days(100),
    lastActive: mins(5),
  },
  {
    id: 'u-user-2',
    email: 'alex.user@email.com',
    password: 'user123',
    role: 'USER',
    name: 'Alex Rivera',
    username: 'alex_r',
    avatar: avatar('alex_r'),
    bio: 'Supporting my favorite creators!',
    status: 'ACTIVE',
    createdAt: days(60),
    lastActive: hours(4),
  },
  {
    id: 'u-user-3',
    email: 'sam.user@email.com',
    password: 'user123',
    role: 'USER',
    name: 'Sam Wilson',
    username: 'sam_w',
    avatar: avatar('sam_w'),
    status: 'ACTIVE',
    createdAt: days(30),
    lastActive: hours(12),
  },
  {
    id: 'u-user-4',
    email: 'chris.user@email.com',
    password: 'user123',
    role: 'USER',
    name: 'Chris Taylor',
    username: 'chris_t',
    avatar: avatar('chris_t'),
    status: 'SUSPENDED',
    createdAt: days(45),
    lastActive: days(2),
  },
];

export const modelIds = ['u-model-1', 'u-model-2', 'u-model-3', 'u-model-4', 'u-model-5'];

// --- Posts ---
const postTexts = [
  'Good morning! Starting the day with a fresh workout 💪',
  'Behind the scenes from today\'s photoshoot ✨',
  'Exclusive content dropping this weekend! Stay tuned 🔥',
  'Loving this new outfit from my favorite brand',
  'Travel diary: Day 3 in Tokyo was incredible 🌸',
  'Quick makeup tutorial — link in bio for the full video',
  'Gaming stream tonight at 8pm! Come hang out 🎮',
  'Thank you all for 5k subscribers! Celebration post coming soon',
  'Morning routine that changed my life',
  'New cosplay reveal — took 40 hours to build!',
  'Sunset hike today 🌅 the view was worth every step',
  'Skincare secrets revealed — subscribers get the full breakdown',
];

export const posts: Post[] = [];
let postIdx = 0;
for (const modelId of modelIds) {
  const numPosts = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPosts; i++) {
    const visibilities: Post['visibility'][] = ['PUBLIC', 'SUBSCRIBERS', 'PPV'];
    const visibility = i < 2 ? 'PUBLIC' : visibilities[i % 3];
    const comments: Comment[] = [
      { id: `c-${postIdx}-1`, userId: 'u-user-1', text: 'Looks amazing!', createdAt: hours(5) },
      { id: `c-${postIdx}-2`, userId: 'u-user-2', text: 'Love this 🔥', createdAt: hours(3) },
    ];
    posts.push({
      id: `p-${postIdx}`,
      modelId,
      text: postTexts[postIdx % postTexts.length],
      media:
        Math.random() > 0.3
          ? [
              {
                type: 'IMAGE',
                url: `https://picsum.photos/seed/post-${postIdx}/800/600`,
                thumbnail: `https://picsum.photos/seed/post-${postIdx}/400/300`,
              },
            ]
          : undefined,
      visibility,
      price: visibility === 'PPV' ? 4.99 + Math.floor(Math.random() * 15) : undefined,
      status: 'PUBLISHED',
      likes: Math.floor(Math.random() * 800) + 50,
      comments,
      bookmarks: Math.floor(Math.random() * 200),
      tips: Math.floor(Math.random() * 50),
      createdAt: hours(postIdx * 5 + i),
    });
    postIdx++;
  }
}

// --- Subscriptions ---
export const subscriptions: Subscription[] = [
  {
    id: 's-1',
    userId: 'u-user-1',
    modelId: 'u-model-1',
    status: 'ACTIVE',
    price: 12.99,
    plan: 'MONTHLY',
    startedAt: days(20),
    renewsAt: futureDays(10),
  },
  {
    id: 's-2',
    userId: 'u-user-1',
    modelId: 'u-model-2',
    status: 'ACTIVE',
    price: 15.99,
    plan: 'QUARTERLY',
    startedAt: days(40),
    renewsAt: futureDays(50),
  },
  {
    id: 's-3',
    userId: 'u-user-1',
    modelId: 'u-model-4',
    status: 'EXPIRED',
    price: 11.99,
    plan: 'MONTHLY',
    startedAt: days(60),
    renewsAt: days(30),
  },
  {
    id: 's-4',
    userId: 'u-user-2',
    modelId: 'u-model-1',
    status: 'ACTIVE',
    price: 12.99,
    plan: 'MONTHLY',
    startedAt: days(15),
    renewsAt: futureDays(15),
  },
  {
    id: 's-5',
    userId: 'u-user-2',
    modelId: 'u-model-5',
    status: 'CANCELLED',
    price: 8.99,
    plan: 'MONTHLY',
    startedAt: days(50),
    renewsAt: days(20),
    cancelledAt: days(22),
  },
  {
    id: 's-6',
    userId: 'u-user-3',
    modelId: 'u-model-3',
    status: 'ACTIVE',
    price: 9.99,
    plan: 'YEARLY',
    startedAt: days(80),
    renewsAt: futureDays(285),
  },
];

// --- Conversations & Messages ---
export const conversations: Conversation[] = [
  { id: 'conv-1', participantIds: ['u-user-1', 'u-model-1'], lastMessageAt: mins(10), unreadCount: 2, typing: 'u-model-1' },
  { id: 'conv-2', participantIds: ['u-user-1', 'u-model-2'], lastMessageAt: hours(2), unreadCount: 0 },
  { id: 'conv-3', participantIds: ['u-user-2', 'u-model-1'], lastMessageAt: hours(5), unreadCount: 1 },
  { id: 'conv-4', participantIds: ['u-user-3', 'u-model-3'], lastMessageAt: days(1), unreadCount: 0 },
];

export const messages: Message[] = [
  { id: 'm-1', conversationId: 'conv-1', senderId: 'u-user-1', type: 'TEXT', text: 'Hey! Love your latest post 🔥', read: true, createdAt: hours(3) },
  { id: 'm-2', conversationId: 'conv-1', senderId: 'u-model-1', type: 'TEXT', text: 'Thank you so much! 💕', read: true, createdAt: hours(2) },
  { id: 'm-3', conversationId: 'conv-1', senderId: 'u-model-1', type: 'PPV', text: 'Here\'s something special just for you', mediaUrl: 'https://picsum.photos/seed/ppvmsg1/600/800', price: 9.99, unlocked: false, read: false, createdAt: mins(15) },
  { id: 'm-4', conversationId: 'conv-1', senderId: 'u-model-1', type: 'TEXT', text: 'Let me know what you think! 😘', read: false, createdAt: mins(10) },
  { id: 'm-5', conversationId: 'conv-2', senderId: 'u-user-1', type: 'TEXT', text: 'Your workouts are the best!', read: true, createdAt: hours(4) },
  { id: 'm-6', conversationId: 'conv-2', senderId: 'u-model-2', type: 'IMAGE', mediaUrl: 'https://picsum.photos/seed/fitmsg/600/400', text: 'Today\'s session 💪', read: true, createdAt: hours(2) },
  { id: 'm-7', conversationId: 'conv-3', senderId: 'u-user-2', type: 'TEXT', text: 'Can\'t wait for the weekend drop!', read: true, createdAt: hours(6) },
  { id: 'm-8', conversationId: 'conv-3', senderId: 'u-model-1', type: 'TEXT', text: 'You won\'t be disappointed 😏', read: false, createdAt: hours(5) },
  { id: 'm-9', conversationId: 'conv-4', senderId: 'u-user-3', type: 'TEXT', text: 'Your travel photos are stunning', read: true, createdAt: days(1) },
  { id: 'm-10', conversationId: 'conv-4', senderId: 'u-model-3', type: 'TEXT', text: 'Thank you! Japan was magical', read: true, createdAt: days(1) },
];

// --- Transactions ---
export const transactions: Transaction[] = [
  { id: 't-1', userId: 'u-user-1', modelId: 'u-model-1', type: 'SUBSCRIPTION', amount: 12.99, status: 'COMPLETED', description: 'Subscription - Emma Rose', createdAt: days(20) },
  { id: 't-2', userId: 'u-user-1', modelId: 'u-model-2', type: 'SUBSCRIPTION', amount: 15.99, status: 'COMPLETED', description: 'Subscription - Luna Sky', createdAt: days(40) },
  { id: 't-3', userId: 'u-user-1', modelId: 'u-model-1', type: 'TIP', amount: 5.00, status: 'COMPLETED', description: 'Tip to Emma Rose', createdAt: days(5) },
  { id: 't-4', userId: 'u-user-1', modelId: 'u-model-1', type: 'PPV', amount: 9.99, status: 'COMPLETED', description: 'PPV Content - Emma Rose', createdAt: days(3) },
  { id: 't-5', userId: 'u-user-2', modelId: 'u-model-1', type: 'SUBSCRIPTION', amount: 12.99, status: 'COMPLETED', description: 'Subscription - Emma Rose', createdAt: days(15) },
  { id: 't-6', userId: 'u-user-2', modelId: 'u-model-5', type: 'SUBSCRIPTION', amount: 8.99, status: 'REFUNDED', description: 'Subscription - Mia Fox (Refunded)', createdAt: days(50) },
  { id: 't-7', userId: 'u-user-3', modelId: 'u-model-3', type: 'SUBSCRIPTION', amount: 95.88, status: 'COMPLETED', description: 'Yearly Subscription - Aria Belle', createdAt: days(80) },
  { id: 't-8', userId: 'u-user-1', modelId: 'u-model-4', type: 'SUBSCRIPTION', amount: 11.99, status: 'COMPLETED', description: 'Subscription - Sophia Lane', createdAt: days(60) },
  { id: 't-9', userId: 'u-model-1', type: 'PAYOUT', amount: 5000, status: 'COMPLETED', description: 'Bank transfer payout', createdAt: days(10) },
  { id: 't-10', userId: 'u-model-2', type: 'PAYOUT', amount: 3200, status: 'PENDING', description: 'Bank transfer payout', createdAt: days(2) },
];

// --- Payouts ---
export const payouts: Payout[] = [
  { id: 'po-1', userId: 'u-model-1', amount: 5000, status: 'COMPLETED', method: 'Bank Transfer', createdAt: days(10) },
  { id: 'po-2', userId: 'u-model-2', amount: 3200, status: 'PENDING', method: 'Bank Transfer', createdAt: days(2) },
  { id: 'po-3', userId: 'u-model-4', amount: 2800, status: 'COMPLETED', method: 'PayPal', createdAt: days(15) },
  { id: 'po-4', userId: 'u-model-3', amount: 1200, status: 'PENDING', method: 'Bank Transfer', createdAt: days(1) },
];

// --- Notifications ---
export const notifications: Notification[] = [
  { id: 'n-1', userId: 'u-user-1', type: 'NEW_MESSAGE', title: 'New Message', body: 'Emma Rose sent you a message', read: false, link: '/messages', createdAt: mins(10) },
  { id: 'n-2', userId: 'u-user-1', type: 'SUBSCRIPTION_RENEWAL', title: 'Subscription Renewing Soon', body: 'Your subscription to Luna Sky renews in 10 days', read: false, link: '/subscriptions', createdAt: hours(6) },
  { id: 'n-3', userId: 'u-user-1', type: 'PAYMENT', title: 'Payment Successful', body: 'Your payment of $9.99 was processed', read: true, link: '/payments', createdAt: days(3) },
  { id: 'n-4', userId: 'u-model-1', type: 'NEW_SUBSCRIBER', title: 'New Subscriber', body: 'John Carter subscribed to your profile', read: false, link: '/model/subscribers', createdAt: days(20) },
  { id: 'n-5', userId: 'u-model-1', type: 'TIP_RECEIVED', title: 'Tip Received', body: 'You received a $5.00 tip from John Carter', read: false, link: '/model/earnings', createdAt: days(5) },
  { id: 'n-6', userId: 'u-model-1', type: 'PPV_PURCHASE', title: 'PPV Purchased', body: 'Your PPV content was purchased for $9.99', read: true, link: '/model/earnings', createdAt: days(3) },
  { id: 'n-7', userId: 'u-mgr-1', type: 'CONTENT_REVIEW', title: 'Content Awaiting Review', body: 'Aria Belle submitted content for review', read: false, link: '/manager/content', createdAt: hours(8) },
  { id: 'n-8', userId: 'u-mgr-1', type: 'PERFORMANCE_ALERT', title: 'Performance Alert', body: 'Aria Belle\'s engagement dropped 15% this week', read: false, link: '/manager/analytics', createdAt: hours(12) },
  { id: 'n-9', userId: 'u-admin', type: 'NEW_REPORT', title: 'New Report', body: 'A user reported a post by Mia Fox', read: false, link: '/admin/reports', createdAt: hours(4) },
  { id: 'n-10', userId: 'u-admin', type: 'VERIFICATION', title: 'Verification Request', body: 'Aria Belle requested account verification', read: false, link: '/admin/models', createdAt: hours(20) },
  { id: 'n-11', userId: 'u-admin', type: 'PAYOUT_ATTENTION', title: 'Payout Requires Attention', body: 'Luna Sky has a pending payout of $3,200', read: false, link: '/admin/payouts', createdAt: days(2) },
];

// --- Reports ---
export const reports: Report[] = [
  { id: 'r-1', reporterId: 'u-user-2', entityType: 'POST', entityId: 'p-3', reason: 'SPAM', description: 'This post seems like spam content', status: 'OPEN', createdAt: hours(4) },
  { id: 'r-2', reporterId: 'u-user-3', entityType: 'MODEL', entityId: 'u-model-5', reason: 'HARASSMENT', description: 'Inappropriate behavior in messages', status: 'UNDER_REVIEW', createdAt: days(1) },
  { id: 'r-3', reporterId: 'u-user-1', entityType: 'POST', entityId: 'p-7', reason: 'COPYRIGHT', description: 'This image appears to be stolen from my account', status: 'RESOLVED', createdAt: days(5) },
  { id: 'r-4', reporterId: 'u-user-2', entityType: 'MESSAGE', entityId: 'm-8', reason: 'FRAUD', description: 'Suspicious payment request', status: 'REJECTED', createdAt: days(7) },
];

// --- Audit Logs ---
export const auditLogs: AuditLog[] = [
  { id: 'al-1', actorId: 'u-admin', action: 'SUSPEND_USER', entity: 'User', entityId: 'u-user-4', ip: '192.168.1.1', createdAt: days(2) },
  { id: 'al-2', actorId: 'u-admin', action: 'VERIFY_MODEL', entity: 'User', entityId: 'u-model-1', ip: '192.168.1.1', createdAt: days(10) },
  { id: 'al-3', actorId: 'u-admin', action: 'APPROVE_PAYOUT', entity: 'Payout', entityId: 'po-1', ip: '192.168.1.1', createdAt: days(10) },
  { id: 'al-4', actorId: 'u-mgr-1', action: 'APPROVE_CONTENT', entity: 'Post', entityId: 'p-5', ip: '10.0.0.2', createdAt: days(3) },
  { id: 'al-5', actorId: 'u-admin', action: 'RESOLVE_REPORT', entity: 'Report', entityId: 'r-3', ip: '192.168.1.1', createdAt: days(5) },
];
