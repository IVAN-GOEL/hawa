import React, { useState } from 'react';
import { LiquidLogo } from '../components/three/LiquidLogo';
import { Coin3D } from '../components/three/Coin3D';
import { AirSwirlMotif } from '../components/AirSwirlMotif';
import { sound } from '../utils/sound';
import { ArrowLeft, CheckCircle, XCircle, Volume2, Sparkles, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BrandPage: React.FC = () => {
  const navigate = useNavigate();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinBursting, setCoinBursting] = useState(false);

  const colors = [
    { name: 'Linen', hex: '#F3EDE2', role: 'Page background', textColor: '#3B0F20' },
    { name: 'Linen Deep', hex: '#E8DFCF', role: 'Cards, inputs, dividers', textColor: '#3B0F20' },
    { name: 'Petrol', hex: '#1E5560', role: 'Primary brand, Yes/Win calls', textColor: '#F3EDE2' },
    { name: 'Baby Pink', hex: '#F5C6D2', role: 'Soft surfaces, glass tint, podium 3', textColor: '#3B0F20' },
    { name: 'Tangerine', hex: '#FF8A3D', role: 'Primary CTA, 3D coin (never text on linen)', textColor: '#3B0F20' },
    { name: 'Black Cherry', hex: '#3B0F20', role: 'Primary typography, No/Loss calls', textColor: '#F3EDE2' },
    { name: 'Cool Blue', hex: '#5B8EF2', role: 'Links, charts, podium 2', textColor: '#FFFFFF' },
  ];

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedToken(hex);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const triggerFlip = () => {
    setCoinFlipping(true);
    sound.vibrate(15);
    sound.playCoinPing();
    setTimeout(() => setCoinFlipping(false), 1200);
  };

  const triggerBurst = () => {
    setCoinBursting(true);
    sound.vibrate(30);
    sound.playCoinPing();
    setTimeout(() => setCoinBursting(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-linen text-black-cherry p-4 sm:p-8 max-w-5xl mx-auto space-y-12">
      <AirSwirlMotif opacity={0.4} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-linen-deep pb-4">
        <div>
          <button
            onClick={() => navigate('/feed')}
            className="text-xs font-bold text-black-cherry/60 hover:text-black-cherry flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Feed</span>
          </button>
          <h1 className="font-display font-black text-3xl text-black-cherry">
            Hawa Brand Kit & Design System
          </h1>
          <p className="text-xs sm:text-sm text-black-cherry/70 mt-1">
            "Kya hawa hai?" &bull; Identity, typography, liquid metal, and voice guidelines.
          </p>
        </div>
        <span className="px-3 py-1 rounded-pill bg-petrol text-linen text-xs font-bold uppercase tracking-wider">
          Internal Guide
        </span>
      </div>

      {/* Section 1: Logo & Monogram Assets */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          1. Brand Wordmark & Monogram
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Liquid Wordmark */}
          <div className="bg-linen border border-linen-deep rounded-card p-6 shadow-subtle flex flex-col items-center text-center">
            <span className="text-xs font-bold text-black-cherry/60 uppercase tracking-wider mb-2">
              Primary Liquid Metal Wordmark
            </span>
            <div className="w-full h-44 flex items-center justify-center my-2">
              <LiquidLogo size="large" interactiveParallax={true} />
            </div>
            <p className="text-xs text-black-cherry/70 mt-2">
              Lowercase "hawa" in thick rounded display face with dynamic simplex noise edge refraction.
            </p>
          </div>

          {/* App Monogram & Icon */}
          <div className="bg-linen border border-linen-deep rounded-card p-6 shadow-subtle flex flex-col items-center text-center">
            <span className="text-xs font-bold text-black-cherry/60 uppercase tracking-wider mb-2">
              "h" Monogram App Icon & Favicon
            </span>
            <div className="w-28 h-28 my-auto p-2">
              <img src="/hawa-monogram.svg" alt="Hawa Monogram Icon" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <p className="text-xs text-black-cherry/70 mt-2">
              Thick-stroke "h" monogram used on sticky scroll, favicon, and mobile launcher icon.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: 3D Coin & Interactive Moments */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          2. 3D Embossed Coin & Physics
        </h2>

        <div className="bg-linen border border-linen-deep rounded-card p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 flex items-center justify-center bg-linen-deep/30 rounded-2xl border border-linen-deep">
              <Coin3D isFlipping={coinFlipping} isBurstingWin={coinBursting} size={64} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-black-cherry">
                Embossed "H" Tangerine Coin
              </h3>
              <p className="text-xs text-black-cherry/70 max-w-sm mt-0.5">
                Physical metallic coin with milled rim and chiseled "H". Flips on prediction and bursts on a win.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2">
            <button
              onClick={triggerFlip}
              className="px-4 py-2 rounded-pill bg-linen-deep hover:bg-linen-deep/80 text-black-cherry text-xs font-bold transition-all"
            >
              Test Flip
            </button>
            <button
              onClick={triggerBurst}
              className="px-4 py-2 rounded-pill bg-tangerine text-black-cherry text-xs font-bold hover:brightness-105 transition-all shadow-subtle"
            >
              Test Win Burst
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Palette & Contrast */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          3. Color Palette Tokens & Accessibility
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {colors.map((c) => (
            <div
              key={c.hex}
              onClick={() => copyHex(c.hex)}
              className="p-3 bg-linen border border-linen-deep rounded-card shadow-subtle cursor-pointer hover:border-petrol transition-all"
            >
              <div
                className="w-full h-16 rounded-lg mb-2 shadow-inner flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: c.hex, color: c.textColor }}
              >
                {copiedToken === c.hex ? <Check className="w-4 h-4" /> : c.hex}
              </div>
              <div className="font-bold text-xs text-black-cherry">{c.name}</div>
              <div className="text-[10px] text-black-cherry/60 mt-0.5">{c.role}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-black-cherry/70 italic">
          * Hard accessibility rule: Tangerine (#FF8A3D) is never used as text on linen (#F3EDE2) to guarantee strict WCAG AA compliance.
        </div>
      </section>

      {/* Section 4: Typography Scale */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          4. Typography Scale & Tabular Numerals
        </h2>

        <div className="bg-linen border border-linen-deep rounded-card p-6 shadow-subtle space-y-4">
          <div className="flex items-baseline justify-between border-b border-linen-deep/40 pb-2">
            <span className="text-xs text-black-cherry/50 font-mono w-24">44px / Display</span>
            <span className="font-display font-black text-2xl text-black-cherry">Kya hawa hai?</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-linen-deep/40 pb-2">
            <span className="text-xs text-black-cherry/50 font-mono w-24">28px / Headline</span>
            <span className="font-display font-bold text-xl text-black-cherry">Call it before it happens.</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-linen-deep/40 pb-2">
            <span className="text-xs text-black-cherry/50 font-mono w-24">20px / Section</span>
            <span className="font-display font-bold text-lg text-petrol">Will Hostel A beat Hostel C?</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-linen-deep/40 pb-2">
            <span className="text-xs text-black-cherry/50 font-mono w-24">16px / Body</span>
            <span className="text-base text-black-cherry">Hyperlocal campus predictions with virtual coins.</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-linen-deep/40 pb-2">
            <span className="text-xs text-black-cherry/50 font-mono w-24">14px / Tabular</span>
            <span className="font-display font-bold text-sm tabular-nums text-black-cherry">100 coins &bull; Yes 64% &bull; No 36%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-black-cherry/50 font-mono w-24">12px / Micro</span>
            <span className="text-xs text-black-cherry/60 font-medium">Play coins only. No real money. Just bragging rights.</span>
          </div>
        </div>
      </section>

      {/* Section 5: Voice Guidelines & Forbidden Vocabulary */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          5. Voice, Tone & Hard Language Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* DO */}
          <div className="p-5 bg-petrol/10 border border-petrol/30 rounded-card space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-petrol">
              <CheckCircle className="w-5 h-5 text-petrol" />
              <span>DO USE (Campus Buzz Vocabulary)</span>
            </div>
            <ul className="text-xs text-black-cherry/85 space-y-1 list-disc pl-5">
              <li><strong>Predict, Prediction, Call, Caller</strong></li>
              <li><strong>Virtual Coins, Play Coins</strong></li>
              <li><strong>"Kya hawa hai?" (What's the buzz?)</strong></li>
              <li><strong>"No hawa yet. Propose the first market."</strong></li>
              <li><strong>"Play coins only. No real money. Just bragging rights."</strong></li>
            </ul>
          </div>

          {/* DON'T */}
          <div className="p-5 bg-black-cherry/10 border border-black-cherry/30 rounded-card space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-black-cherry">
              <XCircle className="w-5 h-5 text-black-cherry" />
              <span>STRICTLY FORBIDDEN (NEVER USE)</span>
            </div>
            <ul className="text-xs text-black-cherry/85 space-y-1 list-disc pl-5">
              <li>Never use <strong>"bet"</strong> or <strong>"betting"</strong></li>
              <li>Never use <strong>"gamble"</strong> or <strong>"gambling"</strong></li>
              <li>Never use <strong>"satta"</strong> or <strong>"daav"</strong></li>
              <li>Never use <strong>"jackpot"</strong> or <strong>"cash"</strong></li>
              <li>Never use words implying deposits, UPI, or withdrawals</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 6: Open Graph Preview */}
      <section className="space-y-4 pb-12">
        <h2 className="font-display font-bold text-xl text-black-cherry border-b border-linen-deep/60 pb-2">
          6. Open Graph & Social Share Preview (1200x630)
        </h2>

        <div className="bg-linen border border-linen-deep rounded-card p-4 shadow-subtle overflow-hidden max-w-2xl mx-auto">
          <img
            src="/hawa-og.svg"
            alt="Open Graph preview"
            className="w-full h-auto rounded-lg border border-linen-deep shadow-sm"
          />
        </div>
      </section>
    </div>
  );
};

export default BrandPage;
