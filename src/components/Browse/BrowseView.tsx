import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { MangaItem } from '../../types/manga';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';

interface BrowseViewProps {
  onSelectComic: (slug: string) => void;
  initialQuery?: string;
  onOpenAgeVerification: () => void;
}

const GENRE_LIST = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Isekai',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Supernatural',
];

export const BrowseView: React.FC<BrowseViewProps> = ({
  onSelectComic,
  initialQuery = '',
  onOpenAgeVerification,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('follow');
  const [comics, setComics] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const settings = StorageService.getSettings();
  const safeSearch = settings.safeSearchEnabled;

  const fetchResults = async () => {
    setLoading(true);
    try {
      const results = await ApiService.searchManga({
        q: query || undefined,
        country: selectedCountry || undefined,
        sort: selectedSort,
        contentRating: safeSearch ? 'safe' : undefined,
        limit: 30,
      });

      let filtered = results;
      if (selectedGenre) {
        filtered = filtered.filter(
          (c) =>
            c.genres && c.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
        );
      }

      setComics(filtered);
    } catch (err) {
      console.error('Browse search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedCountry, selectedSort, safeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Catalog & Advanced Search</h1>
        <p className="text-xs text-slate-400">
          Discover thousands of titles across Japanese Manga, Korean Manhwa, and Chinese Manhua
        </p>
      </div>

      {/* Search Bar & Primary Filters */}
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, character, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shrink-0 shadow-md"
          >
            Search
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Origin Country */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            {[
              { id: '', label: 'All Origins' },
              { id: 'kr', label: 'Manhwa (KR)' },
              { id: 'jp', label: 'Manga (JP)' },
              { id: 'cn', label: 'Manhua (CN)' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountry(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCountry === c.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="follow">Sort: Most Popular</option>
            <option value="view">Sort: Total Views</option>
            <option value="rating">Sort: Top Rated</option>
            <option value="created_at">Sort: Latest Added</option>
          </select>

          {/* Safe-Search Status Pill */}
          <div className="flex items-center gap-2 ml-auto">
            {safeSearch ? (
              <button
                type="button"
                onClick={onOpenAgeVerification}
                className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                title="Safe-Search is ON. Click to unlock 18+ content."
              >
                Safe-Search: ON
              </button>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                Safe-Search: 18+ Unlocked
              </span>
            )}
          </div>
        </div>

        {/* Genre Pill Selection Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedGenre('')}
            className={`px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedGenre === ''
                ? 'border-rose-500 bg-rose-500/10 text-white font-semibold'
                : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {GENRE_LIST.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
              className={`px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                selectedGenre === g
                  ? 'border-rose-500 bg-rose-500/10 text-white font-semibold'
                  : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </form>

      {/* Results View */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs">Searching Comick global index...</p>
        </div>
      ) : comics.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">No Matching Titles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords, origin filters, or clearing the selected genre.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedCountry('');
              setSelectedGenre('');
              fetchResults();
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {comics.map((comic) => (
            <div
              key={comic.slug}
              onClick={() => onSelectComic(comic.slug)}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-md flex flex-col"
            >
              {/* Cover Art */}
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
                {comic.rating && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-black/80 text-amber-400 border border-slate-700">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{comic.rating}</span>
                  </span>
                )}
                {comic.country && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/80 text-slate-200">
                    {comic.country}
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                    {comic.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>{comic.genres?.[0] || 'Action'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{comic.status === 2 ? 'Finished' : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
