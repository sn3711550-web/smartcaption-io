import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  CheckCircle,
  FileVideo,
  Loader2,
  Sparkles,
  Smartphone,
  Layers,
  Settings,
  Crop,
  Sliders,
  Play,
  RotateCcw,
  Film,
  Zap,
} from 'lucide-react';
import { AspectRatio, CaptionStyle, SubtitleSegment } from '../types.ts';
import { generateSRT, downloadFile } from '../utils/subtitles.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { saveProjectToHistory } from '../lib/firebase.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  posterImage: string;
  segments: SubtitleSegment[];
  currentStyle: CaptionStyle;
  aspectRatio: AspectRatio;
  duration: number;
  subtitleYPercent: number;
  maxWordsPerScreen: number;
  videoTitle?: string;
  onRequireAuth?: (reason?: 'export' | 'limit' | 'upload' | 'general') => void;
  onOpenPricing?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  posterImage,
  segments,
  currentStyle,
  aspectRatio: initialAspectRatio,
  duration,
  subtitleYPercent,
  maxWordsPerScreen,
  videoTitle = 'AutoCaption_Video',
  onRequireAuth,
  onOpenPricing,
}) => {
  const { user, profile, isLimitReached, remainingCredits, consumeCredit } = useAuth();

  // Configurable export settings
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(initialAspectRatio || '9:16');
  const [resolution, setResolution] = useState<'4K' | '1080p' | '720p' | '480p'>('1080p');
  const [fps, setFps] = useState<30 | 60>(30);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [fitMode, setFitMode] = useState<'cover' | 'blur-backdrop' | 'contain'>('cover');

  // Export execution state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedBlobSize, setExportedBlobSize] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing renderer...');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Sync initial aspect ratio when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRatio(initialAspectRatio || '9:16');
      setDownloadUrl(null);
      setProgress(0);
      setIsExporting(false);
    }
  }, [isOpen, initialAspectRatio]);

  if (!isOpen) return null;

  // Calculate pixel dimensions based on ratio and resolution
  const getExportDimensions = () => {
    let baseWidth = 1080;
    let baseHeight = 1920;

    if (selectedRatio === '9:16') {
      if (resolution === '4K') {
        baseWidth = 2160;
        baseHeight = 3840;
      } else if (resolution === '1080p') {
        baseWidth = 1080;
        baseHeight = 1920;
      } else if (resolution === '720p') {
        baseWidth = 720;
        baseHeight = 1280;
      } else {
        baseWidth = 480;
        baseHeight = 854;
      }
    } else if (selectedRatio === '1:1') {
      if (resolution === '4K') {
        baseWidth = 2160;
        baseHeight = 2160;
      } else if (resolution === '1080p') {
        baseWidth = 1080;
        baseHeight = 1080;
      } else if (resolution === '720p') {
        baseWidth = 720;
        baseHeight = 720;
      } else {
        baseWidth = 480;
        baseHeight = 480;
      }
    } else if (selectedRatio === '16:9') {
      if (resolution === '4K') {
        baseWidth = 3840;
        baseHeight = 2160;
      } else if (resolution === '1080p') {
        baseWidth = 1920;
        baseHeight = 1080;
      } else if (resolution === '720p') {
        baseWidth = 1280;
        baseHeight = 720;
      } else {
        baseWidth = 854;
        baseHeight = 480;
      }
    } else if (selectedRatio === '4:5') {
      if (resolution === '4K') {
        baseWidth = 2160;
        baseHeight = 2700;
      } else if (resolution === '1080p') {
        baseWidth = 1080;
        baseHeight = 1350;
      } else if (resolution === '720p') {
        baseWidth = 720;
        baseHeight = 900;
      } else {
        baseWidth = 480;
        baseHeight = 600;
      }
    }

    return { width: baseWidth, height: baseHeight };
  };

  const startExport = async () => {
    // Check authentication first to protect free tier credits
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('export');
        return;
      }
    }

    // Check if free credit limit reached
    if (isLimitReached) {
      if (onRequireAuth) {
        onRequireAuth('limit');
        return;
      }
    }

    setIsExporting(true);
    setProgress(0);
    setDownloadUrl(null);
    setStatusMessage('Initializing video canvas & audio tracks...');

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      return;
    }

    const { width, height } = getExportDimensions();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Determine target bit rate based on resolution & format
    let targetBitrate = 8_000_000; // 8 Mbps for 1080p
    if (resolution === '4K') targetBitrate = 18_000_000;
    if (resolution === '720p') targetBitrate = 4_000_000;
    if (resolution === '480p') targetBitrate = 2_000_000;

    // Detect browser-supported MediaRecorder MIME type with fallback chain
    const candidateMimes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    let chosenMime = 'video/webm';
    for (const mime of candidateMimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    const canvasStream = canvas.captureStream(fps);
    let audioTracks: MediaStreamTrack[] = [];
    let audioCtx: AudioContext | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let fallbackImg: HTMLImageElement | null = null;

    // IF videoUrl exists (User uploaded their video):
    if (videoUrl) {
      setStatusMessage('Loading source video file...');
      videoEl = document.createElement('video');
      videoEl.src = videoUrl;
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.preload = 'auto';

      await new Promise<void>((resolve, reject) => {
        if (!videoEl) return resolve();
        videoEl.onloadeddata = () => resolve();
        videoEl.onerror = () => resolve(); // continue if error
        setTimeout(resolve, 4000); // 4s timeout guarantee
      });

      // Try capturing real audio track from the video
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
          await audioCtx.resume();
          const source = audioCtx.createMediaElementSource(videoEl);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          audioTracks = dest.stream.getAudioTracks();
        }
      } catch (e) {
        console.warn('AudioContext routing fallback:', e);
        try {
          if ((videoEl as any).captureStream) {
            const directStream = (videoEl as any).captureStream();
            audioTracks = directStream.getAudioTracks();
          }
        } catch {
          // silent fallback
        }
      }
    } else {
      // Fallback to sample image poster
      fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = posterImage;
      await new Promise((resolve) => {
        if (!fallbackImg) return resolve(null);
        fallbackImg.onload = resolve;
        fallbackImg.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    }

    // Combine canvas video stream + source audio tracks
    const combinedTracks: MediaStreamTrack[] = [
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ];
    const outputStream = new MediaStream(combinedTracks);

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(outputStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: targetBitrate,
      });
    } catch {
      mediaRecorder = new MediaRecorder(outputStream);
    }
    mediaRecorderRef.current = mediaRecorder;

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, {
        type: chosenMime.includes('mp4') ? 'video/mp4' : 'video/webm',
      });
      const url = URL.createObjectURL(finalBlob);
      setDownloadUrl(url);
      setExportedBlobSize((finalBlob.size / (1024 * 1024)).toFixed(2) + ' MB');
      setIsExporting(false);
      setProgress(100);
      setStatusMessage('Export finished!');

      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }

      // Persist usage and deduct 1 credit to prevent repeat abuse
      if (user) {
        consumeCredit().catch((err) => console.warn('Credit deduction error:', err));
        saveProjectToHistory(user.uid, {
          id: 'proj_' + Date.now(),
          userId: user.uid,
          title: videoTitle || 'Untitled Video',
          language: 'multilingual',
          styleId: currentStyle.id,
          aspectRatio: selectedRatio,
          duration: Math.round(duration || 10),
          segmentsCount: segments.length,
        }).catch((err) => console.warn('History save error:', err));
      }
    };

    mediaRecorder.start(100);

    // Frame rendering loop
    const targetDuration = Math.max(1, duration || 10);
    const totalFrames = Math.floor(targetDuration * fps);
    let currentFrame = 0;

    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.playbackRate = 1.0;
      await videoEl.play().catch(() => {});
    }

    const drawSubtitles = (currentTime: number) => {
      const activeSeg = segments.find(
        (s) => currentTime >= s.start && currentTime <= s.end
      );

      if (!activeSeg) return;

      const words = activeSeg.words;
      const activeIdx = words.findIndex(
        (w) => currentTime >= w.start && currentTime <= w.end
      );

      // Word window chunking
      const chunkStart = Math.floor(Math.max(0, activeIdx) / maxWordsPerScreen) * maxWordsPerScreen;
      const displayWords = words.slice(chunkStart, chunkStart + maxWordsPerScreen);

      const subY = (height * subtitleYPercent) / 100;
      // Responsive scale relative to canvas width
      const fontSize = (currentStyle.fontSize / 360) * width;
      const strokeWidth = (currentStyle.strokeWidth / 360) * width;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(fontSize)}px ${currentStyle.fontFamily.replace(/"/g, '')}, sans-serif`;

      let lineText = displayWords
        .map((w) => (w.emoji ? `${w.text} ${w.emoji}` : w.text))
        .join(' ');

      if (currentStyle.textTransform === 'uppercase') {
        lineText = lineText.toUpperCase();
      }

      // 1. Draw optional badge background box (e.g., Black Badge Box style)
      if (currentStyle.backgroundColor) {
        const textMetrics = ctx.measureText(lineText);
        const paddingX = fontSize * 0.55;
        const paddingY = fontSize * 0.35;
        const boxWidth = textMetrics.width + paddingX * 2;
        const boxHeight = fontSize * 1.4;
        const boxX = (width - boxWidth) / 2;
        const boxY = subY - boxHeight / 2;
        const radius = fontSize * 0.3;

        ctx.fillStyle = currentStyle.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
        ctx.fill();
      }

      // 2. Heavy black stroke for viral readability
      if (strokeWidth > 0) {
        ctx.strokeStyle = currentStyle.strokeColor || '#000000';
        ctx.lineWidth = Math.max(4, strokeWidth * 2.2);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(lineText, width / 2, subY);
      }

      // 3. Drop Shadow
      if (currentStyle.shadowBlur > 0) {
        ctx.shadowColor = currentStyle.shadowColor || 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = (currentStyle.shadowBlur / 360) * width;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      }

      // 4. Highlight Fill
      ctx.fillStyle = currentStyle.activeColor || '#FACC15';
      ctx.fillText(lineText, width / 2, subY);

      ctx.restore();
    };

    const renderLoop = () => {
      // Calculate current playback time
      let curTime = 0;
      if (videoEl && !videoEl.paused && !videoEl.ended) {
        curTime = videoEl.currentTime;
      } else {
        curTime = (currentFrame / totalFrames) * targetDuration;
      }

      // Stop condition
      if (curTime >= targetDuration || (videoEl && videoEl.ended) || currentFrame > totalFrames + fps) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (videoEl) videoEl.pause();
        return;
      }

      // 1. CLEAR CANVAS
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 2. DRAW VIDEO FOOTAGE (OR POSTER)
      if (videoEl && videoEl.videoWidth > 0) {
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;

        if (fitMode === 'cover') {
          // Center Cover (fill whole canvas, crop extra)
          const scale = Math.max(width / vw, height / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(videoEl, dx, dy, dw, dh);
        } else if (fitMode === 'blur-backdrop') {
          // Stretched blurred background
          ctx.save();
          ctx.filter = 'blur(30px) brightness(0.6)';
          ctx.drawImage(videoEl, -20, -20, width + 40, height + 40);
          ctx.restore();

          // Centered contain video
          const scale = Math.min(width / vw, height / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(videoEl, dx, dy, dw, dh);
        } else {
          // Contain (Letterbox black bars)
          const scale = Math.min(width / vw, height / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(videoEl, dx, dy, dw, dh);
        }
      } else if (fallbackImg && fallbackImg.width > 0) {
        // Sample poster image
        const iw = fallbackImg.width;
        const ih = fallbackImg.height;
        const scale = Math.max(width / iw, height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;
        ctx.drawImage(fallbackImg, dx, dy, dw, dh);
      }

      // 3. Subtle dark scrim to make captions pop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.fillRect(0, 0, width, height);

      // 4. DRAW SUBTITLES
      drawSubtitles(curTime);

      // Progress calculation
      currentFrame++;
      const pct = Math.min(99, Math.round((curTime / targetDuration) * 100));
      setProgress(pct);
      setStatusMessage(`Rendering frame ${currentFrame} · ${curTime.toFixed(1)}s / ${targetDuration.toFixed(1)}s`);

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  const handleDownloadSRT = () => {
    const srt = generateSRT(segments);
    downloadFile(srt, `${videoTitle || 'captions'}.srt`, 'text/plain');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-neutral-100 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isExporting}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Export Video with AI Captions
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                PRO RENDERER
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              {videoUrl
                ? `Exporting your uploaded video: "${videoTitle}"`
                : 'Burn in animated subtitles with custom aspect ratio & quality'}
            </p>
          </div>
        </div>

        {/* Hidden Canvas for High-Res Render */}
        <canvas ref={canvasRef} className="hidden" />

        {/* State 1: Configuration Form */}
        {!isExporting && !downloadUrl && (
          <div className="flex flex-col gap-4">
            {/* Account & Quota Status Callout */}
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-violet-500/40 bg-violet-600/30 shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-violet-300">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-white font-medium truncate">{user.email}</span>
                    <span className="text-[11px] text-neutral-400">
                      {profile?.plan === 'free'
                        ? `${profile.freeCreditsUsed || 0} of ${profile.freeCreditsMax || 3} free exports used`
                        : 'Pro Creator Member · Unlimited'}
                    </span>
                  </div>
                </div>

                {profile?.plan === 'free' ? (
                  <span
                    className={`shrink-0 font-bold px-2.5 py-1 rounded-full text-[11px] ${
                      isLimitReached
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {remainingCredits}/3 Free Left
                  </span>
                ) : (
                  <span className="shrink-0 font-bold px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    PRO
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-xs">
                <div className="flex items-center gap-2 text-violet-200">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Sign in with Google to use your 3 free video exports!</span>
                </div>
                <button
                  onClick={() => onRequireAuth && onRequireAuth('export')}
                  className="shrink-0 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 font-bold rounded-xl transition-all cursor-pointer text-xs shadow-sm"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* 1. Aspect Ratio Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                Select Video Aspect Ratio:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { ratio: '9:16' as AspectRatio, label: '9:16 Vertical', sub: 'TikTok / Reels / Shorts' },
                  { ratio: '1:1' as AspectRatio, label: '1:1 Square', sub: 'Instagram Feed / Post' },
                  { ratio: '16:9' as AspectRatio, label: '16:9 Landscape', sub: 'YouTube / Desktop' },
                  { ratio: '4:5' as AspectRatio, label: '4:5 Portrait', sub: 'Instagram Feed' },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    onClick={() => setSelectedRatio(item.ratio)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      selectedRatio === item.ratio
                        ? 'border-amber-400 bg-amber-400/10 text-white font-bold ring-1 ring-amber-400/50'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">{item.label}</span>
                    <span className="text-[10px] text-neutral-500 mt-1">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Video Quality & Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Resolution */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Video Quality & Resolution:
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {resolution === '4K' ? '3840×2160' : resolution === '1080p' ? '1080×1920' : resolution === '720p' ? '720×1280' : '480×854'}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                  {[
                    { key: '1080p' as const, label: '1080p', desc: 'Full HD' },
                    { key: '720p' as const, label: '720p', desc: 'HD Fast' },
                    { key: '480p' as const, label: '480p', desc: 'SD Mobile' },
                    { key: '4K' as const, label: '4K', desc: 'Ultra' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setResolution(item.key)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                        resolution === item.key
                          ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black leading-tight">{item.label}</span>
                      <span className={`text-[9px] ${resolution === item.key ? 'text-neutral-800 font-bold' : 'text-neutral-500'}`}>
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate & Format */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Framerate & Format:
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => setFps(fps === 30 ? 60 : 30)}
                    className="py-2 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-colors text-center cursor-pointer"
                  >
                    {fps} FPS ({fps === 60 ? 'Smooth' : 'Standard'})
                  </button>
                  <button
                    onClick={() => setExportFormat(exportFormat === 'mp4' ? 'webm' : 'mp4')}
                    className="py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-neutral-800 transition-colors text-center cursor-pointer uppercase"
                  >
                    Format: {exportFormat}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Crop / Fit Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                Fit & Aspect Ratio Crop Style:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'cover' as const, label: 'Center Crop (Fill)', desc: 'No black bars' },
                  { mode: 'blur-backdrop' as const, label: 'Blurred Background', desc: 'TikTok trend style' },
                  { mode: 'contain' as const, label: 'Clean Letterbox', desc: 'Preserves full video' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setFitMode(item.mode)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      fitMode === item.mode
                        ? 'border-amber-400 bg-amber-400/10 text-white font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-neutral-500 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video & Style Summary Banner */}
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-neutral-400 truncate">
                  Ready to burn <span className="text-amber-300 font-bold">{currentStyle.name}</span> captions on {duration.toFixed(1)}s video
                </span>
              </div>
              <button
                onClick={handleDownloadSRT}
                className="text-[11px] text-amber-400 hover:underline shrink-0 ml-2"
              >
                Download .SRT
              </button>
            </div>

            {/* Start Export Button / Upgrade prompt if limit reached */}
            {isLimitReached ? (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPricing) onOpenPricing();
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1"
              >
                <Zap className="w-5 h-5 fill-neutral-950" />
                <span>Free Limit Reached (3/3 Used) · Upgrade to Pro for Unlimited</span>
              </button>
            ) : (
              <button
                onClick={startExport}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1"
              >
                <Sparkles className="w-5 h-5 fill-neutral-950" />
                <span>Start Export & Render Captions Now</span>
              </button>
            )}
          </div>
        )}

        {/* State 2: Rendering in Progress */}
        {isExporting && (
          <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-white">
                {progress}%
              </div>
            </div>

            <div className="max-w-md">
              <h4 className="text-base font-bold text-white">
                Rendering Synchronized Captions...
              </h4>
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                {statusMessage}
              </p>
            </div>

            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden max-w-md">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              Please keep this tab open while frames and audio tracks are composited.
            </p>
          </div>
        )}

        {/* State 3: Export Complete & Download */}
        {downloadUrl && (
          <div className="flex flex-col items-center justify-center py-6 gap-5 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white">
                Video Export Complete! 🎉
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Your video is rendered with burned-in animated captions ({selectedRatio} · {resolution} · {exportedBlobSize}).
              </p>
            </div>

            {/* Direct Download Button */}
            <a
              href={downloadUrl}
              download={`${videoTitle || 'AutoCaption'}_viral_${selectedRatio.replace(':', 'x')}.${exportFormat}`}
              className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-emerald-400/25 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download Finished Video (.{exportFormat.toUpperCase()})</span>
            </a>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadSRT}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 rounded-xl transition-colors cursor-pointer"
              >
                Download .SRT Subtitles
              </button>
              <button
                onClick={() => {
                  setDownloadUrl(null);
                  onClose();
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 rounded-xl transition-colors cursor-pointer"
              >
                Return to Studio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
