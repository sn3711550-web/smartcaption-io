/**
 * Audio synthesis helper for sample clips and video preview.
 * Provides synchronized speech playback in Hindi & English,
 * and Web Audio API synthesizer with real-time waveform analyzer.
 */

class SpeechPreviewController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  speak(text: string, lang: 'hindi' | 'english' = 'english', onEnd?: () => void) {
    this.initAudioContext();
    this.stop();

    const isHindi =
      lang === 'hindi' ||
      /[\u0900-\u097F]/.test(text); // detects Devanagari script

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = isHindi ? 0.95 : 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (isHindi) {
        utterance.lang = 'hi-IN';
        const hindiVoice = voices.find(
          (v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-US';
        const englishVoice = voices.find(
          (v) =>
            v.lang.includes('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex'))
        ) || voices.find((v) => v.lang.includes('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      this.currentUtterance = utterance;
      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    }
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  pause() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  resume() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const speechController = new SpeechPreviewController();
