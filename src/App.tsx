import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { VideoPlayer } from './components/VideoPlayer.tsx';
import { StyleSelector } from './components/StyleSelector.tsx';
import { TimelineEditor } from './components/TimelineEditor.tsx';
import { ToolsPanel } from './components/ToolsPanel.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { LandingShowcase } from './components/LandingShowcase.tsx';
import { LegalModal, LegalTab } from './components/LegalModal.tsx';
import { PricingModal } from './components/PricingModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LoginGate } from './components/LoginGate.tsx';
import { Footer } from './components/Footer.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { CAPTION_STYLES, SAMPLE_VIDEOS } from './data/presets.ts';
import {
  AspectRatio,
  CaptionStyle,
  SampleVideo,
  SubtitleSegment,
  SubtitleWord,
  SUPPORTED_LANGUAGES,
} from './types.ts';
import { Sparkles, Video, ArrowLeft, Globe, Loader2, CheckCircle2, FileVideo } from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'studio' | 'landing'>('landing');

  // Output Caption Language: string code from SUPPORTED_LANGUAGES (e.g. 'english', 'hindi', 'spanish')
  const [currentLanguage, setCurrentLanguage] = useState<string>('english');

  // Video State: SampleVideo[0] is the English showcase demo
  const [currentSample, setCurrentSample] = useState<SampleVideo>(SAMPLE_VIDEOS[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState(SAMPLE_VIDEOS[0].title);
  const [duration, setDuration] = useState(SAMPLE_VIDEOS[0].duration);

  // Subtitle & Style State
  const [segments, setSegments] = useState<SubtitleSegment[]>(SAMPLE_VIDEOS[0].segments);
  const [currentStyle, setCurrentStyle] = useState<CaptionStyle>(CAPTION_STYLES[0]); // Hormozi Viral
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [subtitleYPercent, setSubtitleYPercent] = useState<number>(75);
  const [maxWordsPerScreen, setMaxWordsPerScreen] = useState<number>(2);
  const [isTranslating, setIsTranslating] = useState(false);

  // Playback State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingPlan, setPricingPlan] = useState<'free' | 'pro' | 'business'>('pro');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<'export' | 'limit' | 'upload' | 'general'>('general');

  const handleOpenAuth = (reason: 'export' | 'limit' | 'upload' | 'general' = 'general') => {
    setAuthReason(reason);
    setIsAuthModalOpen(true);
  };

  const handleOpenLegal = (tab: LegalTab = 'privacy') => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleOpenPricing = (plan: 'free' | 'pro' | 'business' = 'pro') => {
    setPricingPlan(plan);
    setIsPricingModalOpen(true);
  };

  // Playback timer animation
  const playbackTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = () => {
        const now = performance.now();
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        playbackTimerRef.current = requestAnimationFrame(tick);
      };
      playbackTimerRef.current = requestAnimationFrame(tick);
    } else {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Spacebar hotkey for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle selecting a sample video
  const handleSelectSample = (sample: SampleVideo) => {
    setCurrentSample(sample);
    setCustomVideoUrl(null);
    setCustomVideoFile(null);
    setVideoTitle(sample.title);
    setDuration(sample.duration);
    setSegments(sample.segments);
    setCurrentTime(0);
    setIsPlaying(false);

    if (/[\u0900-\u097F]/.test(sample.title) || sample.category.includes('हिंदी')) {
      setCurrentLanguage('hindi');
    } else {
      setCurrentLanguage('english');
    }
  };

  // Handle custom video upload with extracted AI captions
  const handleCustomVideoLoaded = (
    file: File,
    url: string,
    videoDuration: number,
    loadedSegments?: SubtitleSegment[],
    lang?: string
  ) => {
    setCustomVideoFile(file);
    setCustomVideoUrl(url);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    setDuration(videoDuration);
    setCurrentTime(0);
    setIsPlaying(false);

    if (lang) {
      setCurrentLanguage(lang);
    }

    if (loadedSegments && loadedSegments.length > 0) {
      setSegments(loadedSegments);
      return;
    }

    // Default starter segments if none extracted
    const targetLang = lang || currentLanguage;
    const newSegments: SubtitleSegment[] = [
      {
        id: `custom-seg-1`,
        start: 0.0,
        end: Math.min(3.0, videoDuration),
        text: targetLang === 'hindi' ? 'यह वीडियो पूरा देखें' : 'Watch this video',
        words: targetLang === 'hindi'
          ? [
              { id: 'cw-1', text: 'यह वीडियो', start: 0.0, end: 1.5, emoji: '🔥', highlightColor: 'yellow' },
              { id: 'cw-2', text: 'पूरा देखें', start: 1.5, end: 3.0, emoji: '🚀', highlightColor: 'green' },
            ]
          : [
              { id: 'cw-1', text: 'WATCH', start: 0.0, end: 1.5, emoji: '🔥', highlightColor: 'yellow' },
              { id: 'cw-2', text: 'THIS VIDEO', start: 1.5, end: 3.0, emoji: '🚀', highlightColor: 'green' },
            ],
      },
    ];
    setSegments(newSegments);
  };

  // Change Output Caption Language
  const handleLanguageChange = async (newLang: string) => {
    if (newLang === currentLanguage) return;
    setCurrentLanguage(newLang);

    // If on a sample video without custom upload, swap sample if English/Hindi
    if (!customVideoUrl) {
      if (newLang === 'hindi' && SAMPLE_VIDEOS[1]) {
        handleSelectSample(SAMPLE_VIDEOS[1]);
        return;
      } else if (newLang === 'english' && SAMPLE_VIDEOS[0]) {
        handleSelectSample(SAMPLE_VIDEOS[0]);
        return;
      }
    }

    // If on custom uploaded video or non-sample, translate existing captions via AI
    setIsTranslating(true);
    try {
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
      const targetLangName = langObj ? langObj.name : newLang;

      const response = await fetch('/api/translate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          targetLanguage: targetLangName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.segments && data.segments.length > 0) {
          setSegments(data.segments);
        }
      }
    } catch (err) {
      console.warn('Language switch translation fallback:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Update style
  const handleUpdateStyle = (updates: Partial<CaptionStyle>) => {
    setCurrentStyle((prev) => ({ ...prev, ...updates }));
  };

  // Update Segment
  const handleUpdateSegment = (segId: string, updated: Partial<SubtitleSegment>) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, ...updated } : s))
    );
  };

  // Update Word
  const handleUpdateWord = (
    segId: string,
    wordId: string,
    updated: Partial<SubtitleWord>
  ) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== segId) return seg;
        const words = seg.words.map((w) =>
          w.id === wordId ? { ...w, ...updated } : w
        );
        return {
          ...seg,
          text: words.map((w) => w.text).join(' '),
          words,
        };
      })
    );
  };

  // Add Segment
  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? lastSeg.end + 0.2 : 0;
    const newEnd = Math.min(duration, newStart + 2.5);

    const newSeg: SubtitleSegment = {
      id: `seg-${Date.now()}`,
      start: parseFloat(newStart.toFixed(1)),
      end: parseFloat(newEnd.toFixed(1)),
      text: currentLanguage === 'hindi' ? 'नया सबटाइटल' : 'New subtitle cue',
      words: currentLanguage === 'hindi'
        ? [
            { id: `w-${Date.now()}-1`, text: 'नया', start: newStart, end: newStart + 0.8 },
            { id: `w-${Date.now()}-2`, text: 'सबटाइटल', start: newStart + 0.8, end: newEnd, emoji: '⚡', highlightColor: 'yellow' },
          ]
        : [
            { id: `w-${Date.now()}-1`, text: 'NEW', start: newStart, end: newStart + 0.8 },
            { id: `w-${Date.now()}-2`, text: 'SUBTITLE', start: newStart + 0.8, end: newEnd, emoji: '⚡', highlightColor: 'yellow' },
          ],
    };
    setSegments([...segments, newSeg]);
  };

  // Delete Segment
  const handleDeleteSegment = (segId: string) => {
    setSegments(segments.filter((s) => s.id !== segId));
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view, sectionId) => {
          if (view === 'studio' && !user) {
            handleOpenAuth('upload');
            return;
          }
          setCurrentView(view);
          if (sectionId) {
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
        onUploadClick={() => {
          if (!user) {
            handleOpenAuth('upload');
          } else {
            setIsUploadModalOpen(true);
          }
        }}
        onOpenPricing={() => handleOpenPricing('pro')}
        onOpenAuth={handleOpenAuth}
        onOpenTranscriber={() => {
          if (!user) {
            handleOpenAuth('upload');
          } else {
            setIsUploadModalOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      {currentView === 'landing' ? (
        <main className="flex-1">
          <LandingShowcase
            onOpenStudio={(styleId, sampleId) => {
              if (!user) {
                handleOpenAuth('upload');
                return;
              }
              if (sampleId) {
                const foundSample = SAMPLE_VIDEOS.find((s) => s.id === sampleId);
                if (foundSample) handleSelectSample(foundSample);
              }
              if (styleId) {
                const foundStyle = CAPTION_STYLES.find((s) => s.id === styleId);
                if (foundStyle) setCurrentStyle(foundStyle);
              }
              setCurrentView('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSampleVideo={(sampleId) => {
              if (!user) {
                handleOpenAuth('upload');
                return;
              }
              const found = SAMPLE_VIDEOS.find((s) => s.id === sampleId);
              if (found) handleSelectSample(found);
              setCurrentView('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPricing={handleOpenPricing}
            onOpenLegal={handleOpenLegal}
            onNavigate={(view, sectionId) => {
              if (view === 'studio' && !user) {
                handleOpenAuth('upload');
                return;
              }
              setCurrentView(view);
              if (sectionId) {
                setTimeout(() => {
                  const el = document.getElementById(sectionId);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          />
        </main>
      ) : !user ? (
        <main className="flex-1">
          <LoginGate
            onSuccess={() => {
              setCurrentView('studio');
            }}
            onBackToHome={() => {
              setCurrentView('landing');
            }}
          />
        </main>
      ) : (
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 max-w-[1720px] mx-auto w-full flex flex-col gap-4 sm:gap-5">
          {/* Studio Top Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-[#0e0f18]/80 border border-white/[0.08] px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md">
            {/* Left: Showcase link & Title */}
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <span className="text-neutral-700">|</span>
              <div className="flex items-center gap-2 overflow-hidden">
                {customVideoUrl ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold shrink-0">
                    CREATOR DEMO
                  </span>
                )}
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {videoTitle}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                  ({duration.toFixed(1)}s)
                </span>
              </div>
            </div>

            {/* Middle: Multi-Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 flex items-center gap-1 hidden sm:flex">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                Language:
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={currentLanguage}
                  disabled={isTranslating}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-black/60 border border-white/[0.1] text-xs text-neutral-200 font-bold rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:border-violet-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                {isTranslating && (
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin ml-1" />
                )}
              </div>
            </div>

            {/* Right: Upload & Export */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-violet-400" />
                <span>{customVideoUrl ? 'Change Video' : 'Upload Video'}</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 sm:px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-full shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Export Video</span>
              </button>
            </div>
          </div>

          {/* 3-Column Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Preset Styles & Export (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1">
              <StyleSelector
                currentStyle={currentStyle}
                onStyleSelect={setCurrentStyle}
                onUpdateStyle={handleUpdateStyle}
                maxWordsPerScreen={maxWordsPerScreen}
                onMaxWordsChange={setMaxWordsPerScreen}
              />

              <ToolsPanel
                segments={segments}
                onUpdateSegments={setSegments}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                videoTitle={videoTitle}
                isTranslating={isTranslating}
              />
            </div>

            {/* Center Column: Video Player Canvas (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-start order-1 lg:order-2 sticky top-20">
              <VideoPlayer
                videoUrl={customVideoUrl}
                posterImage={currentSample.imagePoster}
                segments={segments}
                currentStyle={currentStyle}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying((prev) => !prev)}
                duration={duration}
                subtitleYPercent={subtitleYPercent}
                onSubtitleYChange={setSubtitleYPercent}
                speechText={currentSample.speechText}
                maxWordsPerScreen={maxWordsPerScreen}
                currentLanguage={currentLanguage as any}
              />
            </div>

            {/* Right Column: Timeline & Script Editor (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5 order-3">
              <TimelineEditor
                segments={segments}
                currentTime={currentTime}
                onSeek={(time) => {
                  setCurrentTime(time);
                  setIsPlaying(false);
                }}
                onUpdateSegment={handleUpdateSegment}
                onUpdateWord={handleUpdateWord}
                onAddSegment={handleAddSegment}
                onDeleteSegment={handleDeleteSegment}
              />
            </div>
          </div>

          {/* Compact Studio Footer for Direct Compliance & AdSense readiness */}
          <div className="border-t border-white/[0.08] mt-6 pt-4 pb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span>© 2026 Smart Caption</span>
              <span>•</span>
              <button
                onClick={() => handleOpenLegal('privacy')}
                className="hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                onClick={() => handleOpenLegal('refund')}
                className="hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Refund Policy
              </button>
              <span>•</span>
              <button
                onClick={() => handleOpenLegal('contact')}
                className="hover:text-neutral-300 transition-colors cursor-pointer text-violet-400"
              >
                Support (sn3711550@gmail.com)
              </button>
            </div>
            <button
              onClick={() => handleOpenPricing('pro')}
              className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>⚡ Upgrade to Pro (₹499/mo)</span>
            </button>
          </div>
        </main>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSelectSample={handleSelectSample}
        onCustomVideoLoaded={handleCustomVideoLoaded}
        currentLanguage={currentLanguage}
        onRequireAuth={handleOpenAuth}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoUrl={customVideoUrl}
        posterImage={currentSample.imagePoster}
        segments={segments}
        currentStyle={currentStyle}
        aspectRatio={aspectRatio}
        duration={duration}
        subtitleYPercent={subtitleYPercent}
        maxWordsPerScreen={maxWordsPerScreen}
        videoTitle={videoTitle}
        onRequireAuth={handleOpenAuth}
        onOpenPricing={() => handleOpenPricing('pro')}
      />

      {/* Google Authentication & Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        reason={authReason}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenPricing={() => handleOpenPricing('pro')}
      />

      {/* Compliance & Legal Modal (Google AdSense & Razorpay Required) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Pricing & Checkout Modal (Razorpay / Stripe) */}
      <PricingModal
        isOpen={isPricingModalOpen}
        defaultPlan={pricingPlan}
        onOpenLegal={handleOpenLegal}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}
