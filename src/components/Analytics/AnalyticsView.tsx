import React, { useState } from 'react';
import {
  Flame,
  Clock,
  BookOpen,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { StorageService } from '../../services/storage';

export const AnalyticsView: React.FC = () => {
  const analytics = StorageService.getAnalytics();
  const profile = StorageService.getUserProfile();
  const achievements = StorageService.getAchievements();

  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(25);
  const todayMinutes = analytics.weeklyMinutes[new Date().getDay()] || 18;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxWeeklyMinute = Math.max(...analytics.weeklyMinutes, 45);

  const getRankTitle = (lvl: number) => {
    if (lvl >= 10) return 'Shadow Monarch (S-Rank)';
    if (lvl >= 7) return 'Tower Floor Master';
    if (lvl >= 4) return 'Elite Hunter (A-Rank)';
    if (lvl >= 2) return 'Avid Manga Scholar';
    return 'Awakened Novice (E-Rank)';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Reading Analytics & Gamification</h1>
          <p className="text-xs text-slate-400">
            Real-time reading metrics, streak tracking, and unlockable rank achievements
          </p>
        </div>

        {/* Level Badge */}
        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
            Lv.{profile.level}
          </div>
          <div>
            <span className="text-xs font-semibold text-white block">
              {getRankTitle(profile.level)}
            </span>
            <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{ width: `${(profile.xp % 500) / 5}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {profile.xp % 500} / 500 XP to next rank
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Daily Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{analytics.dailyStreak} Days</p>
          <p className="text-[11px] text-slate-400">Best: {analytics.longestStreak} days continuous</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Chapters Read</span>
            <BookOpen className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{analytics.totalChaptersRead}</p>
          <p className="text-[11px] text-slate-400">Across Manga & Manhwa</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Reading Time</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {Math.floor(analytics.totalMinutesRead / 60)}h {analytics.totalMinutesRead % 60}m
          </p>
          <p className="text-[11px] text-slate-400">Tracked in real time</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Daily Goal</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{goalPercent}%</p>
          <p className="text-[11px] text-slate-400">
            {todayMinutes} / {dailyGoalMinutes} mins read today
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart (2 columns) */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Weekly Reading Heatmap</h2>
              <p className="text-xs text-slate-400">Minutes spent reading per day</p>
            </div>
            <span className="text-xs font-mono text-rose-400 font-medium">
              {analytics.weeklyMinutes.reduce((a, b) => a + b, 0)} Total Mins
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {analytics.weeklyMinutes.map((mins, idx) => {
              const heightPercent = Math.max(12, Math.round((mins / maxWeeklyMinute) * 100));
              const isToday = idx === new Date().getDay();
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400">{mins}m</span>
                  <div className="w-full max-w-[36px] bg-slate-800 rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isToday ? 'text-rose-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {daysOfWeek[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Genre Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white">Genre Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(analytics.genreStats).map(([genre, count]) => {
              const percent = Math.round((count / 65) * 100);
              return (
                <div key={genre} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{genre}</span>
                    <span className="text-slate-500 font-mono">{count} chapters</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gamified Achievements (Feature 11) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Gamified Achievements</span>
            </h2>
            <p className="text-xs text-slate-400">Unlock trophies and gain reader rank XP</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all ${
                ach.unlocked
                  ? 'bg-slate-900/90 border-amber-500/30 shadow-lg'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    ach.unlocked ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  +{ach.xpReward} XP
                </span>
                {ach.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white">{ach.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
