import React from 'react';
import { Compass, Search, BookMarked, BarChart2 } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  offlineCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, offlineCount }) => {
  const tabs = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'browse', label: 'Browse', icon: Search },
    { id: 'library', label: 'Library', icon: BookMarked, badge: offlineCount > 0 ? offlineCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800/80 px-2 pb-safe">
      <div className="grid grid-cols-4 items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="relative min-h-[44px] flex flex-col items-center justify-center text-center transition-colors active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-rose-500' : 'text-slate-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-mono font-bold bg-emerald-500 text-black px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 ${
                  isActive ? 'text-rose-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
