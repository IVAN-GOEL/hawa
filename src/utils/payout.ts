import { Market, Option, Prediction } from '../types';

export const HOUSE_SEED_PER_OPTION = 100;
export const MIN_PREDICTION = 5;
export const MAX_PREDICTION = 100;

/**
 * Calculates the implied probability percentage (0-100) of an option within a market.
 */
export function calculateImpliedPercentage(optionPool: number, totalPool: number): number {
  if (totalPool <= 0) return 0;
  const pct = Math.round((optionPool / totalPool) * 100);
  return Math.min(Math.max(pct, 1), 99); // Clamp 1-99 so it never shows 0% or 100% while active
}

/**
 * Preview payout for an ongoing market before placing prediction.
 * Formula from spec: Math.floor((stake / (optionPool + stake)) * (totalPool + stake))
 */
export function calculateEstimatedPayout(
  stake: number,
  optionTotalPool: number,
  marketTotalPool: number
): number {
  if (stake <= 0) return 0;
  const newOptionPool = optionTotalPool + stake;
  const newMarketPool = marketTotalPool + stake;
  return Math.floor((stake / newOptionPool) * newMarketPool);
}

export interface ResolutionResult {
  payouts: Record<string, number>; // predictionId -> payout coins
  userRefunds: Record<string, number>; // userId -> total coins refunded/paid
  isRefund: boolean;
  totalPaidOut: number;
}

/**
 * Resolves market payouts for all predictions.
 * - Winners split the total USER pool (excluding house seed) in proportion to their stake.
 * - payout = Math.floor((user_stake / winning_option_user_pool) * total_user_pool)
 * - If winning_option_user_pool === 0, or status === 'cancelled', refund 100% of user stake.
 * - Round down to integers.
 */
export function calculateMarketPayouts(
  market: Market,
  predictions: Prediction[],
  winningOptionId?: string,
  isCancelled: boolean = false
): ResolutionResult {
  const result: ResolutionResult = {
    payouts: {},
    userRefunds: {},
    isRefund: isCancelled,
    totalPaidOut: 0,
  };

  const marketPredictions = predictions.filter((p) => p.marketId === market.id);

  if (marketPredictions.length === 0) {
    return result;
  }

  // If market is cancelled or no winning option specified
  if (isCancelled || !winningOptionId) {
    result.isRefund = true;
    for (const p of marketPredictions) {
      result.payouts[p.id] = p.amount;
      result.userRefunds[p.userId] = (result.userRefunds[p.userId] || 0) + p.amount;
      result.totalPaidOut += p.amount;
    }
    return result;
  }

  // Total user pool in the market
  const totalUserPool = marketPredictions.reduce((sum, p) => sum + p.amount, 0);

  // Predictions on winning option
  const winningPredictions = marketPredictions.filter((p) => p.optionId === winningOptionId);
  const winningOptionUserPool = winningPredictions.reduce((sum, p) => sum + p.amount, 0);

  // If nobody predicted the winning option, refund all stakes
  if (winningOptionUserPool === 0) {
    result.isRefund = true;
    for (const p of marketPredictions) {
      result.payouts[p.id] = p.amount;
      result.userRefunds[p.userId] = (result.userRefunds[p.userId] || 0) + p.amount;
      result.totalPaidOut += p.amount;
    }
    return result;
  }

  // Calculate proportional parimutuel payouts
  for (const p of marketPredictions) {
    if (p.optionId === winningOptionId) {
      // Payout = floor((user_stake / winning_option_user_pool) * total_user_pool)
      const payout = Math.floor((p.amount / winningOptionUserPool) * totalUserPool);
      result.payouts[p.id] = payout;
      result.userRefunds[p.userId] = (result.userRefunds[p.userId] || 0) + payout;
      result.totalPaidOut += payout;
    } else {
      result.payouts[p.id] = 0;
    }
  }

  return result;
}

/**
 * Recomputes all option percentages for a market so they sum cleanly.
 */
export function recalculateMarketPercentages(options: Option[]): Option[] {
  const totalPool = options.reduce((sum, opt) => sum + opt.totalPool, 0);
  if (totalPool <= 0) return options;

  return options.map((opt) => ({
    ...opt,
    percentage: calculateImpliedPercentage(opt.totalPool, totalPool),
  }));
}
