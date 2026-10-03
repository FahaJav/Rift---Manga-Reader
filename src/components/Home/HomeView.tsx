import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  Flame,
  Tablet,
  ShieldCheck,
  Play,
  Heart,
  MessageSquare,
  Lock,
  UserPlus,
  BookmarkCheck,
} from 'lucide-react';
import { MangaItem } from '../../types/manga';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';

interface HomeViewProps {
  onSelectComic: (slug: string) => void;
  onBrowse: () => void;
  onOpenEReader: () => void;
  onOpenAuth?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectComic,
  onBrowse,
  onOpenEReader,
  onOpenAuth,
}) => {
  const [topManga, setTopManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const readingProgress = StorageService.getReadingProgress();
  const recentReading = Object.values(readingProgress).sort(
    (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
  )[0];

  useEffect(() => {
    let isMounted = true;
    const fetchTop = async () => {
      try {
        const data = await ApiService.getTopManga('trending', 7);
        if (isMounted) setTopManga(data.slice(0, 12));
      } catch (err) {
        console.error('Failed to load top manga:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTop();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Continue Reading Banner (Feature 12) */}
      {recentReading && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900 border border-rose-500/20 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              <img
                src={recentReading.coverUrl || '/src/assets/images/featured_manhwa_solo_1790953474736.jpg'}
                alt={recentReading.comicTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                Continue Reading
              </span>
              <h3 className="text-sm font-semibold text-white">{recentReading.comicTitle}</h3>
              <p className="text-xs text-slate-400">
                Chapter {recentReading.chapterNumber} · Page {recentReading.currentPage} ({recentReading.progressPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${recentReading.progressPercent}%` }}
              />
            </div>
            <button
              onClick={() => onSelectComic(recentReading.comicSlug)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Resume</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Trending Manga & Manhwa Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold font-display text-white">Trending Worldwide</h2>
          </div>
          <button
            onClick={onBrowse}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topManga.map((comic) => (
            <div
              key={comic.slug}
              onClick={() => onSelectComic(comic.slug)}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-md flex flex-col"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-slate-800">
                <img
                  src={comic.cover_url || (comic.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${comic.md_covers[0].b2key}` : '/src/assets/images/featured_manhwa_solo_1790953474736.jpg')}
                  alt={comic.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23e2e8f0" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${encodeURIComponent(comic.title.slice(0, 20))}</text><text x="50%" y="55%" fill="%2394a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">MANGA</text></svg>`;
                  }}
                />
                <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-black/80 text-amber-400 border border-slate-700">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  <span>{comic.rating || '9.6'}</span>
                </span>
                {comic.country && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/80 text-slate-200">
                    {comic.country}
                  </span>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                    {comic.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>{comic.genres?.[0] || 'Fantasy'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{comic.status === 2 ? 'Completed' : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. E-Reader Sync & Cloudflare Security Bento Grid (Features 9 & 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* E-Reader Feature Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5" />
              Hardware Compatibility
            </span>
            <h3 className="text-lg font-bold text-white">Seamless E-Reader & E-Ink Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Read on Kindle, Kobo, or Onyx Boox with high-contrast monochrome mode. Enter a 6-digit sync code to continue exactly where you left off.
            </p>
          </div>

          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/60 relative">
            <img
              src="/src/assets/images/ereader_showcase_1790953525939.jpg"
              alt="E-Reader Sync"
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={onOpenEReader}
            className="w-full py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md"
          >
            Pair My E-Reader
          </button>
        </div>

        {/* Custom Reader Account & Cloud Sync Card (No Google ID required) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Freedom & Privacy
            </span>
            <h3 className="text-lg font-bold text-white">Custom Email & Reader Accounts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't want to use Google? Create an account with your favorite email (Proton, Outlook, Yahoo, iCloud, custom) or a private handle to backup library progress, customize reader modes, and level up.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-device reading history & bookmarks</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>No Google account or third-party tracking required</span>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Free Account / Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
