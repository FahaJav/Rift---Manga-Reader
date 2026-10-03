export type CountryOrigin = 'jp' | 'kr' | 'cn' | 'others';
export type ReadingMode = 'webtoon' | 'single' | 'double';
export type ReadingDirection = 'ltr' | 'rtl' | 'vertical';
export type ThemeColor = 'dark' | 'oled' | 'sepia' | 'light';
export type LibraryCategory = 'reading' | 'plan_to_read' | 'completed' | 'on_hold' | 'favorites' | 'downloaded';

export interface MangaItem {
  id: number | string;
  hid: string;
  slug: string;
  title: string;
  country?: string;
  demographic?: number;
  content_rating?: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
  rating?: string | number;
  bayesian_rating?: string | number;
  user_follow_count?: number;
  view_count?: number;
  desc?: string;
  md_covers?: Array<{ b2key?: string; url?: string }>;
  cover_url?: string;
  genres?: string[];
  status?: number; // 1 = ongoing, 2 = completed, etc.
  last_chapter?: string;
  firstChap?: { hid: string; chap: string };
  authors?: Array<{ name: string }>;
  artists?: Array<{ name: string }>;
}

export interface ChapterItem {
  hid: string;
  chap: string;
  vol?: string;
  title?: string;
  lang?: string;
  created_at?: string;
  updated_at?: string;
  group_name?: string;
}

export interface ChapterImage {
  h?: number;
  w?: number;
  name?: string;
  url?: string;
  b2key?: string;
  pageNumber?: number;
  blobData?: string; // For offline storage
}

export interface ReadingProgressRecord {
  comicSlug: string;
  comicTitle: string;
  coverUrl?: string;
  chapterHid: string;
  chapterNumber: string;
  chapterTitle?: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  lastReadAt: string;
  totalChapters?: number;
}

export interface LibraryItem {
  comic: MangaItem;
  category: LibraryCategory;
  addedAt: string;
  lastReadChapter?: string;
  currentProgress?: number; // 0 - 100
  notificationEnabled?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  provider: 'google' | 'guest' | 'sync_code' | 'email_password';
  syncCode: string;
  joinedAt: string;
  level: number;
  xp: number;
  isAgeVerified: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface ReadingAnalytics {
  totalMinutesRead: number;
  totalChaptersRead: number;
  dailyStreak: number;
  longestStreak: number;
  lastActiveDay: string;
  weeklyMinutes: number[]; // Sun to Sat
  genreStats: Record<string, number>;
  historyTimeline: Array<{
    date: string;
    comicTitle: string;
    chapterNumber: string;
    minutesSpent: number;
  }>;
}

export interface OfflineDownloadedChapter {
  comicSlug: string;
  comicTitle: string;
  coverUrl: string;
  chapterHid: string;
  chapterNumber: string;
  chapterTitle: string;
  images: ChapterImage[];
  downloadedAt: string;
  sizeBytes: number;
}

export interface ForumComment {
  id: string;
  comicSlug: string;
  chapterHid?: string;
  chapterTitle?: string;
  author: string;
  avatar: string;
  content: string;
  rating?: number;
  isSpoiler?: boolean;
  upvotes: number;
  createdAt: string;
}
