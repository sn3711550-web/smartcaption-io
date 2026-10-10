/**
 * Robust audio and video extraction utility.
 * Attempts fast client-side audio extraction to lightweight 16kHz WAV.
 * If audio decoding is unsupported by the browser for a codec, falls back
 * directly to a video file slice so Gemini can parse the video audio directly.
 */

export async function extractMediaForGemini(
  mediaFile: File,
  maxDurationSeconds: number = 60,
  onProgress?: (status: string) => void
): Promise<{ data: string; mimeType: string; duration: number }> {
  // Method 1: Try Web Audio decode to 16kHz mono WAV (fastest and smallest payload)
  try {
    if (onProgress) onProgress('Extracting audio track...');
    const arrayBuffer = await mediaFile.arrayBuffer();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const sampleRate = 16000;
        const duration = Math.min(audioBuffer.duration, maxDurationSeconds);
        const totalSamples = Math.floor(duration * sampleRate);

        if (onProgress) onProgress('Resampling audio for AI speech recognition...');

        const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const resampledBuffer = await offlineCtx.startRendering();
        const channelData = resampledBuffer.getChannelData(0);

        if (onProgress) onProgress('Encoding clean WAV stream...');
        const wavBlob = encodeWAV(channelData, sampleRate);
        const base64Audio = await blobToBase64(wavBlob);

        return {
          data: base64Audio,
          mimeType: 'audio/wav',
          duration,
        };
      } finally {
        audioCtx.close().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('AudioContext decode failed, using direct media slice fallback:', err);
  }

  // Method 2: Direct media slice fallback (Gemini natively accepts video/mp4, video/webm, audio/mp3)
  if (onProgress) onProgress('Preparing media file for AI...');
  // Slice to max 3MB to ensure fast upload and fit within serverless request limits
  const maxBytes = 3 * 1024 * 1024;
  const fileSlice = mediaFile.size > maxBytes ? mediaFile.slice(0, maxBytes) : mediaFile;
  const base64Data = await blobToBase64(fileSlice);

  let mime = mediaFile.type || 'video/mp4';
  if (mime.includes('quicktime')) mime = 'video/mp4';

  return {
    data: base64Data,
    mimeType: mime,
    duration: 15,
  };
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
