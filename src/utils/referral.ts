import { User, ReferralEvent } from '../types';

export const REFERRAL_BONUS_FRIEND = 50;
export const REFERRAL_BONUS_REFERRER = 50;
export const MAX_REFERRAL_REWARDS = 10; // Max 500 coins total
export const DAILY_CLAIM_AMOUNT = 10;

// Characters excluding O, 0, I, 1
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(): string {
  let result = 'HAWA-';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return result;
}

export function isValidReferralCodeFormat(code: string): boolean {
  if (!code) return false;
  const regex = /^HAWA-[A-HJ-NP-Z2-9]{4}$/i;
  return regex.test(code.trim());
}

/**
 * Returns current date string formatted as YYYY-MM-DD in Asia/Kolkata (IST).
 */
export function getISTDateString(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date into a human readable IST timestamp string
 */
export function formatISTTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d) + ' IST';
  } catch {
    return isoString;
  }
}

/**
 * Checks whether user is eligible for today's daily 10 coins claim.
 * Resets at 00:00 IST.
 */
export function canClaimDailyCoins(lastClaimIso?: string): {
  canClaim: boolean;
  timeRemainingMs: number;
  formattedCountdown: string;
} {
  const now = new Date();
  const currentISTDate = getISTDateString(now);

  if (!lastClaimIso) {
    return { canClaim: true, timeRemainingMs: 0, formattedCountdown: 'Available now' };
  }

  const lastClaimDate = new Date(lastClaimIso);
  const lastClaimISTDate = getISTDateString(lastClaimDate);

  if (currentISTDate !== lastClaimISTDate) {
    return { canClaim: true, timeRemainingMs: 0, formattedCountdown: 'Available now' };
  }

  // Calculate milliseconds until next IST midnight
  // In IST (UTC + 5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIstMs = now.getTime() + istOffsetMs;
  const nowIstDate = new Date(nowIstMs);
  
  // Tomorrow 00:00:00 IST
  const tomorrowIstDate = new Date(nowIstDate);
  tomorrowIstDate.setUTCDate(tomorrowIstDate.getUTCDate() + 1);
  tomorrowIstDate.setUTCHours(0, 0, 0, 0);

  const diffMs = Math.max(0, tomorrowIstDate.getTime() - nowIstDate.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = `${hours}h ${minutes}m ${seconds}s`;

  return {
    canClaim: false,
    timeRemainingMs: diffMs,
    formattedCountdown: formatted,
  };
}

/**
 * Validates whether a referral redemption is permissible.
 */
export function validateReferral(
  code: string,
  newUserDisplayName: string,
  allUsers: User[]
): {
  valid: boolean;
  referrer?: User;
  error?: string;
  canReferrerEarn?: boolean;
} {
  const cleanCode = code.trim().toUpperCase();

  if (!isValidReferralCodeFormat(cleanCode)) {
    return { valid: false, error: 'Invalid code format. Format is HAWA-XXXX' };
  }

  const referrer = allUsers.find(
    (u) => u.referralCode.toUpperCase() === cleanCode
  );

  if (!referrer) {
    return { valid: false, error: 'Referral code not found' };
  }

  // Cannot refer self (if signing up with same name or already matching)
  if (referrer.displayName.toLowerCase() === newUserDisplayName.trim().toLowerCase()) {
    return { valid: false, error: 'You cannot use your own referral code' };
  }

  const canReferrerEarn = (referrer.referralRewardsEarned || 0) < MAX_REFERRAL_REWARDS;

  return {
    valid: true,
    referrer,
    canReferrerEarn,
  };
}
