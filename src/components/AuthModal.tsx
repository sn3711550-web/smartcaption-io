import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Zap, AlertCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'export' | 'limit' | 'upload' | 'general';
  onSuccess?: () => void;
  onOpenPricing?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  reason = 'general',
  onSuccess,
  onOpenPricing,
}) => {
  const { signIn, signInWithEmail, profile, isLimitReached } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      console.warn('Google sign-in caught:', code, err);

      if (code === 'auth/popup-blocked' || err?.message === 'POPUP_BLOCKED') {
        setShowEmailFallback(true);
        setError('Browser ne popup block kar diya hai. Kripya neeche apna Gmail daal kar turant sign in karein.');
      } else if (code === 'auth/cancelled-popup-request' || err?.message === 'POPUP_INTERRUPTED') {
        setError('Sign-in process interrupt hua tha. Kripya dobara try karein ya neeche Gmail use karein.');
        setShowEmailFallback(true);
      } else if (code === 'auth/popup-closed-by-user' || err?.message === 'POPUP_CLOSED') {
        setError('Sign-in window band ho gaya. Kripya dobara click karein.');
      } else if (code === 'auth/unauthorized-domain' || err?.message === 'UNAUTHORIZED_DOMAIN') {
        setShowEmailFallback(true);
        setError('Domain preview me popup block hua. Kripya neeche apna Gmail daal kar login karein.');
      } else {
        setShowEmailFallback(true);
        setError('Google window open nahi ho payi. Kripya neeche apna Gmail daal kar sign in karein.');
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Kripya apna Gmail address enter karein.');
      return;
    }
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Kripya valid Gmail address enter karein (e.g. yourname@gmail.com).');
      return;
    }

    setIsEmailLoading(true);
    setError(null);
    try {
      await signInWithEmail(cleanEmail);
      setIsEmailLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsEmailLoading(false);
      console.error('Email sign-in failed:', err);
      setError('Account connect karne me error aayi. Kripya dobara try karein.');
    }
  };

  const getReasonContent = () => {
    if (isLimitReached) {
      return {
        badge: 'Free Limit Reached',
        title: 'Your 3 Free Exports Have Been Used',
        subtitle: `Your Google account (${profile?.email || 'this account'}) has utilized all 3 free export credits. Upgrade to Smart Caption Pro for unlimited exports!`,
        actionType: 'upgrade',
      };
    }

    switch (reason) {
      case 'export':
        return {
          badge: 'Account Required',
          title: 'Sign in to Export Your Video',
          subtitle:
            'Sign in with Google to download your video. Every Google account receives 3 Free 1080p AI Video Exports and cloud project syncing.',
          actionType: 'login',
        };
      case 'upload':
        return {
          badge: 'Creator Access',
          title: 'Sign in to Transcribe & Edit',
          subtitle:
            'Connect your Google account to auto-save your video subtitles and claim your free export credits.',
          actionType: 'login',
        };
      case 'limit':
        return {
          badge: 'Usage Notice',
          title: 'Free Plan Quota Exceeded',
          subtitle:
            'Each Google account is limited to 3 free video exports to prevent server abuse. Upgrade to Pro for unlimited exports.',
          actionType: 'upgrade',
        };
      default:
        return {
          badge: 'Sign In',
          title: 'Welcome to Smart Caption AI',
          subtitle:
            'Sign in with Google to preserve your video projects, access 3 free video exports, and unlock viral subtitle presets.',
          actionType: 'login',
        };
    }
  };

  const content = getReasonContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#12131d] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-violet-500/50 shadow-xl shadow-violet-600/30">
            <img
              src="/src/assets/images/smartcaption_logo_1791567332036.jpg"
              alt="Smart Caption Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {content.badge}
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            {content.title}
          </h3>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Free Plan / Quota Protection Callout */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-neutral-300">
          <div className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Account Quota Protection</span>
          </div>
          <p className="text-neutral-400 leading-normal">
            Your usage data is safely linked to your Google account. You get 3 free high-res exports.
            No credit card required upfront.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {content.actionType === 'upgrade' ? (
            <button
              onClick={() => {
                onClose();
                if (onOpenPricing) onOpenPricing();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>Upgrade to Pro (Unlimited Exports)</span>
            </button>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  {/* Google G SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          )}

          {/* Quick Gmail Sign-In Section if not upgrade */}
          {content.actionType !== 'upgrade' && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <span className="relative px-3 bg-[#12131d] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Or Sign In with Gmail (Zero Popups)
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your Gmail address"
                    className="w-full pl-9 pr-2.5 py-2.5 bg-white/[0.05] border border-white/[0.1] focus:border-violet-500 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || isEmailLoading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isEmailLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
