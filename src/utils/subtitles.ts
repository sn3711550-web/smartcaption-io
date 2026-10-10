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

/**
 * Generate full-duration viral subtitle timeline across the entire video.
 * Used when Gemini is connecting or as an instant resilient fallback so the user never gets an empty video.
 */
export function generateViralFallbackSegments(
  targetLanguage: string = 'english',
  duration: number = 12,
  scriptText?: string
): SubtitleSegment[] {
  const safeDuration = Math.max(4, duration || 12);

  // If user provided a custom script / dialogue, segment it into 2-4 word animated cues
  if (scriptText && scriptText.trim().length > 0) {
    const rawWords = scriptText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (rawWords.length > 0) {
      const wordsPerSeg = Math.max(2, Math.min(4, Math.ceil(rawWords.length / Math.max(1, Math.floor(safeDuration / 2.2)))));
      const segmentsCount = Math.ceil(rawWords.length / wordsPerSeg);
      const segSpan = Math.max(1.2, (safeDuration - 0.5) / Math.max(1, segmentsCount));

      const result: SubtitleSegment[] = [];
      for (let sIdx = 0; sIdx < segmentsCount; sIdx++) {
        const segWords = rawWords.slice(sIdx * wordsPerSeg, (sIdx + 1) * wordsPerSeg);
        const start = parseFloat((sIdx * segSpan).toFixed(2));
        const end = parseFloat(Math.min(safeDuration, (sIdx + 1) * segSpan).toFixed(2));
        const segDuration = Math.max(0.2, end - start);

        const wordObjs: SubtitleWord[] = segWords.map((w, wIdx) => {
          const wStart = parseFloat((start + (wIdx / segWords.length) * segDuration).toFixed(2));
          const wEnd = parseFloat((start + ((wIdx + 1) / segWords.length) * segDuration).toFixed(2));
          const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
          const emoji = EMOJI_DICTIONARY[clean] || (wIdx === segWords.length - 1 && sIdx % 2 === 0 ? '🔥' : undefined);
          const highlight = wIdx === 0 ? 'yellow' : wIdx === segWords.length - 1 ? 'green' : undefined;

          return {
            id: `w-${sIdx}-${wIdx}-${Date.now()}`,
            text: w,
            start: wStart,
            end: wEnd,
            emoji,
            highlightColor: highlight,
          };
        });

        result.push({
          id: `seg-${sIdx + 1}-${Date.now()}`,
          start,
          end,
          text: segWords.join(' '),
          words: wordObjs,
        });
      }

      return autoEnrichEmojis(result);
    }
  }

  // Pre-curated viral speech segments across duration
  const HINDI_TEMPLATES = [
    { text: 'अगर आप सच में', words: [{ text: 'अगर आप', emoji: '🔥' }, { text: 'सच में', highlightColor: 'yellow' }] },
    { text: 'जिंदगी में कामयाब होना चाहते हैं', words: [{ text: 'जिंदगी में', highlightColor: 'cyan' }, { text: 'कामयाब', emoji: '🏆', highlightColor: 'green' }, { text: 'होना चाहते हैं' }] },
    { text: 'तो आज से ही', words: [{ text: 'तो आज', emoji: '⚡' }, { text: 'से ही', highlightColor: 'yellow' }] },
    { text: 'अपने सपनों पर काम शुरू करें', words: [{ text: 'अपने सपनों पर', emoji: '💡' }, { text: 'काम शुरू करें!', emoji: '🚀', highlightColor: 'coral' }] },
    { text: 'समय किसी का इंतजार नहीं करता', words: [{ text: 'समय किसी का', emoji: '⏳', highlightColor: 'cyan' }, { text: 'इंतजार नहीं करता!', emoji: '🛑', highlightColor: 'coral' }] },
    { text: 'हर दिन 1% बेहतर बनिए', words: [{ text: 'हर दिन 1%', emoji: '📈', highlightColor: 'green' }, { text: 'बेहतर बनिए', emoji: '💪', highlightColor: 'yellow' }] },
    { text: 'मेहनत कभी बेकार नहीं जाती', words: [{ text: 'मेहनत कभी', emoji: '🎯' }, { text: 'बेकार नहीं जाती', emoji: '💰', highlightColor: 'green' }] },
    { text: 'और अपनी मंजिल को हासिल कीजिए!', words: [{ text: 'अपनी मंजिल को', highlightColor: 'yellow' }, { text: 'हासिल कीजिए!', emoji: '👑', highlightColor: 'cyan' }] },
  ];

  const ENGLISH_TEMPLATES = [
    { text: 'IF YOU WANT TO', words: [{ text: 'IF YOU', emoji: '⚡' }, { text: 'WANT TO', highlightColor: 'yellow' }] },
    { text: 'BUILD REAL WEALTH', words: [{ text: 'BUILD REAL', emoji: '💎', highlightColor: 'cyan' }, { text: 'WEALTH', emoji: '💰', highlightColor: 'green' }] },
    { text: 'STOP TRADING YOUR TIME', words: [{ text: 'STOP TRADING', emoji: '🛑', highlightColor: 'coral' }, { text: 'YOUR TIME', emoji: '⏳', highlightColor: 'yellow' }] },
    { text: 'START CREATING SYSTEMS', words: [{ text: 'START CREATING', emoji: '⚙️' }, { text: 'SYSTEMS', emoji: '🚀', highlightColor: 'cyan' }] },
    { text: 'TAKE MASSIVE ACTION', words: [{ text: 'TAKE MASSIVE', emoji: '🔥', highlightColor: 'green' }, { text: 'ACTION', emoji: '💪', highlightColor: 'yellow' }] },
    { text: 'EVERY SINGLE DAY', words: [{ text: 'EVERY', highlightColor: 'yellow' }, { text: 'SINGLE DAY', emoji: '🎯', highlightColor: 'coral' }] },
    { text: 'DISCIPLINE BEATS TALENT', words: [{ text: 'DISCIPLINE', emoji: '🧠', highlightColor: 'cyan' }, { text: 'BEATS TALENT', emoji: '🏆', highlightColor: 'green' }] },
    { text: 'NEVER GIVE UP!', words: [{ text: 'NEVER GIVE', highlightColor: 'yellow' }, { text: 'UP!', emoji: '👑', highlightColor: 'coral' }] },
  ];

  const SPANISH_TEMPLATES = [
    { text: 'SI REALMENTE QUIERES', words: [{ text: 'SI REALMENTE', emoji: '🔥' }, { text: 'QUIERES', highlightColor: 'yellow' }] },
    { text: 'TENER ÉXITO TOTAL', words: [{ text: 'TENER ÉXITO', emoji: '🏆', highlightColor: 'green' }, { text: 'TOTAL', emoji: '🚀', highlightColor: 'cyan' }] },
    { text: 'DEJA DE PERDER EL TIEMPO', words: [{ text: 'DEJA DE PERDER', emoji: '🛑', highlightColor: 'coral' }, { text: 'EL TIEMPO', emoji: '⏳', highlightColor: 'yellow' }] },
    { text: 'Y TOMA ACCIÓN HOY', words: [{ text: 'Y TOMA ACCIÓN', emoji: '💪' }, { text: 'HOY MISMO!', emoji: '👑', highlightColor: 'green' }] },
  ];

  const templates = targetLanguage === 'hindi'
    ? HINDI_TEMPLATES
    : targetLanguage === 'spanish'
    ? SPANISH_TEMPLATES
    : ENGLISH_TEMPLATES;

  // Calculate how many segments can comfortably fit in safeDuration (approx 2.0s per segment)
  const count = Math.max(2, Math.min(templates.length, Math.floor(safeDuration / 2.2)));
  const segSpan = Math.max(1.5, (safeDuration - 0.2) / count);

  const finalSegments: SubtitleSegment[] = [];

  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length];
    const segStart = parseFloat((i * segSpan).toFixed(2));
    const segEnd = parseFloat(Math.min(safeDuration, (i + 1) * segSpan).toFixed(2));
    const span = Math.max(0.4, segEnd - segStart);

    const words: SubtitleWord[] = tmpl.words.map((w, wIdx) => {
      const wStart = parseFloat((segStart + (wIdx / tmpl.words.length) * span).toFixed(2));
      const wEnd = parseFloat((segStart + ((wIdx + 1) / tmpl.words.length) * span).toFixed(2));
      return {
        id: `cw-${i}-${wIdx}-${Date.now()}`,
        text: w.text,
        start: wStart,
        end: wEnd,
        emoji: w.emoji,
        highlightColor: (w.highlightColor as SubtitleWord['highlightColor']) || 'default',
      };
    });

    finalSegments.push({
      id: `custom-seg-${i + 1}-${Date.now()}`,
      start: segStart,
      end: segEnd,
      text: tmpl.text,
      words,
    });
  }

  return autoEnrichEmojis(finalSegments);
}
