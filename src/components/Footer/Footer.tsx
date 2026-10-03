import React, { useState } from 'react';
import { Mail, ShieldCheck, Copy, Check, ExternalLink, Heart, Sparkles, Terminal } from 'lucide-react';

interface FooterProps {
  onOpenFeedback: () => void;
  onOpenEReader: () => void;
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenFeedback,
  onOpenEReader,
  onOpenSettings,
}) => {
  const supportEmail = 'fahadjaved786007@gmail.com';
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full bg-[#050811] border-t border-slate-800/80 text-slate-400 py-12 px-4 sm:px-6 mt-16 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              <span className="text-lg font-bold font-display text-white tracking-wide">
                Rift™
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                v2.4 LTS
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Rift is a next-generation cross-platform manga & manhwa reading environment engineered for ultra-fast page delivery, zero-loss offline chapter caching, e-reader synchronization, and reading analytics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>reCAPTCHA Bot Verification Active</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">Protected</span>
            </div>
          </div>

          {/* Contact Section: Monitored Support Mailbox */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              Feedback & Support
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have an issue, recommendation, or bug to report? The engineering mailbox is actively monitored.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-slate-200 select-all truncate">
                  {supportEmail}
                </code>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1 hover:text-white rounded transition-colors shrink-0"
                  title="Copy email address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={onOpenFeedback}
                className="w-full py-1 px-2.5 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Submit Feedback Ticket</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Ecosystem
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={onOpenEReader}
                  className="hover:text-slate-200 transition-colors"
                >
                  E-Reader & E-Ink Pairing
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSettings}
                  className="hover:text-slate-200 transition-colors"
                >
                  Reader Engine Settings
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}?subject=Rift%20Copyright%20Inquiry`}
                  className="hover:text-slate-200 transition-colors"
                >
                  Copyright & DMCA Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Trademark & Copyright Notice (Feature 16) */}
        <div className="pt-8 border-t border-slate-800/80 space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Trademark & Copyright Notice:</strong> © 2026 Rift Reader™ & Media Network. Rift™ is a trademark of the application platform. All manga, manhwa, comic titles, panel art, character depictions, and associated intellectual property belong exclusively to their respective copyright holders, authors, and authorized distributors (including Shueisha, Kodansha, Kakao Entertainment, Naver Webtoon, Kadokawa, and Square Enix). Rift provides non-commercial digital indexation and high-performance client viewing interfaces under fair use.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1">
              <span>Engineered with passion for manga and manhwa readers worldwide.</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Admin: {supportEmail}</span>
              <span aria-hidden="true">·</span>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
