import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { LiquidLogo } from './three/LiquidLogo';
import { Coin3D } from './three/Coin3D';
import { LiquidGlass } from './glass/LiquidGlass';
import { Bell, Shield, User as UserIcon, RefreshCw, Sparkles, Check, LogOut, Award } from 'lucide-react';
import { canClaimDailyCoins } from '../utils/referral';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchRole,
    isCoinFlipping,
    isBurstingWin,
    claimDailyCoins,
    resetDemoData,
    notifications,
  } = useHawaStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const dailyCheck = canClaimDailyCoins(currentUser?.dailyClaimLastAt);

  const handleClaim = async () => {
    const res = await claimDailyCoins();
    if (res.success) {
      setClaimToast('+10 coins claimed!');
      setTimeout(() => setClaimToast(null), 3000);
    } else if (res.error) {
      setClaimToast(res.error);
      setTimeout(() => setClaimToast(null), 3000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all demo data back to default initial state?')) {
      await resetDemoData();
      setMenuOpen(false);
      navigate('/feed');
    }
  };

  const handleSignOut = async () => {
    await api.signOut();
    setMenuOpen(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-linen/95 backdrop-blur-md border-b border-linen-deep px-4 py-2.5 transition-all">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo with "h" monogram on scroll */}
        <Link
          to="/feed"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol rounded-lg"
          aria-label="Hawa Home"
        >
          {/* Animated Monogram badge on scroll */}
          {isScrolled ? (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <div className="w-7 h-7 flex items-center justify-center">
                <img src="/hawa-monogram.svg" alt="Hawa monogram" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-black text-xl text-petrol tracking-tight leading-none">
                hawa
              </span>
            </div>
          ) : (
            <div className="flex items-center h-8">
              {/* Larger 28-32px tall wordmark */}
              <LiquidLogo size="small" interactiveParallax={false} />
            </div>
          )}
        </Link>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Daily 10 Coins Action (if ready) */}
          {dailyCheck.canClaim && currentUser && (
            <button
              onClick={handleClaim}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-baby-pink text-black-cherry text-xs font-semibold rounded-pill border border-linen-deep hover:bg-baby-pink/80 transition-transform active:scale-95"
              aria-label="Claim daily coins"
            >
              <Sparkles className="w-3.5 h-3.5 text-petrol" />
              <span>Claim 10 coins</span>
            </button>
          )}

          {/* Balance Chip (Liquid Glass Surface) */}
          <LiquidGlass
            type="pill"
            tintOpacity={0.25}
            radius={999}
            className="px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-subtle hover:brightness-105 transition-all"
            onClick={dailyCheck.canClaim ? handleClaim : undefined}
          >
            <Coin3D isFlipping={isCoinFlipping} isBurstingWin={isBurstingWin} size={24} />
            <span className="font-display font-bold text-sm text-black-cherry tracking-tight tabular-nums">
              {currentUser?.balance ?? 100}
            </span>
            <span className="text-xs font-medium text-black-cherry/60">coins</span>
          </LiquidGlass>

          {/* Notifications bell */}
          <Link
            to="/profile#notifications"
            className="relative p-2 rounded-full text-black-cherry hover:bg-linen-deep/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tangerine" />
            )}
          </Link>

          {/* User Profile Avatar & Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-pill bg-linen-deep/60 hover:bg-linen-deep transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol"
              aria-label="Open user menu"
            >
              <div className="w-7 h-7 rounded-full bg-petrol text-linen flex items-center justify-center font-bold text-xs uppercase">
                {currentUser?.displayName ? currentUser.displayName.slice(0, 2) : 'KV'}
              </div>
              <span className="text-xs font-semibold text-black-cherry hidden md:inline pr-1.5">
                {currentUser?.hostel || 'Hostel'}
              </span>
            </button>

            {/* Menu Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-linen border border-linen-deep rounded-card shadow-float py-2 z-50 text-sm">
                <div className="px-3 py-2 border-b border-linen-deep">
                  <div className="font-semibold text-black-cherry truncate">
                    {currentUser?.displayName}
                  </div>
                  <div className="text-xs text-black-cherry/60 flex items-center justify-between">
                    <span>{currentUser?.hostel}</span>
                    <span className="capitalize px-1.5 py-0.5 rounded-pill bg-baby-pink/60 text-[10px] font-bold">
                      {currentUser?.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-linen-deep/50 text-black-cherry"
                  >
                    <UserIcon className="w-4 h-4 text-petrol" />
                    <span>My Profile & Stats</span>
                  </Link>

                  {/* Daily Bonus in dropdown */}
                  <button
                    onClick={() => {
                      handleClaim();
                      setMenuOpen(false);
                    }}
                    disabled={!dailyCheck.canClaim}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-linen-deep/50 text-black-cherry disabled:opacity-50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-petrol" />
                      <span>Claim 10 coins</span>
                    </div>
                    {!dailyCheck.canClaim && (
                      <span className="text-[11px] text-black-cherry/50">
                        {dailyCheck.formattedCountdown.split(' ')[0]} left
                      </span>
                    )}
                  </button>

                  {/* Role Switcher */}
                  <div className="px-3 py-2 border-t border-linen-deep">
                    <div className="text-[11px] uppercase font-bold text-black-cherry/50 mb-1.5 tracking-wider">
                      Switch Role (Demo)
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => switchRole('student')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-pill transition-colors ${
                          currentUser?.role === 'student'
                            ? 'bg-petrol text-linen'
                            : 'bg-linen-deep/70 text-black-cherry hover:bg-linen-deep'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        onClick={() => switchRole('admin')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-pill transition-colors flex items-center justify-center gap-1 ${
                          currentUser?.role === 'admin'
                            ? 'bg-petrol text-linen'
                            : 'bg-linen-deep/70 text-black-cherry hover:bg-linen-deep'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        Admin
                      </button>
                    </div>
                  </div>

                  {currentUser?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 bg-petrol/10 text-petrol font-semibold hover:bg-petrol/20 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <div className="border-t border-linen-deep pt-1">
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-linen-deep/50 text-black-cherry/80 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-petrol" />
                      <span>Replay Intro Deck</span>
                    </Link>

                    <Link
                      to="/brand"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-linen-deep/50 text-black-cherry/80 text-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-tangerine" />
                      <span>Brand Kit (/brand)</span>
                    </Link>

                    <button
                      onClick={handleReset}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black-cherry/10 text-black-cherry/80 text-left text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black-cherry/15 text-black-cherry font-semibold text-left text-xs border-t border-linen-deep mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-black-cherry" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast alert */}
      {claimToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-black-cherry text-linen px-4 py-2 rounded-pill shadow-float text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-tangerine" />
          <span>{claimToast}</span>
        </div>
      )}
    </header>
  );
};
