import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../../services/api';

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

describe('OAuth Authentication and User Onboarding Flow', () => {
  beforeEach(async () => {
    await api.resetDemoData();
  });

  it('signs in via Google OAuth, creates pending user session, and completes onboarding with bonus', async () => {
    // 1. Initial state: sign in with Google
    const oauthRes = await api.signInWithOAuth('google');
    expect(oauthRes.success).toBe(true);

    const currentUser = await api.getCurrentUser();
    expect(currentUser).not.toBeNull();
    expect(currentUser?.email).toBe('alex.google@campus.ac.in');
    expect(currentUser?.onboarded).toBe(false);
    expect(currentUser?.balance).toBe(100);

    // 2. Complete onboarding with handle, hostel, and referral code
    const onbRes = await api.completeOnboarding({
      displayName: 'Alex Rivers',
      hostel: 'Hostel 4',
      referralCode: 'HAWA-KB72', // from seed referrer Kabir
    });

    expect(onbRes.success).toBe(true);
    expect(onbRes.bonusApplied).toBe(true);
    // Starter 100 + 50 referral bonus = 150 coins
    expect(onbRes.user.balance).toBe(150);
    expect(onbRes.user.displayName).toBe('Alex Rivers');
    expect(onbRes.user.hostel).toBe('Hostel 4');
    expect(onbRes.user.onboarded).toBe(true);

    // 3. User can now claim daily coins once IST day passes or on initial claim
    const claimRes = await api.claimDailyCoins(onbRes.user.id);
    expect(claimRes.success).toBe(true);
    expect(claimRes.newBalance).toBe(160); // 150 + 10 daily coins
  });
});
