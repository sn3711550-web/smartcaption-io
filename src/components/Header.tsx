import React, { useState, useRef, useEffect } from 'react';
import { PlaySquare, Zap, Video, LogOut, ChevronDown, CheckCircle, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  currentView: 'studio' | 'landing';
  onNavigate: (view: 'studio' | 'landing', sectionId?: string) => void;
  onUploadClick: () => void;
  onOpenPricing?: () => void;
  onOpenTranscriber?: () => void;
  onOpenAuth: (reason?: 'export' | 'limit' | 'upload' | 'general') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onUploadClick,
  onOpenPricing,
  onOpenAuth,
}) => {
  const { user, profile, signOut, remainingCredits, isLimitReached } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-6 px-4 sm:px-10 py-3.5 bg-[#0a0b12]/90 backdrop-blur-md border-b border-white/[0.08]">
      {/* Zone 1: Brand Wordmark with Smart Caption Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          {/* Smart Caption Glowing DP/Logo Icon */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden ring-1 ring-violet-500/40 shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-all">
            <img
              src="/src/assets/images/smartcaption_logo_1791567332036.jpg"
              alt="Smart Caption Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                Smart Caption
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                AI
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Zone 2: Clean Nav Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300">
        <button
          onClick={() => onNavigate('landing', 'features')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Features
        </button>
        <button
          onClick={() => onNavigate('landing', 'how-it-works')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          How it works
        </button>
        <button
          onClick={() => {
            if (onOpenPricing) onOpenPricing();
            else onNavigate('landing', 'pricing');
          }}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Pricing
        </button>
        <button
          onClick={() => onNavigate('landing', 'demo')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Demo
        </button>
        <button
          onClick={() => {
            if (!user) {
              onOpenAuth('general');
            } else {
              onNavigate('studio');
            }
          }}
          className={`hover:text-violet-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            currentView === 'studio' ? 'text-violet-400 font-semibold' : ''
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5" />
          Studio
        </button>
      </nav>

      {/* Zone 3: Google Auth & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {user ? (
          /* User is logged in: show DP, credit badge & profile dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full transition-all cursor-pointer group"
            >
              {/* Credits / Plan Badge */}
              <div className="flex items-center gap-1 text-xs">
                {profile?.plan === 'free' ? (
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      isLimitReached
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {remainingCredits}/3 Free Left
                  </span>
                ) : (
                  <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-amber-300" />
                    PRO
                  </span>
                )}
              </div>

              {/* User Avatar / DP */}
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-violet-500/40 bg-violet-600/30 flex items-center justify-center shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-violet-300" />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#12131d] border border-white/[0.12] rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                {/* User Info Header */}
                <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-violet-500/50 shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                      {user.displayName || 'Creator'}
                    </span>
                    <span className="text-xs text-neutral-400 truncate">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Account Usage & Quota Box */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="font-medium">Plan Status:</span>
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {profile?.plan || 'Free'} Plan
                    </span>
                  </div>

                  {profile?.plan === 'free' ? (
                    <>
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>Free Video Exports</span>
                        <span className="font-semibold text-white">
                          {profile?.freeCreditsUsed || 0} / {profile?.freeCreditsMax || 3} used
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isLimitReached ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (((profile?.freeCreditsUsed || 0) / (profile?.freeCreditsMax || 3)) *
                                100)
                            )}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unlimited High-Res 4K & 1080p Exports</span>
                    </div>
                  )}
                </div>

                {/* Upgrade Button if Free Plan */}
                {profile?.plan === 'free' && onOpenPricing && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                    <span>Upgrade to Pro Plan</span>
                  </button>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await signOut();
                  }}
                  className="w-full py-2 px-3 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* User is NOT logged in: show Google Sign In button */
          <button
            onClick={() => onOpenAuth('general')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] rounded-full transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
          >
            {/* Google G logo */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        )}

        {/* View / Action Buttons */}
        {currentView === 'landing' ? (
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('general');
              } else {
                onNavigate('studio');
              }
            }}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-full transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 whitespace-nowrap flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Try it free</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Upgrade</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('landing')}
              className="px-3 py-1.5 sm:py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('upload');
                } else {
                  onUploadClick();
                }
              }}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-full transition-all shadow-md shadow-violet-600/30 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Upload Video</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
