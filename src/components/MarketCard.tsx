import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Market } from '../types';
import { Clock, Users, Flame } from 'lucide-react';
import { formatISTTime } from '../utils/referral';

interface MarketCardProps {
  market: Market;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const navigate = useNavigate();

  const isClosed = market.status !== 'open' || new Date(market.closingTime).getTime() <= Date.now();

  const handleCardClick = () => {
    navigate(`/market/${market.id}`);
  };

  const handleOptionClick = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    navigate(`/market/${market.id}?opt=${optionId}`);
  };

  // Time remaining text
  const getTimeRemaining = () => {
    if (market.status === 'resolved') return 'Resolved';
    if (market.status === 'cancelled') return 'Cancelled';
    const diff = new Date(market.closingTime).getTime() - Date.now();
    if (diff <= 0) return 'Closed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `Closes in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Closes in ${days}d`;
  };

  const categoryBadgeColors = {
    league: 'bg-cool-blue/15 text-petrol border-cool-blue/30',
    fest: 'bg-baby-pink/60 text-black-cherry border-baby-pink',
    campus: 'bg-linen-deep text-black-cherry border-linen-deep',
  }[market.category];

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-linen border border-linen-deep rounded-card p-4 transition-all hover:border-black-cherry/30 hover:shadow-subtle cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Category & Status Bar */}
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span
            className={`px-2.5 py-0.5 rounded-pill border text-[11px] font-bold uppercase tracking-wider ${categoryBadgeColors}`}
          >
            {market.category}
          </span>

          <div className="flex items-center gap-1.5 text-black-cherry/60 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{getTimeRemaining()}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base text-black-cherry leading-snug line-clamp-2 mb-3 group-hover:text-petrol transition-colors">
          {market.title}
        </h3>

        {/* Market Options / Percentages */}
        {market.type === 'binary' ? (
          <div className="grid grid-cols-2 gap-2 my-3">
            {market.options.map((opt, i) => {
              const isYes = opt.label.toLowerCase() === 'yes';
              return (
                <button
                  key={opt.id}
                  onClick={(e) => handleOptionClick(e, opt.id)}
                  disabled={isClosed}
                  className={`py-2 px-3 rounded-pill text-xs font-bold transition-all flex items-center justify-between border ${
                    isYes
                      ? 'bg-petrol/10 text-petrol border-petrol/30 hover:bg-petrol hover:text-linen'
                      : 'bg-black-cherry/5 text-black-cherry border-black-cherry/20 hover:bg-black-cherry hover:text-linen'
                  } disabled:opacity-50`}
                >
                  <span>{opt.label}</span>
                  <span className="font-display tabular-nums text-sm font-black">{opt.percentage}%</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5 my-3">
            {market.options.slice(0, 3).map((opt) => (
              <div
                key={opt.id}
                onClick={(e) => handleOptionClick(e, opt.id)}
                className="group/opt relative overflow-hidden bg-linen-deep/40 hover:bg-linen-deep/80 rounded-lg p-2 flex items-center justify-between text-xs transition-colors"
              >
                {/* Visual percentage progress bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-petrol/15 -z-0 transition-all duration-500"
                  style={{ width: `${opt.percentage}%` }}
                />
                <span className="font-medium text-black-cherry relative z-10 truncate max-w-[70%]">
                  {opt.label}
                </span>
                <span className="font-display font-bold tabular-nums text-petrol relative z-10">
                  {opt.percentage}%
                </span>
              </div>
            ))}
            {market.options.length > 3 && (
              <div className="text-[11px] text-black-cherry/50 font-medium pl-1">
                +{market.options.length - 3} more options
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="pt-2 border-t border-linen-deep/70 flex items-center justify-between text-xs text-black-cherry/60">
        <div className="flex items-center gap-1 font-medium">
          <Users className="w-3.5 h-3.5" />
          <span>{market.totalUserPool > 0 ? `${market.totalUserPool} coins in pool` : 'New market'}</span>
        </div>
        <div className="font-bold text-[11px] text-petrol">
          {market.options.length} outcomes
        </div>
      </div>
    </div>
  );
};
