import React from 'react';
import { CaptionStyle } from '../types.ts';
import { CAPTION_STYLES } from '../data/presets.ts';
import { Sparkles, Palette, Type, Sliders, Check } from 'lucide-react';

interface StyleSelectorProps {
  currentStyle: CaptionStyle;
  onStyleSelect: (style: CaptionStyle) => void;
  onUpdateStyle: (updates: Partial<CaptionStyle>) => void;
  maxWordsPerScreen: number;
  onMaxWordsChange: (num: number) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  currentStyle,
  onStyleSelect,
  onUpdateStyle,
  maxWordsPerScreen,
  onMaxWordsChange,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Viral Caption Styles & Animations
          </h3>
        </div>
        <span className="text-xs text-neutral-400 font-medium">
          {CAPTION_STYLES.length} Presets Available
        </span>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
        {CAPTION_STYLES.map((style) => {
          const isSelected = currentStyle.id === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onStyleSelect(style)}
              className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-neutral-800/90 ring-1 ring-amber-400/50 shadow-md shadow-amber-400/10'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
              }`}
            >
              {/* Top row: Name & Badge */}
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {style.name}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Live Mini Preview Box */}
              <div className="h-10 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-center px-2 overflow-hidden">
                <span
                  style={{
                    fontFamily: style.fontFamily,
                    fontSize: '13px',
                    color: style.activeColor,
                    textTransform: style.textTransform,
                    textShadow: style.strokeWidth > 0 ? `0 0 1px ${style.strokeColor}` : 'none',
                  }}
                  className="font-black truncate"
                >
                  {style.showEmojis ? '🔥 VIRAL' : 'CAPTIONS'}
                </span>
              </div>

              {/* Tag / Category */}
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>{style.category}</span>
                <span className="text-neutral-500 font-mono capitalize">{style.animation}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fine-Tuning Controls */}
      <div className="pt-2 border-t border-neutral-800 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Customization</span>
        </div>

        {/* Word Density per Screen */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Words per Screen:</span>
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            {[1, 2, 3, 5].map((count) => (
              <button
                key={count}
                onClick={() => onMaxWordsChange(count)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  maxWordsPerScreen === count
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {count === 1 ? '1 Word' : `${count} Words`}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-neutral-400 shrink-0 flex items-center gap-1">
            <Type className="w-3.5 h-3.5" />
            Font Size:
          </span>
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <input
              type="range"
              min={18}
              max={44}
              value={currentStyle.fontSize}
              onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 accent-amber-400 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-neutral-300 w-8 text-right">
              {currentStyle.fontSize}px
            </span>
          </div>
        </div>

        {/* Text Casing & Emojis */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400">Letter Casing:</span>
            <select
              value={currentStyle.textTransform}
              onChange={(e) =>
                onUpdateStyle({
                  textTransform: e.target.value as 'uppercase' | 'capitalize' | 'none',
                })
              }
              className="bg-neutral-800 text-white rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
            >
              <option value="uppercase">ALL CAPS</option>
              <option value="capitalize">Title Case</option>
              <option value="none">Standard</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-lg border border-neutral-800">
            <span className="text-neutral-400">Animated Emojis:</span>
            <button
              onClick={() => onUpdateStyle({ showEmojis: !currentStyle.showEmojis })}
              className={`px-3 py-0.5 rounded text-xs font-semibold transition-colors ${
                currentStyle.showEmojis
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {currentStyle.showEmojis ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Active Highlight Color Palette */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-neutral-400 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5" />
            Active Word Color:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Yellow', color: '#FACC15' },
              { label: 'Green', color: '#22C55E' },
              { label: 'Cyan', color: '#38BDF8' },
              { label: 'Pink', color: '#F43F5E' },
              { label: 'Purple', color: '#A855F7' },
              { label: 'White', color: '#FFFFFF' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => onUpdateStyle({ activeColor: c.color })}
                style={{ backgroundColor: c.color }}
                title={c.label}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  currentStyle.activeColor === c.color
                    ? 'ring-2 ring-white scale-120'
                    : 'hover:scale-110 opacity-90'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
