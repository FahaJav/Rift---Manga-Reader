import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sliders,
  Download,
  Check,
  Play,
  Pause,
  List,
  Sparkles,
  Info,
  ShieldCheck,
  X,
  Volume2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import { FirebaseSyncService } from '../../services/firebaseSync';
import { MangaItem, ChapterItem, ChapterImage, OfflineDownloadedChapter } from '../../types/manga';

interface MangaReaderProps {
  comic: MangaItem;
  chapter: ChapterItem;
  allChapters: ChapterItem[];
  onSelectChapter: (chapter: ChapterItem) => void;
  onExit: () => void;
  onOpenSettings: () => void;
}

const MANGA_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ko', label: '한국어 (Raw)', flag: '🇰🇷' },
  { code: 'ja', label: '日本語 (Raw)', flag: '🇯🇵' },
  { code: 'pt-br', label: 'Português', flag: '🇧🇷' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const MangaReader: React.FC<MangaReaderProps> = ({
  comic,
  chapter,
  allChapters,
  onSelectChapter,
  onExit,
  onOpenSettings,
}) => {
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHUD, setShowHUD] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  const settings = StorageService.getSettings();
  const readerMode = settings.readerMode || 'webtoon'; // 'webtoon' | 'single' | 'double'
  const readingDirection = settings.readingDirection || 'vertical';

  // Zoom feature state (50% to 200%)
  const [zoomLevel, setZoomLevel] = useState<number>(settings.zoomLevel || 100);

  // Manhwa translation language feature state
  const [currentLang, setCurrentLang] = useState<string>(settings.readingLanguage || chapter.lang || 'en');
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  // Sync with global settings changes (e.g. from SettingsModal)
  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        if (e.detail.zoomLevel !== undefined) {
          setZoomLevel(e.detail.zoomLevel);
        }
        if (e.detail.readingLanguage !== undefined) {
          setCurrentLang(e.detail.readingLanguage);
        }
      }
    };
    window.addEventListener('km_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('km_settings_updated', handleSettingsUpdated);
  }, []);

  const handleZoomIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.min(200, prev + 10);
      StorageService.saveSettings({ ...StorageService.getSettings(), zoomLevel: next });
      return next;
    });
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.max(50, prev - 10);
      StorageService.saveSettings({ ...StorageService.getSettings(), zoomLevel: next });
      return next;
    });
  };

  const handleZoomReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomLevel(100);
    StorageService.saveSettings({ ...StorageService.getSettings(), zoomLevel: 100 });
  };

  const handleSelectLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    setShowLangMenu(false);
    StorageService.saveSettings({ ...StorageService.getSettings(), readingLanguage: langCode });

    // Find equivalent chapter in new language or update current chapter
    const matching =
      allChapters.find((c) => c.lang === langCode && c.chap === chapter.chap) ||
      allChapters.find((c) => c.lang === langCode);

    if (matching && matching.hid !== chapter.hid) {
      onSelectChapter(matching);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimer = useRef<number | null>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // Load Chapter images (checking offline IndexedDB first!)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setCurrentPage(1);

    const loadImages = async () => {
      // 1. Check if downloaded offline
      const offline = await StorageService.getOfflineChapter(chapter.hid);
      if (offline && offline.images && offline.images.length > 0) {
        if (isMounted) {
          setImages(offline.images);
          setIsOfflineAvailable(true);
          setLoading(false);
        }
        return;
      }

      // 2. Fetch from API proxy
      try {
        const data = await ApiService.getChapterImages(chapter.hid);
        if (isMounted) {
          setImages(data);
          setIsOfflineAvailable(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading chapter images:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadImages();

    // Check reading progress restore
    const saved = StorageService.getReadingProgress()[comic.slug];
    if (saved && saved.chapterHid === chapter.hid && saved.currentPage > 1) {
      setCurrentPage(saved.currentPage);
    }

    return () => {
      isMounted = false;
    };
  }, [chapter.hid, comic.slug]);

  // Track session reading time on unmount or chapter change
  useEffect(() => {
    sessionStartTime.current = Date.now();
    return () => {
      const minutesSpent = Math.max(1, Math.round((Date.now() - sessionStartTime.current) / 60000));
      StorageService.recordReadingActivity(comic.title, chapter.chap, minutesSpent);
    };
  }, [chapter.hid, comic.title, chapter.chap]);

  // Save progress periodically
  useEffect(() => {
    if (images.length > 0 && currentPage > 0) {
      const progressPercent = Math.round((currentPage / images.length) * 100);
      const record = {
        comicSlug: comic.slug,
        comicTitle: comic.title,
        coverUrl: comic.cover_url,
        chapterHid: chapter.hid,
        chapterNumber: chapter.chap,
        chapterTitle: chapter.title,
        currentPage,
        totalPages: images.length,
        progressPercent,
        lastReadAt: new Date().toISOString(),
        totalChapters: allChapters.length,
      };
      StorageService.saveChapterProgress(record);
      FirebaseSyncService.syncReadingProgress(record);
    }
  }, [currentPage, images.length, chapter.hid, chapter.chap, comic.slug, comic.title, comic.cover_url, allChapters.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleZoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Auto-scroll loop
  useEffect(() => {
    if (isAutoScrolling && readerMode === 'webtoon') {
      autoScrollTimer.current = window.setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += 2;
        }
      }, 25);
    } else {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    }
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [isAutoScrolling, readerMode]);

  // Find previous and next chapters
  const sortedChapters = [...allChapters].sort((a, b) => parseFloat(a.chap) - parseFloat(b.chap));
  const currentIndex = sortedChapters.findIndex((c) => c.hid === chapter.hid);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  const handleNextPage = () => {
    if (currentPage < images.length) {
      setCurrentPage((prev) => prev + (readerMode === 'double' ? 2 : 1));
      if (readerMode === 'webtoon') {
        const el = document.getElementById(`panel-${currentPage + 1}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (nextChapter) {
      onSelectChapter(nextChapter);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => Math.max(1, prev - (readerMode === 'double' ? 2 : 1)));
      if (readerMode === 'webtoon') {
        const el = document.getElementById(`panel-${currentPage - 1}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (prevChapter) {
      onSelectChapter(prevChapter);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Download chapter to IndexedDB for offline reading
  const handleDownloadOffline = async () => {
    if (images.length === 0 || downloading) return;
    setDownloading(true);
    setDownloadProgress(10);

    try {
      const cachedImages: ChapterImage[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let blobData = img.blobData;

        // Fetch image as blob URL if online
        if (!blobData && img.url) {
          try {
            const resp = await fetch(img.url);
            const blob = await resp.blob();
            blobData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch {
            blobData = img.url;
          }
        }

        cachedImages.push({
          ...img,
          blobData: blobData || img.url,
          url: blobData || img.url,
        });

        setDownloadProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const offlineRecord: OfflineDownloadedChapter = {
        comicSlug: comic.slug,
        comicTitle: comic.title,
        coverUrl: comic.cover_url || '',
        chapterHid: chapter.hid,
        chapterNumber: chapter.chap,
        chapterTitle: chapter.title || `Chapter ${chapter.chap}`,
        images: cachedImages,
        downloadedAt: new Date().toISOString(),
        sizeBytes: cachedImages.length * 280000,
      };

      await StorageService.saveOfflineChapter(offlineRecord);
      setIsOfflineAvailable(true);
      setImages(cachedImages);
    } catch (err) {
      console.error('Failed to download chapter offline:', err);
    } finally {
      setDownloading(false);
    }
  };

  const progressPercent = images.length > 0 ? Math.round((currentPage / images.length) * 100) : 0;

  // Determine container background based on theme
  const getThemeBg = () => {
    switch (settings.theme) {
      case 'oled':
        return 'bg-black text-white';
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#2c2013]';
      case 'light':
        return 'bg-[#f8fafc] text-slate-900';
      default:
        return 'bg-[#060911] text-slate-100';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${getThemeBg()} select-none overflow-hidden`}>
      {/* Top Floating HUD */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showHUD ? 'translate-y-0' : '-translate-y-full'
        } bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 text-slate-200`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onExit}
            className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
            title="Back to series"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">{comic.title}</h1>
            <p className="text-[11px] text-slate-400 truncate">
              Chapter {chapter.chap} {chapter.title ? `· ${chapter.title}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Out & In Controls */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300 hover:text-white"
              title="Reset Zoom to 100% (0)"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Manhwa Language Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLangMenu(!showLangMenu);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 transition-colors"
              title="Select Manhwa Translation Language"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span className="uppercase font-mono text-[10px] font-semibold">
                {MANGA_LANGUAGES.find((l) => l.code === currentLang)?.flag || '🌐'} {currentLang}
              </span>
            </button>

            {showLangMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-48 bg-[#0c1220] border border-slate-700/90 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-xs"
              >
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Translation Language
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {MANGA_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                        currentLang === lang.code
                          ? 'bg-rose-600/20 text-rose-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Offline Download button */}
          <button
            onClick={handleDownloadOffline}
            disabled={downloading || isOfflineAvailable}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              isOfflineAvailable
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80'
            }`}
            title={isOfflineAvailable ? 'Stored in IndexedDB (Offline Ready)' : 'Download chapter for offline reading'}
          >
            {downloading ? (
              <span className="font-mono text-[10px] text-rose-400">{downloadProgress}%</span>
            ) : isOfflineAvailable ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </button>

          {/* Chapter Drawer Toggle */}
          <button
            onClick={() => setShowChapterDrawer(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Chapter list"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Reader options"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reader Stage Content */}
      <div
        ref={containerRef}
        onClick={() => setShowHUD(!showHUD)}
        className="flex-1 overflow-y-auto relative outline-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-xs">Loading authentic manga pages...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Info className="w-10 h-10 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-white">No Images Available for this Chapter</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              This chapter may be scheduled for future publication or linked to an external provider.
            </p>
            {nextChapter && (
              <button
                onClick={() => onSelectChapter(nextChapter)}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              >
                Skip to Chapter {nextChapter.chap}
              </button>
            )}
          </div>
        ) : readerMode === 'webtoon' ? (
          /* Continuous Vertical Webtoon Strip */
          <div
            className="mx-auto flex flex-col items-center transition-all duration-150"
            style={{
              gap: `${settings.pageGap}px`,
              paddingBottom: '120px',
              paddingTop: '60px',
              width: `${zoomLevel}%`,
              maxWidth: `${Math.round(48 * (zoomLevel / 100))}rem`,
            }}
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                id={`panel-${idx + 1}`}
                className={`w-full relative ${
                  settings.ambientBacklight ? 'shadow-2xl shadow-rose-950/20' : ''
                }`}
              >
                <img
                  src={img.blobData || img.url}
                  alt={`Page ${idx + 1}`}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block select-none pointer-events-none"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = 'true';
                      target.src = (img.blobData || img.url) + '&retry=' + Date.now();
                    } else {
                      target.onerror = null;
                      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="100%" height="100%" fill="%230b0f19"/><rect x="20" y="20" width="760" height="1160" fill="%23111827" stroke="%23334155" stroke-width="2"/><text x="400" y="580" fill="%23f43f5e" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">RIFT MANGA PANEL</text><text x="400" y="620" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Page ${idx + 1} of ${images.length}</text></svg>`;
                    }
                  }}
                />
              </div>
            ))}

            {/* End of chapter transition shelf */}
            <div className="w-full p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-white">You finished Chapter {chapter.chap}!</h3>
              <p className="text-xs text-slate-400">Great progress. Ready for the next one?</p>
              <div className="flex items-center justify-center gap-3">
                {prevChapter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChapter(prevChapter);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    ← Chapter {prevChapter.chap}
                  </button>
                )}
                {nextChapter ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChapter(nextChapter);
                    }}
                    className="px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors"
                  >
                    Read Chapter {nextChapter.chap} →
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExit();
                    }}
                    className="px-5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Back to Series
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single or Double Page Paged View */
          <div className="h-full flex items-center justify-center p-4 overflow-auto">
            <div
              className="relative max-h-[85vh] flex items-center justify-center gap-2 transition-transform duration-150"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            >
              <img
                src={images[currentPage - 1]?.blobData || images[currentPage - 1]?.url}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="100%" height="100%" fill="%230b0f19"/><rect x="20" y="20" width="760" height="1160" fill="%23111827" stroke="%23334155" stroke-width="2"/><text x="400" y="580" fill="%23f43f5e" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">RIFT MANGA PANEL</text><text x="400" y="620" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Page ${currentPage} of ${images.length}</text></svg>`;
                }}
              />
              {readerMode === 'double' && currentPage < images.length && (
                <img
                  src={images[currentPage]?.blobData || images[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="100%" height="100%" fill="%230b0f19"/><rect x="20" y="20" width="760" height="1160" fill="%23111827" stroke="%23334155" stroke-width="2"/><text x="400" y="580" fill="%23f43f5e" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">RIFT MANGA PANEL</text><text x="400" y="620" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Page ${currentPage + 1} of ${images.length}</text></svg>`;
                  }}
                />
              )}
            </div>

            {/* Left/Right Tap zones */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                readingDirection === 'rtl' ? handleNextPage() : handlePrevPage();
              }}
              className="absolute left-0 top-16 bottom-16 w-1/4 cursor-w-resize"
              title="Previous Page"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                readingDirection === 'rtl' ? handlePrevPage() : handleNextPage();
              }}
              className="absolute right-0 top-16 bottom-16 w-1/4 cursor-e-resize"
              title="Next Page"
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Scrubber & Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showHUD ? 'translate-y-0' : 'translate-y-full'
        } bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 space-y-2`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevPage();
            }}
            disabled={!prevChapter && currentPage <= 1}
            className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrubber slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400 shrink-0">
              {currentPage} / {images.length || 1}
            </span>
            <input
              type="range"
              min="1"
              max={images.length || 1}
              value={currentPage}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const page = parseInt(e.target.value, 10);
                setCurrentPage(page);
                if (readerMode === 'webtoon') {
                  const el = document.getElementById(`panel-${page}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-[11px] text-rose-400 font-semibold shrink-0">
              {progressPercent}%
            </span>
          </div>

          {/* Auto Scroll toggle (for webtoon) */}
          {readerMode === 'webtoon' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAutoScrolling(!isAutoScrolling);
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                isAutoScrolling
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle Auto-Scroll"
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Auto</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextPage();
            }}
            disabled={!nextChapter && currentPage >= images.length}
            className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chapter Drawer / Jump Selector */}
      {showChapterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0e1424] border-l border-slate-800 h-full flex flex-col text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0b0f1b]">
              <div>
                <h3 className="text-sm font-semibold text-white">Jump to Chapter</h3>
                <p className="text-[11px] text-slate-400">
                  {allChapters.length} Chapters · Language: {MANGA_LANGUAGES.find((l) => l.code === currentLang)?.flag} {currentLang.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setShowChapterDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick language filter strip inside drawer */}
            <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium">Language:</span>
              {MANGA_LANGUAGES.slice(0, 6).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-2 py-0.5 rounded-full shrink-0 transition-colors font-mono ${
                    currentLang === lang.code
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {lang.flag} {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {allChapters.map((chap) => {
                const isCurrent = chap.hid === chapter.hid;
                return (
                  <button
                    key={chap.hid}
                    onClick={() => {
                      onSelectChapter(chap);
                      setShowChapterDrawer(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span>
                      Chapter {chap.chap} {chap.title ? `· ${chap.title}` : ''}
                    </span>
                    {isCurrent && <span className="text-[10px] uppercase font-mono">Reading</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
