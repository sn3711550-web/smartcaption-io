import React, { useState } from 'react';
import { SubtitleSegment, SubtitleWord } from '../types.ts';
import { formatDisplayTime } from '../utils/subtitles.ts';
import {
  Clock,
  Edit2,
  Trash2,
  Plus,
  Smile,
  Highlighter,
  ChevronRight,
  Play,
  Search,
} from 'lucide-react';

interface TimelineEditorProps {
  segments: SubtitleSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateSegment: (segmentId: string, updated: Partial<SubtitleSegment>) => void;
  onUpdateWord: (segmentId: string, wordId: string, updated: Partial<SubtitleWord>) => void;
  onAddSegment: () => void;
  onDeleteSegment: (segmentId: string) => void;
}

const QUICK_EMOJIS = ['🔥', '🚀', '💡', '💰', '⚡', '🤯', '🎯', '👑', '🛑', '📈', '🌙', '💪', '❌', '❤️'];

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  segments,
  currentTime,
  onSeek,
  onUpdateSegment,
  onUpdateWord,
  onAddSegment,
  onDeleteSegment,
}) => {
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [activeWordPickerId, setActiveWordPickerId] = useState<string | null>(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery) return true;
    return seg.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3.5 h-[580px]">
      {/* Top Bar: Title & Search */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Script & Word Timeline Editor
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            ({segments.length} cues)
          </span>
        </div>

        <button
          onClick={onAddSegment}
          className="px-2.5 py-1 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Cue
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search words in transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Segments Scrollable List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
        {filteredSegments.map((segment, segIdx) => {
          const isSegmentActive =
            currentTime >= segment.start && currentTime <= segment.end;

          return (
            <div
              key={segment.id}
              className={`p-3 rounded-xl border transition-all ${
                isSegmentActive
                  ? 'border-amber-400/80 bg-neutral-800/80 shadow-md shadow-amber-400/5'
                  : 'border-neutral-800/80 bg-neutral-950/70 hover:border-neutral-700'
              }`}
            >
              {/* Segment Header: Timestamps & Controls */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 mb-2 border-b border-neutral-800/60">
                <button
                  onClick={() => onSeek(segment.start)}
                  className="flex items-center gap-1.5 text-neutral-300 hover:text-amber-400 font-mono transition-colors group cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current text-amber-400 group-hover:scale-110" />
                  <span className="font-semibold text-amber-300">
                    {formatDisplayTime(segment.start)}
                  </span>
                  <span className="text-neutral-500">→</span>
                  <span>{formatDisplayTime(segment.end)}</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Timing Nudges */}
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      onClick={() =>
                        onUpdateSegment(segment.id, {
                          start: Math.max(0, segment.start - 0.2),
                        })
                      }
                      title="-0.2s start"
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      -0.2s
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSegment(segment.id, {
                          end: segment.end + 0.2,
                        })
                      }
                      title="+0.2s end"
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      +0.2s
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteSegment(segment.id)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Delete Cue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Word-by-Word Interactive Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {segment.words.map((word) => {
                  const isWordActive =
                    currentTime >= word.start && currentTime <= word.end;
                  const isEditing = editingWordId === word.id;
                  const isPickerOpen = activeWordPickerId === word.id;
                  const isColorPickerOpen = activeColorPickerId === word.id;

                  return (
                    <div
                      key={word.id}
                      className="relative inline-flex items-center group"
                    >
                      {/* Word chip */}
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                          isWordActive
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300 shadow-sm'
                            : word.highlightColor && word.highlightColor !== 'default'
                            ? 'bg-neutral-800 text-amber-300 border-amber-500/40'
                            : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-neutral-700'
                        }`}
                        onClick={() => onSeek(word.start)}
                      >
                        {/* Word Emoji */}
                        {word.emoji && (
                          <span className="text-sm select-none">{word.emoji}</span>
                        )}

                        {/* Word Text Edit */}
                        {isEditing ? (
                          <input
                            type="text"
                            value={word.text}
                            autoFocus
                            onBlur={() => setEditingWordId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingWordId(null);
                            }}
                            onChange={(e) =>
                              onUpdateWord(segment.id, word.id, { text: e.target.value })
                            }
                            className="bg-black/60 text-white px-1 py-0.5 rounded text-xs outline-none w-20"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => setEditingWordId(word.id)}
                            title="Double-click to edit text"
                          >
                            {word.text}
                          </span>
                        )}

                        {/* Quick Action Buttons on Hover */}
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWordPickerId(isPickerOpen ? null : word.id);
                              setActiveColorPickerId(null);
                            }}
                            title="Change Emoji"
                            className="p-0.5 hover:text-amber-400"
                          >
                            <Smile className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveColorPickerId(isColorPickerOpen ? null : word.id);
                              setActiveWordPickerId(null);
                            }}
                            title="Highlight Color"
                            className="p-0.5 hover:text-amber-400"
                          >
                            <Highlighter className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWordId(word.id);
                            }}
                            title="Edit Word"
                            className="p-0.5 hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Emoji Picker Popover */}
                      {isPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-neutral-950 border border-neutral-700 rounded-xl shadow-xl flex flex-wrap gap-1 w-44">
                          <button
                            onClick={() => {
                              onUpdateWord(segment.id, word.id, { emoji: undefined });
                              setActiveWordPickerId(null);
                            }}
                            className="text-[10px] text-neutral-400 hover:text-white w-full text-left pb-1 border-b border-neutral-800"
                          >
                            Clear Emoji
                          </button>
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                onUpdateWord(segment.id, word.id, { emoji });
                                setActiveWordPickerId(null);
                              }}
                              className="text-base p-1 hover:bg-neutral-800 rounded transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Color Highlight Picker Popover */}
                      {isColorPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-neutral-950 border border-neutral-700 rounded-xl shadow-xl flex items-center gap-1.5">
                          {[
                            { color: 'yellow', hex: '#FACC15' },
                            { color: 'green', hex: '#22C55E' },
                            { color: 'cyan', hex: '#38BDF8' },
                            { color: 'coral', hex: '#FB7185' },
                            { color: 'purple', hex: '#C084FC' },
                            { color: 'default', hex: '#94A3B8' },
                          ].map((item) => (
                            <button
                              key={item.color}
                              onClick={() => {
                                onUpdateWord(segment.id, word.id, {
                                  highlightColor: item.color as any,
                                });
                                setActiveColorPickerId(null);
                              }}
                              style={{ backgroundColor: item.hex }}
                              className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
