import React, { useState, useEffect } from 'react';
import { X, Minus, ExternalLink, Sparkles, Megaphone, Shield } from 'lucide-react';

interface AdBannerWindowProps {
  isVisible?: boolean;
}

const AD_CAMPAIGNS = [
  {
    id: 'webtoon-coins',
    tag: 'Webtoon Partner',
    title: 'Unlock Next 5 Chapters Early',
    description: 'Get 50 bonus coins for weekly manhwa fast-pass releases with code RIFTREADER.',
    cta: 'Claim 50 Coins',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=320&auto=format&fit=crop&q=80',
    link: '#ad-webtoon',
  },
  {
    id: 'anime-figure',
    tag: 'Official Merch',
    title: 'Solo Leveling: Sung Jinwoo 1/7 Figure',
    description: 'Limited edition Shadow Monarch statue with LED glowing daggers now open for preorder.',
    cta: 'View Pre-Orders',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=320&auto=format&fit=crop&q=80',
    link: '#ad-figures',
  },
  {
    id: 'crunchyroll-pass',
    tag: 'Anime Streaming',
    title: '14-Day Free Crunchyroll Mega Pass',
    description: 'Stream Chainsaw Man, Demon Slayer, and Jujutsu Kaisen ad-free in 4K HDR.',
    cta: 'Start Free Trial',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=320&auto=format&fit=crop&q=80',
    link: '#ad-streaming',
  },
];

export const AdBannerWindow: React.FC<AdBannerWindowProps> = ({ isVisible = true }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [clickedToast, setClickedToast] = useState(false);

  // Rotate ad every 45 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % AD_CAMPAIGNS.length);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible || isDismissed) return null;

  const currentAd = AD_CAMPAIGNS[currentAdIndex];

  const handleAction = () => {
    setClickedToast(true);
    setTimeout(() => setClickedToast(false), 3000);
  };

  // Minimized pill in bottom right
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-5 right-4 z-40 animate-fade-in">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[11px] font-medium shadow-xl backdrop-blur-md transition-all hover:scale-105"
        >
          <Megaphone className="w-3 h-3 text-rose-400" />
          <span>Sponsored ({currentAd.tag})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 z-40 w-72 sm:w-80 bg-[#0d1322]/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-slate-200 animate-slide-up transition-all">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>Sponsored Partner</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Minimize ad"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            title="Close ad"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Ad Content */}
      <div className="p-3 space-y-2.5">
        <div className="flex gap-2.5 items-start">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img
              src={currentAd.image}
              alt={currentAd.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold mb-1">
              {currentAd.tag}
            </span>
            <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
              {currentAd.title}
            </h4>
            <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
              {currentAd.description}
            </p>
          </div>
        </div>

        {/* Action Button & Toast */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-[9px] text-slate-500">Supports free scanlations</span>
          <button
            onClick={handleAction}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow transition-colors active:scale-95"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        {clickedToast && (
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-[10px] text-emerald-300 text-center animate-fade-in">
            Redirecting to sponsor offer! Thank you for supporting free readers.
          </div>
        )}
      </div>
    </div>
  );
};
