import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Flame,
  Clock,
  Film,
  Sparkles,
  Crown,
  QrCode,
  Smartphone,
  Send,
  MessageCircle,
  Twitter
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  photoURL: string;
  watchedCount: number;
  watchHours: string;
  isEventClaimed: boolean;
  isAdmin: boolean;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  displayName,
  photoURL,
  watchedCount,
  watchHours,
  isEventClaimed,
  isAdmin
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/profile?u=${userId}`;
  const shareText = `Check out ${displayName || 'my'}'s anime profile & special collection on Yoru Anime!`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName || 'Anime Fan'} - Yoru Profile`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Social share URLs
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

  // QR Code generator using reliable public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=0E1018&color=FFFFFF&margin=10`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-[#0E1018] border border-white/15 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-5 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yoru-accent/20 border border-yoru-accent/40 flex items-center justify-center text-yoru-accent">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Share Anime Profile
                </h3>
                <p className="text-xs text-yoru-text-muted">
                  Showcase your anime watch stats & collections
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#151722] to-[#0A0B0E] p-4 shadow-inner">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-yoru-accent/50 shrink-0 bg-black/60 shadow-lg">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                {isAdmin ? (
                  <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-black rounded-tl font-black">
                    <Crown className="w-3 h-3" />
                  </div>
                ) : isEventClaimed ? (
                  <div className="absolute bottom-0 right-0 p-0.5 bg-rose-500 text-white rounded-tl font-black">
                    <Flame className="w-3 h-3" />
                  </div>
                ) : null}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm sm:text-base font-black text-white truncate">
                    {displayName || 'Anime Fan'}
                  </h4>
                  {isEventClaimed && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                      S1 Pioneer
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-white/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-white font-bold">{watchHours}</strong> Watch Time
                  </span>
                  <span className="flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-yoru-accent" />
                    <strong className="text-white font-bold">{watchedCount}</strong> Episodes
                  </span>
                </div>
              </div>
            </div>

            {isEventClaimed && (
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-rose-300/80 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> [Luffy & Zoro Special S1]
                </span>
                <span className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  2 Mythic Items
                </span>
              </div>
            )}
          </div>

          {/* Copy Link Input Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center justify-between">
              <span>Public Profile Link</span>
              <span className="text-[10px] font-normal text-emerald-400">Shareable with anyone</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/90 font-mono focus:outline-none focus:border-yoru-accent select-all truncate"
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 px-4 py-2.5 text-xs font-bold gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-yoru-accent text-[#030407]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* QR Code Section Toggle */}
          {showQr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center space-y-2"
            >
              <div className="p-2 rounded-xl bg-[#0E1018] border border-white/20 shadow-xl">
                <img
                  src={qrCodeUrl}
                  alt="Profile QR Code"
                  className="w-36 h-36 rounded-lg"
                />
              </div>
              <span className="text-[11px] text-yoru-text-muted font-medium">
                Scan with phone camera to view profile
              </span>
            </motion.div>
          )}

          {/* Social Quick Share & Mobile Actions */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 flex items-center justify-center transition-colors"
                title="Share on Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 flex items-center justify-center transition-colors"
                title="Share on X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showQr
                    ? 'bg-yoru-accent/20 border-yoru-accent text-yoru-accent'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Show QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
            </div>

            {/* Mobile Native Share Trigger if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleNativeShare}
                className="text-xs font-bold gap-1.5 border-white/10"
              >
                <Smartphone className="w-3.5 h-3.5" /> More Share Options
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
