import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  BookOpen,
  Trash2,
  DownloadCloud,
  Check,
  Search,
  FolderHeart,
  Clock,
  Sparkles
} from 'lucide-react';
import { LibraryItem, LibraryCategory, OfflineDownloadedChapter } from '../../types/manga';
import { StorageService } from '../../services/storage';

interface LibraryViewProps {
  onSelectComic: (slug: string) => void;
  onStartReading: (comic: any, chapter: any) => void;
  onBrowse: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectComic,
  onStartReading,
  onBrowse,
}) => {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [offlineChapters, setOfflineChapters] = useState<OfflineDownloadedChapter[]>([]);
  const [activeTab, setActiveTab] = useState<LibraryCategory | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    setLibrary(StorageService.getLibrary());
    const downloaded = await StorageService.getAllOfflineChapters();
    setOfflineChapters(downloaded);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveFromLibrary = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.removeFromLibrary(slug);
    loadData();
  };

  const handleDeleteOffline = async (chapterHid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await StorageService.deleteOfflineChapter(chapterHid);
    loadData();
  };

  const readingProgress = StorageService.getReadingProgress();

  const totalOfflineBytes = offlineChapters.reduce((acc, c) => acc + (c.sizeBytes || 0), 0);
  const totalOfflineMB = (totalOfflineBytes / (1024 * 1024)).toFixed(1);

  const filteredLibrary = library.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = item.comic.title.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Header with Title and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Your Reading Library</h1>
          <p className="text-xs text-slate-400">
            Personalized collection with cloud sync & offline downloads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search library titles..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        {[
          { id: 'all', label: 'All Titles', count: library.length },
          { id: 'reading', label: 'Currently Reading', count: library.filter((l) => l.category === 'reading').length },
          { id: 'plan_to_read', label: 'Plan to Read', count: library.filter((l) => l.category === 'plan_to_read').length },
          { id: 'completed', label: 'Completed', count: library.filter((l) => l.category === 'completed').length },
          { id: 'favorites', label: 'Favorites', count: library.filter((l) => l.category === 'favorites').length },
          { id: 'downloaded', label: 'Offline Downloads', count: offlineChapters.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Offline Storage Notice */}
      {activeTab === 'downloaded' && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DownloadCloud className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-white">IndexedDB Offline Storage Active</p>
              <p className="text-[11px] text-slate-400">
                Downloaded chapters can be read anywhere without Wi-Fi or mobile data.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {totalOfflineMB} MB Cached
          </span>
        </div>
      )}

      {/* Content Grid */}
      {activeTab === 'downloaded' ? (
        offlineChapters.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <DownloadCloud className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-white">No Offline Chapters Downloaded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When reading any chapter, tap "Offline" in the top bar to save all pages into your browser's persistent storage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {offlineChapters.map((chap) => (
              <div
                key={chap.chapterHid}
                onClick={() => onSelectComic(chap.comicSlug)}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={chap.coverUrl}
                      alt={chap.comicTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition-colors">
                      {chap.comicTitle}
                    </h4>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      Chapter {chap.chapterNumber}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {chap.images.length} pages · {(chap.sizeBytes / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteOffline(chap.chapterHid, e)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                  title="Delete from offline storage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : filteredLibrary.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <BookMarked className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">Your Library is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bookmark trending manga and manhwa to track your reading progress across all devices.
          </p>
          <button
            onClick={onBrowse}
            className="px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredLibrary.map((item) => {
            const prog = readingProgress[item.comic.slug];
            const percent = prog ? prog.progressPercent : 0;
            return (
              <div
                key={item.comic.slug}
                onClick={() => onSelectComic(item.comic.slug)}
                className="group relative bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-lg flex flex-col"
              >
                {/* Cover Poster */}
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-800">
                  <img
                    src={item.comic.cover_url || (item.comic.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${item.comic.md_covers[0].b2key}` : '/src/assets/images/featured_manhwa_solo_1790953474736.jpg')}
                    alt={item.comic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" fill="%23e2e8f0" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${encodeURIComponent(item.comic.title.slice(0, 20))}</text></svg>`;
                    }}
                  />
                  <button
                    onClick={(e) => handleRemoveFromLibrary(item.comic.slug, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from Library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar (Feature 12) */}
                <div className="w-full bg-slate-800 h-1">
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                      {item.comic.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {prog ? `Ch. ${prog.chapterNumber} (${percent}%)` : 'Not Started'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
