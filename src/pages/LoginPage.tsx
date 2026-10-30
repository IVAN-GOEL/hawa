import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { LiquidLogo } from '../components/three/LiquidLogo';
import { AirSwirlMotif } from '../components/AirSwirlMotif';
import { ArrowRight, AlertCircle, RefreshCw, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import {
  ChaiStudentCharacter,
  WashiTapeSticker,
  DoodledStar,
  HandDrawnArrow,
} from '../components/CollegeDoodles';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentUser, currentUser } = useHawaStore();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [publicStats, setPublicStats] = useState({ studentsCount: 64 });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Detect OAuth redirect in URL
  useEffect(() => {
    const hasHashAuth = window.location.hash.includes('access_token') || window.location.hash.includes('error');
    const hasCodeAuth = window.location.search.includes('code=');
    if (hasHashAuth || hasCodeAuth) {
      setOauthProcessing(true);
    }
  }, []);

  // Sync Supabase Auth state & handle redirect
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const refCode = searchParams.get('ref');
          const redirect = searchParams.get('redirect') || '/feed';
          if (!user.onboarded) {
            navigate(refCode ? `/onboarding?ref=${encodeURIComponent(refCode)}` : '/onboarding', { replace: true });
          } else {
            navigate(redirect, { replace: true });
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setOauthProcessing(false);
      }
    };

    checkSession();

    const { unsubscribe } = api.onAuthStateChange((user) => {
      if (user) {
        setCurrentUser(user);
        const refCode = searchParams.get('ref');
        const redirect = searchParams.get('redirect') || '/feed';
        if (!user.onboarded) {
          navigate(refCode ? `/onboarding?ref=${encodeURIComponent(refCode)}` : '/onboarding', { replace: true });
        } else {
          navigate(redirect, { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams, setCurrentUser]);

  // Load public stats
  useEffect(() => {
    api.getPublicStats().then((st) => setPublicStats(st));
  }, []);

  // Redirect if already logged in and onboarded
  useEffect(() => {
    if (currentUser?.onboarded) {
      const redirect = searchParams.get('redirect') || '/feed';
      navigate(redirect, { replace: true });
    }
  }, [currentUser, navigate, searchParams]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setErrorMsg(null);
    setIsOAuthLoading(provider);
    try {
      const ref = searchParams.get('ref');
      const redirect = searchParams.get('redirect');
      let target = '/login';
      const params = new URLSearchParams();
      if (ref) params.set('ref', ref);
      if (redirect) params.set('redirect', redirect);
      const q = params.toString();
      if (q) target += `?${q}`;

      const res = await api.signInWithOAuth(provider, target);
      if (!res.success) {
        setErrorMsg(res.error || `Could not start ${provider} sign-in`);
        setIsOAuthLoading(null);
        return;
      }

      // Check if user is instantly logged in (e.g. test or mock)
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (!user.onboarded) {
          navigate(ref ? `/onboarding?ref=${encodeURIComponent(ref)}` : '/onboarding', { replace: true });
        } else {
          navigate(redirect || '/feed', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OAuth sign-in error');
      setIsOAuthLoading(null);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.sendOtp(email);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to send code');
        setIsSubmitting(false);
        return;
      }

      setStep('otp');
      setResendTimer(30);
      setIsSubmitting(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending code');
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit on 6th digit filled
    if (val && index === 5 && newDigits.every((d) => d !== '')) {
      submitVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
      submitVerification(pasted);
    }
  };

  const submitVerification = async (code: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyOtp(email, code);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Incorrect code. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(res.user);

      const refCode = searchParams.get('ref');
      const redirect = searchParams.get('redirect') || '/feed';

      if (!res.user.onboarded) {
        const onboardingUrl = refCode ? `/onboarding?ref=${encodeURIComponent(refCode)}` : '/onboarding';
        navigate(onboardingUrl, { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-full bg-linen flex flex-col justify-between p-3.5 sm:p-6 overflow-x-hidden">
      {/* Background Air Swirl Curves */}
      <AirSwirlMotif opacity={0.65} />

      {/* Top Header Back / Brand */}
      <div className="w-full max-w-md mx-auto pt-2 flex items-center justify-between gap-2 px-1">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-black-cherry/60 hover:text-black-cherry transition-colors shrink-0"
        >
          &larr; Back to intro
        </button>
        <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-pill bg-baby-pink/80 text-black-cherry uppercase tracking-wider shrink-0">
          Instant Access &bull; 100 Free Coins
        </span>
      </div>

      {/* Center Hero Logo & Login Box */}
      <div className="w-full max-w-md mx-auto my-auto py-4 sm:py-6">
        {/* HERO LIQUID LOGO: Spans nicely on mobile and desktop */}
        <div className="w-full min-h-[28vh] sm:min-h-[36vh] flex flex-col items-center justify-center text-center">
          <div className="w-full max-w-[320px] sm:max-w-[480px] h-36 sm:h-52 flex items-center justify-center">
            <LiquidLogo size="large" interactiveParallax={true} />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-black-cherry tracking-tight mt-1">
            Kya hawa hai?
          </h1>
          <p className="text-xs sm:text-sm text-black-cherry/75 mt-0.5">
            Call campus buzz before it happens.
          </p>
        </div>

        {/* Auth Card with College Stickers & Character */}
        <div className="relative mt-2">
          {/* Peeking Student Character on Top-Right */}
          <div className="hidden sm:block absolute -top-16 -right-10 pointer-events-none z-10">
            <ChaiStudentCharacter className="w-28 h-28 transform rotate-6 drop-shadow-md" />
          </div>

          {/* College Washi Tape Header */}
          <div className="absolute -top-3 left-6 z-20">
            <WashiTapeSticker text="FREE 100 STARTER COINS" color="#F5C6D2" className="transform -rotate-2" />
          </div>

          <div className="bg-linen border-2 border-linen-deep rounded-card p-5 sm:p-8 shadow-float relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 pointer-events-none opacity-20">
              <DoodledStar className="w-24 h-24" color="#FF8A3D" />
            </div>
          {/* OAuth Redirect Processing State */}
          {oauthProcessing && (
            <div className="mb-4 p-3 bg-petrol/10 border border-petrol/30 rounded-xl flex items-center justify-center gap-2.5 text-xs text-petrol font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-petrol" />
              <span>Verifying your Google session with campus...</span>
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              {/* 1-Click OAuth Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isOAuthLoading !== null || isSubmitting || oauthProcessing}
                  onClick={() => handleOAuthSignIn('google')}
                  className="w-full py-3.5 px-4 rounded-pill font-display font-bold text-sm bg-white hover:bg-linen/40 text-black-cherry border-2 border-linen-deep hover:border-black-cherry/30 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-3 disabled:opacity-60 group cursor-pointer"
                >
                  {isOAuthLoading === 'google' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-petrol" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  disabled={isOAuthLoading !== null || isSubmitting || oauthProcessing}
                  onClick={() => handleOAuthSignIn('github')}
                  className="w-full py-2.5 px-4 rounded-pill font-sans font-semibold text-xs bg-linen-deep/50 hover:bg-linen-deep text-black-cherry border border-black-cherry/10 active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
                >
                  {isOAuthLoading === 'github' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black-cherry" />
                  ) : (
                    <svg className="w-4 h-4 fill-current shrink-0 text-black-cherry" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  )}
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Doodle Separator */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-linen-deep absolute inset-0 my-auto"></div>
                <span className="relative bg-linen px-3 text-[11px] font-bold text-black-cherry/50 uppercase tracking-wider">
                  or use email code
                </span>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-black-cherry mb-1.5 flex items-center justify-between">
                    <span>Enter Your Email *</span>
                    <span className="text-[11px] text-petrol font-semibold">1-time 6-digit code</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black-cherry/40" />
                    <input
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com or college email"
                      className="w-full pl-10 pr-4 py-3 bg-linen border border-linen-deep rounded-input text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
                    />
                  </div>
                  <span className="text-[11px] text-black-cherry/50 mt-1 block">
                    Any email welcome &bull; We'll send a 6-digit login code.
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-black-cherry shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || oauthProcessing}
                  className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Sending code...</span>
                  ) : (
                    <>
                      <span>Send my code</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-semibold text-black-cherry/60">
                  Enter the 6-digit code sent to
                </span>
                <div className="font-bold text-sm text-black-cherry mt-0.5">{email}</div>
              </div>

              {/* 6 Separate Digit Boxes */}
              <div className="flex justify-center gap-2 sm:gap-2.5 my-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center font-display font-black text-xl text-black-cherry bg-linen border-2 border-linen-deep focus:border-petrol rounded-input focus:outline-none focus:ring-2 focus:ring-petrol/20 transition-all tabular-nums"
                  />
                ))}
              </div>

              {/* Instructions */}
              <div className="text-center text-[11px] text-black-cherry/60">
                Check your college inbox or spam for the 6-digit verification code.
              </div>

              {errorMsg && (
                <div className="p-3 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-black-cherry shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Resend Timer & Change Email */}
              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-black-cherry/60 hover:text-black-cherry underline"
                >
                  Change email
                </button>

                {resendTimer > 0 ? (
                  <span className="text-black-cherry/50 font-medium tabular-nums">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="font-bold text-petrol hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend code</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Campus Community Badge */}
          <div className="mt-6 pt-4 border-t border-linen-deep text-center text-xs text-black-cherry/70 flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-petrol" />
            <span>
              {publicStats.studentsCount > 0 ? (
                <><strong>{publicStats.studentsCount} callers</strong> inside making predictions</>
              ) : (
                <>Open to everyone &bull; 100 starter coins &bull; Zero real money</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Footer Promise */}
      <div className="text-center pb-4 text-[11px] text-black-cherry/60 font-medium">
        Play coins only. No real money. Just bragging rights.
      </div>
    </div>
  );
};

export default LoginPage;
