import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { LandingCanvas } from '../components/three/LandingCanvas';
import { LiquidLogo } from '../components/three/LiquidLogo';
import { Coin3D } from '../components/three/Coin3D';
import { AirSwirlMotif } from '../components/AirSwirlMotif';
import {
  ChaiStudentCharacter,
  FestGirlCharacter,
  SportsStrikerCharacter,
  WashiTapeSticker,
  HandDrawnArrow,
  ApprovedStampBadge,
  DoodledStar,
} from '../components/CollegeDoodles';
import { sound } from '../utils/sound';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Trophy,
  Flame,
  Award,
  Users,
  ShieldCheck,
  Check,
  Smartphone,
  TrendingUp,
} from 'lucide-react';

const TOTAL_SLIDES = 10;

export const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useHawaStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [publicStats, setPublicStats] = useState({ studentsCount: 64, activeMarketsCount: 12 });
  const [paletteWipe, setPaletteWipe] = useState(true);

  // Live odds simulation ticker for Slide 4
  const [tickerOdds, setTickerOdds] = useState({ yes: 64, no: 36 });
  const [heroCoinFlipping, setHeroCoinFlipping] = useState(false);
  const [heroSampleChoice, setHeroSampleChoice] = useState<'yes' | 'no' | null>(null);

  const handleHeroCoinTap = () => {
    sound.playCoinPing();
    sound.vibrate(20);
    setHeroCoinFlipping(true);
    setTimeout(() => setHeroCoinFlipping(false), 1200);
  };

  // Touch handling
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const refCode = searchParams.get('ref');

  // If already logged in, redirect straight to /feed
  useEffect(() => {
    if (currentUser?.onboarded) {
      navigate('/feed', { replace: true });
    }
  }, [currentUser, navigate]);

  // Load public stats
  useEffect(() => {
    api.getPublicStats().then((st) => setPublicStats(st));
  }, []);

  // 2-second initial palette wipe
  useEffect(() => {
    const timer = setTimeout(() => setPaletteWipe(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Live odds fluctuation loop for Slide 4
  useEffect(() => {
    if (currentSlide === 3) {
      const interval = setInterval(() => {
        setTickerOdds((prev) => {
          const delta = (Math.random() - 0.48) * 6;
          const newYes = Math.min(88, Math.max(22, Math.round(prev.yes + delta)));
          return { yes: newYes, no: 100 - newYes };
        });
      }, 1600);
      return () => clearInterval(interval);
    }
  }, [currentSlide]);

  const goToSlide = (idx: number) => {
    if (idx < 0 || idx >= TOTAL_SLIDES) return;
    setCurrentSlide(idx);
    sound.vibrate(10);
    sound.playWhoosh();
  };

  // Keyboard navigation (Arrow keys, space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goToSlide(Math.min(TOTAL_SLIDES - 1, currentSlide + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSlide(Math.max(0, currentSlide - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Wheel scrolling throttled
  const lastScrollTime = useRef(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 600) return;
    if (Math.abs(e.deltaY) > 25) {
      lastScrollTime.current = now;
      if (e.deltaY > 0) {
        goToSlide(Math.min(TOTAL_SLIDES - 1, currentSlide + 1));
      } else {
        goToSlide(Math.max(0, currentSlide - 1));
      }
    }
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToSlide(Math.min(TOTAL_SLIDES - 1, currentSlide + 1));
      } else {
        goToSlide(Math.max(0, currentSlide - 1));
      }
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playCoinPing();
    }
  };

  const handleGetIn = () => {
    const loginUrl = refCode ? `/login?ref=${encodeURIComponent(refCode)}` : '/login';
    navigate(loginUrl);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-screen h-screen overflow-hidden bg-linen text-black-cherry select-none"
    >
      {/* Initial 2-second palette wipe animation */}
      {paletteWipe && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col transition-all duration-1000">
          <div className="flex-1 bg-black-cherry animate-pulse" />
          <div className="flex-1 bg-petrol" />
          <div className="flex-1 bg-baby-pink" />
          <div className="flex-1 bg-tangerine" />
        </div>
      )}

      {/* Persistent 3D Canvas in background */}
      <LandingCanvas currentSlide={currentSlide} />

      {/* Air Swirl Line Motif */}
      <AirSwirlMotif opacity={0.6} />

      {/* ALWAYS-VISIBLE CHROME */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Top-Left Small Wordmark & College Sticker */}
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-2xl text-petrol tracking-tight">
            hawa
          </span>
          <WashiTapeSticker text="Campus Buzz" color="#F5C6D2" className="hidden sm:inline-block" />
        </div>

        {/* Top-Right Controls & CTA */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle (Off by default) */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-full bg-linen-deep/60 hover:bg-linen-deep text-black-cherry transition-all shadow-sm"
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={isMuted ? 'Sound off (Click to unmute)' : 'Sound on'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-black-cherry/60" /> : <Volume2 className="w-4 h-4 text-petrol" />}
          </button>

          {/* Top-Right Get In CTA */}
          <button
            onClick={handleGetIn}
            className="px-4 sm:px-5 py-2 rounded-pill bg-tangerine text-black-cherry font-display font-black text-xs sm:text-sm hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center gap-1.5"
          >
            <span>Get in</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </header>

      {/* Progress Dots on Right Edge (Desktop & Tablet) */}
      <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-2.5">
        {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentSlide === idx
                ? 'bg-petrol scale-125 ring-2 ring-petrol/30'
                : 'bg-linen-deep hover:bg-black-cherry/40'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter on Mobile Bottom */}
      <div className="fixed bottom-4 left-6 z-40 sm:hidden text-[11px] font-bold text-black-cherry/50 uppercase tracking-wider">
        Slide {currentSlide + 1} of {TOTAL_SLIDES}
      </div>

      {/* ========================================================== */}
      {/* SLIDES CONTAINER WITH RICH COLLEGE DOODLES & CHARACTERS */}
      {/* ========================================================== */}
      <div className="w-full h-full flex flex-col justify-center items-center px-4 sm:px-12 max-w-4xl mx-auto text-center relative z-20">

        {/* SLIDE 1: OPEN (The Hero Moment with Giant Logo & Interactive Coin) */}
        {currentSlide === 0 && (
          <div className="space-y-3.5 animate-fade-in relative max-w-2xl mx-auto">
            {/* Top Washi Tape & Referral Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
              <WashiTapeSticker text="Hostel League • Fest Buzz • Mess Intel" color="#F5C6D2" />
              {refCode && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-baby-pink text-black-cherry text-xs font-bold border border-linen-deep shadow-subtle">
                  <Sparkles className="w-3.5 h-3.5 text-petrol" />
                  <span>Code {refCode} applied: 50 free coins waiting!</span>
                </div>
              )}
            </div>

            {/* BIGGER HERO LIQUID LOGO WORDMARK */}
            <div className="w-[88vw] sm:w-[58vw] max-w-[560px] h-36 sm:h-48 mx-auto flex items-center justify-center relative">
              <LiquidLogo size="large" interactiveParallax={true} />
            </div>

            {/* Giant Tagline */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 sm:left-4 animate-bounce">
                <DoodledStar color="#FF8A3D" className="w-7 h-7" />
              </div>
              <div className="absolute -top-4 -right-4 sm:right-6">
                <DoodledStar color="#5B8EF2" className="w-6 h-6" />
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-black-cherry tracking-tight leading-none drop-shadow-sm">
                Kya hawa hai?
              </h1>
              <p className="font-display font-bold text-base sm:text-xl text-petrol mt-2">
                Call campus buzz before it happens.
              </p>
            </div>

            {/* Vertical 3D Coin Hero Interaction ("use the coin alot") */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div
                onClick={handleHeroCoinTap}
                className="cursor-pointer group flex items-center gap-2.5 px-4 py-2 rounded-pill bg-linen border-2 border-linen-deep hover:border-tangerine shadow-subtle transition-all active:scale-95"
                title="Tap to flip 3D vertical coin"
              >
                <Coin3D isFlipping={heroCoinFlipping} size={36} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-black-cherry/50">Free Starter Bankroll</div>
                  <div className="font-display font-black text-sm text-black-cherry flex items-center gap-1">
                    <span>100 Virtual Coins</span>
                    <Sparkles className="w-3.5 h-3.5 text-tangerine" />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Buzz Teaser Box */}
            <div className="max-w-md mx-auto p-3.5 sm:p-4 bg-linen/90 backdrop-blur-sm border-2 border-linen-deep rounded-card shadow-float text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-black-cherry/60">
                <span className="uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-tangerine" />
                  Live Campus Buzz
                </span>
                <span className="text-petrol">10 coins to call</span>
              </div>
              <div className="font-display font-bold text-sm sm:text-base text-black-cherry">
                "Will Hostel A win the inter-hostel cricket derby?"
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setHeroSampleChoice('yes');
                    handleHeroCoinTap();
                  }}
                  className={`py-2 px-3 rounded-pill text-xs font-display font-black border transition-all flex items-center justify-between ${
                    heroSampleChoice === 'yes'
                      ? 'bg-petrol text-linen border-petrol shadow-sm'
                      : 'bg-linen-deep/40 text-black-cherry border-linen-deep hover:bg-linen-deep'
                  }`}
                >
                  <span>YES</span>
                  <span className="opacity-80">64%</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroSampleChoice('no');
                    handleHeroCoinTap();
                  }}
                  className={`py-2 px-3 rounded-pill text-xs font-display font-black border transition-all flex items-center justify-between ${
                    heroSampleChoice === 'no'
                      ? 'bg-tangerine text-black-cherry border-tangerine shadow-sm'
                      : 'bg-linen-deep/40 text-black-cherry border-linen-deep hover:bg-linen-deep'
                  }`}
                >
                  <span>NO</span>
                  <span className="opacity-80">36%</span>
                </button>
              </div>
              {heroSampleChoice && (
                <div className="text-[11px] font-bold text-petrol pt-1 text-center animate-fade-in">
                  🎯 You called {heroSampleChoice.toUpperCase()}! Estimated return: {heroSampleChoice === 'yes' ? '16' : '28'} coins
                </div>
              )}
            </div>

            {/* Chai Insider Student Illustration peeking on desktop */}
            <div className="hidden lg:block absolute -bottom-12 -left-28 transform -rotate-6 pointer-events-none">
              <ChaiStudentCharacter className="w-36 h-36" />
            </div>

            {/* Direct Get In CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={handleGetIn}
                className="w-full sm:w-auto px-7 py-3 rounded-pill bg-tangerine text-black-cherry font-display font-black text-sm hover:brightness-105 active:scale-95 transition-all shadow-subtle inline-flex items-center justify-center gap-2"
              >
                <span>Get in</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={() => goToSlide(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-pill bg-linen-deep/60 hover:bg-linen-deep text-black-cherry font-display font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5"
              >
                <span>See how it works</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-black-cherry/60 font-semibold">
              Play coins only &bull; Zero real money &bull; Strictly campus bragging rights
            </div>
          </div>
        )}

        {/* SLIDE 2: THE HOOK (With Sports Striker Character) */}
        {currentSlide === 1 && (
          <div className="space-y-5 animate-fade-in max-w-2xl relative">
            {/* Peeking sports character */}
            <div className="hidden md:block absolute -right-28 -top-8 pointer-events-none">
              <SportsStrikerCharacter className="w-36 h-36" />
            </div>

            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="The Campus Takes" color="#5B8EF2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Everyone on campus has a take. <br />
              <span className="text-petrol relative inline-block">
                Now it counts.
                <span className="absolute left-0 right-0 -bottom-1 h-1.5 bg-tangerine/60 rounded-full" />
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs font-bold">
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle text-black-cherry transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="text-[10px] text-petrol block mb-1 uppercase tracking-wider">Mess Committee</span>
                "Will the mess serve biryani this Sunday?"
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle text-black-cherry transform rotate-1 hover:rotate-0 transition-transform">
                <span className="text-[10px] text-tangerine block mb-1 uppercase tracking-wider">Fest Core</span>
                "Who headlines the annual cult fest?"
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle text-black-cherry transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="text-[10px] text-cool-blue block mb-1 uppercase tracking-wider">Hostel League</span>
                "Will Hostel A beat Hostel C in finals?"
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => goToSlide(2)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>See how it works</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 3: HOW IT WORKS (With Fest Girl Character) */}
        {currentSlide === 2 && (
          <div className="space-y-5 animate-fade-in max-w-2xl relative">
            <div className="hidden md:block absolute -left-28 -top-6 pointer-events-none">
              <FestGirlCharacter className="w-36 h-36" />
            </div>

            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Zero Real Money" color="#F5C6D2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Three steps. Endless bragging rights.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle space-y-1">
                <span className="font-display font-black text-base text-petrol flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-petrol text-linen text-xs flex items-center justify-center">1</span>
                  <span>Pick a call</span>
                </span>
                <p className="text-xs text-black-cherry/75 pt-1">
                  Choose an upcoming match, fest announcement, or campus event.
                </p>
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle space-y-1">
                <span className="font-display font-black text-base text-tangerine flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-tangerine text-black-cherry text-xs flex items-center justify-center">2</span>
                  <span>Put coins on it</span>
                </span>
                <p className="text-xs text-black-cherry/75 pt-1">
                  Stake 5 to 100 virtual coins on your instinct.
                </p>
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle space-y-1">
                <span className="font-display font-black text-base text-cool-blue flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-cool-blue text-linen text-xs flex items-center justify-center">3</span>
                  <span>Win the pool</span>
                </span>
                <p className="text-xs text-black-cherry/75 pt-1">
                  Be right, split the total user pool with fellow winners.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => goToSlide(3)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>Check live odds</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 4: LIVE ODDS */}
        {currentSlide === 3 && (
          <div className="space-y-5 animate-fade-in max-w-xl">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Real-Time Polling" color="#5B8EF2" />
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Watch the campus change its mind.
            </h2>

            {/* Interactive Live Odds Card Simulation */}
            <div className="bg-linen border-2 border-linen-deep rounded-card p-5 text-left shadow-float space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-petrol uppercase tracking-wider">
                  Football Final Closes in 48h
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-tangerine animate-ping" />
              </div>

              <h4 className="font-display font-bold text-base text-black-cherry">
                Will Hostel A beat Hostel C?
              </h4>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-petrol/10 border-2 border-petrol/30 rounded-lg flex items-center justify-between">
                  <span className="font-bold text-xs text-petrol">Yes</span>
                  <span className="font-display font-black text-2xl text-petrol tabular-nums">
                    {tickerOdds.yes}%
                  </span>
                </div>
                <div className="p-3 bg-black-cherry/5 border-2 border-black-cherry/20 rounded-lg flex items-center justify-between">
                  <span className="font-bold text-xs text-black-cherry">No</span>
                  <span className="font-display font-black text-2xl text-black-cherry tabular-nums">
                    {tickerOdds.no}%
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-black-cherry/60 italic flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-petrol" />
                <span>Odds shift dynamically every time students make a call.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => goToSlide(4)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>Propose a market</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 5: PROPOSE ANYTHING */}
        {currentSlide === 4 && (
          <div className="space-y-5 animate-fade-in max-w-xl relative">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Student Proposer Flow" color="#F5C6D2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Got a question? <br />
              <span className="text-petrol">Make it a market.</span>
            </h2>

            <div className="bg-linen border-2 border-linen-deep rounded-card p-6 shadow-float text-left space-y-3 relative overflow-hidden">
              {/* Hand-drawn approved stamp badge */}
              <div className="absolute right-4 top-2 pointer-events-none">
                <ApprovedStampBadge className="w-24 h-24" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black-cherry/60 uppercase">
                  Proposed by Sneha Reddy (Hostel D)
                </span>
              </div>
              <div className="font-display font-bold text-base text-black-cherry pr-16">
                "Will the library extend hours for mid-terms week?"
              </div>
              <p className="text-xs text-black-cherry/70">
                Verified through student council and admin moderation, so questions stay safe and fair.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => goToSlide(5)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>Understand the coin economy</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 6: COINS */}
        {currentSlide === 5 && (
          <div className="space-y-4 animate-fade-in max-w-2xl text-center">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Purely Virtual" color="#FF8A3D" />
            </div>

            {/* Vertical 3D Spinning Coin Star */}
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <Coin3D isFlipping={true} isBurstingWin={true} size={64} />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Play coins only. <br />
              <span className="text-tangerine">No real money.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-center">
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle transform -rotate-1">
                <div className="font-display font-black text-3xl text-petrol tabular-nums">100</div>
                <div className="text-xs font-bold text-black-cherry mt-1">Coins when you join</div>
                <div className="text-[11px] text-black-cherry/60 mt-0.5">Free starter bankroll</div>
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle transform rotate-1">
                <div className="font-display font-black text-3xl text-tangerine tabular-nums">+10</div>
                <div className="text-xs font-bold text-black-cherry mt-1">Every single day</div>
                <div className="text-[11px] text-black-cherry/60 mt-0.5">00:00 IST daily drop</div>
              </div>
              <div className="p-4 bg-linen border-2 border-linen-deep rounded-card shadow-subtle transform -rotate-1">
                <div className="font-display font-black text-3xl text-cool-blue tabular-nums">+50</div>
                <div className="text-xs font-bold text-black-cherry mt-1">Per friend you bring</div>
                <div className="text-[11px] text-black-cherry/60 mt-0.5">Up to 10 friends</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={handleGetIn}
                className="px-5 py-2.5 rounded-pill bg-tangerine text-black-cherry font-display font-black text-xs hover:brightness-105 shadow-subtle"
              >
                Claim my 100 coins
              </button>
              <button
                onClick={() => goToSlide(6)}
                className="text-xs font-bold text-petrol hover:underline"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 7: HOSTEL WARS */}
        {currentSlide === 6 && (
          <div className="space-y-5 animate-fade-in max-w-xl">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Hostel Championship" color="#5B8EF2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Your hostel vs everyone.
            </h2>
            <p className="text-xs sm:text-sm text-black-cherry/75">
              Every correct call boosts your hostel's total standing in the campus championship.
            </p>

            <div className="pt-3">
              <button
                onClick={() => goToSlide(7)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>See streaks and badges</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 8: STREAKS AND BADGES */}
        {currentSlide === 7 && (
          <div className="space-y-5 animate-fade-in max-w-xl">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Bragging Rights" color="#F5C6D2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Collect badges. Show off streaks.
            </h2>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                'First Call',
                'Hot Streak 🔥',
                'Headliner Hunter',
                'Sharp 🎯',
                'Contrarian',
                'Connector',
                'Campus Plug ⚡',
              ].map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1.5 rounded-pill bg-linen border-2 border-linen-deep text-xs font-bold text-black-cherry shadow-subtle"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="pt-3">
              <button
                onClick={() => goToSlide(8)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>Invite friends</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 9: BRING YOUR PEOPLE */}
        {currentSlide === 8 && (
          <div className="space-y-5 animate-fade-in max-w-xl">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Referral Bonus" color="#5B8EF2" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-black-cherry leading-tight">
              Invite friends. <br />
              <span className="text-petrol">Get 50 coins each.</span>
            </h2>

            <div className="p-5 bg-linen border-2 border-linen-deep rounded-card shadow-float text-center max-w-xs mx-auto space-y-2 relative">
              <div className="text-[11px] font-bold text-black-cherry/60 uppercase">
                Your Unique Invite Code
              </div>
              <div className="font-display font-black text-2xl text-black-cherry tracking-widest tabular-nums">
                HAWA-XXXX
              </div>
              <p className="text-[11px] text-black-cherry/70">
                Share on WhatsApp or hostel group chat in one click.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => goToSlide(9)}
                className="text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
              >
                <span>Ready to enter</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 10: THE CLOSE */}
        {currentSlide === 9 && (
          <div className="space-y-4 animate-fade-in max-w-xl text-center">
            <div className="flex justify-center gap-2">
              <WashiTapeSticker text="Season 1 Live" color="#FF8A3D" />
            </div>

            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <Coin3D isFlipping={false} size={64} />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-black-cherry leading-tight">
              The whole campus is already talking. <br />
              <span className="text-petrol">Join the hawa.</span>
            </h2>

            <p className="text-xs sm:text-sm text-black-cherry/75 max-w-md mx-auto">
              Call matches, fest secrets, and campus rumors before they happen.
            </p>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleGetIn}
                className="w-full max-w-xs py-4 px-6 rounded-pill bg-tangerine text-black-cherry font-display font-black text-base hover:brightness-105 active:scale-95 transition-all shadow-float mx-auto flex items-center justify-center gap-2"
              >
                <span>Get in</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="text-xs text-black-cherry/60 font-medium">
                Open to everyone &bull; Free 100 starter coins &bull; Play coins only
              </div>

              {/* Social Proof */}
              <div className="pt-2 text-xs text-petrol font-bold flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-petrol" />
                <span>
                  {publicStats.studentsCount > 0 ? (
                    <>{publicStats.studentsCount} students already inside</>
                  ) : (
                    <>Verified college community &bull; 100 starter coins</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Prompt on Slide 0 */}
      {currentSlide === 0 && (
        <div
          onClick={() => goToSlide(1)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 cursor-pointer flex flex-col items-center gap-1 text-black-cherry/60 hover:text-black-cherry transition-colors"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider">Explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default LandingPage;

