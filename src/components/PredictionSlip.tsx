import React, { useState, useMemo } from 'react';
import { Market, Option } from '../types';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { MIN_PREDICTION, MAX_PREDICTION, calculateEstimatedPayout } from '../utils/payout';
import { LiquidGlass } from './glass/LiquidGlass';
import { Coin3D } from './three/Coin3D';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PredictionSlipProps {
  market: Market;
  selectedOptionId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PredictionSlip: React.FC<PredictionSlipProps> = ({
  market,
  selectedOptionId: initialOptionId,
  onClose,
  onSuccess,
}) => {
  const { currentUser, refreshMarkets, triggerCoinFlip } = useHawaStore();

  const [selectedOptId, setSelectedOptId] = useState<string>(
    initialOptionId || market.options[0]?.id || ''
  );
  const [stakeInput, setStakeInput] = useState<string>('25');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedOption = market.options.find((o) => o.id === selectedOptId);
  const userBalance = currentUser?.balance || 0;

  const currentStake = parseInt(stakeInput, 10) || 0;

  // Max allowed for quick chip
  const maxAllowed = Math.min(userBalance, MAX_PREDICTION);

  // Parimutuel preview payout
  const estimatedPayout = useMemo(() => {
    if (!selectedOption || currentStake <= 0) return 0;
    return calculateEstimatedPayout(currentStake, selectedOption.totalPool, market.totalPool);
  }, [selectedOption, currentStake, market.totalPool]);

  const estimatedProfit = Math.max(0, estimatedPayout - currentStake);

  const isClosed =
    market.status !== 'open' || new Date(market.closingTime).getTime() <= Date.now();
  const isCreator = currentUser?.id === market.creatorId;

  const handlePlace = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);

    if (isClosed) {
      setErrorMsg('This market has just closed. Predictions can no longer be placed.');
      return;
    }

    if (isCreator) {
      setErrorMsg('You cannot predict on a market you proposed.');
      return;
    }

    if (currentStake < MIN_PREDICTION) {
      setErrorMsg(`Minimum prediction is ${MIN_PREDICTION} coins.`);
      return;
    }

    if (currentStake > MAX_PREDICTION) {
      setErrorMsg(`Maximum prediction is ${MAX_PREDICTION} coins per market.`);
      return;
    }

    if (currentStake > userBalance) {
      setErrorMsg(`Insufficient coins. You have ${userBalance} coins.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.placePrediction({
        userId: currentUser!.id,
        marketId: market.id,
        optionId: selectedOptId,
        amount: currentStake,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to place prediction');
        setIsSubmitting(false);
        return;
      }

      // Success!
      triggerCoinFlip();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF8A3D', '#1E5560', '#F5C6D2'],
      });

      setSuccessMsg(`Prediction placed on ${selectedOption?.label}!`);
      await refreshMarkets();

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black-cherry/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg">
        <LiquidGlass
          type="rounded"
          tintOpacity={0.4}
          radius={24}
          className="w-full bg-linen border border-linen-deep shadow-float rounded-t-3xl sm:rounded-card p-5 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-linen-deep">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-black-cherry/60">
                Prediction Slip
              </span>
              <h4 className="font-display font-bold text-base text-black-cherry line-clamp-1">
                {market.title}
              </h4>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-full hover:bg-linen-deep text-black-cherry transition-colors"
              aria-label="Close prediction slip"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Option Picker */}
          <div className="my-4">
            <label className="block text-xs font-semibold text-black-cherry/75 mb-2">
              Choose Outcome
            </label>
            <div className="grid grid-cols-2 gap-2">
              {market.options.map((opt) => {
                const isSelected = opt.id === selectedOptId;
                const isYes = opt.label.toLowerCase() === 'yes';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptId(opt.id)}
                    className={`p-3 rounded-card text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? isYes
                          ? 'border-petrol bg-petrol/15 ring-2 ring-petrol text-black-cherry'
                          : 'border-black-cherry bg-black-cherry/10 ring-2 ring-black-cherry text-black-cherry'
                        : 'border-linen-deep bg-linen-deep/30 text-black-cherry/80 hover:bg-linen-deep/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-[11px] text-black-cherry/60">
                        {opt.totalPool} coins pool
                      </div>
                    </div>
                    <span className="font-display font-black text-base tabular-nums">
                      {opt.percentage}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Amount Input & Quick Chips */}
          <div className="my-4">
            <div className="flex items-center justify-between text-xs font-semibold text-black-cherry/75 mb-1.5">
              <span>Stake Coins</span>
              <span className="tabular-nums">
                Balance:{' '}
                <strong className="text-black-cherry font-display">{userBalance}</strong> coins
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min={MIN_PREDICTION}
                max={MAX_PREDICTION}
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
                className="w-full bg-linen border border-linen-deep rounded-input py-2.5 px-3.5 text-lg font-display font-bold text-black-cherry focus:outline-none focus:ring-2 focus:ring-petrol tabular-nums"
                placeholder="25"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black-cherry/50 uppercase">
                Coins
              </span>
            </div>

            {/* Quick Chips: 5, 10, 25, MAX */}
            <div className="flex gap-2 mt-2.5">
              {[5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setStakeInput(amt.toString())}
                  className={`flex-1 py-1.5 rounded-pill text-xs font-bold border transition-colors ${
                    currentStake === amt
                      ? 'bg-petrol text-linen border-petrol'
                      : 'bg-linen-deep/50 text-black-cherry border-linen-deep hover:bg-linen-deep'
                  }`}
                >
                  +{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStakeInput(maxAllowed.toString())}
                className="flex-1 py-1.5 rounded-pill text-xs font-bold bg-baby-pink/80 hover:bg-baby-pink text-black-cherry border border-baby-pink transition-colors"
              >
                MAX ({maxAllowed})
              </button>
            </div>
          </div>

          {/* Estimated Payout Banner with 3D Coin */}
          <div className="my-4 p-3 bg-linen-deep/40 border border-linen-deep rounded-card flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Coin3D isFlipping={isSubmitting} size={28} />
              <div>
                <div className="font-semibold text-black-cherry flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-petrol" />
                  <span>If you win:</span>
                </div>
                <div className="text-[11px] text-black-cherry/60">
                  Parimutuel split (estimate)
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-black text-lg text-petrol tabular-nums">
                +{estimatedPayout} coins
              </div>
              <div className="text-[10px] text-black-cherry/60 font-medium">
                (net +{estimatedProfit})
              </div>
            </div>
          </div>

          {/* Feedback states */}
          {errorMsg && (
            <div className="mb-3 p-2.5 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-black-cherry shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-2.5 bg-petrol/15 border border-petrol/30 text-petrol rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-petrol shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Action CTA: Primary Tangerine with Black Cherry text */}
          <button
            type="button"
            onClick={handlePlace}
            disabled={isSubmitting || isClosed || isCreator || currentStake <= 0}
            className="w-full py-3.5 px-4 rounded-pill font-display font-black text-base bg-tangerine text-black-cherry hover:brightness-105 active:scale-[0.98] transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Placing call...</span>
            ) : isClosed ? (
              <span>Market Closed</span>
            ) : isCreator ? (
              <span>Cannot predict on own market</span>
            ) : (
              <span>Place prediction &bull; {currentStake} coins</span>
            )}
          </button>
        </LiquidGlass>
      </div>
    </div>
  );
};
