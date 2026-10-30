import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { Prediction, Comment, Market } from '../types';
import { formatISTTime } from '../utils/referral';
import { PredictionSlip } from '../components/PredictionSlip';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Users,
  MessageSquare,
  Activity,
  AlertTriangle,
  Share2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const MarketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { markets, currentUser, refreshMarkets } = useHawaStore();

  const [market, setMarket] = useState<Market | undefined>(
    markets.find((m) => m.id === id)
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [commentText, setCommentText] = useState('');
  const [slipOpen, setSlipOpen] = useState(false);
  const [preselectedOptionId, setPreselectedOptionId] = useState<string | undefined>(
    searchParams.get('opt') || undefined
  );
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (id) {
      api.getMarketById(id).then((m) => {
        if (m) setMarket(m);
      });
      api.getComments(id).then(setComments);
      api.getPredictions(id).then(setPredictions);

      // Poll option_pools view every 5 seconds per spec
      const pollInterval = setInterval(() => {
        api.getMarketOptionPools(id).then((pools) => {
          if (pools && pools.length > 0) {
            setMarket((prev) => {
              if (!prev) return prev;
              const totalPool = pools.reduce((sum, o) => sum + o.totalPool, 0);
              const totalUserPool = pools.reduce((sum, o) => sum + o.userPool, 0);
              return {
                ...prev,
                options: pools,
                totalPool,
                totalUserPool,
              };
            });
          }
        });
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [id, markets]);

  useEffect(() => {
    const optParam = searchParams.get('opt');
    if (optParam) {
      setPreselectedOptionId(optParam);
      setSlipOpen(true);
    }
  }, [searchParams]);

  if (!market) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center">
        <h2 className="font-display font-bold text-xl text-black-cherry">Market not found</h2>
        <button
          onClick={() => navigate('/feed')}
          className="mt-4 px-4 py-2 rounded-pill bg-petrol text-linen text-xs font-bold"
        >
          Return to Markets
        </button>
      </div>
    );
  }

  const isClosed =
    market.status !== 'open' || new Date(market.closingTime).getTime() <= Date.now();

  const userPredictions = predictions.filter((p) => p.userId === currentUser?.id);
  const userStakedTotal = userPredictions.reduce((sum, p) => sum + p.amount, 0);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    const newComment = await api.addComment(market.id, currentUser.id, commentText);
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleReport = async () => {
    if (reported) return;
    if (window.confirm('Report this market for review by student moderators?')) {
      await api.reportMarket(market.id);
      setReported(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: market.title,
        text: `Call this campus buzz on Hawa: "${market.title}"`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Market link copied to clipboard!');
    }
  };

  // Status badge styling
  const statusBadge = {
    open: 'bg-petrol/10 text-petrol border-petrol/20',
    closed: 'bg-black-cherry/10 text-black-cherry border-black-cherry/20',
    resolved: 'bg-cool-blue/15 text-cool-blue border-cool-blue/30',
    cancelled: 'bg-black-cherry/20 text-black-cherry border-black-cherry/30',
  }[market.status];

  // SVG Chart for odds history
  const chartPoints = useMemo(() => {
    if (!market.oddsHistory || market.oddsHistory.length === 0) return null;
    const leadingOptId = market.options[0]?.id;
    if (!leadingOptId) return null;

    const data = market.oddsHistory.map((h) => h.percentages[leadingOptId] || 50);
    if (data.length < 2) return null;

    const width = 360;
    const height = 90;
    const padding = 12;
    const step = (width - padding * 2) / (data.length - 1);

    const points = data
      .map((val, idx) => {
        const x = padding + idx * step;
        const y = height - padding - ((val - 0) / 100) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return { points, currentVal: data[data.length - 1], leadingLabel: market.options[0]?.label };
  }, [market]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-4 sm:py-6">
      {/* Top back & actions bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-1.5 text-xs font-semibold text-black-cherry/70 hover:text-black-cherry transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Markets</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full hover:bg-linen-deep text-black-cherry/70 hover:text-black-cherry transition-colors"
            title="Share market"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReport}
            className={`p-1.5 rounded-full transition-colors ${
              reported
                ? 'text-petrol bg-petrol/10'
                : 'text-black-cherry/50 hover:bg-linen-deep hover:text-black-cherry'
            }`}
            title="Report market"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Market Details & Community */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-linen border border-linen-deep rounded-card p-5 sm:p-6 shadow-subtle">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-pill bg-linen-deep text-black-cherry text-[11px] font-bold uppercase tracking-wider">
                {market.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-pill border text-[11px] font-bold uppercase tracking-wider ${statusBadge}`}
              >
                {market.status}
              </span>
              {market.type === 'binary' ? (
                <span className="text-[11px] text-black-cherry/50 font-medium">Yes / No</span>
              ) : (
                <span className="text-[11px] text-black-cherry/50 font-medium">Multiple Choice</span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-xl sm:text-2xl text-black-cherry leading-tight mb-2">
              {market.title}
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-black-cherry/80 leading-relaxed mb-4">
              {market.description}
            </p>

            {/* Odds Timeline Sparkline Chart */}
            {chartPoints && (
              <div className="my-4 p-3 bg-linen-deep/30 rounded-input border border-linen-deep/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-black-cherry/60 font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-petrol" />
                    <span>Chance over time ({chartPoints.leadingLabel})</span>
                  </span>
                  <span className="font-display font-black text-petrol tabular-nums">
                    {chartPoints.currentVal}%
                  </span>
                </div>
                <svg viewBox="0 0 360 90" className="w-full h-20 overflow-visible">
                  <polyline
                    fill="none"
                    stroke="#1E5560"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints.points}
                  />
                </svg>
              </div>
            )}

            {/* Option Probabilities List */}
            <div className="space-y-2.5 my-5">
              <div className="text-xs font-bold text-black-cherry/60 uppercase tracking-wider">
                Current Implied Odds
              </div>
              {market.options.map((opt) => {
                const isWinner = market.winningOptionId === opt.id;
                const isYes = opt.label.toLowerCase() === 'yes';

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (!isClosed) {
                        setPreselectedOptionId(opt.id);
                        setSlipOpen(true);
                      }
                    }}
                    className={`relative overflow-hidden p-3.5 rounded-input border transition-all cursor-pointer ${
                      isWinner
                        ? 'bg-petrol/15 border-petrol ring-2 ring-petrol'
                        : 'bg-linen hover:border-black-cherry/40 border-linen-deep'
                    }`}
                  >
                    {/* Background fill based on percentage */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 -z-0 transition-all duration-500 ${
                        isWinner
                          ? 'bg-petrol/20'
                          : isYes
                          ? 'bg-petrol/10'
                          : 'bg-black-cherry/10'
                      }`}
                      style={{ width: `${opt.percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <div className="font-display font-bold text-sm sm:text-base text-black-cherry flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded-pill bg-petrol text-linen text-[10px] font-bold">
                              WINNER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-black-cherry/60 mt-0.5">
                          {opt.userPool} user coins staked &bull; {opt.totalPool} total
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-display font-black text-xl text-black-cherry tabular-nums">
                          {opt.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key Metadata Table */}
            <div className="pt-4 border-t border-linen-deep grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-black-cherry/50 font-medium">Closing Time</span>
                <span className="font-bold text-black-cherry">{formatISTTime(market.closingTime)}</span>
              </div>
              <div>
                <span className="block text-black-cherry/50 font-medium">Proposed By</span>
                <span className="font-bold text-black-cherry">{market.creatorName}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-black-cherry/50 font-medium">Total Pool</span>
                <span className="font-bold text-black-cherry tabular-nums">{market.totalPool} coins</span>
              </div>
            </div>

            {/* Resolution Criteria */}
            <div className="mt-4 p-3 bg-linen-deep/40 rounded-lg text-xs text-black-cherry/80 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-petrol shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-black-cherry">Resolution Source: </strong>
                {market.resolutionSource}
              </div>
            </div>

            {/* Resolution note if settled */}
            {market.resolutionNote && (
              <div className="mt-3 p-3 bg-baby-pink/40 border border-baby-pink rounded-lg text-xs text-black-cherry">
                <div className="font-bold mb-0.5">Official Resolution Note:</div>
                <div>{market.resolutionNote}</div>
              </div>
            )}
          </div>

          {/* User's Position on this Market */}
          {userPredictions.length > 0 && (
            <div className="bg-baby-pink/30 border border-baby-pink rounded-card p-4">
              <h3 className="font-display font-bold text-sm text-black-cherry mb-2">
                Your Predictions on this Market ({userStakedTotal} coins)
              </h3>
              <div className="space-y-2">
                {userPredictions.map((pred) => {
                  const opt = market.options.find((o) => o.id === pred.optionId);
                  return (
                    <div
                      key={pred.id}
                      className="bg-linen p-2.5 rounded-lg border border-linen-deep flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-black-cherry">{opt?.label}</span>
                        <span className="text-black-cherry/60 ml-2">({pred.amount} coins)</span>
                      </div>
                      <div className="font-bold">
                        {pred.status === 'won' ? (
                          <span className="text-petrol">Won +{pred.actualPayout} coins</span>
                        ) : pred.status === 'lost' ? (
                          <span className="text-black-cherry/60">Resolved (Lost)</span>
                        ) : pred.status === 'refunded' ? (
                          <span className="text-petrol">Refunded {pred.amount} coins</span>
                        ) : (
                          <span className="text-petrol">Est. payout: +{pred.estimatedPayout} coins</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community Feed: Anonymized Activity & Discussion */}
          <div className="bg-linen border border-linen-deep rounded-card p-5 shadow-subtle">
            <h3 className="font-display font-bold text-base text-black-cherry mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-petrol" />
              <span>Recent Activity & Buzz</span>
            </h3>

            {/* Recent predictions activity stream */}
            <div className="space-y-2 mb-6">
              {predictions.slice(0, 4).map((p) => {
                const opt = market.options.find((o) => o.id === p.optionId);
                return (
                  <div
                    key={p.id}
                    className="text-xs text-black-cherry/75 flex items-center justify-between py-1.5 border-b border-linen-deep/50"
                  >
                    <span>
                      A student from <strong>{p.userHostel}</strong> put{' '}
                      <strong>{p.amount}</strong> on{' '}
                      <span className="font-bold text-petrol">{opt?.label}</span>
                    </span>
                    <span className="text-[11px] text-black-cherry/40">
                      {formatISTTime(p.createdAt).split('at')[1] || 'recently'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Comments Stream */}
            <div className="space-y-3 mb-5">
              <div className="text-xs font-bold text-black-cherry/60 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({comments.length})</span>
              </div>

              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-linen-deep/30 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-black-cherry/60">
                      <span className="font-bold text-black-cherry">
                        {c.userDisplayName} &bull; {c.userHostel}
                      </span>
                      <span className="text-[10px]">{formatISTTime(c.createdAt)}</span>
                    </div>
                    <p className="text-black-cherry/90 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-black-cherry/50 italic py-2">
                  No comments yet. Share your campus intel!
                </div>
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Drop some campus insight..."
                className="flex-1 px-3 py-2 bg-linen border border-linen-deep rounded-input text-xs text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-pill bg-petrol text-linen font-bold text-xs hover:bg-petrol/90 disabled:opacity-50 transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Desktop Sticky Prediction Panel */}
        <div className="space-y-4">
          <div className="bg-linen border border-linen-deep rounded-card p-5 shadow-subtle sticky top-20">
            <h3 className="font-display font-bold text-base text-black-cherry mb-1">
              Make Your Call
            </h3>
            <p className="text-xs text-black-cherry/60 mb-4">
              Min 5, max 100 coins per market.
            </p>

            <button
              onClick={() => {
                setPreselectedOptionId(market.options[0]?.id);
                setSlipOpen(true);
              }}
              disabled={isClosed}
              className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosed ? 'Predictions Closed' : 'Open Prediction Slip'}
            </button>

            <div className="mt-4 text-[11px] text-black-cherry/60 text-center">
              Play coins only &bull; Payouts calculated parimutuelly on resolution.
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Slip Sheet Modal */}
      {slipOpen && (
        <PredictionSlip
          market={market}
          selectedOptionId={preselectedOptionId}
          onClose={() => setSlipOpen(false)}
          onSuccess={() => {
            refreshMarkets();
            api.getPredictions(market.id).then(setPredictions);
          }}
        />
      )}
    </div>
  );
};
