import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lightweight, lowest-cost Gemini model (Flash-Lite uses 4x-5x fewer resources)
const EFFICIENT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Subtitle Schema for structured responses
const wordSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: 'The spoken word' },
    start: { type: Type.NUMBER, description: 'Start time in seconds with decimal places' },
    end: { type: Type.NUMBER, description: 'End time in seconds with decimal places' },
    emoji: { type: Type.STRING, description: 'Relevant emoji if applicable or empty string' },
    highlightColor: { type: Type.STRING, description: 'Accent color name like yellow, green, cyan, coral, or default' },
  },
  required: ['text', 'start', 'end'],
};

const segmentSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    start: { type: Type.NUMBER },
    end: { type: Type.NUMBER },
    text: { type: Type.STRING },
    words: {
      type: Type.ARRAY,
      items: wordSchema,
    },
  },
  required: ['id', 'start', 'end', 'text', 'words'],
};

// Helper: Sanitize and ensure 100% accurate, non-overlapping timestamps
function sanitizeAndSmoothTimings(segments: any[], maxDuration?: number): any[] {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  let lastEndTime = 0;
  const sanitized = segments.map((seg, segIdx) => {
    let start = typeof seg.start === 'number' && !isNaN(seg.start) ? Math.max(0, seg.start) : lastEndTime;
    let end = typeof seg.end === 'number' && !isNaN(seg.end) ? seg.end : start + 2.5;

    if (start < lastEndTime) {
      start = lastEndTime;
    }
    if (end <= start) {
      end = start + 1.8;
    }
    if (maxDuration && maxDuration > 0 && end > maxDuration) {
      end = maxDuration;
      if (start >= end) start = Math.max(0, end - 1.2);
    }
    lastEndTime = end;

    const rawWords = Array.isArray(seg.words) ? seg.words : [];
    const textWords = (seg.text || '')
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0);

    const wordCount = Math.max(rawWords.length, textWords.length, 1);
    const segSpan = Math.max(0.2, end - start);

    const smoothedWords = (rawWords.length >= textWords.length ? rawWords : textWords.map((tw: string) => ({ text: tw }))).map(
      (w: any, wIdx: number) => {
        const text = (w.text || textWords[wIdx] || '').trim();
        const expectedStart = start + (wIdx / wordCount) * segSpan;
        const expectedEnd = start + ((wIdx + 1) / wordCount) * segSpan;

        let wStart = typeof w.start === 'number' && !isNaN(w.start) ? w.start : expectedStart;
        let wEnd = typeof w.end === 'number' && !isNaN(w.end) ? w.end : expectedEnd;

        // If timing is inverted or out of bounds, snap to expected proportional window
        if (wStart < start || wStart >= end || wEnd <= wStart || wEnd > end + 0.1) {
          wStart = expectedStart;
          wEnd = expectedEnd;
        }

        return {
          id: w.id || `w-${segIdx}-${wIdx}-${Date.now()}`,
          text,
          start: parseFloat(wStart.toFixed(2)),
          end: parseFloat(wEnd.toFixed(2)),
          emoji: w.emoji || '',
          highlightColor: w.highlightColor || 'default',
        };
      }
    );

    return {
      id: seg.id || `seg-${segIdx}-${Date.now()}`,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      text: seg.text || smoothedWords.map((w: any) => w.text).join(' '),
      words: smoothedWords,
    };
  });

  return sanitized;
}

// API: AI Auto-Transcribe & Translate with Language Detection
app.post('/api/transcribe', async (req, res) => {
  try {
    const {
      audioData,
      videoData,
      mimeType,
      scriptHint,
      duration,
      targetLanguage = 'english',
    } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
      });
    }

    const mediaData = audioData || videoData;
    let contents: any[] = [];

    const languageGuidelines: Record<string, string> = {
      hindi: 'Output the subtitles strictly in natural, authentic HINDI (हिंदी Devanagari script, e.g. "अगर आप सच में अमीर बनना चाहते हैं..."). Even if the video is spoken in English, Hinglish or another language, transcribe and translate the speech into Hindi with matching speech timings.',
      english: 'Output the subtitles strictly in high-impact, punchy ENGLISH. Even if the video is spoken in Hindi or another language, transcribe and translate the speech into English with matching speech timings.',
      spanish: 'Output the subtitles in crisp, viral SPANISH (Español) with proper accents and punctuation.',
      french: 'Output the subtitles in viral FRENCH (Français) with proper accents and punctuation.',
      german: 'Output the subtitles in viral GERMAN (Deutsch).',
      japanese: 'Output the subtitles in natural JAPANESE (日本語).',
      portuguese: 'Output the subtitles in viral PORTUGUESE (Português).',
      arabic: 'Output the subtitles in authentic ARABIC (العربية).',
      bengali: 'Output the subtitles in authentic BENGALI (বাংলা).',
      italian: 'Output the subtitles in crisp ITALIAN (Italiano).',
      russian: 'Output the subtitles in viral RUSSIAN (Русский).',
      chinese: 'Output the subtitles in simplified CHINESE (中文).',
      korean: 'Output the subtitles in authentic KOREAN (한국어).',
      turkish: 'Output the subtitles in crisp TURKISH (Türkçe).',
    };

    const targetPrompt =
      languageGuidelines[targetLanguage.toLowerCase()] ||
      `Output the subtitles in authentic ${targetLanguage} language with matching speech timings.`;

    if (mediaData) {
      const cleanBase64 = mediaData.replace(/^data:[^;]+;base64,/, '');
      const cleanMime = mimeType || (videoData ? 'video/mp4' : 'audio/wav');

      contents = [
        {
          inlineData: {
            mimeType: cleanMime,
            data: cleanBase64,
          },
        },
        {
          text: `You are the world's best AI video caption generator (like Submagic & AutoCaption.io).
TASK:
1. Listen carefully to the voice/audio in this media. Detect the spoken language automatically.
2. Generate captions in the user's TARGET LANGUAGE: ${targetLanguage.toUpperCase()}.
${targetPrompt}
3. Break down the speech into short, rapid-fire viral segments (1 to 3 words per segment max, suitable for TikTok / Reels / YouTube Shorts).
4. CRITICAL TIMING ACCURACY:
   - Synchronize each word and segment to the exact moment it is spoken in the audio.
   - For every segment and every word, provide precise start and end timestamps in seconds (e.g. start: 1.25, end: 1.60).
   - Ensure start and end are strictly increasing and fit within the audio duration (${duration || 12}s).
5. Add relevant viral emojis (e.g. 🔥, 🚀, 💡, 💰, ⚡, 🤯) to key words.
6. Highlight key words with colors: 'yellow', 'green', 'cyan', 'coral', or 'default'.`,
        },
      ];
    } else {
      contents = [
        {
          text: `You are an expert viral video subtitle generator like AutoCaption.io.
TARGET LANGUAGE: ${targetLanguage.toUpperCase()}.
${targetPrompt}
Spoken dialogue / script hint: "${scriptHint || (targetLanguage === 'hindi' ? 'अगर आप सच में अमीर बनना चाहते हैं तो समय बेचना बंद कीजिए।' : 'If you want to build real wealth, stop trading your hours for dollars.')}"
Video duration is ${duration || 10} seconds.
Split this speech into short viral subtitle segments (1-3 words per segment).
Provide precise word-level start and end timestamps in seconds evenly spread across the duration.
Add engaging viral emojis (🔥, 🚀, 💡, 💰, ⚡, 🤯) and highlight colors ('yellow', 'green', 'cyan', 'coral').`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: EFFICIENT_GEMINI_MODEL,
      contents,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        systemInstruction:
          'You are an expert video caption and subtitle timing engine. Always output perfectly formatted JSON with segments and word-level timestamps. Never output markdown fences.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: 'The language detected in the video audio (e.g. Hindi, English, Spanish)',
            },
            segments: {
              type: Type.ARRAY,
              items: segmentSchema,
            },
          },
          required: ['segments'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const smoothedSegments = sanitizeAndSmoothTimings(parsed.segments || [], duration);

    return res.json({
      detectedLanguage: parsed.detectedLanguage || targetLanguage,
      segments: smoothedSegments,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate captions',
    });
  }
});

// API: AI Auto-Emojis & Viral Enhancements
app.post('/api/auto-emojis', async (req, res) => {
  try {
    const { segments } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'AI not configured' });
    }

    const response = await ai.models.generateContent({
      model: EFFICIENT_GEMINI_MODEL,
      contents: `Analyze these subtitle segments and enhance them with high-retention viral emojis (like TikTok/Reels captions) on key buzzwords and assign highlight colors (yellow, green, cyan, coral).
Input segments: ${JSON.stringify(segments)}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: segmentSchema,
            },
          },
          required: ['segments'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Auto emoji error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API: Translate Captions
app.post('/api/translate-captions', async (req, res) => {
  try {
    const { segments, targetLanguage } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'AI not configured' });
    }

    const response = await ai.models.generateContent({
      model: EFFICIENT_GEMINI_MODEL,
      contents: `Translate the text in these subtitle segments into ${targetLanguage || 'Hindi'}.
Preserve the exact same segment IDs, timings, and word count proportions so they align with the video.
Segments: ${JSON.stringify(segments)}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: segmentSchema,
            },
          },
          required: ['segments'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const smoothed = sanitizeAndSmoothTimings(parsed.segments || []);
    return res.json({ segments: smoothed });
  } catch (error: any) {
    console.error('Translate error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoCaption Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
