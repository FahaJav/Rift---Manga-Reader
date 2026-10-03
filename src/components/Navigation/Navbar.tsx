import React from 'react';
import { Search, Tablet, Settings, ShieldCheck, Mail, User, Download } from 'lucide-react';
import { UserProfile } from '../../types/manga';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenEReader: () => void;
  onOpenFeedback: () => void;
  onQuickSearch: () => void;
  offlineCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  userProfile,
  onOpenAuth,
  onOpenSettings,
  onOpenEReader,
  onOpenFeedback,
  onQuickSearch,
  offlineCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
          <span className="font-display tracking-wider text-xl bg-gradient-to-r from-white via-cyan-200 to-rose-400 bg-clip-text text-transparent">
            Rift
          </span>
        </button>

        {/* Zone 2: 4–6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentView === 'home' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => onNavigate('browse')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentView === 'browse' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Browse & Search
          </button>
          <button
            onClick={() => onNavigate('library')}
            className={`transition-colors whitespace-nowrap hover:text-white flex items-center gap-1.5 ${
              currentView === 'library' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            <span>Library</span>
            {offlineCount > 0 && (
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                {offlineCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentView === 'analytics' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Analytics & Goals
          </button>
          <button
            onClick={onOpenEReader}
            className="transition-colors whitespace-nowrap hover:text-white flex items-center gap-1 text-slate-300"
          >
            <Tablet className="w-3.5 h-3.5 text-indigo-400" />
            <span>E-Reader Sync</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search */}
          <button
            onClick={onQuickSearch}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Search manga"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Contact / Monitored Support Mailbox */}
          <button
            onClick={onOpenFeedback}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
            title="Contact Support (fahadjaved786007@gmail.com)"
          >
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">Contact Support</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Profile / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1 pl-2 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
          >
            <span className="hidden sm:inline max-w-[90px] truncate text-slate-300">
              {userProfile.name}
            </span>
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full border border-rose-500/30 object-cover"
            />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Reader & App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
