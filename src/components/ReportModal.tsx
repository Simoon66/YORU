import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  episodeNumber: number;
  animeId: string;
  seasonId?: string;
  episodeId: string;
}

const REPORT_REASONS = [
  'Broken / Not Playing',
  'Buffering / Loading Issue',
  'Wrong Episode',
  'Audio Problem',
  'Subtitle Problem',
  'Video Quality Problem',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  animeTitle,
  episodeNumber,
  animeId,
  seasonId,
  episodeId,
}) => {
  const { user } = useAuth();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedReasons.length === 0 && !additionalDetails.trim()) {
      setError("Please select a reason or provide additional details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reports'), {
        animeId,
        animeTitle,
        episodeId,
        episodeNumber,
        seasonId: seasonId || 's1',
        userId: user.uid,
        userEmail: user.email,
        reasons: selectedReasons,
        details: additionalDetails.trim(),
        status: 'pending',
        createdAt: Date.now(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setIsSuccess(false);
          setSelectedReasons([]);
          setAdditionalDetails('');
        }, 500);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report", err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Flag className="w-4 h-4 text-yoru-accent" />
                Report Playback Issue
              </div>
              <button
                onClick={onClose}
                className="text-yoru-text-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-5 overflow-y-auto scrollbar-thin">
              <div className="mb-5 p-3 rounded-lg bg-white/5 border border-white/5">
                <p className="text-xs text-yoru-text-muted mb-1 uppercase tracking-wider font-semibold">Reporting for</p>
                <p className="text-sm text-white font-bold leading-snug">
                  {animeTitle} — Episode {episodeNumber}
                </p>
              </div>

              {!user ? (
                <div className="text-center py-8 space-y-3">
                  <AlertCircle className="w-10 h-10 text-yoru-warning mx-auto opacity-80" />
                  <p className="text-sm font-semibold text-white">Login Required</p>
                  <p className="text-xs text-yoru-text-muted max-w-[250px] mx-auto">
                    You must be logged in to submit reports. Please sign in to continue.
                  </p>
                </div>
              ) : isSuccess ? (
                <div className="text-center py-10 space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-2"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-bold text-white">Report Submitted</p>
                  <p className="text-xs text-yoru-text-muted max-w-[280px] mx-auto">
                    Thank you for letting us know. Our team will review this issue shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-yoru-text-muted uppercase tracking-wider">
                      Select all that apply
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REPORT_REASONS.map(reason => {
                        const isSelected = selectedReasons.includes(reason);
                        return (
                          <label
                            key={reason}
                            className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-yoru-accent/10 border-yoru-accent/50 text-white'
                                : 'bg-white/5 border-white/5 text-yoru-text-muted hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isSelected}
                              onChange={() => handleToggleReason(reason)}
                            />
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-yoru-accent border-yoru-accent text-[#030407]' : 'border-white/20 bg-black/20'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-medium leading-tight select-none">{reason}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-yoru-text-muted uppercase tracking-wider flex justify-between">
                      <span>Other / Additional Details</span>
                      <span className="text-[10px] opacity-50 font-normal normal-case">Optional</span>
                    </label>
                    <textarea
                      value={additionalDetails}
                      onChange={e => setAdditionalDetails(e.target.value)}
                      placeholder="Please provide any other relevant details..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Submit Report</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
