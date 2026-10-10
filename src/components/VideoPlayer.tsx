import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  MoveVertical,
  Smartphone,
  Square,
  Monitor,
  Activity,
  Layers,
} from 'lucide-react';
import { AspectRatio, CaptionStyle, SubtitleSegment, SubtitleWord } from '../types.ts';
import { formatDisplayTime } from '../utils/subtitles.ts';
import { speechController } from '../utils/audioSynth.ts';

interface VideoPlayerProps {
  videoUrl: string | null;
  posterImage: string;
  segments: SubtitleSegment[];
  currentStyle: CaptionStyle;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  duration: number;
  subtitleYPercent: number; // 0 to 100%
  onSubtitleYChange: (val: number) => void;
  speechText?: string;
  maxWordsPerScreen: number;
  currentLanguage?: 'english' | 'hindi';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  posterImage,
  segments,
  currentStyle,
  aspectRatio,
  onAspectRatioChange,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onPlayPause,
  duration,
  subtitleYPercent,
  onSubtitleYChange,
  speechText,
  maxWordsPerScreen,
  currentLanguage = 'english',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDraggingSubtitle, setIsDraggingSubtitle] = useState(false);

  // Sync actual HTML5 video element when videoUrl is present
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) > 0.3) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
      video.muted = isMuted;
    }
  }, [playbackRate, isMuted]);

  // Audio Speech Synthesis for Sample Videos
  useEffect(() => {
    if (!videoUrl && isPlaying && speechText) {
      speechController.speak(speechText, currentLanguage, () => {
        // ended
      });
    } else if (!videoUrl && !isPlaying) {
      speechController.pause();
    }
    return () => {
      if (!videoUrl) speechController.stop();
    };
  }, [videoUrl, isPlaying, speechText, currentLanguage]);

  // Seek bar handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onTimeUpdate(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Find active segment
  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  // Filter words to display based on maxWordsPerScreen
  const getDisplayWords = (): { words: SubtitleWord[]; activeIndex: number } => {
    if (!activeSegment) return { words: [], activeIndex: -1 };

    const words = activeSegment.words;
    const activeIndex = words.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );

    if (maxWordsPerScreen <= 1) {
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      return { words: [words[targetIndex]], activeIndex: 0 };
    }

    if (words.length <= maxWordsPerScreen) {
      return { words, activeIndex };
    }

    // Window chunking for rapid subtitle retention
    const chunkStart = Math.floor(Math.max(0, activeIndex) / maxWordsPerScreen) * maxWordsPerScreen;
    const chunkWords = words.slice(chunkStart, chunkStart + maxWordsPerScreen);
    const chunkActiveIdx = activeIndex >= 0 ? activeIndex - chunkStart : -1;

    return { words: chunkWords, activeIndex: chunkActiveIdx };
  };

  const { words: displayWords, activeIndex } = getDisplayWords();

  // Aspect ratio dimensions
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'w-[320px] sm:w-[350px] aspect-[9/16]';
      case '1:1':
        return 'w-[360px] sm:w-[400px] aspect-square';
      case '16:9':
        return 'w-full max-w-[620px] aspect-video';
      case '4:5':
        return 'w-[340px] sm:w-[380px] aspect-[4/5]';
      default:
        return 'w-[350px] aspect-[9/16]';
    }
  };

  // Handle Dragging Subtitle directly on video canvas
  const handleMouseDownSubtitle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSubtitle(true);

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const relY = moveEvent.clientY - rect.top;
      const percent = Math.min(Math.max(15, (relY / rect.height) * 100), 88);
      onSubtitleYChange(Math.round(percent));
    };

    const handleMouseUp = () => {
      setIsDraggingSubtitle(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Top Controls: Aspect Ratio & Position Presets */}
      <div className="w-full flex items-center justify-between pb-3 text-xs text-neutral-400">
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => onAspectRatioChange('9:16')}
            title="9:16 TikTok / Reels / Shorts"
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-600/30'
                : 'hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('1:1')}
            title="1:1 Instagram Square"
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              aspectRatio === '1:1'
                ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-600/30'
                : 'hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('16:9')}
            title="16:9 YouTube Landscape"
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-600/30'
                : 'hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('4:5')}
            title="4:5 Social Portrait"
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              aspectRatio === '4:5'
                ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-600/30'
                : 'hover:text-white'
            }`}
          >
            <span>4:5</span>
          </button>
        </div>

        {/* Subtitle Vertical Position Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
            <MoveVertical className="w-3 h-3 text-amber-400" />
            Position:
          </span>
          <button
            onClick={() => onSubtitleYChange(25)}
            className={`px-2 py-0.5 rounded text-[11px] border border-neutral-800 transition-colors cursor-pointer ${
              subtitleYPercent <= 30
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => onSubtitleYChange(50)}
            className={`px-2 py-0.5 rounded text-[11px] border border-neutral-800 transition-colors cursor-pointer ${
              subtitleYPercent > 30 && subtitleYPercent < 70
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Center
          </button>
          <button
            onClick={() => onSubtitleYChange(75)}
            className={`px-2 py-0.5 rounded text-[11px] border border-neutral-800 transition-colors cursor-pointer ${
              subtitleYPercent >= 70
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Lower
          </button>
        </div>
      </div>

      {/* Video Screen Container */}
      <div
        ref={containerRef}
        className={`relative ${getAspectClass()} bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-neutral-800/80 group select-none transition-all duration-300`}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            playsInline
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            onEnded={() => onPlayPause()}
          />
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={posterImage}
              alt="Video speaker"
              className={`w-full h-full object-cover transition-transform duration-1000 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
              referrerPolicy="no-referrer"
            />
            {/* Cinematic Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />

            {/* Active Audio Waveform Bars when playing */}
            {isPlaying && (
              <div className="absolute bottom-3 left-4 flex items-end gap-1 pointer-events-none z-10">
                <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-4 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="w-1 h-6 bg-amber-400 rounded-full animate-bounce [animation-delay:0.05s]" />
                <span className="w-1 h-3 bg-amber-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="text-[10px] font-mono text-amber-300 ml-1.5 font-bold">
                  AUDIO SYNC
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live Subtitle Overlay */}
        {displayWords && displayWords.length > 0 && (
          <div
            style={{
              top: `${subtitleYPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={handleMouseDownSubtitle}
            className={`absolute left-1/2 cursor-grab active:cursor-grabbing px-4 py-2 z-20 max-w-[92%] transition-transform duration-75 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center ${
              isDraggingSubtitle ? 'ring-2 ring-amber-400/80 rounded-xl bg-black/40' : ''
            }`}
          >
            {/* Optional background box */}
            {currentStyle.backgroundColor && (
              <div
                className="absolute inset-0 -z-10 rounded-xl"
                style={{
                  backgroundColor: currentStyle.backgroundColor,
                  backdropFilter: 'blur(4px)',
                }}
              />
            )}

            {displayWords.map((word, idx) => {
              const isActive = idx === activeIndex;
              const hasHighlight = word.highlightColor && word.highlightColor !== 'default';

              // Text color computation
              let color = currentStyle.textColor;
              if (isActive) {
                color = currentStyle.activeColor;
              } else if (hasHighlight) {
                if (word.highlightColor === 'yellow') color = '#FACC15';
                if (word.highlightColor === 'green') color = '#4ADE80';
                if (word.highlightColor === 'cyan') color = '#38BDF8';
                if (word.highlightColor === 'coral') color = '#FB7185';
                if (word.highlightColor === 'purple') color = '#C084FC';
              }

              // Text stroke and shadow
              const textShadow =
                currentStyle.animation === 'neon' && isActive
                  ? `0 0 10px ${currentStyle.activeColor}, 0 0 20px ${currentStyle.activeColor}`
                  : `${currentStyle.strokeWidth > 0 ? `-1.5px -1.5px 0 ${currentStyle.strokeColor}, 1.5px -1.5px 0 ${currentStyle.strokeColor}, -1.5px 1.5px 0 ${currentStyle.strokeColor}, 1.5px 1.5px 0 ${currentStyle.strokeColor}, ` : ''}0 3px 6px ${currentStyle.shadowColor}`;

              return (
                <div
                  key={word.id || idx}
                  className="relative inline-flex flex-col items-center justify-center transition-all duration-100"
                >
                  {/* Floating Animated Emoji */}
                  {currentStyle.showEmojis && word.emoji && (
                    <span
                      className={`text-xl sm:text-2xl transition-all duration-150 transform ${
                        isActive
                          ? 'scale-125 -translate-y-1 animate-bounce'
                          : 'scale-90 opacity-80'
                      }`}
                    >
                      {word.emoji}
                    </span>
                  )}

                  {/* Word Text */}
                  <span
                    style={{
                      fontFamily: currentStyle.fontFamily,
                      fontSize: `${currentStyle.fontSize}px`,
                      color,
                      textShadow,
                      textTransform: currentLanguage === 'hindi' ? 'none' : currentStyle.textTransform,
                      letterSpacing: currentLanguage === 'hindi' ? '0px' : '0.5px',
                    }}
                    className={`font-black select-none transition-all duration-100 ${
                      isActive && currentStyle.animation === 'bounce'
                        ? 'scale-115 -translate-y-0.5'
                        : ''
                    } ${
                      isActive && currentStyle.animation === 'pop'
                        ? 'scale-120'
                        : ''
                    }`}
                  >
                    {word.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors z-10 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
              <Play className="w-7 h-7 fill-neutral-950 translate-x-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Video Timeline & Playback Controls Bar */}
      <div className="w-full mt-3 bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl flex flex-col gap-2.5">
        {/* Scrubber Range Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tabular-nums text-neutral-400 w-12 text-left">
            {formatDisplayTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-neutral-800 accent-amber-400 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono tabular-nums text-neutral-500 w-12 text-right">
            {formatDisplayTime(duration || 10)}
          </span>
        </div>

        {/* Bottom Playback Toolbar */}
        <div className="flex items-center justify-between text-neutral-300">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPlayPause}
              className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition-transform active:scale-95 cursor-pointer font-bold"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-neutral-950" />
              ) : (
                <Play className="w-4 h-4 fill-neutral-950 translate-x-0.5" />
              )}
            </button>
            <button
              onClick={() => {
                const prev = Math.max(0, currentTime - 3);
                onTimeUpdate(prev);
                if (videoRef.current) videoRef.current.currentTime = prev;
              }}
              title="Back 3 seconds"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-[11px]">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
