import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Film,
  Smartphone,
  Pencil,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Star,
  Globe,
  Sliders,
} from 'lucide-react';
import { SAMPLE_VIDEOS, CAPTION_STYLES } from '../data/presets.ts';
import { SampleVideo } from '../types.ts';
import { AdBanner } from './AdBanner.tsx';
import { Footer } from './Footer.tsx';
import { LegalTab } from './LegalModal.tsx';

interface LandingShowcaseProps {
  onOpenStudio: (styleId?: string, sampleId?: string) => void;
  onSelectSampleVideo: (sampleId: string) => void;
  onOpenPricing?: (plan?: 'free' | 'pro' | 'business') => void;
  onOpenLegal?: (tab: LegalTab) => void;
  onNavigate?: (view: 'studio' | 'landing', sectionId?: string) => void;
}

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({
  onOpenStudio,
  onSelectSampleVideo,
  onOpenPricing,
  onOpenLegal,
  onNavigate,
}) => {
  // Creator demo selection: 0 is MrBeast, 1 is Raj Shamani, 2 is Marcus, 3 is Ali Abdaal
  const [selectedCreatorIdx, setSelectedCreatorIdx] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [demoTime, setDemoTime] = useState(0);

  const currentCreator = SAMPLE_VIDEOS[selectedCreatorIdx] || SAMPLE_VIDEOS[0];

  // Active word timing calculation for live animated demo
  useEffect(() => {
    let interval: any = null;
    if (isPlayingDemo) {
      interval = setInterval(() => {
        setDemoTime((prev) => {
          const next = prev + 0.1;
          if (next >= currentCreator.duration) {
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlayingDemo, currentCreator]);

  // Find active segment & words for current creator
  const activeSegment = currentCreator.segments.find(
    (s) => demoTime >= s.start && demoTime <= s.end
  );
  const activeWord = activeSegment?.words.find(
    (w) => demoTime >= w.start && demoTime <= w.end
  );

  return (
    <div className="flex flex-col gap-28 pb-24 overflow-x-hidden bg-[#0a0b12] text-white">
      {/* 1. HERO SECTION (Exactly Matching Screenshot 1) */}
      <section className="relative pt-12 md:pt-20 px-6 max-w-7xl mx-auto w-full">
        {/* Subtle purple radial background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-600/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start text-left gap-6">
            {/* Pill badge: "✦ AI captions for creators" */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-neutral-300">
              <span className="text-violet-400">✦</span>
              <span>AI captions for creators</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08] text-balance">
              Create viral <br />
              captions <br />
              for your videos in <br />
              <span className="text-violet-500">seconds</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-xl text-pretty leading-relaxed">
              Smart Caption automatically generates stylish animated captions, viral word highlights, and ready-to-post videos for TikTok, Reels, and Shorts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenStudio(undefined, currentCreator.id)}
                className="px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm rounded-full transition-all shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="text-base">✦</span>
                <span>Try it free</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('demo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.12] font-semibold text-sm rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Watch demo</span>
              </button>
            </div>

            {/* Star Rating Reviews */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-400 pt-2">
              <div className="flex items-center text-amber-400 text-sm">
                {'★★★★★'}
              </div>
              <span className="font-semibold text-neutral-300">4.7/5</span>
              <span className="text-neutral-600">·</span>
              <span>14,000+ reviews</span>
            </div>
          </div>

          {/* Right Column: Hero Before & After Card + Famous Creator Switcher */}
          <div className="lg:col-span-6 flex flex-col items-center gap-4">
            {/* Creator Demo Pill Tabs (MrBeast, Raj Shamani, Top Podcaster) */}
            <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
              {[
                { idx: 0, label: '🚀 MrBeast (Viral Energy)', style: 'mrbeast' },
                { idx: 1, label: '🇮🇳 Raj Shamani (Indian Podcast)', style: 'desi-saffron' },
                { idx: 2, label: '🎙️ Top Podcaster (Deep Talk)', style: 'hormozi' },
                { idx: 3, label: '⚡ Ali Abdaal (Productivity)', style: 'ali-abdaal' },
              ].map((tab) => (
                <button
                  key={tab.idx}
                  onClick={() => {
                    setSelectedCreatorIdx(tab.idx);
                    setDemoTime(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCreatorIdx === tab.idx
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Interactive Before & After Visual Player from Screenshot 1 */}
            <div className="relative w-full max-w-[420px] aspect-[9/12] sm:aspect-[9/13] rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border border-white/[0.12] bg-neutral-950 select-none group">
              {/* BEFORE CARD (Left background footage) */}
              <div className="absolute inset-0">
                <img
                  src={currentCreator.imagePoster}
                  alt="Raw footage before"
                  className="w-full h-full object-cover filter brightness-75"
                />
                {/* Before Badge */}
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-bold text-neutral-300 border border-neutral-700/60">
                  Before
                </div>
                {/* 0:00 / 0:10 Playback indicator */}
                <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm z-10">
                  <Play className="w-3 h-3 text-white fill-white" />
                  <span>0:00 / 0:10</span>
                </div>
              </div>

              {/* AFTER CARD (Clipped by slider handle) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <div className="relative w-[420px] h-full max-w-none">
                  <img
                    src={currentCreator.imagePoster}
                    alt="After viral caption"
                    className="w-full h-full object-cover"
                    style={{ width: '420px', maxWidth: 'none' }}
                  />
                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* After Badge */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-md bg-violet-600 text-white text-[11px] font-bold shadow-md shadow-violet-600/30">
                    After
                  </div>

                  {/* Synchronized Viral Captions Overlay */}
                  <div className="absolute top-[72%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20 w-[90%] pointer-events-none">
                    {activeWord?.emoji && (
                      <span className="text-3xl animate-bounce drop-shadow-md">
                        {activeWord.emoji}
                      </span>
                    )}
                    <div className="text-center font-black uppercase text-2xl tracking-wide leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                      {activeSegment ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {activeSegment.words.map((w) => {
                            const isWordActive =
                              demoTime >= w.start && demoTime <= w.end;
                            return (
                              <span
                                key={w.id}
                                className={`transition-all duration-150 ${
                                  isWordActive
                                    ? 'text-yellow-300 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                                    : 'text-white'
                                }`}
                                style={{
                                  textShadow:
                                    '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
                                }}
                              >
                                {w.text}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span
                          className="text-yellow-300"
                          style={{
                            textShadow:
                              '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
                          }}
                        >
                          WITH CAPTIONS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 0:00 / 0:10 Playback indicator */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[11px] font-mono text-neutral-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm z-10">
                    <Play className="w-3 h-3 text-violet-400 fill-violet-400" />
                    <span>0:{demoTime < 10 ? `0${Math.floor(demoTime)}` : Math.floor(demoTime)} / 0:10</span>
                  </div>
                </div>
              </div>

              {/* Slider Divider Line & ↔ Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-neutral-900 flex items-center justify-center font-bold shadow-xl border-2 border-neutral-900 text-xs">
                  ↔
                </div>
              </div>

              {/* Range input for scrubbing */}
              <input
                type="range"
                min={5}
                max={95}
                value={sliderPos}
                onChange={(e) => setSliderPos(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>

            {/* Quick Action under card */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenStudio(undefined, currentCreator.id)}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Edit {currentCreator.speaker}'s Video in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF & PARTNERS LOGO TICKER (Screenshot 2) */}
      <section className="px-6 max-w-6xl mx-auto w-full text-center flex flex-col items-center gap-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm">★★★★★</span>
            <span className="font-bold text-white">4.7/5</span>
            <span>· 14,000+ reviews</span>
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <span className="text-neutral-400 font-medium">
            Trusted by 300,000+ creators
          </span>
        </div>

        {/* Brand Logos Strip from Screenshot 2 */}
        <div className="w-full flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-bold text-neutral-500 tracking-wider">
          {['Typeform', 'Buffer', 'Later', 'Adobe', 'Shopify', 'HubSpot', 'Notion', 'Figma'].map(
            (brand) => (
              <span
                key={brand}
                className="hover:text-neutral-300 transition-colors select-none font-semibold text-neutral-500 tracking-tight text-sm"
              >
                {brand}
              </span>
            )
          )}
        </div>
      </section>

      {/* 3. FEATURES SECTION (Screenshot 2 Bento Grid) */}
      <section id="features" className="px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <span className="text-xs font-extrabold text-violet-400 tracking-widest uppercase">
            ✦ FEATURES ✦
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl">
            Everything you need to create better captioned videos.
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl text-pretty">
            AutoCaption helps creators generate captions, edit quickly, save templates, and publish faster—on any platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: Caption styles that keep people watching */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 group">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                Caption styles that keep people watching
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Dynamic captions with animations, emphasis, and 100+ languages.
              </p>
            </div>
          </div>

          {/* Bento Card 2: One video, every platform */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 group">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                One video, every platform
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Auto-resize for TikTok, Reels, Shorts, and LinkedIn in one click.
              </p>
            </div>
          </div>

          {/* Bento Card 3: Edit subtitles and timing */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 group">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400">
              <Pencil className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                Edit subtitles and timing
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Fine-tune every word and adjust timing in a simple timeline editor.
              </p>
            </div>
          </div>
        </div>

        {/* AdSense Slot 1: Mid-Content Responsive Leaderboard */}
        <div className="max-w-4xl mx-auto w-full pt-4">
          <AdBanner slotId="ad-slot-landing-leaderboard" format="horizontal" />
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Screenshot 3 - 3 Simple Steps) */}
      <section id="how-it-works" className="px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <span className="text-xs font-extrabold text-violet-400 tracking-widest uppercase">
            ✦ HOW IT WORKS ✦
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl">
            Create captioned videos in 3 simple steps
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl text-pretty">
            From upload to publish in minutes — no editing experience needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 01 */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/[0.03] rounded-bl-full pointer-events-none" />
            <div>
              <span className="text-2xl font-black text-violet-400 tracking-tight block mb-4">
                01
              </span>
              <h3 className="text-lg font-bold text-white">Upload your video</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Drag and drop or select any video file. We support all major formats.
              </p>
            </div>
          </div>

          {/* Step 02 */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/[0.03] rounded-bl-full pointer-events-none" />
            <div>
              <span className="text-2xl font-black text-violet-400 tracking-tight block mb-4">
                02
              </span>
              <h3 className="text-lg font-bold text-white">Customize your captions</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Pick a caption style, adjust fonts, colors, animations, and timing.
              </p>
            </div>
          </div>

          {/* Step 03 */}
          <div className="p-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/[0.03] rounded-bl-full pointer-events-none" />
            <div>
              <span className="text-2xl font-black text-violet-400 tracking-tight block mb-4">
                03
              </span>
              <h3 className="text-lg font-bold text-white">Export & publish</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                Download in any format or publish directly to TikTok, Reels, or Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION (Screenshot 4 - Simple Honest Pricing) */}
      <section id="pricing" className="px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <span className="text-xs font-extrabold text-violet-400 tracking-widest uppercase">
            ✦ PRICING ✦
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simple, honest pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Tier 1: Free */}
          <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-base font-bold text-white">Free</h4>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>3 videos / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Basic caption styles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>720p & 480p export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Community support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenStudio()}
              className="w-full py-3 rounded-full border border-white/[0.15] bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Get started
            </button>
          </div>

          {/* Tier 2: Pro (MOST POPULAR - Highlighted Purple Border from Screenshot 4) */}
          <div className="p-8 rounded-3xl border-2 border-violet-500 bg-white/[0.03] shadow-2xl shadow-violet-600/20 flex flex-col justify-between gap-8 relative">
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider block mb-1">
                  MOST POPULAR
                </span>
                <h4 className="text-base font-bold text-white">Pro</h4>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black text-white">$19</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>30 videos / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>All caption styles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>1080p export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Emoji & translations</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenPricing ? onOpenPricing('pro') : onOpenStudio()}
              className="w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-violet-600/40 cursor-pointer active:scale-95"
            >
              Get started with Pro
            </button>
          </div>

          {/* Tier 3: Business */}
          <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-base font-bold text-white">Business</h4>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Unlimited videos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>All styles + templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>4K export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Team workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>API access</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenPricing ? onOpenPricing('business') : onOpenStudio()}
              className="w-full py-3 rounded-full border border-white/[0.15] bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Get started with Business
            </button>
          </div>
        </div>

        {/* AdSense Slot 2: Below Pricing Grid */}
        <div className="max-w-4xl mx-auto w-full pt-10">
          <AdBanner slotId="ad-slot-landing-bottom" format="horizontal" />
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION BANNER */}
      <section className="px-6 max-w-5xl mx-auto w-full">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-violet-900/40 via-violet-800/30 to-purple-900/40 border border-violet-500/30 flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to 10x your video retention?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl">
            Start generating viral subtitles today.
          </h2>
          <button
            onClick={() => onOpenStudio()}
            className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-sm rounded-full transition-all shadow-xl shadow-violet-600/40 hover:shadow-violet-600/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Try it free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 7. COMPLIANT LEGAL FOOTER */}
      <Footer
        onOpenLegal={onOpenLegal || (() => {})}
        onNavigate={onNavigate || (() => {})}
        onOpenPricing={() => onOpenPricing && onOpenPricing('pro')}
      />
    </div>
  );
};
