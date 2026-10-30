import { describe, it, expect } from 'vitest';
import {
  calculateImpliedPercentage,
  calculateEstimatedPayout,
  calculateMarketPayouts,
  recalculateMarketPercentages,
} from '../payout';
import {
  generateReferralCode,
  isValidReferralCodeFormat,
  validateReferral,
  canClaimDailyCoins,
  getISTDateString,
  MAX_REFERRAL_REWARDS,
} from '../referral';
import { Market, Prediction, User } from '../../types';

describe('Parimutuel Payout & Odds Logic', () => {
  it('calculates implied percentage with house seeds', () => {
    // 100 seed + 100 seed = 50% each
    expect(calculateImpliedPercentage(100, 200)).toBe(50);
    // 300 vs 100 in 400 total = 75%
    expect(calculateImpliedPercentage(300, 400)).toBe(75);
    // Clamping avoids 0% or 100%
    expect(calculateImpliedPercentage(1, 10000)).toBe(1);
  });

  it('calculates estimated payout rounded down', () => {
    // Option pool = 200, market total = 400. Stake = 50.
    // preview = floor((50 / (200 + 50)) * (400 + 50)) = floor((50 / 250) * 450) = floor(0.2 * 450) = 90
    const est = calculateEstimatedPayout(50, 200, 400);
    expect(est).toBe(90);
  });

  it('correctly splits USER pool proportionally to winning option stakes, excluding seed', () => {
    const mockMarket: Market = {
      id: 'm1',
      title: 'Will Hostel A beat Hostel C?',
      description: 'Football final',
      category: 'league',
      type: 'binary',
      options: [
        { id: 'opt-yes', label: 'Yes', userPool: 150, seedPool: 100, totalPool: 250, percentage: 63 },
        { id: 'opt-no', label: 'No', userPool: 50, seedPool: 100, totalPool: 150, percentage: 37 },
      ],
      closingTime: '2026-11-01T18:00:00Z',
      resolutionSource: 'Official scoresheet',
      status: 'open',
      creatorId: 'u-admin',
      creatorName: 'Sports Sec',
      totalPool: 400, // 200 seed + 200 user
      totalUserPool: 200,
      reportsCount: 0,
      oddsHistory: [],
      createdAt: '2026-10-30T00:00:00Z',
    };

    const predictions: Prediction[] = [
      // 3 users on Yes (stakes: 50, 50, 50 = total 150)
      { id: 'p1', userId: 'u1', userDisplayName: 'Aarav', userHostel: 'Hostel A', marketId: 'm1', optionId: 'opt-yes', amount: 50, estimatedPayout: 0, status: 'open', createdAt: '' },
      { id: 'p2', userId: 'u2', userDisplayName: 'Bhavna', userHostel: 'Hostel B', marketId: 'm1', optionId: 'opt-yes', amount: 50, estimatedPayout: 0, status: 'open', createdAt: '' },
      { id: 'p3', userId: 'u3', userDisplayName: 'Chirag', userHostel: 'Hostel A', marketId: 'm1', optionId: 'opt-yes', amount: 50, estimatedPayout: 0, status: 'open', createdAt: '' },
      // 1 user on No (stake 50)
      { id: 'p4', userId: 'u4', userDisplayName: 'Divya', userHostel: 'Hostel C', marketId: 'm1', optionId: 'opt-no', amount: 50, estimatedPayout: 0, status: 'open', createdAt: '' },
    ];

    // Total user pool = 200. Yes wins. Winning pool = 150.
    // Each winner stake = 50.
    // Payout = floor((50 / 150) * 200) = floor(66.666) = 66 coins.
    const res = calculateMarketPayouts(mockMarket, predictions, 'opt-yes', false);

    expect(res.isRefund).toBe(false);
    expect(res.payouts['p1']).toBe(66);
    expect(res.payouts['p2']).toBe(66);
    expect(res.payouts['p3']).toBe(66);
    expect(res.payouts['p4']).toBe(0); // Lost
    expect(res.userRefunds['u1']).toBe(66);
    expect(res.totalPaidOut).toBe(198); // 3 * 66, integer floor
  });

  it('refunds all stakes 100% when market is cancelled', () => {
    const mockMarket: Market = {
      id: 'm2',
      title: 'Rainout match',
      description: '',
      category: 'league',
      type: 'binary',
      options: [
        { id: 'opt-1', label: 'Team 1', userPool: 40, seedPool: 100, totalPool: 140, percentage: 50 },
        { id: 'opt-2', label: 'Team 2', userPool: 40, seedPool: 100, totalPool: 140, percentage: 50 },
      ],
      closingTime: '2026-11-01T18:00:00Z',
      resolutionSource: '',
      status: 'cancelled',
      creatorId: 'u-admin',
      creatorName: 'Admin',
      totalPool: 280,
      totalUserPool: 80,
      reportsCount: 0,
      oddsHistory: [],
      createdAt: '',
    };

    const predictions: Prediction[] = [
      { id: 'p1', userId: 'u1', userDisplayName: 'Aarav', userHostel: 'Hostel A', marketId: 'm2', optionId: 'opt-1', amount: 40, estimatedPayout: 0, status: 'open', createdAt: '' },
      { id: 'p2', userId: 'u2', userDisplayName: 'Bhavna', userHostel: 'Hostel B', marketId: 'm2', optionId: 'opt-2', amount: 40, estimatedPayout: 0, status: 'open', createdAt: '' },
    ];

    const res = calculateMarketPayouts(mockMarket, predictions, undefined, true);
    expect(res.isRefund).toBe(true);
    expect(res.payouts['p1']).toBe(40);
    expect(res.payouts['p2']).toBe(40);
    expect(res.totalPaidOut).toBe(80);
  });

  it('refunds all stakes 100% if nobody predicted the winning option', () => {
    const mockMarket: Market = {
      id: 'm3',
      title: 'Upset win',
      description: '',
      category: 'campus',
      type: 'binary',
      options: [
        { id: 'opt-yes', label: 'Yes', userPool: 50, seedPool: 100, totalPool: 150, percentage: 60 },
        { id: 'opt-no', label: 'No', userPool: 0, seedPool: 100, totalPool: 100, percentage: 40 },
      ],
      closingTime: '',
      resolutionSource: '',
      status: 'open',
      creatorId: 'u1',
      creatorName: '',
      totalPool: 250,
      totalUserPool: 50,
      reportsCount: 0,
      oddsHistory: [],
      createdAt: '',
    };

    const predictions: Prediction[] = [
      { id: 'p1', userId: 'u1', userDisplayName: 'Aarav', userHostel: 'Hostel A', marketId: 'm3', optionId: 'opt-yes', amount: 50, estimatedPayout: 0, status: 'open', createdAt: '' },
    ];

    // 'opt-no' won, but nobody predicted it
    const res = calculateMarketPayouts(mockMarket, predictions, 'opt-no', false);
    expect(res.isRefund).toBe(true);
    expect(res.payouts['p1']).toBe(50); // Refunded
  });
});

describe('Referral Rules & Anti-Abuse Logic', () => {
  it('generates valid referral codes and adheres to format', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateReferralCode();
      expect(isValidReferralCodeFormat(code)).toBe(true);
      // Verify no ambiguous characters (0, O, 1, I)
      expect(code).not.toMatch(/[0O1I]/);
    }
  });

  it('blocks self-referral and unknown codes', () => {
    const existingUsers: User[] = [
      {
        id: 'u-referrer',
        email: 'rohan@college.ac.in',
        displayName: 'Rohan Sharma',
        hostel: 'Hostel B',
        role: 'student',
        balance: 100,
        referralCode: 'HAWA-9K2M',
        referralRewardsEarned: 2,
        streak: 0,
        badges: [],
        onboarded: true,
        createdAt: '',
      },
    ];

    // Unknown code
    const unknownRes = validateReferral('HAWA-XXXX', 'Aditi', existingUsers);
    expect(unknownRes.valid).toBe(false);
    expect(unknownRes.error).toContain('not found');

    // Self referral attempt (same display name)
    const selfRes = validateReferral('HAWA-9K2M', 'Rohan Sharma', existingUsers);
    expect(selfRes.valid).toBe(false);
    expect(selfRes.error).toContain('cannot use your own');

    // Valid referral
    const validRes = validateReferral('HAWA-9K2M', 'Kavita', existingUsers);
    expect(validRes.valid).toBe(true);
    expect(validRes.canReferrerEarn).toBe(true);
  });

  it('respects 10-referral reward limit for referrer', () => {
    const cappedUser: User[] = [
      {
        id: 'u-popular',
        email: 'lead@college.ac.in',
        displayName: 'Campus Lead',
        hostel: 'Hostel A',
        role: 'student',
        balance: 600,
        referralCode: 'HAWA-CAP7',
        referralRewardsEarned: MAX_REFERRAL_REWARDS, // 10
        streak: 3,
        badges: ['Campus Plug'],
        onboarded: true,
        createdAt: '',
      },
    ];

    const res = validateReferral('HAWA-CAP7', 'New Student', cappedUser);
    expect(res.valid).toBe(true); // Still valid for the new student to get +50
    expect(res.canReferrerEarn).toBe(false); // But referrer has reached max 10
  });
});

describe('Daily Claim Cooldown (00:00 IST Reset)', () => {
  it('allows claim when no previous claim exists', () => {
    const claim = canClaimDailyCoins(undefined);
    expect(claim.canClaim).toBe(true);
  });

  it('blocks claim if already claimed on the same IST date', () => {
    const now = new Date();
    const claim = canClaimDailyCoins(now.toISOString());
    expect(claim.canClaim).toBe(false);
    expect(claim.timeRemainingMs).toBeGreaterThan(0);
    expect(claim.formattedCountdown).toContain('h');
  });

  it('allows claim if previous claim was on a prior IST day', () => {
    // Yesterday
    const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000);
    const claim = canClaimDailyCoins(yesterday.toISOString());
    // Unless yesterday happens to be today in IST
    const todayIst = getISTDateString(new Date());
    const yesterdayIst = getISTDateString(yesterday);
    if (todayIst !== yesterdayIst) {
      expect(claim.canClaim).toBe(true);
    }
  });
});
