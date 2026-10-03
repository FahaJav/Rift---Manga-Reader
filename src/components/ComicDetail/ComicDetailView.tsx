import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Share2,
  Star,
  Eye,
  Heart,
  Download,
  Check,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Globe,
} from 'lucide-react';
import { MangaItem, ChapterItem, ForumComment, LibraryCategory, LibraryItem } from '../../types/manga';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import { FirebaseSyncService } from '../../services/firebaseSync';

const DETAIL_LANGUAGES = [
  { code: 'all', label: 'All Languages', flag: '🌐' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ko', label: '한국어 (Raw)', flag: '🇰🇷' },
  { code: 'ja', label: '日本語 (Raw)', flag: '🇯🇵' },
  { code: 'pt-br', label: 'Português', flag: '🇧🇷' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
];

interface ComicDetailViewProps {
  slug: string;
  onBack: () => void;
  onStartReading: (comic: MangaItem, chapter: ChapterItem) => void;
  onSelectComic: (slug: string) => void;
}

export const ComicDetailView: React.FC<ComicDetailViewProps> = ({
  slug,
  onBack,
  onStartReading,
  onSelectComic,
}) => {
  const [comic, setComic] = useState<MangaItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'forum' | 'similar'>('chapters');
  const [searchChapter, setSearchChapter] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<LibraryCategory | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoilerComment, setIsSpoilerComment] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadedHids, setDownloadedHids] = useState<Set<string>>(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return StorageService.getSettings().readingLanguage || 'all';
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const detail = await ApiService.getComicDetail(slug);
        if (!isMounted) return;

        if (detail && detail.comic) {
          setComic(detail.comic);

          // Check library status
          const library = StorageService.getLibrary();
          const found = library.find((l) => l.comic.slug === detail.comic.slug);
          if (found) setLibraryCategory(found.category);

          // Load chapters
          const chData = await ApiService.getComicChapters(detail.comic.hid || slug, 1, 100);
          if (isMounted) setChapters(chData.chapters || []);

          // Load forum comments & subscribe to Firestore updates
          const forumData = await ApiService.getComments(detail.comic.slug);
          if (isMounted) setComments(forumData);

          const unsubComments = FirebaseSyncService.subscribeComments(detail.comic.slug, (liveComments) => {
            if (isMounted && liveComments.length > 0) {
              setComments(liveComments);
            }
          });

          // Check downloaded offline chapters
          const offlineList = await StorageService.getAllOfflineChapters();
          const hids = new Set(offlineList.map((c) => c.chapterHid));
          if (isMounted) setDownloadedHids(hids);

          return () => {
            unsubComments();
          };
        }
      } catch (err) {
        console.error('Failed to load comic detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleLibraryChange = (category: LibraryCategory) => {
    if (!comic) return;
    setLibraryCategory(category);
    const item: LibraryItem = {
      comic,
      category,
      addedAt: new Date().toISOString(),
      currentProgress: 0,
    };
    StorageService.addToLibrary(item);
    FirebaseSyncService.syncLibraryItem(item);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !comic) return;

    const posted = await FirebaseSyncService.postComment({
      comicSlug: comic.slug,
      chapterTitle: 'General Title Discussion',
      content: newComment.trim(),
      rating: userRating,
      isSpoiler: isSpoilerComment,
    });

    if (posted) {
      setComments([posted, ...comments.filter((c) => c.id !== posted.id)]);
      setNewComment('');
      setIsSpoilerComment(false);
    }
  };

  const handleVote = async (commentId: string) => {
    const success = await ApiService.voteComment(commentId, 1);
    if (success) {
      setComments(
        comments.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c))
      );
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-xs">Fetching title metadata & chapter releases...</p>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-lg font-semibold text-white">Comic Not Found</h2>
        <p className="text-xs text-slate-400">The requested title could not be loaded from the index.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  const readingProgress = StorageService.getReadingProgress()[comic.slug];
  const sortedChapters = [...chapters].sort((a, b) => parseFloat(a.chap) - parseFloat(b.chap));
  const firstChapter = sortedChapters[0] || { hid: `${comic.slug}-ch-1`, chap: '1', title: 'Prologue' };
  const resumeChapter = readingProgress
    ? sortedChapters.find((c) => c.hid === readingProgress.chapterHid) || firstChapter
    : firstChapter;

  const filteredChapters = sortedChapters.filter((c) => {
    const matchesSearch =
      c.chap.includes(searchChapter) ||
      (c.title && c.title.toLowerCase().includes(searchChapter.toLowerCase()));
    const matchesLang =
      selectedLanguage === 'all' || !c.lang || c.lang.toLowerCase() === selectedLanguage.toLowerCase();
    return matchesSearch && matchesLang;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Main Comic Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        {/* Poster / Cover */}
        <div className="md:col-span-1 flex flex-col items-center sm:items-start">
          <div className="w-48 sm:w-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 relative group">
            <img
              src={comic.cover_url || (comic.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${comic.md_covers[0].b2key}` : '/src/assets/images/featured_manhwa_solo_1790953474736.jpg')}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23e2e8f0" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${encodeURIComponent(comic.title.slice(0, 22))}</text><text x="50%" y="55%" fill="%23f43f5e" font-family="sans-serif" font-size="12" text-anchor="middle">OFFICIAL SERIES</text></svg>`;
              }}
            />
            {comic.country && (
              <span className="absolute top-2 left-2 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/80 text-white border border-slate-600">
                {comic.country === 'kr' ? 'Manhwa (KR)' : comic.country === 'jp' ? 'Manga (JP)' : 'Manhua (CN)'}
              </span>
            )}
          </div>
        </div>

        {/* Metadata & Actions */}
        <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {comic.title}
            </h1>

            {/* Clean unboxed metadata with typographic separators (anti-slop rule) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{comic.rating || '9.6'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{((comic.view_count || 14000000) / 1000000).toFixed(1)}M Views</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>{((comic.user_follow_count || 320000) / 1000).toFixed(0)}k Follows</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{comic.status === 2 ? 'Completed' : 'Ongoing Series'}</span>
            </div>

            {/* Genres unboxed with subtle separator */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-300">
              {(comic.genres || ['Action', 'Fantasy', 'Adventure']).map((genre, idx, arr) => (
                <span key={genre} className="hover:text-rose-400 cursor-pointer transition-colors">
                  {genre}
                  {idx < arr.length - 1 && <span className="text-slate-600 ml-1.5">/</span>}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 line-clamp-4">
              {comic.desc || 'An epic reading journey with weekly translated releases, vivid webtoon panel art, and an active reader community.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
            {/* Read CTA */}
            <button
              onClick={() => onStartReading(comic, resumeChapter)}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {readingProgress
                  ? `Resume Ch. ${resumeChapter.chap} (${readingProgress.progressPercent}%)`
                  : `Start Reading Ch. ${firstChapter.chap}`}
              </span>
            </button>

            {/* Add to Library Dropdown */}
            <div className="relative">
              <select
                value={libraryCategory || ''}
                onChange={(e) => handleLibraryChange(e.target.value as LibraryCategory)}
                className="px-3 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer focus:outline-none"
              >
                <option value="" disabled>
                  + Add to Library
                </option>
                <option value="reading">Currently Reading</option>
                <option value="plan_to_read">Plan to Read</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Chapters / Community Discussion / Similar */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'chapters'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Chapters</span>
            <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full">
              {chapters.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'forum'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Forum</span>
            <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Chapters List */}
        {activeTab === 'chapters' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={searchChapter}
                  onChange={(e) => setSearchChapter(e.target.value)}
                  placeholder="Filter chapters (e.g. 175, battle)..."
                  className="w-full sm:w-72 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />

                {/* Translation Language Selector */}
                <div className="relative shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl">
                    <Globe className="w-3.5 h-3.5 text-rose-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedLanguage(val);
                        if (val !== 'all') {
                          StorageService.saveSettings({
                            ...StorageService.getSettings(),
                            readingLanguage: val,
                          });
                        }
                      }}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {DETAIL_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Showing {filteredChapters.length} chapters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredChapters.map((chap) => {
                const isDownloaded = downloadedHids.has(chap.hid);
                return (
                  <button
                    key={chap.hid}
                    onClick={() => onStartReading(comic, chap)}
                    className="p-3 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-medium text-white group-hover:text-rose-400 transition-colors">
                        Chapter {chap.chap}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {chap.title || 'Official Translation'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDownloaded && (
                        <span
                          className="p-1 rounded bg-emerald-500/10 text-emerald-400"
                          title="Downloaded offline"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                        Read →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Community Discussion Forum (Feature 5) */}
        {activeTab === 'forum' && (
          <div className="space-y-6">
            {/* Post comment box */}
            <form onSubmit={handlePostComment} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold text-white">Join the Community Discussion for {comic.title}</h3>
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on the plot, character development, or art style..."
                className="w-full px-3 py-2 text-xs bg-[#0b0f1b] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={isSpoilerComment}
                    onChange={(e) => setIsSpoilerComment(e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900"
                  />
                  <span>Mark as Spoiler</span>
                </label>

                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition-colors shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comm.avatar}
                        alt={comm.author}
                        className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{comm.author}</p>
                        <p className="text-[10px] text-slate-400">{comm.chapterTitle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(comm.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="font-mono text-[11px]">{comm.upvotes}</span>
                    </button>
                  </div>

                  {comm.isSpoiler ? (
                    <details className="text-xs text-slate-300 cursor-pointer pt-1">
                      <summary className="text-amber-400 font-medium">
                        ⚠️ Contains Spoiler (Click to reveal)
                      </summary>
                      <p className="mt-2 p-2 bg-black/40 rounded border border-slate-800 text-slate-300">
                        {comm.content}
                      </p>
                    </details>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{comm.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
