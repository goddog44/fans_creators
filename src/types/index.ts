export type Role = 'ADMIN' | 'MANAGER' | 'MODEL' | 'USER';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING';

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'REMOVED';

export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS' | 'VIP' | 'PPV';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export type TransactionType = 'SUBSCRIPTION' | 'PPV' | 'TIP' | 'PAYOUT' | 'REFUND' | 'COMMISSION';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';

export type PayoutStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type ReportReason = 'HARASSMENT' | 'EXPLICIT_CONTENT' | 'SPAM' | 'FRAUD' | 'COPYRIGHT' | 'OTHER';

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'SUBSCRIPTION_CONFIRMED'
  | 'SUBSCRIPTION_RENEWAL'
  | 'PAYMENT'
  | 'PPV_PURCHASE'
  | 'NEW_SUBSCRIBER'
  | 'TIP_RECEIVED'
  | 'PAYOUT'
  | 'NEW_MODEL'
  | 'CONTENT_REVIEW'
  | 'PERFORMANCE_ALERT'
  | 'NEW_REPORT'
  | 'VERIFICATION'
  | 'TRANSACTION_ISSUE'
  | 'PAYOUT_ATTENTION';

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'PPV';

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  username: string;
  avatar: string;
  avatarEmoji?: string;
  cover?: string;
  bio?: string;
  status: AccountStatus;
  verified?: boolean;
  managerId?: string;
  socialLinks?: { platform: string; url: string }[];
  subscriptionPrice?: number;
  createdAt: string;
  lastActive: string;
  // stats
  subscriberCount?: number;
  postCount?: number;
  engagement?: number;
  revenue?: number;
}

export interface Post {
  id: string;
  modelId: string;
  text: string;
  media?: PostMedia[];
  visibility: Visibility;
  price?: number;
  status: ContentStatus;
  likes: number;
  comments: Comment[];
  bookmarks: number;
  tips: number;
  createdAt: string;
  scheduledAt?: string;
  likedByUser?: boolean;
  bookmarkedByUser?: boolean;
}

export interface Story {
  id: string;
  modelId: string;
  text: string;
  createdAt: string;
  expiresAt: string;
  durationHours: number;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  storagePath?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  background?: string;
}

export interface PostMedia {
  id?: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail?: string;
  storagePath?: string;
  thumbnailPath?: string;
  position?: number;
  duration?: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  modelId: string;
  status: SubscriptionStatus;
  price: number;
  plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startedAt: string;
  renewsAt: string;
  cancelledAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  price?: number;
  unlocked?: boolean;
  read: boolean;
  createdAt: string;
  storyId?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
  unreadCount: number;
  typing?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  modelId?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: PayoutStatus;
  method: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  entityType: 'MODEL' | 'POST' | 'MESSAGE' | 'USER';
  entityId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
