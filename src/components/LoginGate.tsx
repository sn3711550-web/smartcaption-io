import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Flame,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { SMART_CAPTION_LOGO } from '../data/presets.ts';

interface LoginGateProps {
  onSuccess?: () => void;
  onBackToHome?: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onSuccess, onBackToHome }) => {
  const { signIn, signInWithEmail } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  // 1. Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setErrorMessage(null);
    setIsPopupBlocked(false);

    try {
      await signIn();
      setIsLoadingGoogle(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoadingGoogle(false);
      const code = err?.code || '';
      console.warn('LoginGate Google sign-in caught:', code, err);

      if (code === 'auth/popup-blocked' || err?.message === 'POPUP_BLOCKED') {
        setIsPopupBlocked(true);
        setErrorMessage(
          'Aapke browser ne popup window block kar di hai. Kripya neeche apna Gmail daal kar turant login karein ya browser address bar se popups allow karein.'
        );
      } else if (code === 'auth/cancelled-popup-request' || err?.message === 'POPUP_INTERRUPTED') {
        setErrorMessage('Sign-in process interrupt ho gaya tha. Kripya dobara click karein.');
      } else if (code === 'auth/popup-closed-by-user' || err?.message === 'POPUP_CLOSED') {
        setErrorMessage('Sign-in window band ho gaya. Kripya dobara login par click karein.');
      } else if (code === 'auth/unauthorized-domain' || err?.message === 'UNAUTHORIZED_DOMAIN') {
        setIsPopupBlocked(true);
        setErrorMessage(
          'Preview domain par popup block hua hai. Kripya neeche apna Gmail daal kar 1-click me login karein.'
        );
      } else {
        setIsPopupBlocked(true);
        setErrorMessage(
          'Google popup open nahi ho paya. Kripya neeche apna Gmail enter karke sidha login karein.'
        );
      }
    }
  };

  // 2. Direct Gmail Instant Sign-In (Guaranteed Zero-Popup Fallback)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Kripya apna Gmail address enter karein.');
      return;
    }
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Kripya valid Gmail ya email ID enter karein (e.g. user@gmail.com).');
      return;
    }

    setIsLoadingEmail(true);
    setErrorMessage(null);

    try {
      await signInWithEmail(cleanEmail);
      setIsLoadingEmail(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoadingEmail(false);
      console.error('Email login error:', err);
      setErrorMessage(
        err?.message && err.message !== 'Account connect karne me dikkat aayi.'
          ? err.message
          : 'Account connect karne me dikkat aayi. Kripya dobara try karein.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 bg-[#0a0b12] text-white relative overflow-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-violet-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl bg-[#12131d]/90 border border-white/[0.1] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col gap-7">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-violet-500/50 shadow-xl shadow-violet-600/30 group">
            <img
              src={SMART_CAPTION_LOGO}
              alt="Smart Caption Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>Login Required to Access Studio</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Sign In to Smart Caption AI
          </h2>

          <p className="text-sm text-neutral-400 max-w-md leading-relaxed text-balance">
            Website aur AI caption generator use karne ke liye login zaroori hai. Har account ko{' '}
            <strong className="text-amber-400 font-bold">3 Free 1080p Video Exports</strong> aur
            cloud project save milta hai.
          </p>
        </div>

        {/* Error / Popup Notice Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-200 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-red-300">Login Notice:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Action 1: One-Click Continue with Google */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle || isLoadingEmail}
            className="w-full py-4 px-6 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3.5 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoadingGoogle ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                <span>Connecting Google Account...</span>
              </>
            ) : (
              <>
                {/* Official Google G SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider: OR GMAIL SIGN IN */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 bg-[#12131d] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Or Sign In with Gmail (Zero Popups Needed)
            </span>
          </div>

          {/* Action 2: Direct Gmail Form */}
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your Gmail (e.g. name@gmail.com)"
                  className="w-full pl-10 pr-3 py-3 bg-white/[0.05] border border-white/[0.12] focus:border-violet-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingGoogle || isLoadingEmail}
                className="py-3 px-5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {isLoadingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Enter Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 leading-tight">
              Instant login: Popups block hone par bhi ye 100% kaam karta hai. Data safe aur
              Firestore database me save hota hai.
            </p>
          </form>
        </div>

        {/* Benefits & Anti-Abuse Guarantee Box */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Account Benefits & Free Quota</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>3 Free 1080p Video Exports</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>12+ Viral Subtitle Presets</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hindi, English & 10+ Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Anti-Abuse Google Account Lock</span>
            </div>
          </div>
        </div>

        {/* Back to Home CTA */}
        {onBackToHome && (
          <div className="flex items-center justify-center pt-1 border-t border-white/[0.06]">
            <button
              onClick={onBackToHome}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
