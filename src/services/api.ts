import {
  User,
  Market,
  Option,
  Prediction,
  Proposal,
  Comment,
  Notification,
  AuditLog,
  LeaderboardEntry,
  HostelLeaderboardEntry,
  UserRole,
} from '../types';
import {
  INITIAL_DEMO_USER,
  SEED_USERS,
  SEED_MARKETS,
  SEED_PROPOSALS,
  SEED_PREDICTIONS,
  SEED_COMMENTS,
  SEED_REFERRAL_EVENTS,
  SEED_AUDIT_LOGS,
} from './seedData';
import {
  HOUSE_SEED_PER_OPTION,
  MIN_PREDICTION,
  MAX_PREDICTION,
  calculateEstimatedPayout,
  calculateMarketPayouts,
  recalculateMarketPercentages,
} from '../utils/payout';
import {
  generateReferralCode,
  validateReferral,
  canClaimDailyCoins,
  DAILY_CLAIM_AMOUNT,
  REFERRAL_BONUS_FRIEND,
  REFERRAL_BONUS_REFERRER,
  MAX_REFERRAL_REWARDS,
} from '../utils/referral';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'hawa_current_user_v3',
  USERS: 'hawa_users_v3',
  MARKETS: 'hawa_markets_v3',
  PREDICTIONS: 'hawa_predictions_v3',
  PROPOSALS: 'hawa_proposals_v3',
  COMMENTS: 'hawa_comments_v3',
  NOTIFICATIONS: 'hawa_notifications_v3',
  REFERRAL_EVENTS: 'hawa_referral_events_v3',
  AUDIT_LOGS: 'hawa_audit_logs_v3',
  INITIALIZED: 'hawa_initialized_v3',
  PENDING_OTP: 'hawa_pending_otp',
};

class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const safeStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : new MemoryStorage();

class HawaApiService {
  private storage = safeStorage;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(force: boolean = false) {
    // If Supabase is connected, do NOT seed mock data unless explicitly forced (e.g. test runner)
    if (!force && isSupabaseConfigured) {
      return;
    }
    if (!force && this.storage.getItem(STORAGE_KEYS.INITIALIZED)) {
      return;
    }
    this.storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_DEMO_USER));
    this.storage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    this.storage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(SEED_MARKETS));
    this.storage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(SEED_PROPOSALS));
    this.storage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(SEED_PREDICTIONS));
    this.storage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(SEED_COMMENTS));
    this.storage.setItem(STORAGE_KEYS.REFERRAL_EVENTS, JSON.stringify(SEED_REFERRAL_EVENTS));
    this.storage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    this.storage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public async resetDemoData(): Promise<void> {
    this.ensureInitialized(true);
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = this.storage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  // --- Auth & Session (Supabase OTP) ---

  public async sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Standard email format validation (Any email allowed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Mock OTP mode
    this.storage.setItem(
      STORAGE_KEYS.PENDING_OTP,
      JSON.stringify({ email: cleanEmail, code: '123456', sentAt: Date.now() })
    );
    return { success: true };
  }

  public async verifyOtp(
    email: string,
    token: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'email',
      });
      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid 6-digit code' };
      }
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        return {
          success: true,
          user: {
            id: profile.id,
            email: profile.email,
            displayName: profile.display_name || '',
            hostel: profile.hostel || '',
            role: profile.role || 'student',
            balance: Number(profile.balance),
            referralCode: profile.referral_code,
            referredBy: profile.referred_by,
            referralRewardsEarned: profile.referral_rewards_earned || 0,
            dailyClaimLastAt: profile.daily_claim_last_at,
            streak: profile.streak || 0,
            badges: profile.badges || ['First Call'],
            onboarded: profile.onboarded || false,
            createdAt: profile.created_at,
          },
        };
      } else {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            displayName: '',
            hostel: '',
            role: 'student',
            balance: 100,
            referralCode: 'HAWA-' + data.user.id.slice(0, 4).toUpperCase(),
            referralRewardsEarned: 0,
            streak: 0,
            badges: ['First Call'],
            onboarded: false,
            createdAt: data.user.created_at,
          },
        };
      }
    }

    // Mock OTP Verification: accepts 123456 or any 6-digit code in test mode
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    let user = users.find((u) => u.email === cleanEmail);

    if (!user) {
      // First-time user, requires onboarding
      user = {
        id: `u-${Date.now()}`,
        email: cleanEmail,
        displayName: '',
        hostel: '',
        role: 'student',
        balance: 100,
        referralCode: generateReferralCode(),
        referralRewardsEarned: 0,
        streak: 0,
        badges: ['First Call'],
        onboarded: false,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    return { success: true, user };
  }

  public async signInWithOAuth(
    provider: 'google' | 'github' = 'google',
    redirectPath: string = '/login'
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const redirectTo = `${window.location.origin}${redirectPath}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'OAuth initialization failed' };
      }
    }

    // Mock OAuth mode for tests / offline preview
    const mockEmail = `alex.${provider}@campus.ac.in`;
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    let user = users.find((u) => u.email === mockEmail);

    if (!user) {
      user = {
        id: `u-oauth-${Date.now()}`,
        email: mockEmail,
        displayName: 'Campus Explorer',
        hostel: 'Hostel 1',
        role: 'student',
        balance: 100,
        referralCode: generateReferralCode(),
        referralRewardsEarned: 0,
        streak: 0,
        badges: ['First Call'],
        onboarded: false,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    return { success: true };
  }

  public onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = await this.getCurrentUser();
          callback(user);
        } else {
          callback(null);
        }
      });
      return { unsubscribe: () => subscription.unsubscribe() };
    }
    return { unsubscribe: () => {} };
  }

  public async completeOnboarding(params: {
    displayName: string;
    hostel: string;
    referralCode?: string;
  }): Promise<{ success: boolean; user: User; bonusApplied: boolean; error?: string }> {
    const { displayName, hostel, referralCode } = params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('complete_onboarding', {
        p_display_name: displayName,
        p_hostel: hostel,
        p_referral_code: referralCode || null,
      });
      if (error) {
        return { success: false, user: INITIAL_DEMO_USER, bonusApplied: false, error: error.message };
      }
      const currentUser = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
      return { success: true, user: currentUser, bonusApplied: data?.bonus_applied ?? false };
    }

    // Local / Mock RPC
    const currentUser = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);

    let bonusApplied = false;
    let startingCoins = 100;
    let referrer: User | undefined;

    if (referralCode && referralCode.trim()) {
      const refCheck = validateReferral(referralCode, displayName, users);
      if (refCheck.valid && refCheck.referrer) {
        referrer = refCheck.referrer;
        startingCoins += REFERRAL_BONUS_FRIEND; // +50
        bonusApplied = true;
      }
    }

    const updatedUser: User = {
      ...currentUser,
      displayName: displayName.trim(),
      hostel: hostel.trim(),
      balance: startingCoins,
      referredBy: referrer?.id,
      onboarded: true,
    };

    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
    } else {
      users.push(updatedUser);
    }

    this.setItem(STORAGE_KEYS.USERS, users);
    this.setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    if (referrer) {
      const events = this.getItem<any[]>(STORAGE_KEYS.REFERRAL_EVENTS, []);
      events.push({
        id: `ref-${Date.now()}`,
        referrerId: referrer.id,
        referredId: updatedUser.id,
        status: 'joined',
        createdAt: new Date().toISOString(),
      });
      this.setItem(STORAGE_KEYS.REFERRAL_EVENTS, events);
    }

    return { success: true, user: updatedUser, bonusApplied };
  }

  public async getCurrentUser(): Promise<User | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          return {
            id: profile.id,
            email: profile.email,
            displayName: profile.display_name || '',
            hostel: profile.hostel || '',
            role: profile.role || 'student',
            balance: Number(profile.balance),
            referralCode: profile.referral_code,
            referredBy: profile.referred_by,
            referralRewardsEarned: profile.referral_rewards_earned || 0,
            dailyClaimLastAt: profile.daily_claim_last_at,
            streak: profile.streak || 0,
            badges: profile.badges || ['First Call'],
            onboarded: profile.onboarded || false,
            createdAt: profile.created_at,
          };
        } else {
          // Authenticated via Supabase, awaiting onboarding
          return {
            id: user.id,
            email: user.email || '',
            displayName: '',
            hostel: '',
            role: 'student',
            balance: 100,
            referralCode: 'HAWA-' + user.id.slice(0, 4).toUpperCase(),
            referralRewardsEarned: 0,
            streak: 0,
            badges: ['First Call'],
            onboarded: false,
            createdAt: user.created_at,
          };
        }
      }
      return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    }
    return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public async setCurrentUser(user: User): Promise<void> {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) users[idx] = user;
    else users.push(user);
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    this.storage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  public async switchRole(role: UserRole): Promise<User> {
    const user = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    const updated: User = { ...user, role };
    await this.setCurrentUser(updated);
    return updated;
  }

  public async getUsers(): Promise<User[]> {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, []);
  }

  // --- RPC: claim_daily ---

  public async claimDailyCoins(userId?: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('claim_daily');
      if (error) return { success: false, newBalance: 0, error: error.message };
      return { success: true, newBalance: data?.new_balance ?? 0 };
    }

    const user = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    if (!user) return { success: false, newBalance: 0, error: 'Not logged in' };
    const check = canClaimDailyCoins(user.dailyClaimLastAt);
    if (!check.canClaim) {
      return { success: false, newBalance: user.balance, error: `Daily coins available in ${check.formattedCountdown}` };
    }

    const updatedUser: User = {
      ...user,
      balance: user.balance + DAILY_CLAIM_AMOUNT,
      dailyClaimLastAt: new Date().toISOString(),
    };

    await this.setCurrentUser(updatedUser);
    return { success: true, newBalance: updatedUser.balance };
  }

  // --- RPC: place_prediction ---

  public async placePrediction(params: {
    userId: string;
    marketId: string;
    optionId: string;
    amount: number;
  }): Promise<{ success: boolean; prediction?: Prediction; error?: string }> {
    const { userId, marketId, optionId, amount } = params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('place_prediction', {
        p_market_id: marketId,
        p_option_id: optionId,
        p_amount: Math.floor(amount),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Local / Mock validation & calculation
    const cleanAmount = Math.floor(amount);
    if (cleanAmount < MIN_PREDICTION || cleanAmount > MAX_PREDICTION) {
      return { success: false, error: `Predictions must be between ${MIN_PREDICTION} and ${MAX_PREDICTION} coins.` };
    }

    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.balance < cleanAmount) return { success: false, error: 'Insufficient coin balance.' };

    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const market = markets.find((m) => m.id === marketId);
    if (!market) return { success: false, error: 'Market not found.' };
    if (market.status !== 'open' || new Date(market.closingTime).getTime() <= Date.now()) {
      return { success: false, error: 'This market is closed.' };
    }
    if (market.creatorId === userId) {
      return { success: false, error: 'Cannot predict on your own proposed market.' };
    }

    const option = market.options.find((o) => o.id === optionId);
    if (!option) return { success: false, error: 'Option not found.' };

    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const userMarketPredictions = predictions.filter((p) => p.marketId === marketId && p.userId === userId);
    const existingStaked = userMarketPredictions.reduce((sum, p) => sum + p.amount, 0);
    if (existingStaked + cleanAmount > MAX_PREDICTION) {
      return { success: false, error: `Market limit reached (Max ${MAX_PREDICTION} coins per market).` };
    }

    const updatedUser: User = { ...user, balance: user.balance - cleanAmount };
    const estimatedPayout = calculateEstimatedPayout(cleanAmount, option.totalPool, market.totalPool);

    option.userPool += cleanAmount;
    option.totalPool += cleanAmount;
    market.totalUserPool += cleanAmount;
    market.totalPool += cleanAmount;
    market.options = recalculateMarketPercentages(market.options);

    const newPrediction: Prediction = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userDisplayName: user.displayName,
      userHostel: user.hostel,
      marketId,
      optionId,
      amount: cleanAmount,
      estimatedPayout,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    predictions.unshift(newPrediction);

    // Referral bonus check on first prediction
    const userPredCount = predictions.filter((p) => p.userId === userId).length;
    let updatedReferrerUser: User | undefined;
    if (userPredCount === 1 && user.referredBy) {
      const referrer = users.find((u) => u.id === user.referredBy);
      if (referrer && (referrer.referralRewardsEarned || 0) < MAX_REFERRAL_REWARDS) {
        referrer.balance += REFERRAL_BONUS_REFERRER;
        referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + 1;
        updatedReferrerUser = referrer;
      }
    }

    this.setItem(STORAGE_KEYS.MARKETS, markets);
    this.setItem(STORAGE_KEYS.PREDICTIONS, predictions);

    const uIdx = users.findIndex((u) => u.id === user.id);
    if (uIdx !== -1) users[uIdx] = updatedUser;
    this.setItem(STORAGE_KEYS.USERS, users);

    const currentSession = this.getItem<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_DEMO_USER);
    if (currentSession.id === updatedUser.id) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }

    if (updatedReferrerUser) {
      const rIdx = users.findIndex((u) => u.id === updatedReferrerUser!.id);
      if (rIdx !== -1) {
        users[rIdx] = updatedReferrerUser;
        this.setItem(STORAGE_KEYS.USERS, users);
      }
    }

    return { success: true, prediction: newPrediction };
  }

  // --- RPC: resolve_market ---

  public async resolveMarket(
    marketId: string,
    winningOptionId: string,
    note: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('resolve_market', {
        p_market_id: marketId,
        p_winning_option_id: winningOptionId,
        p_note: note,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const market = markets.find((m) => m.id === marketId);
    if (!market) return { success: false, error: 'Market not found' };

    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);

    const resolution = calculateMarketPayouts(market, predictions, winningOptionId, false);

    market.status = 'resolved';
    market.winningOptionId = winningOptionId;
    market.resolvedAt = new Date().toISOString();
    market.resolutionNote = note;

    for (const p of predictions) {
      if (p.marketId === marketId) {
        if (resolution.isRefund) {
          p.status = 'refunded';
          p.actualPayout = p.amount;
        } else if (p.optionId === winningOptionId) {
          p.status = 'won';
          p.actualPayout = resolution.payouts[p.id] || 0;
        } else {
          p.status = 'lost';
          p.actualPayout = 0;
        }
      }
    }

    for (const [userId, payoutAmount] of Object.entries(resolution.userRefunds)) {
      const u = users.find((usr) => usr.id === userId);
      if (u) {
        u.balance += payoutAmount;
        if (!resolution.isRefund && payoutAmount > 0) {
          u.streak = (u.streak || 0) + 1;
          this.addNotification({
            userId: u.id,
            title: 'Prediction Won! 🏆',
            message: `You won ${payoutAmount} coins on "${market.title}"!`,
            type: 'resolution',
          });
        } else if (!resolution.isRefund) {
          u.streak = 0;
        }
      }
    }

    this.setItem(STORAGE_KEYS.MARKETS, markets);
    this.setItem(STORAGE_KEYS.PREDICTIONS, predictions);
    this.setItem(STORAGE_KEYS.USERS, users);

    const admin = await this.getCurrentUser();
    if (admin) {
      const currentRefreshed = users.find((u) => u.id === admin.id);
      if (currentRefreshed) this.setItem(STORAGE_KEYS.CURRENT_USER, currentRefreshed);
    }

    return { success: true };
  }

  // --- RPC: cancel_market ---

  public async cancelMarket(marketId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('cancel_market', {
        p_market_id: marketId,
        p_reason: reason || 'Cancelled by admin.',
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const market = markets.find((m) => m.id === marketId);
    if (!market) return { success: false, error: 'Market not found' };

    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);

    const resolution = calculateMarketPayouts(market, predictions, undefined, true);

    market.status = 'cancelled';
    market.resolvedAt = new Date().toISOString();
    market.resolutionNote = reason || 'Market cancelled. Stakes refunded.';

    for (const p of predictions) {
      if (p.marketId === marketId) {
        p.status = 'refunded';
        p.actualPayout = p.amount;
      }
    }

    for (const [userId, refundAmount] of Object.entries(resolution.userRefunds)) {
      const u = users.find((usr) => usr.id === userId);
      if (u) u.balance += refundAmount;
    }

    this.setItem(STORAGE_KEYS.MARKETS, markets);
    this.setItem(STORAGE_KEYS.PREDICTIONS, predictions);
    this.setItem(STORAGE_KEYS.USERS, users);

    return { success: true };
  }

  // --- View Polling: option_pools ---

  public async getMarketOptionPools(marketId: string): Promise<Option[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('option_pools')
        .select('*')
        .eq('market_id', marketId);

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.option_id,
          label: d.label,
          userPool: Number(d.user_pool),
          seedPool: Number(d.seed_pool),
          totalPool: Number(d.total_pool),
          percentage: Number(d.percentage),
        }));
      }
    }

    const market = await this.getMarketById(marketId);
    return market ? market.options : [];
  }

  // --- View: leaderboard ---

  public async getLeaderboard(
    _period: 'week' | 'month' | 'all',
    metric: 'netCoins' | 'accuracy' | 'streak' | 'referrals'
  ): Promise<LeaderboardEntry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('leaderboard').select('*');
      if (data) {
        const mapped: LeaderboardEntry[] = data.map((d: any) => ({
          userId: d.user_id,
          displayName: d.display_name,
          hostel: d.hostel,
          netCoinsWon: Number(d.net_coins_won),
          accuracy: Number(d.accuracy),
          resolvedPredictionsCount: Number(d.resolved_predictions_count),
          streak: Number(d.streak),
          referralsRewarded: Number(d.referrals_rewarded),
        }));

        if (metric === 'accuracy') {
          return mapped
            .filter((e) => e.resolvedPredictionsCount >= 5)
            .sort((a, b) => b.accuracy - a.accuracy);
        }
        if (metric === 'streak') return mapped.sort((a, b) => b.streak - a.streak);
        if (metric === 'referrals') return mapped.sort((a, b) => b.referralsRewarded - a.referralsRewarded);
        return mapped.sort((a, b) => b.netCoinsWon - a.netCoinsWon);
      }
    }

    // Local fallback
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const events = this.getItem<any[]>(STORAGE_KEYS.REFERRAL_EVENTS, []);

    const entries: LeaderboardEntry[] = users.map((u) => {
      const userPreds = predictions.filter((p) => p.userId === u.id);
      const resolvedPreds = userPreds.filter((p) => p.status === 'won' || p.status === 'lost');
      const wonPreds = userPreds.filter((p) => p.status === 'won');
      const totalStaked = resolvedPreds.reduce((sum, p) => sum + p.amount, 0);
      const totalWon = wonPreds.reduce((sum, p) => sum + (p.actualPayout || 0), 0);
      const netCoinsWon = totalWon - totalStaked;
      const accuracy = resolvedPreds.length > 0 ? Math.round((wonPreds.length / resolvedPreds.length) * 100) : 0;
      const referralsRewarded = events.filter((e) => e.referrerId === u.id && e.status === 'rewarded').length;

      return {
        userId: u.id,
        displayName: u.displayName,
        hostel: u.hostel,
        netCoinsWon,
        accuracy,
        resolvedPredictionsCount: resolvedPreds.length,
        streak: u.streak || 0,
        referralsRewarded,
      };
    });

    if (metric === 'accuracy') {
      return entries.filter((e) => e.resolvedPredictionsCount >= 5).sort((a, b) => b.accuracy - a.accuracy);
    }
    if (metric === 'streak') return entries.sort((a, b) => b.streak - a.streak);
    if (metric === 'referrals') return entries.sort((a, b) => b.referralsRewarded - a.referralsRewarded);
    return entries.sort((a, b) => b.netCoinsWon - a.netCoinsWon);
  }

  // --- Public Stats (Slide 10 social proof) ---

  public async getPublicStats(): Promise<{
    studentsCount: number;
    activeMarketsCount: number;
    totalPredictionsCount: number;
  }> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.rpc('get_public_stats');
      if (data) {
        return {
          studentsCount: data.students_count || 0,
          activeMarketsCount: data.active_markets_count || 0,
          totalPredictionsCount: data.total_predictions_count || 0,
        };
      }
    }

    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);

    return {
      studentsCount: users.length,
      activeMarketsCount: markets.filter((m) => m.status === 'open').length,
      totalPredictionsCount: predictions.length,
    };
  }

  // Markets
  public async getMarkets(): Promise<Market[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: dbMarkets, error } = await supabase
        .from('markets')
        .select('*, market_options (*)')
        .order('created_at', { ascending: false });

      if (!error && dbMarkets) {
        return dbMarkets.map((m: any) => {
          const rawOpts = m.market_options || [];
          const totalPool = rawOpts.reduce((sum: number, o: any) => sum + Number(o.seed_pool || 100), 0);
          const options: Option[] = rawOpts.map((o: any) => {
            const seed = Number(o.seed_pool || 100);
            return {
              id: o.id,
              label: o.label,
              userPool: 0,
              seedPool: seed,
              totalPool: seed,
              percentage: totalPool > 0 ? Math.round((seed / totalPool) * 100) : 50,
            };
          });

          return {
            id: m.id,
            title: m.title,
            description: m.description || '',
            category: m.category,
            type: m.type,
            closingTime: m.closing_time,
            resolutionSource: m.resolution_source,
            status: m.status,
            creatorId: m.creator_id,
            creatorName: m.creator_name,
            totalPool,
            totalUserPool: 0,
            options,
            winningOptionId: m.winning_option_id,
            resolvedAt: m.resolved_at,
            resolutionNote: m.resolution_note,
            reportsCount: m.reports_count || 0,
            oddsHistory: [],
            createdAt: m.created_at,
          };
        });
      }
    }
    return this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
  }

  public async getMarketById(id: string): Promise<Market | undefined> {
    const list = await this.getMarkets();
    return list.find((m) => m.id === id);
  }

  public async reportMarket(marketId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: m } = await supabase.from('markets').select('reports_count').eq('id', marketId).single();
      if (m) {
        await supabase.from('markets').update({ reports_count: (m.reports_count || 0) + 1 }).eq('id', marketId);
      }
    }
    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const m = markets.find((item) => item.id === marketId);
    if (m) {
      m.reportsCount = (m.reportsCount || 0) + 1;
      this.setItem(STORAGE_KEYS.MARKETS, markets);
    }
  }

  public async getPredictions(marketId?: string, userId?: string): Promise<Prediction[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('predictions').select('*');
      if (marketId) query = query.eq('market_id', marketId);
      if (userId) query = query.eq('user_id', userId);
      const { data } = await query;
      if (data) {
        return data.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          userDisplayName: p.user_display_name,
          userHostel: p.user_hostel,
          marketId: p.market_id,
          optionId: p.option_id,
          amount: Number(p.amount),
          estimatedPayout: Number(p.estimated_payout || p.amount),
          actualPayout: p.actual_payout ? Number(p.actual_payout) : undefined,
          status: p.status,
          createdAt: p.created_at,
        }));
      }
    }
    let list = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    if (marketId) list = list.filter((p) => p.marketId === marketId);
    if (userId) list = list.filter((p) => p.userId === userId);
    return list;
  }

  public async getComments(marketId: string): Promise<Comment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false });
      if (data) {
        return data.map((c: any) => ({
          id: c.id,
          marketId: c.market_id,
          userId: c.user_id,
          userDisplayName: c.user_display_name,
          userHostel: c.user_hostel,
          text: c.text,
          createdAt: c.created_at,
        }));
      }
    }
    const all = this.getItem<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    return all.filter((c) => c.marketId === marketId);
  }

  public async addComment(marketId: string, userId: string, text: string): Promise<Comment> {
    const user = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('comments')
        .insert({
          market_id: marketId,
          user_id: user?.id || userId,
          user_display_name: user?.displayName || 'Student',
          user_hostel: user?.hostel || 'Hostel',
          text: text.trim(),
        })
        .select('*')
        .single();
      if (data) {
        return {
          id: data.id,
          marketId: data.market_id,
          userId: data.user_id,
          userDisplayName: data.user_display_name,
          userHostel: data.user_hostel,
          text: data.text,
          createdAt: data.created_at,
        };
      }
    }
    const comment: Comment = {
      id: `c-${Date.now()}`,
      marketId,
      userId: user?.id || userId,
      userDisplayName: user?.displayName || 'Student',
      userHostel: user?.hostel || 'Hostel',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const all = this.getItem<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    all.unshift(comment);
    this.setItem(STORAGE_KEYS.COMMENTS, all);
    return comment;
  }

  // Proposals
  public async getProposals(): Promise<Proposal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        return data.map((p: any) => ({
          id: p.id,
          creatorId: p.creator_id,
          creatorName: p.creator_name,
          creatorHostel: p.creator_hostel,
          title: p.title,
          description: p.description,
          category: p.category,
          type: p.type,
          options: p.options,
          closingTime: p.closing_time,
          resolutionSource: p.resolution_source,
          status: p.status,
          rejectionReason: p.rejection_reason,
          createdAt: p.created_at,
        }));
      }
    }
    return this.getItem<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
  }

  public async submitProposal(proposal: Omit<Proposal, 'id' | 'status' | 'createdAt'>): Promise<Proposal> {
    const user = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          creator_id: user?.id,
          creator_name: user?.displayName || proposal.creatorName,
          creator_hostel: user?.hostel || proposal.creatorHostel,
          title: proposal.title,
          description: proposal.description,
          category: proposal.category,
          type: proposal.type,
          options: proposal.options,
          closing_time: proposal.closingTime,
          resolution_source: proposal.resolutionSource,
          status: 'pending',
        })
        .select('*')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          creatorId: data.creator_id,
          creatorName: data.creator_name,
          creatorHostel: data.creator_hostel,
          title: data.title,
          description: data.description,
          category: data.category,
          type: data.type,
          options: data.options,
          closingTime: data.closing_time,
          resolutionSource: data.resolution_source,
          status: data.status,
          createdAt: data.created_at,
        };
      }
    }
    const newProp: Proposal = {
      ...proposal,
      id: `prop-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const list = this.getItem<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
    list.unshift(newProp);
    this.setItem(STORAGE_KEYS.PROPOSALS, list);
    return newProp;
  }

  public async approveProposal(
    proposalId: string,
    overrides?: { title?: string; closingTime?: string; resolutionSource?: string }
  ): Promise<Market> {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch proposal
      const { data: prop, error: pErr } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (pErr || !prop) throw new Error('Proposal not found');

      // 2. Mark proposal approved
      await supabase.from('proposals').update({ status: 'approved' }).eq('id', proposalId);

      // 3. Create market in Supabase
      const { data: newMarket, error: mErr } = await supabase
        .from('markets')
        .insert({
          title: overrides?.title || prop.title,
          description: prop.description,
          category: prop.category,
          type: prop.type,
          closing_time: overrides?.closingTime || prop.closing_time,
          resolution_source: overrides?.resolutionSource || prop.resolution_source,
          status: 'open',
          creator_id: prop.creator_id,
          creator_name: prop.creator_name,
        })
        .select('*')
        .single();

      if (mErr || !newMarket) throw new Error(mErr?.message || 'Failed to create market');

      // 4. Create market options
      const optLabels: string[] = prop.options || ['Yes', 'No'];
      const optionsToInsert = optLabels.map((lbl: string, idx: number) => ({
        id: `opt-${idx + 1}`,
        market_id: newMarket.id,
        label: lbl,
        seed_pool: HOUSE_SEED_PER_OPTION,
      }));

      await supabase.from('market_options').insert(optionsToInsert);

      return {
        id: newMarket.id,
        title: newMarket.title,
        description: newMarket.description,
        category: newMarket.category,
        type: newMarket.type,
        options: optionsToInsert.map((o: any) => ({
          id: o.id,
          label: o.label,
          userPool: 0,
          seedPool: o.seed_pool,
          totalPool: o.seed_pool,
          percentage: Math.round(100 / optLabels.length),
        })),
        closingTime: newMarket.closing_time,
        resolutionSource: newMarket.resolution_source,
        status: 'open',
        creatorId: newMarket.creator_id,
        creatorName: newMarket.creator_name,
        totalPool: optLabels.length * HOUSE_SEED_PER_OPTION,
        totalUserPool: 0,
        reportsCount: 0,
        oddsHistory: [],
        createdAt: newMarket.created_at,
      };
    }

    const proposals = this.getItem<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
    const prop = proposals.find((p) => p.id === proposalId);
    if (!prop) throw new Error('Proposal not found');

    prop.status = 'approved';
    this.setItem(STORAGE_KEYS.PROPOSALS, proposals);

    const options: Option[] = prop.options.map((optLabel, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      label: optLabel,
      userPool: 0,
      seedPool: HOUSE_SEED_PER_OPTION,
      totalPool: HOUSE_SEED_PER_OPTION,
      percentage: Math.round(100 / prop.options.length),
    }));

    const totalSeed = options.length * HOUSE_SEED_PER_OPTION;

    const newMarket: Market = {
      id: `m-${Date.now()}`,
      title: overrides?.title || prop.title,
      description: prop.description,
      category: prop.category,
      type: prop.type,
      options,
      closingTime: overrides?.closingTime || prop.closingTime,
      resolutionSource: overrides?.resolutionSource || prop.resolutionSource,
      status: 'open',
      creatorId: prop.creatorId,
      creatorName: prop.creatorName,
      totalPool: totalSeed,
      totalUserPool: 0,
      reportsCount: 0,
      oddsHistory: [
        {
          timestamp: new Date().toISOString(),
          percentages: options.reduce((acc, o) => ({ ...acc, [o.id]: o.percentage }), {}),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    markets.unshift(newMarket);
    this.setItem(STORAGE_KEYS.MARKETS, markets);
    return newMarket;
  }

  public async rejectProposal(proposalId: string, reason: string): Promise<void> {
    const proposals = this.getItem<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
    const prop = proposals.find((p) => p.id === proposalId);
    if (!prop) throw new Error('Proposal not found');
    prop.status = 'rejected';
    prop.rejectionReason = reason;
    this.setItem(STORAGE_KEYS.PROPOSALS, proposals);
  }

  public async closeMarketEarly(marketId: string): Promise<void> {
    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const m = markets.find((item) => item.id === marketId);
    if (m) {
      m.status = 'closed';
      m.closingTime = new Date().toISOString();
      this.setItem(STORAGE_KEYS.MARKETS, markets);
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public async getStats(): Promise<any> {
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const markets = this.getItem<Market[]>(STORAGE_KEYS.MARKETS, []);
    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const openPredictions = predictions.filter((p) => p.status === 'open');

    return {
      totalUsers: users.length,
      activeMarkets: markets.filter((m) => m.status === 'open').length,
      coinsInPlay: openPredictions.reduce((sum, p) => sum + p.amount, 0),
      mostActiveCategory: 'CAMPUS',
    };
  }

  public async getReferralStats(userId: string): Promise<{
    referralCode: string;
    friendsJoined: number;
    friendsPredicted: number;
    coinsEarned: number;
    remainingSlots: number;
  }> {
    const user = (await this.getCurrentUser()) || INITIAL_DEMO_USER;
    const events = this.getItem<any[]>(STORAGE_KEYS.REFERRAL_EVENTS, []);
    const userEvents = events.filter((e) => e.referrerId === userId);
    const friendsJoined = userEvents.length;
    const friendsPredicted = userEvents.filter((e) => e.status === 'rewarded').length;

    return {
      referralCode: user.referralCode,
      friendsJoined,
      friendsPredicted,
      coinsEarned: friendsPredicted * REFERRAL_BONUS_REFERRER,
      remainingSlots: Math.max(0, MAX_REFERRAL_REWARDS - friendsPredicted),
    };
  }

  public async getHostelLeaderboard(): Promise<HostelLeaderboardEntry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: profiles } = await supabase.from('profiles').select('hostel');
      const { data: preds } = await supabase.from('predictions').select('user_hostel, amount, actual_payout, status');

      const hostelMap: Record<string, any> = {};

      if (profiles) {
        for (const u of profiles) {
          if (!u.hostel) continue;
          if (!hostelMap[u.hostel]) {
            hostelMap[u.hostel] = { totalMembers: 0, totalPredictions: 0, wonCount: 0, resolvedCount: 0, netWon: 0 };
          }
          hostelMap[u.hostel].totalMembers += 1;
        }
      }

      if (preds) {
        for (const p of preds) {
          if (!p.user_hostel) continue;
          if (!hostelMap[p.user_hostel]) {
            hostelMap[p.user_hostel] = { totalMembers: 1, totalPredictions: 0, wonCount: 0, resolvedCount: 0, netWon: 0 };
          }
          hostelMap[p.user_hostel].totalPredictions += 1;
          if (p.status === 'won') {
            hostelMap[p.user_hostel].wonCount += 1;
            hostelMap[p.user_hostel].resolvedCount += 1;
            hostelMap[p.user_hostel].netWon += (p.actual_payout || 0) - p.amount;
          } else if (p.status === 'lost') {
            hostelMap[p.user_hostel].resolvedCount += 1;
            hostelMap[p.user_hostel].netWon -= p.amount;
          }
        }
      }

      return Object.entries(hostelMap).map(([hostel, data]) => ({
        hostel,
        totalMembers: data.totalMembers,
        totalPredictions: data.totalPredictions,
        netCoinsWon: data.netWon,
        winRate: data.resolvedCount > 0 ? Math.round((data.wonCount / data.resolvedCount) * 100) : 0,
      })).sort((a, b) => b.netCoinsWon - a.netCoinsWon);
    }

    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    const predictions = this.getItem<Prediction[]>(STORAGE_KEYS.PREDICTIONS, []);
    const hostelMap: Record<string, any> = {};

    for (const u of users) {
      if (!hostelMap[u.hostel]) {
        hostelMap[u.hostel] = { totalMembers: 0, totalPredictions: 0, wonCount: 0, resolvedCount: 0, netWon: 0 };
      }
      hostelMap[u.hostel].totalMembers += 1;
    }

    for (const p of predictions) {
      if (!hostelMap[p.userHostel]) {
        hostelMap[p.userHostel] = { totalMembers: 1, totalPredictions: 0, wonCount: 0, resolvedCount: 0, netWon: 0 };
      }
      hostelMap[p.userHostel].totalPredictions += 1;
      if (p.status === 'won') {
        hostelMap[p.userHostel].wonCount += 1;
        hostelMap[p.userHostel].resolvedCount += 1;
        hostelMap[p.userHostel].netWon += (p.actualPayout || 0) - p.amount;
      } else if (p.status === 'lost') {
        hostelMap[p.userHostel].resolvedCount += 1;
        hostelMap[p.userHostel].netWon -= p.amount;
      }
    }

    return Object.entries(hostelMap).map(([hostel, data]) => ({
      hostel,
      totalMembers: data.totalMembers,
      totalPredictions: data.totalPredictions,
      netCoinsWon: data.netWon,
      winRate: data.resolvedCount > 0 ? Math.round((data.wonCount / data.resolvedCount) * 100) : 0,
    })).sort((a, b) => b.netCoinsWon - a.netCoinsWon);
  }

  public async getNotifications(userId: string): Promise<Notification[]> {
    const all = this.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter((n) => n.userId === userId);
  }

  public async markNotificationRead(id: string): Promise<void> {
    const all = this.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const target = all.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  public async createUser(
    displayName: string,
    hostel: string,
    referralCode?: string
  ): Promise<{ user: User; bonusCredited: boolean; error?: string }> {
    const email = `${displayName.toLowerCase().replace(/\s+/g, '.')}@college.ac.in`;
    const otpRes = await this.verifyOtp(email, '123456');
    if (!otpRes.user) return { user: INITIAL_DEMO_USER, bonusCredited: false, error: 'Failed' };
    const onbRes = await this.completeOnboarding({ displayName, hostel, referralCode });
    return { user: onbRes.user, bonusCredited: onbRes.bonusApplied, error: onbRes.error };
  }

  private addNotification(entry: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const all = this.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift({
      ...entry,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
  }
}

export const api = new HawaApiService();
