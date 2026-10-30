export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  hostel: string; // e.g. "Hostel A", "Hostel B", "Dept of CS", "Hostel D"
  role: UserRole;
  balance: number; // in virtual coins (integers only)
  referralCode: string; // e.g. "HAWA-7K9A"
  referredBy?: string; // referrer's userId
  referralRewardsEarned: number; // count of 50-coin rewards received (max 10)
  dailyClaimLastAt?: string; // ISO string
  streak: number; // consecutive correct predictions
  badges: string[]; // ['First Call', 'Hot Streak', 'Headliner Hunter', 'Sharp', 'Contrarian', 'Connector', 'Campus Plug']
  onboarded: boolean;
  createdAt: string;
}

export type MarketCategory = 'all' | 'league' | 'fest' | 'campus';
export type MarketType = 'binary' | 'multiple';
export type MarketStatus = 'open' | 'closed' | 'resolved' | 'cancelled';
export type SortOption = 'trending' | 'closing' | 'newest' | 'pool';

export interface Option {
  id: string;
  label: string;
  userPool: number; // total user coins on this option
  seedPool: number; // house seed (default 100)
  totalPool: number; // userPool + seedPool
  percentage: number; // integer 0-100 derived from totalPool / marketTotalPool
}

export interface OddsSnapshot {
  timestamp: string; // ISO string
  percentages: Record<string, number>; // optionId -> percentage (0-100)
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: 'league' | 'fest' | 'campus';
  type: MarketType;
  options: Option[];
  closingTime: string; // ISO string (IST-based representation)
  resolutionSource: string;
  status: MarketStatus;
  creatorId: string;
  creatorName: string;
  totalPool: number; // sum of all option totalPools
  totalUserPool: number; // sum of all option userPools
  winningOptionId?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  reportsCount: number;
  oddsHistory: OddsSnapshot[];
  createdAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  userDisplayName: string;
  userHostel: string;
  marketId: string;
  optionId: string;
  amount: number; // 5 to 100 coins
  estimatedPayout: number;
  actualPayout?: number;
  status: 'open' | 'won' | 'lost' | 'refunded';
  createdAt: string;
}

export interface Proposal {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorHostel: string;
  title: string;
  description: string;
  category: 'league' | 'fest' | 'campus';
  type: MarketType;
  options: string[];
  closingTime: string;
  resolutionSource: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface ReferralEvent {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'joined' | 'rewarded';
  createdAt: string;
  rewardedAt?: string;
}

export interface Comment {
  id: string;
  marketId: string;
  userId: string;
  userDisplayName: string;
  userHostel: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'prediction' | 'referral' | 'daily' | 'resolution' | 'proposal';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: 'approve_proposal' | 'reject_proposal' | 'close_market' | 'edit_close_time' | 'cancel_market' | 'resolve_market' | 'remove_reported_item';
  targetMarketId?: string;
  details: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  hostel: string;
  netCoinsWon: number;
  accuracy: number; // percentage
  resolvedPredictionsCount: number;
  streak: number;
  referralsRewarded: number;
}

export interface HostelLeaderboardEntry {
  hostel: string;
  totalMembers: number;
  totalPredictions: number;
  netCoinsWon: number;
  winRate: number;
}
