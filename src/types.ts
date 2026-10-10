export interface SubtitleWord {
  id: string;
  text: string;
  start: number; // in seconds
  end: number; // in seconds
  emoji?: string;
  highlightColor?: 'yellow' | 'green' | 'cyan' | 'coral' | 'purple' | 'default';
  isCustomHighlight?: boolean;
}

export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: SubtitleWord[];
}

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export type CaptionAnimation = 'bounce' | 'pop' | 'wipe' | 'fade' | 'slide' | 'neon';

export interface CaptionStyle {
  id: string;
  name: string;
  category: string;
  fontFamily: string;
  fontSize: number; // base font size in px
  lineHeight: number;
  textTransform: 'uppercase' | 'capitalize' | 'none';
  textColor: string;
  activeColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number; // px
  shadowColor: string;
  shadowBlur: number;
  backgroundColor?: string;
  backgroundPadding?: string;
  borderRadius?: string;
  animation: CaptionAnimation;
  showEmojis: boolean;
  maxWordsPerScreen: number; // 1, 2, 3, 4
  previewBadge?: string;
}

export interface SampleVideo {
  id: string;
  title: string;
  speaker: string;
  duration: number;
  imagePoster: string;
  category: string;
  speechText: string;
  segments: SubtitleSegment[];
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  fontFamily?: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'english', name: 'English', nativeName: 'English', flag: '🇺🇸', fontFamily: "'Montserrat', sans-serif" },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', fontFamily: "'Noto Sans Devanagari', 'Montserrat', sans-serif" },
  { code: 'spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'german', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'italian', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'russian', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'chinese', name: 'Chinese', nativeName: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'korean', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'turkish', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];
