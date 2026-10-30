import React, { useState, useMemo } from 'react';
import { useHawaStore } from '../store/useHawaStore';
import { MarketCard } from '../components/MarketCard';
import { MarketCategory, SortOption } from '../types';
import { Search, Flame, Clock, Sparkles, TrendingUp, SlidersHorizontal, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AmbientAir3D } from '../components/three/AmbientAir3D';
import {
  ChaiStudentCharacter,
  WashiTapeSticker,
  DoodledStar,
} from '../components/CollegeDoodles';

export const HomePage: React.FC = () => {
  const {
    markets,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    fpsWarning,
    setFpsWarning,
  } = useHawaStore();

  const [disableAmbient, setDisableAmbient] = useState(false);

  const categories: { id: MarketCategory; label: string }[] = [
    { id: 'all', label: 'All Buzz' },
    { id: 'league', label: 'League' },
    { id: 'fest', label: 'Fest' },
    { id: 'campus', label: 'Campus' },
  ];

  const sortOptions: { id: SortOption; label: string; icon: any }[] = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'closing', label: 'Closing soon', icon: Clock },
    { id: 'newest', label: 'Newest', icon: Sparkles },
    { id: 'pool', label: 'Biggest pool', icon: TrendingUp },
  ];

  // Filter & sort markets
  const filteredMarkets = useMemo(() => {
    return markets
      .filter((m) => {
        if (activeCategory !== 'all' && m.category !== activeCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchDesc = m.description.toLowerCase().includes(q);
          const matchOptions = m.options.some((o) => o.label.toLowerCase().includes(q));
          return matchTitle || matchDesc || matchOptions;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'closing') {
          return new Date(a.closingTime).getTime() - new Date(b.closingTime).getTime();
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'pool') {
          return b.totalPool - a.totalPool;
        }
        // Trending: active open with high user pool
        return (b.totalUserPool || 0) - (a.totalUserPool || 0);
      });
  }, [markets, activeCategory, searchQuery, sortBy]);

  return (
    <div className="relative min-h-screen">
      {/* 3D Ambient drifting layer behind content (auto-downgraded if fps < 40) */}
      {!disableAmbient && !fpsWarning && (
        <AmbientAir3D
          onFpsDowngrade={() => {
            setDisableAmbient(true);
            setFpsWarning(true);
          }}
        />
      )}

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-4 sm:py-6">
        {/* Welcome Tagline Banner with College Stickers */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-linen-deep/60 pb-4 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <WashiTapeSticker text="CAMPUS PREDICTIONS" color="#F5C6D2" className="transform -rotate-1" />
              <DoodledStar className="w-5 h-5" color="#FF8A3D" />
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-black-cherry tracking-tight">
              Kya hawa hai?
            </h1>
            <p className="text-xs sm:text-sm text-black-cherry/70 mt-0.5">
              Hyperlocal college prediction market. Play coins only &bull; no real money.
            </p>
          </div>

          <Link
            to="/propose"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-tangerine text-black-cherry font-display font-bold text-xs rounded-pill shadow-subtle hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Propose Market</span>
          </Link>
        </div>

        {/* Search & Category Filter Header */}
        <div className="space-y-3 mb-6">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black-cherry/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cricket finals, fest headliners, mess biryani..."
              className="w-full pl-10 pr-4 py-2.5 bg-linen border border-linen-deep rounded-input text-xs sm:text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol transition-all"
            />
          </div>

          {/* Category Tabs & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-petrol text-linen shadow-sm'
                      : 'bg-linen-deep/60 text-black-cherry/75 hover:bg-linen-deep hover:text-black-cherry'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort pills */}
            <div className="flex items-center gap-1 text-xs self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-black-cherry/50 mr-1 hidden sm:inline">
                Sort:
              </span>
              <div className="flex items-center bg-linen-deep/50 p-0.5 rounded-pill border border-linen-deep">
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        sortBy === opt.id
                          ? 'bg-linen text-black-cherry shadow-sm'
                          : 'text-black-cherry/60 hover:text-black-cherry'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden md:inline">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Markets Grid (Mobile 1-col, Desktop 2-3 col grid) */}
        {filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          /* Empty state in light Hinglish with Chai student doodle per spec */
          <div className="my-16 text-center py-10 px-6 border-2 border-dashed border-linen-deep rounded-card bg-linen-deep/20 max-w-md mx-auto relative overflow-hidden">
            <div className="flex justify-center mb-1">
              <ChaiStudentCharacter className="w-32 h-32" />
            </div>
            <h3 className="font-display font-black text-xl text-black-cherry mt-1">
              No hawa yet.
            </h3>
            <p className="text-xs text-black-cherry/75 mt-1.5 mb-5 max-w-xs mx-auto">
              Nothing matches this filter right now. Propose the first market or check another category!
            </p>
            <Link
              to="/propose"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-pill bg-tangerine text-black-cherry font-display font-black text-xs hover:brightness-105 transition-all shadow-subtle"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Propose the first market</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
