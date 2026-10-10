import React from 'react';
import { ShieldCheck, Mail, Sparkles, Heart, Globe, Lock } from 'lucide-react';
import { LegalTab } from './LegalModal.tsx';
import { SMART_CAPTION_LOGO } from '../data/presets.ts';

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void;
  onNavigate: (view: 'studio' | 'landing', sectionId?: string) => void;
  onOpenPricing: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onNavigate,
  onOpenPricing,
}) => {
  return (
    <footer className="w-full bg-[#07080f] border-t border-white/[0.08] text-neutral-400 text-xs">
      {/* Upper Footer: Columns */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand & Description (4 cols) */}
        <div className="md:col-span-5 flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-violet-500/40 shadow-md">
              <img
                src={SMART_CAPTION_LOGO}
                alt="Smart Caption DP Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-white tracking-tight">Smart Caption</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                PRO
              </span>
            </div>
          </div>

          <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
            Smart Caption is the leading AI video subtitle studio. Automatically transcribe multi-language speech, generate animated text effects, word-by-word highlights, and export directly in 480p, 720p, and 1080p for Instagram Reels, YouTube Shorts, and TikTok.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>AI Powered</span>
            </span>
          </div>
        </div>

        {/* Product Navigation (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Product</h5>
          <button
            onClick={() => onNavigate('studio')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            Studio Editor
          </button>
          <button
            onClick={() => onNavigate('landing', 'features')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => onNavigate('landing', 'how-it-works')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={onOpenPricing}
            className="text-left hover:text-white transition-colors cursor-pointer text-violet-400 font-semibold"
          >
            Pricing & Plans
          </button>
          <button
            onClick={() => onNavigate('landing', 'demo')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            Creator Demos
          </button>
        </div>

        {/* Legal & Compliance (Sabse zaroori for AdSense & Razorpay) (3 cols) */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span>Legal & Compliance</span>
          </h5>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => onOpenLegal('terms')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            onClick={() => onOpenLegal('refund')}
            className="text-left hover:text-white transition-colors cursor-pointer text-neutral-300"
          >
            Refund & Cancellation Policy
          </button>
          <button
            onClick={() => onOpenLegal('about')}
            className="text-left hover:text-white transition-colors cursor-pointer"
          >
            About AutoCaption
          </button>
          <button
            onClick={() => onOpenLegal('contact')}
            className="text-left hover:text-white transition-colors cursor-pointer text-violet-400 font-semibold"
          >
            Contact & Support
          </button>
        </div>

        {/* Support & Contact (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-violet-400" />
            <span>Support</span>
          </h5>
          <p className="text-neutral-400 text-xs">Direct Creator Helpline:</p>
          <a
            href="mailto:sn3711550@gmail.com"
            className="text-violet-400 hover:underline font-mono text-xs break-all"
          >
            sn3711550@gmail.com
          </a>
          <p className="text-[11px] text-neutral-500 mt-2">
            24/7 technical support for exports, billing & translation queries.
          </p>
        </div>
      </div>

      {/* Lower Footer: Copyright & AdSense Note */}
      <div className="border-t border-white/[0.06] bg-black/40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>© 2026 Smart Caption. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Cookies & Ads
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Security
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal('refund')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Refunds
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
