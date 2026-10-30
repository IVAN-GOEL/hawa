import React, { useState, useEffect } from 'react';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { LeaderboardEntry, HostelLeaderboardEntry } from '../types';
import { Podium3D } from '../components/three/Podium3D';
import { Trophy, Flame, Target, UserPlus, Building2 } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { currentUser } = useHawaStore();

  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [metric, setMetric] = useState<'netCoins' | 'accuracy' | 'streak' | 'referrals'>('netCoins');
  const [activeTab, setActiveTab] = useState<'students' | 'hostels'>('students');

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [hostelEntries, setHostelEntries] = useState<HostelLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'students') {
      api.getLeaderboard(period, metric).then((res) => {
        setEntries(res);
        setLoading(false);
      });
    } else {
      api.getHostelLeaderboard().then((res) => {
        setHostelEntries(res);
        setLoading(false);
      });
    }
  }, [period, metric, activeTab]);

  // Current user rank in entries
  const userRankIndex = entries.findIndex((e) => e.userId === currentUser?.id);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : undefined;

  const top3 = entries.slice(0, 3);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-black-cherry">
          Campus Hall of Fame
        </h1>
        <p className="text-xs sm:text-sm text-black-cherry/70 mt-1">
          Top predictors, streaks, and campus plugs.
        </p>

        {/* Tab switcher: Students vs Hostels */}
        <div className="inline-flex p-1 bg-linen-deep/60 rounded-pill border border-linen-deep mt-4">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-1.5 rounded-pill text-xs font-bold transition-all ${
              activeTab === 'students'
                ? 'bg-petrol text-linen shadow-sm'
                : 'text-black-cherry/70 hover:text-black-cherry'
            }`}
          >
            Individual Predictors
          </button>
          <button
            onClick={() => setActiveTab('hostels')}
            className={`px-4 py-1.5 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'hostels'
                ? 'bg-petrol text-linen shadow-sm'
                : 'text-black-cherry/70 hover:text-black-cherry'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hostel vs Hostel</span>
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <>
          {/* Sub-Filters: Metric & Period */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-linen border border-linen-deep p-2 rounded-card shadow-subtle">
            {/* Metric tabs */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: 'netCoins', label: 'Net Coins', icon: Trophy },
                { id: 'accuracy', label: 'Accuracy %', icon: Target },
                { id: 'streak', label: 'Streak', icon: Flame },
                { id: 'referrals', label: 'Top Inviters', icon: UserPlus },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id as any)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      metric === m.id
                        ? 'bg-petrol text-linen shadow-sm'
                        : 'text-black-cherry/70 hover:bg-linen-deep/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Period tabs */}
            <div className="flex items-center gap-1 text-xs bg-linen-deep/40 p-1 rounded-pill">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold capitalize transition-all ${
                    period === p
                      ? 'bg-linen text-black-cherry shadow-sm'
                      : 'text-black-cherry/60 hover:text-black-cherry'
                  }`}
                >
                  {p === 'all' ? 'All time' : `This ${p}`}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Rising Podium for Top 3 */}
          {top3.length >= 3 && (
            <div className="my-6 bg-linen border border-linen-deep rounded-card p-4 shadow-subtle overflow-hidden">
              <div className="text-center text-xs font-bold text-black-cherry/60 uppercase tracking-wider mb-2">
                Top 3 Podium
              </div>
              <Podium3D userRank={userRank && userRank <= 3 ? userRank : undefined} />

              {/* Podium names below blocks */}
              <div className="grid grid-cols-3 text-center text-xs pt-2 border-t border-linen-deep/50">
                {/* 2nd Place */}
                <div className="px-1">
                  <div className="w-5 h-5 rounded-full bg-cool-blue text-linen font-bold text-[10px] mx-auto mb-1 flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-black-cherry truncate">{top3[1]?.displayName}</div>
                  <div className="text-[10px] text-black-cherry/60">{top3[1]?.hostel}</div>
                </div>

                {/* 1st Place */}
                <div className="px-1 -mt-2">
                  <div className="w-6 h-6 rounded-full bg-petrol text-linen font-bold text-xs mx-auto mb-1 flex items-center justify-center shadow-subtle">
                    1
                  </div>
                  <div className="font-display font-black text-sm text-petrol truncate">
                    {top3[0]?.displayName}
                  </div>
                  <div className="text-[11px] text-black-cherry/70 font-semibold">{top3[0]?.hostel}</div>
                </div>

                {/* 3rd Place */}
                <div className="px-1">
                  <div className="w-5 h-5 rounded-full bg-baby-pink text-black-cherry font-bold text-[10px] mx-auto mb-1 flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-black-cherry truncate">{top3[2]?.displayName}</div>
                  <div className="text-[10px] text-black-cherry/60">{top3[2]?.hostel}</div>
                </div>
              </div>
            </div>
          )}

          {/* Metric condition guidance */}
          {metric === 'accuracy' && (
            <div className="mb-4 text-xs text-black-cherry/60 italic text-center">
              * Minimum 5 resolved predictions required to qualify for accuracy ranking.
            </div>
          )}

          {/* Full Table */}
          <div className="bg-linen border border-linen-deep rounded-card shadow-subtle overflow-hidden">
            <div className="divide-y divide-linen-deep">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === currentUser?.id;

                return (
                  <div
                    key={entry.userId}
                    className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors ${
                      isCurrentUser
                        ? 'bg-baby-pink/30 font-bold border-l-4 border-l-tangerine'
                        : 'hover:bg-linen-deep/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-sm sm:text-base text-black-cherry/70 w-6 text-center tabular-nums">
                        #{rank}
                      </span>
                      <div>
                        <div className="font-display font-bold text-sm text-black-cherry flex items-center gap-2">
                          <span>{entry.displayName}</span>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-pill bg-tangerine text-black-cherry text-[10px] font-black uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-black-cherry/60">{entry.hostel}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {metric === 'netCoins' && (
                        <div>
                          <div className="font-display font-black text-sm sm:text-base text-petrol tabular-nums">
                            {entry.netCoinsWon >= 0 ? `+${entry.netCoinsWon}` : entry.netCoinsWon} coins
                          </div>
                          <div className="text-[10px] text-black-cherry/50">
                            {entry.resolvedPredictionsCount} resolved calls
                          </div>
                        </div>
                      )}
                      {metric === 'accuracy' && (
                        <div>
                          <div className="font-display font-black text-sm sm:text-base text-petrol tabular-nums">
                            {entry.accuracy}%
                          </div>
                          <div className="text-[10px] text-black-cherry/50">
                            {entry.resolvedPredictionsCount} calls
                          </div>
                        </div>
                      )}
                      {metric === 'streak' && (
                        <div>
                          <div className="font-display font-black text-sm sm:text-base text-petrol tabular-nums">
                            {entry.streak} wins in a row
                          </div>
                        </div>
                      )}
                      {metric === 'referrals' && (
                        <div>
                          <div className="font-display font-black text-sm sm:text-base text-cool-blue tabular-nums">
                            {entry.referralsRewarded} verified friends
                          </div>
                          <div className="text-[10px] text-black-cherry/50">
                            +{entry.referralsRewarded * 50} coins earned
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Hostel vs Hostel Table */
        <div className="bg-linen border border-linen-deep rounded-card shadow-subtle overflow-hidden">
          <div className="p-4 bg-linen-deep/30 border-b border-linen-deep text-xs font-bold text-black-cherry flex justify-between">
            <span>Hostel / Department</span>
            <span>Net Coins Won / Win Rate</span>
          </div>
          <div className="divide-y divide-linen-deep">
            {hostelEntries.map((h, idx) => (
              <div
                key={h.hostel}
                className="p-4 flex items-center justify-between hover:bg-linen-deep/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-base text-black-cherry/60 w-6">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-sm text-black-cherry">
                      {h.hostel}
                    </h4>
                    <span className="text-xs text-black-cherry/60">
                      {h.totalMembers} active members &bull; {h.totalPredictions} predictions
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-black text-sm text-petrol tabular-nums">
                    {h.netCoinsWon >= 0 ? `+${h.netCoinsWon}` : h.netCoinsWon} coins
                  </div>
                  <div className="text-xs text-black-cherry/60 font-medium">
                    {h.winRate}% win rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
