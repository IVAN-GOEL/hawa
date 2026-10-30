import React, { useState, useEffect } from 'react';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { Prediction, Proposal, Notification } from '../types';
import { canClaimDailyCoins, formatISTTime } from '../utils/referral';
import {
  User,
  Share2,
  Copy,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Award,
  Bell,
  Check,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfilePage: React.FC = () => {
  const { currentUser, claimDailyCoins, refreshNotifications, notifications } = useHawaStore();

  const [referralStats, setReferralStats] = useState({
    referralCode: currentUser?.referralCode || 'HAWA-DEMO',
    friendsJoined: 0,
    friendsPredicted: 0,
    coinsEarned: 0,
    remainingSlots: 10,
  });

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'proposals' | 'notifications'>('history');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'open' | 'won' | 'lost' | 'refunded'>('all');

  const dailyCheck = canClaimDailyCoins(currentUser?.dailyClaimLastAt);

  useEffect(() => {
    if (currentUser) {
      api.getReferralStats(currentUser.id).then(setReferralStats);
      api.getPredictions(undefined, currentUser.id).then(setPredictions);
      api.getProposals().then((all) => {
        setProposals(all.filter((p) => p.creatorId === currentUser.id));
      });
    }
  }, [currentUser]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralStats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareReferral = () => {
    const url = window.location.origin;
    const shareText = `Join me on Hawa and predict campus buzz. Use my code ${referralStats.referralCode} for 50 free coins. ${url}?ref=${referralStats.referralCode}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join me on Hawa',
        text: shareText,
        url: `${url}?ref=${referralStats.referralCode}`,
      });
    } else {
      // Fallback: WhatsApp share link
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleClaim = async () => {
    const res = await claimDailyCoins();
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8A3D', '#F5C6D2', '#1E5560'],
      });
    }
  };

  if (!currentUser) return null;

  const filteredPredictions = predictions.filter((p) => {
    if (historyFilter === 'all') return true;
    return p.status === historyFilter;
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Profile Hero Card */}
      <div className="bg-linen border border-linen-deep rounded-card p-5 sm:p-7 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-petrol text-linen flex items-center justify-center font-display font-black text-2xl uppercase shadow-subtle">
              {currentUser.displayName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-xl sm:text-2xl text-black-cherry">
                  {currentUser.displayName}
                </h1>
                <span className="px-2 py-0.5 rounded-pill bg-baby-pink text-black-cherry text-[10px] font-bold uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-black-cherry/60 mt-0.5 font-medium">
                {currentUser.hostel} &bull; Member since{' '}
                {new Date(currentUser.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Balance & Daily Claim Action */}
          <div className="flex items-center gap-3 bg-linen-deep/40 p-3 rounded-card border border-linen-deep self-start sm:self-auto">
            <div>
              <div className="text-[11px] text-black-cherry/60 font-semibold">Play Balance</div>
              <div className="font-display font-black text-2xl text-black-cherry tabular-nums">
                {currentUser.balance}{' '}
                <span className="text-xs font-semibold text-black-cherry/60">coins</span>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={!dailyCheck.canClaim}
              className={`px-3.5 py-2 rounded-pill font-bold text-xs flex items-center gap-1.5 transition-all ${
                dailyCheck.canClaim
                  ? 'bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 shadow-subtle'
                  : 'bg-linen-deep text-black-cherry/50 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dailyCheck.canClaim ? 'Claim 10 coins' : dailyCheck.formattedCountdown.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-linen-deep">
          <div className="p-3 bg-linen-deep/20 rounded-lg">
            <span className="text-[11px] text-black-cherry/60 block">Total Calls</span>
            <span className="font-display font-black text-lg text-black-cherry tabular-nums">
              {predictions.length}
            </span>
          </div>
          <div className="p-3 bg-linen-deep/20 rounded-lg">
            <span className="text-[11px] text-black-cherry/60 block">Current Streak</span>
            <span className="font-display font-black text-lg text-petrol flex items-center gap-1 tabular-nums">
              <Flame className="w-4 h-4 fill-tangerine" />
              <span>{currentUser.streak || 0}</span>
            </span>
          </div>
          <div className="p-3 bg-linen-deep/20 rounded-lg">
            <span className="text-[11px] text-black-cherry/60 block">Accuracy</span>
            <span className="font-display font-black text-lg text-petrol tabular-nums">
              {predictions.filter((p) => p.status === 'won').length > 0
                ? Math.round(
                    (predictions.filter((p) => p.status === 'won').length /
                      Math.max(1, predictions.filter((p) => p.status === 'won' || p.status === 'lost').length)) *
                      100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="p-3 bg-linen-deep/20 rounded-lg">
            <span className="text-[11px] text-black-cherry/60 block">Referral Bonus</span>
            <span className="font-display font-black text-lg text-cool-blue tabular-nums">
              +{referralStats.coinsEarned}
            </span>
          </div>
        </div>

        {/* Badges Carousel / List */}
        <div className="mt-6 pt-5 border-t border-linen-deep/60">
          <div className="text-xs font-bold text-black-cherry/70 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-petrol" />
            <span>Badges Unlocked</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'First Call', desc: 'Placed your first prediction' },
              { id: 'Hot Streak', desc: '5 correct calls in a row' },
              { id: 'Headliner Hunter', desc: 'Correct call on a fest market' },
              { id: 'Sharp', desc: '70%+ accuracy over 20 calls' },
              { id: 'Contrarian', desc: 'Won on an option under 20%' },
              { id: 'Connector', desc: '3 friends joined and made first call' },
              { id: 'Campus Plug', desc: '10 friends joined and made first call' },
            ].map((badge) => {
              const isUnlocked = currentUser.badges?.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  title={badge.desc}
                  className={`px-3 py-1.5 rounded-pill border text-xs font-bold transition-all ${
                    isUnlocked
                      ? 'bg-petrol text-linen border-petrol shadow-sm'
                      : 'bg-linen-deep/30 text-black-cherry/35 border-linen-deep'
                  }`}
                >
                  {badge.id} {isUnlocked && '✓'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invite Friends Referral Card */}
      <div className="bg-linen border-2 border-cool-blue/40 rounded-card p-5 sm:p-7 shadow-subtle mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-pill bg-cool-blue/15 text-cool-blue font-bold text-[10px] uppercase tracking-wider">
                Referral Program
              </span>
              <span className="text-xs text-black-cherry/60 font-semibold">
                Earn 50 coins per active friend
              </span>
            </div>
            <h2 className="font-display font-black text-xl text-black-cherry mt-1">
              Invite friends to Hawa
            </h2>
            <p className="text-xs text-black-cherry/70 mt-0.5 max-w-lg">
              Give your friend 50 bonus coins at signup. When they place their first prediction, you get +50 coins too! (Max 10 friends, 500 coins).
            </p>
          </div>

          {/* Referral Code Box */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 bg-linen-deep/50 border border-linen-deep px-4 py-2.5 rounded-card">
              <span className="text-xs text-black-cherry/50 font-bold uppercase">Code:</span>
              <span className="font-display font-black text-lg text-black-cherry tracking-wider tabular-nums">
                {referralStats.referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-full hover:bg-linen text-black-cherry transition-colors ml-1"
                title="Copy referral code"
              >
                {copied ? <Check className="w-4 h-4 text-petrol" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleShareReferral}
              className="w-full sm:w-auto px-5 py-3 rounded-pill bg-petrol text-linen font-bold text-xs hover:bg-petrol/90 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Referral Status Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-linen-deep/60 text-xs">
          <div>
            <span className="text-black-cherry/60 block">Friends Joined</span>
            <strong className="font-display text-base text-black-cherry">
              {referralStats.friendsJoined}
            </strong>
          </div>
          <div>
            <span className="text-black-cherry/60 block">First Call Placed</span>
            <strong className="font-display text-base text-petrol">
              {referralStats.friendsPredicted}
            </strong>
          </div>
          <div>
            <span className="text-black-cherry/60 block">Coins Earned</span>
            <strong className="font-display text-base text-petrol tabular-nums">
              +{referralStats.coinsEarned}
            </strong>
          </div>
          <div>
            <span className="text-black-cherry/60 block">Slots Remaining</span>
            <strong className="font-display text-base text-black-cherry">
              {referralStats.remainingSlots} of 10
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs: History / Proposals / Notifications */}
      <div className="flex items-center gap-2 border-b border-linen-deep mb-5">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-black-cherry/60 hover:text-black-cherry'
          }`}
        >
          My Predictions ({predictions.length})
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'proposals'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-black-cherry/60 hover:text-black-cherry'
          }`}
        >
          My Proposals ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-black-cherry/60 hover:text-black-cherry'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications ({notifications.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Prediction History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Sub-filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'open', 'won', 'lost', 'refunded'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setHistoryFilter(st)}
                className={`px-3 py-1 rounded-pill text-[11px] font-bold capitalize transition-all ${
                  historyFilter === st
                    ? 'bg-petrol text-linen shadow-sm'
                    : 'bg-linen-deep/50 text-black-cherry/70 hover:bg-linen-deep'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredPredictions.length > 0 ? (
            <div className="divide-y divide-linen-deep bg-linen border border-linen-deep rounded-card shadow-subtle overflow-hidden">
              {filteredPredictions.map((pred) => (
                <div key={pred.id} className="p-4 flex items-center justify-between hover:bg-linen-deep/20 transition-colors">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider ${
                        pred.status === 'won'
                          ? 'bg-petrol/15 text-petrol'
                          : pred.status === 'lost'
                          ? 'bg-black-cherry/10 text-black-cherry'
                          : pred.status === 'refunded'
                          ? 'bg-cool-blue/15 text-cool-blue'
                          : 'bg-baby-pink/60 text-black-cherry'
                      }`}
                    >
                      {pred.status}
                    </span>
                    <div className="font-display font-bold text-sm text-black-cherry mt-1">
                      {pred.amount} coins staked
                    </div>
                    <div className="text-[11px] text-black-cherry/50">
                      Placed {formatISTTime(pred.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    {pred.status === 'won' ? (
                      <span className="font-display font-black text-base text-petrol tabular-nums">
                        +{pred.actualPayout} coins
                      </span>
                    ) : pred.status === 'refunded' ? (
                      <span className="font-display font-black text-base text-petrol tabular-nums">
                        Refunded {pred.amount} coins
                      </span>
                    ) : pred.status === 'lost' ? (
                      <span className="font-display font-bold text-sm text-black-cherry/60">
                        0 coins
                      </span>
                    ) : (
                      <span className="font-display font-bold text-sm text-petrol tabular-nums">
                        Est: +{pred.estimatedPayout} coins
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-black-cherry/60 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep">
              No predictions matching this filter.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-3">
          {proposals.length > 0 ? (
            proposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 bg-linen border border-linen-deep rounded-card shadow-subtle space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-pill font-bold uppercase text-[10px] ${
                      prop.status === 'approved'
                        ? 'bg-petrol/15 text-petrol'
                        : prop.status === 'rejected'
                        ? 'bg-black-cherry/15 text-black-cherry'
                        : 'bg-baby-pink/80 text-black-cherry'
                    }`}
                  >
                    {prop.status}
                  </span>
                  <span className="text-[11px] text-black-cherry/50">
                    {formatISTTime(prop.createdAt)}
                  </span>
                </div>

                <h3 className="font-display font-bold text-sm text-black-cherry">
                  {prop.title}
                </h3>

                {prop.rejectionReason && (
                  <div className="p-2.5 bg-black-cherry/10 rounded-lg text-xs text-black-cherry">
                    <strong>Rejection reason:</strong> {prop.rejectionReason}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-black-cherry/60 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep">
              You haven't proposed any campus markets yet.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-2.5">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-card border text-xs space-y-1 transition-colors ${
                  n.read
                    ? 'bg-linen border-linen-deep text-black-cherry/75'
                    : 'bg-baby-pink/30 border-baby-pink text-black-cherry font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-petrol">{n.title}</span>
                  <span className="text-black-cherry/50">{formatISTTime(n.createdAt)}</span>
                </div>
                <p>{n.message}</p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-black-cherry/60 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep">
              No notifications yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
