import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../../services/api';
import { calculateMarketPayouts } from '../payout';

// Mock localStorage for node test environment if needed
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('End-to-End Prediction Market & Referral Flow', () => {
  beforeEach(async () => {
    await api.resetDemoData();
  });

  it('runs complete lifecycle: propose -> approve -> predict -> resolve -> payout', async () => {
    // 1. Get initial state
    const user = await api.getCurrentUser();
    expect(user!.balance).toBe(100);

    // 2. Submit a proposal
    const prop = await api.submitProposal({
      creatorId: 'u-other',
      creatorName: 'Aman Gupta',
      creatorHostel: 'Hostel A',
      title: 'Will the night mess remain open until 3 AM during finals?',
      description: 'Exam council requested extended hours',
      category: 'campus',
      type: 'binary',
      options: ['Yes', 'No'],
      closingTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      resolutionSource: 'SAC Notice Board',
    });
    expect(prop.status).toBe('pending');

    // 3. Admin approves the proposal
    const newMarket = await api.approveProposal(prop.id);
    expect(newMarket.status).toBe('open');
    expect(newMarket.options.length).toBe(2);
    // House seed 100 each -> total 200
    expect(newMarket.totalPool).toBe(200);

    // 4. Place a prediction of 50 coins on 'Yes'
    const yesOption = newMarket.options.find((o) => o.label === 'Yes')!;
    const predRes = await api.placePrediction({
      userId: user!.id,
      marketId: newMarket.id,
      optionId: yesOption.id,
      amount: 50,
    });

    expect(predRes.success).toBe(true);

    // Verify user balance deducted
    const refreshedUser = await api.getCurrentUser();
    expect(refreshedUser!.balance).toBe(50); // 100 - 50 = 50

    // Verify market pools updated
    const updatedMarket = await api.getMarketById(newMarket.id);
    expect(updatedMarket?.totalUserPool).toBe(50);
    expect(updatedMarket?.totalPool).toBe(250); // 200 seed + 50 user

    // 5. Another user predicts 50 on 'No'
    await api.placePrediction({
      userId: 'u-1',
      marketId: newMarket.id,
      optionId: updatedMarket!.options.find((o) => o.label === 'No')!.id,
      amount: 50,
    });

    // 6. Admin resolves market with 'Yes' as winner
    // Total user pool = 100 (50 on Yes, 50 on No).
    // Yes wins: winning stake is 50. Payout = floor((50/50)*100) = 100 coins.
    await api.resolveMarket(newMarket.id, yesOption.id, 'Confirmed open until 3 AM.');

    const finalMarket = await api.getMarketById(newMarket.id);
    expect(finalMarket?.status).toBe('resolved');
    expect(finalMarket?.winningOptionId).toBe(yesOption.id);

    // User should have received 100 coins payout -> balance: 50 + 100 = 150
    const finalUser = await api.getCurrentUser();
    expect(finalUser!.balance).toBe(150);

    // Notifications should include winning notification
    const notifs = await api.getNotifications(finalUser!.id);
    const winNotif = notifs.find((n) => n.title.includes('Won'));
    expect(winNotif).toBeDefined();
    expect(winNotif?.message).toContain('100 coins');
  });

  it('runs referral reward cycle: referred friend signs up and earns referrer 50 coins on first call', async () => {
    // Referrer Kabir has code HAWA-KB72
    const referrer = await api.getCurrentUser();
    const initialReferrerBalance = referrer!.balance;

    // Create a new friend account with Kabir's code
    const signupRes = await api.createUser('Priya Sharma', 'Hostel C', referrer!.referralCode);
    expect(signupRes.bonusCredited).toBe(true);
    // New friend starts with 100 + 50 = 150 coins
    expect(signupRes.user.balance).toBe(150);
    expect(signupRes.user.referredBy).toBe(referrer!.id);

    // Referrer has NOT been credited yet (only after first prediction!)
    const allUsers1 = await api.getUsers();
    const referrerCheck1 = allUsers1.find((u) => u.id === referrer!.id);
    expect(referrerCheck1?.balance).toBe(initialReferrerBalance);

    // Friend places first prediction
    const markets = await api.getMarkets();
    const activeMarket = markets.find((m) => m.status === 'open')!;

    // Temporarily switch active session to friend
    await api.setCurrentUser(signupRes.user);

    const predRes = await api.placePrediction({
      userId: signupRes.user.id,
      marketId: activeMarket.id,
      optionId: activeMarket.options[0].id,
      amount: 25,
    });
    expect(predRes.success).toBe(true);

    // Now check that referrer was awarded +50 coins!
    const allUsers2 = await api.getUsers();
    const referrerCheck2 = allUsers2.find((u) => u.id === referrer!.id);
    expect(referrerCheck2?.balance).toBe(initialReferrerBalance + 50);
  });
});
