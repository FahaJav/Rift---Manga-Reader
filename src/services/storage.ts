import {
  ReadingProgressRecord,
  LibraryItem,
  UserProfile,
  ReadingAnalytics,
  OfflineDownloadedChapter,
  Achievement,
} from '../types/manga';

const DB_NAME = 'Rift_IndexedDB';
const DB_VERSION = 1;
const STORE_OFFLINE = 'offline_chapters';

// IndexedDB Helper for Large Offline Chapter Storage
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_OFFLINE)) {
        db.createObjectStore(STORE_OFFLINE, { keyPath: 'chapterHid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  // ----------------- OFFLINE CHAPTER DOWNLOADS (INDEXEDDB) -----------------
  async saveOfflineChapter(chapter: OfflineDownloadedChapter): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE);
      const req = store.put(chapter);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getOfflineChapter(chapterHid: string): Promise<OfflineDownloadedChapter | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE, 'readonly');
        const store = tx.objectStore(STORE_OFFLINE);
        const req = store.get(chapterHid);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },

  async getAllOfflineChapters(): Promise<OfflineDownloadedChapter[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE, 'readonly');
        const store = tx.objectStore(STORE_OFFLINE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  async deleteOfflineChapter(chapterHid: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE);
      const req = store.delete(chapterHid);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // ----------------- READING PROGRESS (LOCAL STORAGE + SYNC) -----------------
  getReadingProgress(): Record<string, ReadingProgressRecord> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem('km_reading_progress');
    return raw ? JSON.parse(raw) : {};
  },

  saveChapterProgress(record: ReadingProgressRecord) {
    if (typeof window === 'undefined') return;
    const all = this.getReadingProgress();
    all[record.comicSlug] = record;
    localStorage.setItem('km_reading_progress', JSON.stringify(all));

    // Also update library progress if present
    const library = this.getLibrary();
    const item = library.find((l) => l.comic.slug === record.comicSlug);
    if (item) {
      item.lastReadChapter = record.chapterNumber;
      item.currentProgress = record.progressPercent;
      this.saveLibrary(library);
    }

    // Trigger gamified progress update
    this.recordReadingActivity(record.comicTitle, record.chapterNumber, 2);
  },

  // ----------------- USER LIBRARY (COLLECTIONS) -----------------
  getLibrary(): LibraryItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('km_user_library');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  },

  saveLibrary(items: LibraryItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('km_user_library', JSON.stringify(items));
  },

  addToLibrary(item: LibraryItem) {
    const library = this.getLibrary();
    const existingIndex = library.findIndex((l) => l.comic.slug === item.comic.slug);
    if (existingIndex >= 0) {
      library[existingIndex] = { ...library[existingIndex], category: item.category };
    } else {
      library.unshift(item);
    }
    this.saveLibrary(library);
  },

  removeFromLibrary(comicSlug: string) {
    const library = this.getLibrary();
    const filtered = library.filter((l) => l.comic.slug !== comicSlug);
    this.saveLibrary(filtered);
  },

  // ----------------- USER PROFILE & AUTH -----------------
  getUserProfile(): UserProfile {
    if (typeof window === 'undefined') {
      return {
        id: 'km-guest',
        name: 'Guest Reader',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        provider: 'guest',
        syncCode: 'KM-8821',
        joinedAt: new Date().toISOString(),
        level: 1,
        xp: 150,
        isAgeVerified: false,
      };
    }
    const raw = localStorage.getItem('km_user_profile');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    const guest: UserProfile = {
      id: `km-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Guest Reader',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      provider: 'guest',
      syncCode: `KM-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedAt: new Date().toISOString(),
      level: 1,
      xp: 200,
      isAgeVerified: false,
    };
    this.saveUserProfile(guest);
    return guest;
  },

  saveUserProfile(profile: UserProfile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('km_user_profile', JSON.stringify(profile));
  },

  // Custom (Non-Google) User Account Management
  getRegisteredUsers(): Array<{ email: string; passwordHash: string; profile: UserProfile }> {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('km_registered_accounts');
    return raw ? JSON.parse(raw) : [];
  },

  registerCustomUser(account: { email: string; passwordHash: string; profile: UserProfile }): boolean {
    if (typeof window === 'undefined') return false;
    const users = this.getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === account.email.toLowerCase());
    if (existing) {
      return false; // Email or username already taken
    }
    users.push(account);
    localStorage.setItem('km_registered_accounts', JSON.stringify(users));
    this.saveUserProfile(account.profile);
    return true;
  },

  authenticateCustomUser(emailOrUsername: string, passwordHash: string): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const users = this.getRegisteredUsers();
    const found = users.find(
      (u) =>
        (u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
          u.profile.name.toLowerCase() === emailOrUsername.toLowerCase()) &&
        u.passwordHash === passwordHash
    );
    if (found) {
      this.saveUserProfile(found.profile);
      return found.profile;
    }
    return null;
  },

  // ----------------- ANALYTICS & GAMIFICATION -----------------
  getAnalytics(): ReadingAnalytics {
    const defaultStats: ReadingAnalytics = {
      totalMinutesRead: 142,
      totalChaptersRead: 18,
      dailyStreak: 3,
      longestStreak: 7,
      lastActiveDay: new Date().toISOString().split('T')[0],
      weeklyMinutes: [25, 40, 15, 30, 20, 45, 12],
      genreStats: {
        Action: 24,
        Fantasy: 18,
        Adventure: 14,
        Supernatural: 9,
        Comedy: 6,
      },
      historyTimeline: [
        {
          date: new Date().toISOString(),
          comicTitle: 'Solo Leveling',
          chapterNumber: '179',
          minutesSpent: 12,
        },
      ],
    };

    if (typeof window === 'undefined') return defaultStats;
    const raw = localStorage.getItem('km_analytics');
    return raw ? JSON.parse(raw) : defaultStats;
  },

  recordReadingActivity(comicTitle: string, chapterNumber: string, minutes: number = 2) {
    if (typeof window === 'undefined') return;
    const analytics = this.getAnalytics();
    const today = new Date().toISOString().split('T')[0];

    analytics.totalMinutesRead += minutes;
    analytics.totalChaptersRead += 1;

    // Streak calculation
    if (analytics.lastActiveDay !== today) {
      analytics.dailyStreak += 1;
      if (analytics.dailyStreak > analytics.longestStreak) {
        analytics.longestStreak = analytics.dailyStreak;
      }
      analytics.lastActiveDay = today;
    }

    // Weekly day bucket (0 = Sun, 6 = Sat)
    const dayIndex = new Date().getDay();
    analytics.weeklyMinutes[dayIndex] = (analytics.weeklyMinutes[dayIndex] || 0) + minutes;

    analytics.historyTimeline.unshift({
      date: new Date().toISOString(),
      comicTitle,
      chapterNumber,
      minutesSpent: minutes,
    });
    if (analytics.historyTimeline.length > 30) {
      analytics.historyTimeline.pop();
    }

    localStorage.setItem('km_analytics', JSON.stringify(analytics));

    // Award XP to user profile
    const profile = this.getUserProfile();
    profile.xp += 25 * minutes;
    profile.level = Math.floor(profile.xp / 500) + 1;
    this.saveUserProfile(profile);
  },

  // ----------------- ACHIEVEMENTS -----------------
  getAchievements(): Achievement[] {
    const list: Achievement[] = [
      {
        id: 'first_chapter',
        title: 'First Awakening',
        description: 'Read and complete your first manga or manhwa chapter.',
        icon: 'BookOpen',
        xpReward: 100,
        unlocked: true,
        progress: 1,
        maxProgress: 1,
        unlockedAt: '2026-09-28',
      },
      {
        id: 'night_owl',
        title: 'Night Raid Reader',
        description: 'Read chapters between midnight and 4:00 AM.',
        icon: 'Moon',
        xpReward: 150,
        unlocked: true,
        progress: 1,
        maxProgress: 1,
        unlockedAt: '2026-10-01',
      },
      {
        id: 'streak_master',
        title: 'Hunter’s Discipline',
        description: 'Maintain a 5-day continuous reading streak.',
        icon: 'Flame',
        xpReward: 250,
        unlocked: false,
        progress: 3,
        maxProgress: 5,
      },
      {
        id: 'offline_survivor',
        title: 'Off-Grid Explorer',
        description: 'Download 3 chapters and read them fully offline.',
        icon: 'DownloadCloud',
        xpReward: 200,
        unlocked: false,
        progress: 1,
        maxProgress: 3,
      },
      {
        id: 'speed_demon',
        title: 'Shadow Sprint',
        description: 'Read 10 chapters within a single 24-hour cycle.',
        icon: 'Zap',
        xpReward: 300,
        unlocked: false,
        progress: 4,
        maxProgress: 10,
      },
      {
        id: 'tower_climber',
        title: 'Floor 100 Champion',
        description: 'Read over 100 chapters across any manga series.',
        icon: 'Trophy',
        xpReward: 500,
        unlocked: false,
        progress: 18,
        maxProgress: 100,
      },
    ];

    if (typeof window === 'undefined') return list;
    const raw = localStorage.getItem('km_achievements');
    return raw ? JSON.parse(raw) : list;
  },

  // ----------------- SETTINGS -----------------
  getSettings() {
    const defaults = {
      readerMode: 'webtoon' as 'webtoon' | 'single' | 'double',
      readingDirection: 'vertical' as 'ltr' | 'rtl' | 'vertical',
      theme: 'dark' as 'dark' | 'oled' | 'sepia' | 'light',
      eInkMode: false,
      olderDeviceMode: false, // Low power / reduced animations for budget devices
      autoScrollSpeed: 0, // 0 = off, 1 = slow, 2 = medium, 3 = fast
      ambientBacklight: true,
      soundEffects: true,
      pageGap: 8, // px
      safeSearchEnabled: true,
      imageQuality: 'high' as 'high' | 'medium' | 'data_saver',
      zoomLevel: 100, // 50% - 200%
      readingLanguage: 'en', // 'en' | 'es' | 'fr' | 'ko' | 'ja' | 'pt-br' | 'id' | 'de' | 'ru'
      showAdvertisement: true, // Display small sponsor window
    };

    if (typeof window === 'undefined') return defaults;
    const raw = localStorage.getItem('km_settings');
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  },

  saveSettings(settings: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('km_settings', JSON.stringify(settings));
  },
};
