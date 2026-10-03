import React, { useState } from 'react';
import { Tablet, Copy, Check, QrCode, BookOpen, X, Monitor } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface EReaderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleEInk: (enabled: boolean) => void;
  isEInkActive: boolean;
}

export const EReaderSyncModal: React.FC<EReaderSyncModalProps> = ({
  isOpen,
  onClose,
  onToggleEInk,
  isEInkActive,
}) => {
  const profile = StorageService.getUserProfile();
  const [copied, setCopied] = useState(false);
  const syncCode = profile.syncCode || 'KM-8821';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReadingList = () => {
    const library = StorageService.getLibrary();
    const progress = StorageService.getReadingProgress();
    const exportData = {
      app: 'Rift Reader',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      syncCode,
      library,
      progress,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift-ereader-sync-${syncCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f1b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Tablet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">E-Reader & E-Ink Device Sync</h2>
              <p className="text-xs text-slate-400">Pair Kindle, Kobo, Onyx Boox, or Remarkable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* E-Ink High Contrast Toggle */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                E-Ink High-Contrast Monochrome Mode
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Disables transitions, increases contrast, and converts UI to pure monochrome for electronic ink displays.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleEInk(!isEInkActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEInkActive ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isEInkActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sync Code Box */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Your Universal Sync Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-white tracking-widest bg-black/60 px-5 py-2 rounded-xl border border-slate-700">
                {syncCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                title="Copy Sync Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Open Rift in your e-reader's experimental browser or companion app, tap "Pair Device", and enter this 6-digit code.
            </p>
          </div>

          {/* Step by step for E-Readers */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">How to sync with your hardware e-reader:</h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">1.</span>
                <span>On your Kindle/Kobo/Boox, navigate to the web browser and visit this app URL.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">2.</span>
                <span>Enable "E-Ink Mode" in settings for ghosting prevention and instantaneous page turns.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">3.</span>
                <span>Click "Pair Device" and enter code <strong className="text-white font-mono">{syncCode}</strong>. Your reading position restores automatically!</span>
              </p>
            </div>
          </div>

          {/* Export reading list */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleExportReadingList}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Export OPDS/JSON Manifest</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
