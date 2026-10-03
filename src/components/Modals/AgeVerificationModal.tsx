import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ isOpen, onClose, onVerified }) => {
  const [birthYear, setBirthYear] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1920 || year > currentYear) {
      setError('Please enter a valid four-digit birth year.');
      return;
    }

    const age = currentYear - year;
    if (age < 18) {
      setError('You must be 18 years of age or older to disable Safe-Search.');
      return;
    }

    if (!agreed) {
      setError('Please acknowledge and agree to the content guidelines.');
      return;
    }

    const profile = StorageService.getUserProfile();
    profile.isAgeVerified = true;
    StorageService.saveUserProfile(profile);

    const settings = StorageService.getSettings();
    settings.safeSearchEnabled = false;
    StorageService.saveSettings(settings);

    onVerified();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e1424] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f1b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">Age Verification Required</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            By default, <strong className="text-white">Rift</strong> enforces strict <strong className="text-emerald-400">Safe-Search</strong> filtering out mature and suggestive content. To view uncensored or 18+ titles, international digital compliance laws require verification of your age.
          </p>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Enter your birth year</label>
            <input
              type="number"
              placeholder="e.g. 2002"
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setError(null);
              }}
              className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900"
            />
            <span className="text-xs text-slate-300 leading-snug">
              I certify under penalty of law that I am at least 18 years of age and consent to viewing uncensored fictional illustrations.
            </span>
          </label>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Keep Safe-Search On
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify & Unlock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
