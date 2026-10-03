import React, { useState } from 'react';
import { Settings, Eye, Sliders, Volume2, Sparkles, Cpu, Mail, X, Check, ZoomIn, ZoomOut, Globe, Megaphone } from 'lucide-react';
import { StorageService } from '../../services/storage';

const SETTINGS_LANGUAGES = [
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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenAgeVerification: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenFeedback,
  onOpenAgeVerification,
}) => {
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [activeTab, setActiveTab] = useState<'reader' | 'ui' | 'system'>('reader');

  if (!isOpen) return null;

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    StorageService.saveSettings(updated);

    // Apply immediate DOM classes if applicable
    if (key === 'olderDeviceMode') {
      if (value) {
        document.documentElement.classList.add('low-power-mode');
      } else {
        document.documentElement.classList.remove('low-power-mode');
      }
    }
    if (key === 'eInkMode') {
      if (value) {
        document.documentElement.classList.add('e-ink-mode');
      } else {
        document.documentElement.classList.remove('e-ink-mode');
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('km_settings_updated', { detail: updated }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f1b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">App & Reader Settings</h2>
              <p className="text-xs text-slate-400">Configure reading engine, visual themes, and performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('reader')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'reader' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reading Interface
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ui')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'ui' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Themes & Display
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'system' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Device & Security
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'reader' && (
            <div className="space-y-5">
              {/* Reader Mode */}
              <div>
                <label className="block text-xs font-semibold text-white mb-2">Default Reader Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'webtoon', label: 'Continuous Strip', desc: 'Vertical webtoon' },
                    { id: 'single', label: 'Single Page', desc: 'Classic manga' },
                    { id: 'double', label: 'Double Page', desc: 'Spread view' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateSetting('readerMode', mode.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.readerMode === mode.id
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-medium text-white">{mode.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Direction */}
              <div>
                <label className="block text-xs font-semibold text-white mb-2">Page Turn Direction</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vertical', label: 'Top to Bottom', desc: 'Scroll' },
                    { id: 'rtl', label: 'Right to Left', desc: 'Manga (JP)' },
                    { id: 'ltr', label: 'Left to Right', desc: 'Manhwa / West' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => updateSetting('readingDirection', dir.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.readingDirection === dir.id
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-medium text-white">{dir.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{dir.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Spacing */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white">Webtoon Page Gap</label>
                  <span className="text-xs font-mono text-slate-400">{settings.pageGap}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="4"
                  value={settings.pageGap}
                  onChange={(e) => updateSetting('pageGap', parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Ambient backlight */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    Ambient Page Backlight
                  </h4>
                  <p className="text-[11px] text-slate-400">Subtle glow matching the manga panel colors</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ambientBacklight}
                  onChange={(e) => updateSetting('ambientBacklight', e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Page Zoom & Viewport Scale Feature */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
                      Page Zoom & Viewport Scale
                    </h4>
                    <p className="text-[11px] text-slate-400">Scale manhwa panels to fit your screen size</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 font-mono text-xs text-rose-400 font-bold">
                    <span>{settings.zoomLevel || 100}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('zoomLevel', Math.max(50, (settings.zoomLevel || 100) - 10))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={settings.zoomLevel || 100}
                    onChange={(e) => updateSetting('zoomLevel', parseInt(e.target.value, 10))}
                    className="flex-1 accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateSetting('zoomLevel', Math.min(200, (settings.zoomLevel || 100) + 10))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                  {[75, 100, 125, 150].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateSetting('zoomLevel', preset)}
                      className={`px-2.5 py-1 rounded-lg border transition-colors ${
                        (settings.zoomLevel || 100) === preset
                          ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset}% {preset === 100 ? '(Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manhwa Translation Language Selector Feature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Manhwa Reading Language
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                    {SETTINGS_LANGUAGES.find((l) => l.code === (settings.readingLanguage || 'en'))?.flag}{' '}
                    {(settings.readingLanguage || 'en').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SETTINGS_LANGUAGES.map((lang) => {
                    const isSelected = (settings.readingLanguage || 'en') === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => updateSetting('readingLanguage', lang.code)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-950/20 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-medium text-white flex items-center gap-1.5">
                            <span>{lang.flag}</span>
                            <span className="truncate">{lang.label}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{lang.code}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Page flip sound */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    Haptic & Page Turn Audio
                  </h4>
                  <p className="text-[11px] text-slate-400">Tactile page-turn sound cues</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-5">
              {/* Color Themes */}
              <div>
                <label className="block text-xs font-semibold text-white mb-2">Color Atmosphere</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dark', label: 'Midnight Slate', hex: '#0f172a' },
                    { id: 'oled', label: 'OLED Pure Black', hex: '#000000' },
                    { id: 'sepia', label: 'Warm Sepia', hex: '#fbf0d9' },
                    { id: 'light', label: 'Paper White', hex: '#ffffff' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateSetting('theme', theme.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                        settings.theme === theme.id
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-slate-600 shadow-sm"
                        style={{ backgroundColor: theme.hex }}
                      />
                      <span className="text-xs font-medium text-white">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safe-Search toggle */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Safe-Search Protection</h4>
                    <p className="text-[11px] text-slate-400">Filters 18+, suggestive, or adult content</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      settings.safeSearchEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {settings.safeSearchEnabled ? 'ENABLED (Safe)' : 'UNLOCKED (18+)'}
                  </span>
                </div>
                {settings.safeSearchEnabled ? (
                  <button
                    type="button"
                    onClick={onOpenAgeVerification}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Request 18+ Age Verification to Unlock →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateSetting('safeSearchEnabled', true)}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Re-enable Safe-Search Protection
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-5">
              {/* Older Device / Low Power Mode (Feature 18) */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-white">Legacy & Older Device Mode</h4>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.olderDeviceMode}
                    onChange={(e) => updateSetting('olderDeviceMode', e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Optimizes execution for older smartphones, budget tablets, and low-spec hardware by disabling GPU backdrop filters, heavy animations, and reducing memory footprint.
                </p>
              </div>

              {/* Cloud Sync & Reading History */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Cross-Device Cloud Sync</h4>
                    <p className="text-[11px] text-slate-400">Continuous background backup to Firebase</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>

              {/* Small Advertisement Window Toggle Feature */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold text-white">Sponsored Partner Window</h4>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showAdvertisement !== false}
                    onChange={(e) => updateSetting('showAdvertisement', e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Display subtle manga & manhwa sponsor offers (figures, Crunchyroll passes, Webtoon coins) in the corner window to support free reader development.
                </p>
              </div>

              {/* Feedback and Email Support trigger */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    Engineering & User Feedback
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">fahadjaved786007@gmail.com</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
