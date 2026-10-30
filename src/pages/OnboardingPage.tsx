import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { Coin3D } from '../components/three/Coin3D';
import { AirSwirlMotif } from '../components/AirSwirlMotif';
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';
import {
  FestGirlCharacter,
  ApprovedStampBadge,
  WashiTapeSticker,
  DoodledStar,
} from '../components/CollegeDoodles';

const HOSTELS = [
  'Hostel A',
  'Hostel B',
  'Hostel C',
  'Hostel D',
  'Dept of CS',
  'Dept of Mech',
  'Dept of Electrical',
  'Dept of Civil',
  'Campus Guest',
  'Independent Caller',
];

export const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, triggerCoinFlip } = useHawaStore();

  const [displayName, setDisplayName] = useState('');
  const [hostel, setHostel] = useState(HOSTELS[0]);
  const [referralCode, setReferralCode] = useState('');
  const [isLockedRef, setIsLockedRef] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Celebration state
  const [isCelebration, setIsCelebration] = useState(false);
  const [bonusCredited, setBonusCredited] = useState(false);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
      setIsLockedRef(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter your name or campus handle.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.completeOnboarding({
        displayName: displayName.trim(),
        hostel,
        referralCode: referralCode.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete onboarding');
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(res.user);
      setBonusCredited(res.bonusApplied);
      setIsCelebration(true);

      // Trigger coin shower & haptics
      triggerCoinFlip();
      sound.vibrate(25);
      sound.playCoinPing();

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FF8A3D', '#1E5560', '#F5C6D2', '#5B8EF2'],
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
      setIsSubmitting(false);
    }
  };

  const handleEnterFeed = () => {
    navigate('/feed', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-linen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      <AirSwirlMotif opacity={0.7} />

      <div className="w-full max-w-md mx-auto my-auto relative">
        {!isCelebration ? (
          <div className="relative">
            {/* Peeking Fest Character on Top-Right */}
            <div className="hidden sm:block absolute -top-14 -right-12 pointer-events-none z-10">
              <FestGirlCharacter className="w-28 h-28 transform rotate-12 drop-shadow-md" />
            </div>

            {/* Washi Tape Header */}
            <div className="absolute -top-3 left-6 z-20">
              <WashiTapeSticker text="FRESHMAN LOCKER" color="#FF8A3D" className="transform -rotate-1" />
            </div>

            <div className="bg-linen border-2 border-linen-deep rounded-card p-6 sm:p-8 shadow-float space-y-5 relative">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <Coin3D isFlipping={false} size={48} />
                </div>
                <h1 className="font-display font-black text-2xl text-black-cherry">
                  Claim Your Locker
                </h1>
                <p className="text-xs text-black-cherry/70 mt-1">
                  Set your campus identity to start predicting with virtual coins.
                </p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black-cherry mb-1.5">
                  Display Name / Handle *
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
                  Hostel or Department *
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
                  <span className="text-[11px] text-petrol font-semibold">+50 bonus coins</span>
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
                <div className="p-3 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-black-cherry shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !displayName.trim()}
                className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Claiming coins...</span>
                ) : (
                  <>
                    <span>Unlock 100 Coins</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          </div>
          </div>
        ) : (
          /* Celebration Screen with Campus Stamp & Stickers */
          <div className="relative">
            {/* Approved Student Stamp */}
            <div className="absolute -top-8 -right-4 pointer-events-none z-20">
              <ApprovedStampBadge className="w-24 h-24 drop-shadow-md animate-bounce" />
            </div>

            {/* Washi Tape */}
            <div className="absolute -top-3 left-6 z-20">
              <WashiTapeSticker text="OFFICIALLY ONBOARDED" color="#F5C6D2" className="transform rotate-2" />
            </div>

            <div className="bg-linen border-2 border-petrol rounded-card p-6 sm:p-8 shadow-float text-center space-y-5 animate-fade-in relative overflow-hidden">
              <div className="absolute -bottom-8 -left-8 pointer-events-none opacity-20">
                <DoodledStar className="w-28 h-28" color="#5B8EF2" />
              </div>

              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <Coin3D isFlipping={true} isBurstingWin={true} size={64} />
              </div>

              <div>
                <span className="px-3 py-1 rounded-pill bg-petrol/15 text-petrol text-xs font-bold uppercase tracking-wider">
                  Locker Unlocked
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-black-cherry mt-2">
                  You're in.
                </h2>
                <div className="font-display font-black text-4xl text-petrol mt-1 tabular-nums">
                  {bonusCredited ? '150' : '100'}{' '}
                  <span className="text-xl text-black-cherry/70 font-bold">coins</span>
                </div>
              </div>

              <div className="p-3.5 bg-linen-deep/40 rounded-lg text-xs text-black-cherry/80 space-y-1">
                <div>&bull; 100 Starter Coins credited</div>
                {bonusCredited && (
                  <div className="font-bold text-petrol">&bull; +50 coins from friend's referral code applied!</div>
                )}
                <div className="text-[11px] text-black-cherry/60 pt-1">
                  Play coins only. No real money. Just bragging rights.
                </div>
              </div>

              <button
                onClick={handleEnterFeed}
                className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-2"
              >
                <span>Enter the Market Feed</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
