import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navigation/Navbar';
import { MobileNav } from './components/Navigation/MobileNav';
import { OfflineBanner } from './components/Navigation/OfflineBanner';
import { Footer } from './components/Footer/Footer';
import { HomeView } from './components/Home/HomeView';
import { BrowseView } from './components/Browse/BrowseView';
import { LibraryView } from './components/Library/LibraryView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { ComicDetailView } from './components/ComicDetail/ComicDetailView';
import { MangaReader } from './components/Reader/MangaReader';
import { AuthModal } from './components/Modals/AuthModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { FeedbackModal } from './components/Modals/FeedbackModal';
import { EReaderSyncModal } from './components/Modals/EReaderSyncModal';
import { AgeVerificationModal } from './components/Modals/AgeVerificationModal';
import { AdBannerWindow } from './components/Advertisement/AdBannerWindow';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import { FirebaseSyncService } from './services/firebaseSync';
import { MangaItem, ChapterItem, UserProfile } from './types/manga';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'library' | 'analytics' | 'comic-detail' | 'reader'>('home');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Active reading state
  const [readingComic, setReadingComic] = useState<MangaItem | null>(null);
  const [readingChapter, setReadingChapter] = useState<ChapterItem | null>(null);
  const [allComicChapters, setAllComicChapters] = useState<ChapterItem[]>([]);

  // Modals
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [eReaderOpen, setEReaderOpen] = useState(false);
  const [ageVerificationOpen, setAgeVerificationOpen] = useState(false);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>(StorageService.getUserProfile());
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isEInkActive, setIsEInkActive] = useState<boolean>(false);
  const [showAd, setShowAd] = useState<boolean>(() => StorageService.getSettings().showAdvertisement !== false);

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail && e.detail.showAdvertisement !== undefined) {
        setShowAd(e.detail.showAdvertisement);
      }
    };
    window.addEventListener('km_settings_updated', handleSettingsUpdated);

    const updateOffline = async () => {
      const list = await StorageService.getAllOfflineChapters();
      setOfflineCount(list.length);
    };
    updateOffline();

    const settings = StorageService.getSettings();
    if (settings.eInkMode) {
      setIsEInkActive(true);
      document.documentElement.classList.add('e-ink-mode');
    }
    if (settings.olderDeviceMode) {
      document.documentElement.classList.add('low-power-mode');
    }

    // Initialize Firebase Realtime Auth & Cloud Sync
    const unsubscribe = FirebaseSyncService.initAuthSync(
      (fbUser) => {
        if (fbUser) {
          const profile: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Manga Reader',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            provider: 'google',
            syncCode: `RIFT-${fbUser.uid.slice(0, 4).toUpperCase()}`,
            joinedAt: new Date().toISOString(),
            level: 2,
            xp: 350,
            isAgeVerified: true,
          };
          setUserProfile(profile);
          StorageService.saveUserProfile(profile);
        }
      },
      () => {
        // Updated from cloud Firestore
      }
    );

    return () => {
      unsubscribe();
      window.removeEventListener('km_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const handleToggleEInk = (enabled: boolean) => {
    setIsEInkActive(enabled);
    const settings = StorageService.getSettings();
    settings.eInkMode = enabled;
    StorageService.saveSettings(settings);
    if (enabled) {
      document.documentElement.classList.add('e-ink-mode');
    } else {
      document.documentElement.classList.remove('e-ink-mode');
    }
  };

  const handleSelectComic = (slug: string) => {
    setSelectedSlug(slug);
    setCurrentView('comic-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartReading = async (comic: MangaItem, chapter: ChapterItem) => {
    setReadingComic(comic);
    setReadingChapter(chapter);

    // Fetch full chapters if not already loaded
    try {
      const data = await ApiService.getComicChapters(comic.hid || comic.slug, 1, 100);
      setAllComicChapters(data.chapters || [chapter]);
    } catch {
      setAllComicChapters([chapter]);
    }

    setCurrentView('reader');
  };

  const handleExitReader = () => {
    if (selectedSlug) {
      setCurrentView('comic-detail');
    } else {
      setCurrentView('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Offline Status Toast */}
      <OfflineBanner />

      {/* Render Main App or Fullscreen Reader */}
      {currentView === 'reader' && readingComic && readingChapter ? (
        <MangaReader
          comic={readingComic}
          chapter={readingChapter}
          allChapters={allComicChapters}
          onSelectChapter={(chap) => setReadingChapter(chap)}
          onExit={handleExitReader}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <>
          {/* Top Bar Navigation */}
          <Navbar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            userProfile={userProfile}
            onOpenAuth={() => setAuthOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenEReader={() => setEReaderOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
            onQuickSearch={() => {
              setCurrentView('browse');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            offlineCount={offlineCount}
          />

          {/* Main Content Router */}
          <main className="flex-1 pb-16 md:pb-0">
            {currentView === 'home' && (
              <HomeView
                onSelectComic={handleSelectComic}
                onBrowse={() => setCurrentView('browse')}
                onOpenEReader={() => setEReaderOpen(true)}
                onOpenAuth={() => setAuthOpen(true)}
              />
            )}

            {currentView === 'browse' && (
              <BrowseView
                onSelectComic={handleSelectComic}
                onOpenAgeVerification={() => setAgeVerificationOpen(true)}
              />
            )}

            {currentView === 'library' && (
              <LibraryView
                onSelectComic={handleSelectComic}
                onStartReading={handleStartReading}
                onBrowse={() => setCurrentView('browse')}
              />
            )}

            {currentView === 'analytics' && <AnalyticsView />}

            {currentView === 'comic-detail' && selectedSlug && (
              <ComicDetailView
                slug={selectedSlug}
                onBack={() => setCurrentView('home')}
                onStartReading={handleStartReading}
                onSelectComic={handleSelectComic}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <MobileNav
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            offlineCount={offlineCount}
          />

          {/* Site Footer with Trademark, Copyright, and Monitored Email */}
          <Footer
            onOpenFeedback={() => setFeedbackOpen(true)}
            onOpenEReader={() => setEReaderOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </>
      )}

      {/* Interactive Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onProfileUpdate={(p) => setUserProfile(p)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenFeedback={() => {
          setSettingsOpen(false);
          setFeedbackOpen(true);
        }}
        onOpenAgeVerification={() => {
          setSettingsOpen(false);
          setAgeVerificationOpen(true);
        }}
      />

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      <EReaderSyncModal
        isOpen={eReaderOpen}
        onClose={() => setEReaderOpen(false)}
        onToggleEInk={handleToggleEInk}
        isEInkActive={isEInkActive}
      />

      <AgeVerificationModal
        isOpen={ageVerificationOpen}
        onClose={() => setAgeVerificationOpen(false)}
        onVerified={() => {}}
      />

      {/* Small Advertisement / Sponsor Window Feature */}
      <AdBannerWindow isVisible={showAd} />
    </div>
  );
}
