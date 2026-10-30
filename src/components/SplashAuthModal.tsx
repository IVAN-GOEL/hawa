import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { LiquidLogo } from './three/LiquidLogo';
import { Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const HOSTELS = [
  'Hostel A',
  'Hostel B',
  'Hostel C',
  'Hostel D',
  'Dept of CS',
  'Dept of Mech',
  'Dept of Electrical',
  'Dept of Civil',
];

export const SplashAuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [searchParams] = useSearchParams();
  const { setCurrentUser, refreshMarkets, triggerCoinFlip } = useHawaStore();

  const [displayName, setDisplayName] = useState('');
  const [hostel, setHostel] = useState(HOSTELS[0]);
  const [referralCode, setReferralCode] = useState('');
  const [isLockedRef, setIsLockedRef] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
      setIsLockedRef(true);
    }
  }, [searchParams]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Please enter your name or campus handle.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.createUser(displayName, hostel, referralCode);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(res.user);
      await refreshMarkets();
      triggerCoinFlip();

      if (res.bonusCredited) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#FF8A3D', '#F5C6D2', '#1E5560'],
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-cherry/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-gradient-to-b from-linen via-linen to-baby-pink/30 border border-linen-deep rounded-3xl p-6 sm:p-8 shadow-float relative my-auto">
        {/* Hero Liquid Metal Wordmark */}
        <div className="text-center pt-2 pb-4">
          <LiquidLogo size="large" interactiveParallax={true} />

          <h2 className="font-display font-black text-2xl text-black-cherry mt-2 tracking-tight">
            Kya hawa hai?
          </h2>
          <p className="text-xs text-black-cherry/70 mt-1 max-w-xs mx-auto">
            The hyper-local campus prediction market. Predict inter-hostel matches, fest surprises, and college buzz.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5">
              Display Name / Campus Handle *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Kabir Verma"
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5">
              Hostel / Department *
            </label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-xs font-semibold text-black-cherry focus:outline-none focus:ring-2 focus:ring-petrol"
            >
              {HOSTELS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5 flex items-center justify-between">
              <span>Have a referral code?</span>
              <span className="text-[11px] text-petrol font-semibold">Get +50 bonus coins</span>
            </label>
            <input
              type="text"
              value={referralCode}
              disabled={isLockedRef}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. HAWA-7K9A"
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-xs font-display font-bold text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol uppercase tracking-wider disabled:bg-linen-deep/60 disabled:cursor-not-allowed"
            />
            {isLockedRef && (
              <span className="text-[11px] text-petrol mt-1 block font-medium">
                Referral code locked from your invite link!
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-black-cherry shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CTA: Tangerine Primary Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Creating your locker...</span>
            ) : (
              <>
                <span>Enter with 100 Virtual Coins</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-[11px] text-black-cherry/60 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-petrol" />
              <span>Play coins only &bull; No real money &bull; Just bragging rights</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
