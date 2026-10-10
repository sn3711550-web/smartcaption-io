import React, { useEffect } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
  label?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = '1234567890',
  format = 'horizontal',
  className = '',
  label = 'Sponsored Advertisement',
}) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignored if adblocker or adsense not yet loaded
    }
  }, [slotId]);

  const heightClass =
    format === 'horizontal'
      ? 'h-24 sm:h-28'
      : format === 'rectangle'
      ? 'h-64'
      : 'h-96';

  return (
    <div
      className={`relative w-full rounded-2xl bg-gradient-to-r from-white/[0.02] via-violet-950/20 to-white/[0.02] border border-white/[0.08] overflow-hidden flex flex-col items-center justify-center p-3 text-center my-4 ${heightClass} ${className}`}
    >
      {/* Google AdSense Compliant Label */}
      <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1 select-none">
        {label}
      </span>

      {/* Ad slot element (for real Google AdSense when ca-pub ID is inserted into index.html) */}
      <div className="w-full h-full flex items-center justify-center">
        {/* Placeholder / Fallback Creative until AdSense is approved */}
        <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-white/[0.05] max-w-lg">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">
              Google AdSense Space Reserved
            </p>
            <p className="text-[11px] text-neutral-400">
              High-CTR responsive ad slot ready for live AdSense script (<code className="text-violet-400">ca-pub</code>)
            </p>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-bold text-violet-300 bg-violet-500/10 rounded-md border border-violet-500/20 shrink-0">
            Ad Slot #{slotId.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
};
