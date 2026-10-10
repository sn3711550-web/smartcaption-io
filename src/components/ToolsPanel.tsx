import React, { useState } from 'react';
import { SubtitleSegment, SUPPORTED_LANGUAGES } from '../types.ts';
import {
  Download,
  FileText,
  FileVideo,
  Sparkles,
  Globe,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  generateSRT,
  generateVTT,
  generatePlainTranscript,
  downloadFile,
  autoEnrichEmojis,
} from '../utils/subtitles.ts';

interface ToolsPanelProps {
  segments: SubtitleSegment[];
  onUpdateSegments: (newSegments: SubtitleSegment[]) => void;
  onOpenExportModal: () => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  videoTitle: string;
  isTranslating?: boolean;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  segments,
  onUpdateSegments,
  onOpenExportModal,
  currentLanguage,
  onLanguageChange,
  videoTitle,
  isTranslating = false,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAutoEmojis = () => {
    const enriched = autoEnrichEmojis(segments);
    onUpdateSegments(enriched);
    setStatusMessage('Added viral emojis!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDownloadSRT = () => {
    const srt = generateSRT(segments);
    downloadFile(srt, `${videoTitle || 'captions'}.srt`, 'text/plain');
  };

  const handleDownloadVTT = () => {
    const vtt = generateVTT(segments);
    downloadFile(vtt, `${videoTitle || 'captions'}.vtt`, 'text/vtt');
  };

  const handleDownloadTXT = () => {
    const txt = generatePlainTranscript(segments);
    downloadFile(txt, `${videoTitle || 'captions'}_transcript.txt`, 'text/plain');
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Language & Export Options
        </h3>
        {statusMessage && (
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {statusMessage}
          </span>
        )}
      </div>

      {/* Language Selector */}
      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Captions Language:</span>
          </div>
          {isTranslating && (
            <span className="text-[11px] text-amber-400 flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Translating...
            </span>
          )}
        </div>

        {/* Quick select pills */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {[
            { code: 'english', label: '🇺🇸 English' },
            { code: 'hindi', label: '🇮🇳 हिंदी' },
            { code: 'spanish', label: '🇪🇸 Español' },
          ].map((item) => (
            <button
              key={item.code}
              disabled={isTranslating}
              onClick={() => onLanguageChange(item.code)}
              className={`py-1.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer truncate ${
                currentLanguage === item.code
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Dropdown for All Languages */}
        <select
          value={currentLanguage}
          disabled={isTranslating}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-amber-400"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
      </div>

      {/* AI Auto-Emoji */}
      <button
        onClick={handleAutoEmojis}
        className="w-full py-2.5 px-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Add Viral Animated Emojis</span>
      </button>

      {/* Export Section */}
      <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2.5">
        <button
          onClick={onOpenExportModal}
          className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <FileVideo className="w-4 h-4 text-white" />
          Export Video with Burned-In Captions
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadSRT}
            className="py-2 px-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>.SRT</span>
          </button>
          <button
            onClick={handleDownloadVTT}
            className="py-2 px-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>.VTT</span>
          </button>
          <button
            onClick={handleDownloadTXT}
            className="py-2 px-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>.TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
