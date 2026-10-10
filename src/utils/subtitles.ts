import { SubtitleSegment, SubtitleWord } from '../types.ts';

/**
 * Format seconds to standard SubRip (SRT) format: 00:00:00,000
 */
export function formatSRTTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Format seconds to WebVTT format: 00:00:00.000
 */
export function formatVTTTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Format seconds to mm:ss.s display format
 */
export function formatDisplayTime(seconds: number): string {
  const totalSeconds = Math.max(0, seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const decimal = Math.floor((totalSeconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${decimal}`;
}

/**
 * Generate standard .srt subtitle file content
 */
export function generateSRT(segments: SubtitleSegment[]): string {
  return segments
    .map((seg, index) => {
      const startStr = formatSRTTime(seg.start);
      const endStr = formatSRTTime(seg.end);
      const wordsWithEmojis = seg.words
        .map((w) => (w.emoji ? `${w.text} ${w.emoji}` : w.text))
        .join(' ');
      return `${index + 1}\n${startStr} --> ${endStr}\n${wordsWithEmojis}\n`;
    })
    .join('\n');
}

/**
 * Generate standard .vtt subtitle file content
 */
export function generateVTT(segments: SubtitleSegment[]): string {
  let output = 'WEBVTT\n\n';
  segments.forEach((seg, index) => {
    const startStr = formatVTTTime(seg.start);
    const endStr = formatVTTTime(seg.end);
    const wordsWithEmojis = seg.words
      .map((w) => (w.emoji ? `${w.text} ${w.emoji}` : w.text))
      .join(' ');
    output += `${index + 1}\n${startStr} --> ${endStr}\n${wordsWithEmojis}\n\n`;
  });
  return output.trim();
}

/**
 * Generate plain text transcript
 */
export function generatePlainTranscript(segments: SubtitleSegment[]): string {
  return segments
    .map((s) => `[${formatDisplayTime(s.start)} - ${formatDisplayTime(s.end)}] ${s.text}`)
    .join('\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// High-impact viral keyword dictionary for instant local AI emoji enrichment
const EMOJI_DICTIONARY: Record<string, string> = {
  money: '💰',
  wealth: '💵',
  rich: '🤑',
  dollars: '💸',
  billion: '💎',
  million: '💎',
  cash: '💳',
  crypto: '🪙',
  invest: '📈',
  grow: '🚀',
  scale: '⚙️',
  build: '🏗️',
  stop: '🛑',
  wait: '⏸️',
  dont: '❌',
  no: '🚫',
  fire: '🔥',
  hot: '🔥',
  ai: '🤖',
  tech: '💻',
  code: '👨‍💻',
  developer: '💻',
  engineer: '⚡',
  replace: '💥',
  secret: '🤫',
  crazy: '🤯',
  mindset: '🧠',
  brain: '🧠',
  smart: '💡',
  idea: '💡',
  discipline: '💪',
  workout: '🏋️‍♂️',
  gym: '🏃‍♂️',
  energy: '⚡',
  fast: '⚡',
  king: '👑',
  win: '🏆',
  winner: '🥇',
  target: '🎯',
  goal: '🎯',
  sleep: '🌙',
  night: '✨',
  time: '⏳',
  hours: '⌛',
  today: '📅',
  world: '🌍',
  love: '❤️',
  danger: '⚠️',
  system: '⚙️',
  viral: '🚀',
};

/**
 * Enrich subtitle segments with viral emojis locally
 */
export function autoEnrichEmojis(segments: SubtitleSegment[]): SubtitleSegment[] {
  return segments.map((seg) => {
    const updatedWords: SubtitleWord[] = seg.words.map((w) => {
      const cleanWord = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedEmoji = EMOJI_DICTIONARY[cleanWord];
      if (matchedEmoji && !w.emoji) {
        return {
          ...w,
          emoji: matchedEmoji,
          highlightColor: w.highlightColor || 'yellow',
        };
      }
      return w;
    });

    return {
      ...seg,
      words: updatedWords,
    };
  });
}

/**
 * Apply text transform to segments
 */
export function applyTextTransform(
  segments: SubtitleSegment[],
  transform: 'uppercase' | 'capitalize' | 'none'
): SubtitleSegment[] {
  return segments.map((seg) => {
    const words = seg.words.map((w) => {
      let transformedText = w.text;
      if (transform === 'uppercase') {
        transformedText = w.text.toUpperCase();
      } else if (transform === 'capitalize') {
        transformedText =
          w.text.charAt(0).toUpperCase() + w.text.slice(1).toLowerCase();
      }
      return { ...w, text: transformedText };
    });
    return {
      ...seg,
      text: words.map((w) => w.text).join(' '),
      words,
    };
  });
}
