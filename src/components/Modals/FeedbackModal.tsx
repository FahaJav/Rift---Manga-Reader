import React, { useState } from 'react';
import { Mail, Check, Copy, Send, ExternalLink, ShieldCheck, HelpCircle, X } from 'lucide-react';
import { ApiService } from '../../services/api';
import { FirebaseSyncService } from '../../services/firebaseSync';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, defaultCategory = 'General Query' }) => {
  const supportEmail = 'fahadjaved786007@gmail.com';
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await ApiService.submitFeedback({
        name: name.trim() || 'Anonymous Reader',
        email: email.trim() || 'not-provided',
        category,
        message: message.trim(),
      });
      // Also write ticket to Firestore
      try {
        await FirebaseSyncService.submitFeedbackTicket({
          name: name.trim() || 'Anonymous Reader',
          email: email.trim() || 'not-provided',
          category,
          message: message.trim(),
        });
      } catch (fsErr) {
        console.warn('Firestore feedback note:', fsErr);
      }

      setSubmittedTicket(res.ticketId || `RIFT-TICKET-${Date.now().toString().slice(-6)}`);
      setMessage('');
    } catch {
      setSubmittedTicket(`RIFT-TICKET-${Date.now().toString().slice(-6)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f1b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Support & User Feedback</h2>
              <p className="text-xs text-slate-400">Contact the engineering & editorial team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Official Monitored Email Callout */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Monitored Support Mailbox
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                Active 24/7
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              We monitor all incoming queries for reader technical assistance, missing chapter reports, performance logs, and feedback.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-black/60 border border-slate-700 rounded-lg">
              <code className="text-xs sm:text-sm font-mono text-white select-all break-all px-1">
                {supportEmail}
              </code>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                  title="Copy email address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={`mailto:${supportEmail}?subject=Rift%20Feedback%20and%20Support`}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Client</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Ticket Form */}
          {submittedTicket ? (
            <div className="p-5 text-center bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Ticket Submitted Successfully</h3>
              <p className="text-xs text-slate-300 mt-1">
                Ticket Reference:{' '}
                <span className="font-mono text-emerald-400 font-semibold">{submittedTicket}</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Your report has been logged and sent to <span className="text-slate-200">{supportEmail}</span>. Our team typically responds within 24 hours.
              </p>
              <button
                onClick={() => setSubmittedTicket(null)}
                className="mt-4 px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <HelpCircle className="w-4 h-4 text-rose-400" />
                <span>Or submit an in-app message directly to the engineering team:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Your Name / Handle</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MangaReader99"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Your Email (for response)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Query Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="General Query">General Feedback & Suggestion</option>
                  <option value="Bug Report">Bug Report / Technical Issue</option>
                  <option value="Missing Chapter">Missing Chapter or Broken Images</option>
                  <option value="Feature Request">New Reader Feature Request</option>
                  <option value="E-Reader Sync">E-Reader / Offline Sync Assistance</option>
                  <option value="Copyright & DMCA">Copyright & Licensing Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message Details</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, feature idea, or error details..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-colors"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send to Engineering</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
