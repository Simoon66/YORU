import React from 'react';
import { Button } from '../ui/Button';
import { Compass, Gift, Play } from 'lucide-react';

export const WatchlistEmptyIllustration: React.FC<{ onBrowseClick?: () => void }> = ({ onBrowseClick }) => (
  <div className="text-center py-12 px-4 bg-[#0A0B0E] border border-white/10 rounded-3xl space-y-4">
    <svg className="w-28 h-28 sm:w-36 sm:h-36 mx-auto drop-shadow-[0_0_25px_rgba(236,72,153,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899"/>
          <stop offset="50%" stopColor="#f43f5e"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="wl-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="165" rx="60" ry="14" fill="rgba(244,63,94,0.12)"/>
      <rect x="52" y="65" width="96" height="85" rx="10" fill="#12141C" stroke="url(#wl-grad)" strokeWidth="3"/>
      <path d="M52 140 C75 132, 125 132, 148 140" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
      <path d="M52 75 C75 67, 125 67, 148 75" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
      <line x1="100" y1="67" x2="100" y2="148" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3 3"/>
      <rect x="62" y="85" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="62" y="93" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="62" y="101" width="25" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="110" y="85" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="110" y="93" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="110" y="101" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <path d="M120 50 V115 L132 103 L144 115 V50 Z" fill="url(#wl-gold)"/>
      <circle cx="132" cy="70" r="4.5" fill="#ffffff"/>
      <path d="M132 64 L133.5 68.5 L138 70 L133.5 71.5 L132 76 L130.5 71.5 L126 70 L130.5 68.5 Z" fill="#f59e0b"/>
      <path d="M55 42 L57.5 48.5 L64 51 L57.5 53.5 L55 60 L52.5 53.5 L46 51 L52.5 48.5 Z" fill="#ec4899"/>
      <circle cx="160" cy="55" r="3.5" fill="#f43f5e"/>
      <circle cx="40" cy="110" r="2.5" fill="#8b5cf6"/>
      <path d="M152 125 L154 129 L158 131 L154 133 L152 137 L150 133 L146 131 L150 129 Z" fill="#fde047"/>
    </svg>
    <div className="space-y-1 max-w-sm mx-auto">
      <h4 className="text-base font-black text-white uppercase tracking-wider">Your Watchlist is Empty</h4>
      <p className="text-xs text-yoru-text-muted">
        Save anime series you want to watch later by clicking the bookmark button on any anime detail page.
      </p>
    </div>
    {onBrowseClick && (
      <Button onClick={onBrowseClick} size="sm" className="font-bold text-xs gap-1.5 px-5 mt-2">
        <Compass className="w-3.5 h-3.5" /> Explore Anime
      </Button>
    )}
  </div>
);

export const CollectionEmptyIllustration: React.FC<{ onClaimClick?: () => void }> = ({ onClaimClick }) => (
  <div className="text-center py-12 px-4 bg-[#0A0B0E] border border-white/10 rounded-3xl space-y-4">
    <svg className="w-28 h-28 sm:w-36 sm:h-36 mx-auto drop-shadow-[0_0_25px_rgba(244,63,94,0.3)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="col-chest" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e"/>
          <stop offset="50%" stopColor="#fb7185"/>
          <stop offset="100%" stopColor="#e11d48"/>
        </linearGradient>
        <linearGradient id="col-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="165" rx="60" ry="14" fill="rgba(244,63,94,0.15)"/>
      <path d="M48 95 C48 72, 152 72, 152 95 L146 150 C146 156, 54 156, 54 150 Z" fill="#14111E" stroke="url(#col-chest)" strokeWidth="3"/>
      <path d="M44 95 C44 68, 156 68, 156 95 L150 102 C150 102, 50 102, 50 102 Z" fill="url(#col-chest)" opacity="0.4"/>
      <path d="M72 74 V152" stroke="url(#col-gold)" strokeWidth="3"/>
      <path d="M128 74 V152" stroke="url(#col-gold)" strokeWidth="3"/>
      <rect x="90" y="92" width="20" height="24" rx="5" fill="url(#col-gold)"/>
      <circle cx="100" cy="101" r="3" fill="#241020"/>
      <path d="M100 104 V110" stroke="#241020" strokeWidth="2" strokeLinecap="round"/>
      <path d="M100 38 L103.5 47 L112 50 L103.5 53 L100 62 L96.5 53 L88 50 L96.5 47 Z" fill="#f43f5e"/>
      <circle cx="152" cy="78" r="3.5" fill="#fde047"/>
      <path d="M156 74 L158 79 L163 81 L158 83 L156 88 L154 83 L149 81 L154 79 Z" fill="#fbbf24"/>
      <circle cx="44" cy="82" r="2.5" fill="#ec4899"/>
      <path d="M100 28 V18 M84 34 L74 24 M116 34 L126 24" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7"/>
    </svg>
    <div className="space-y-1 max-w-sm mx-auto">
      <h4 className="text-base font-black text-white uppercase tracking-wider">No Special Avatars Claimed</h4>
      <p className="text-xs text-yoru-text-muted">
        Participate in limited season events to unlock permanent mythic avatars with exclusive battle auras and lore cards.
      </p>
    </div>
    {onClaimClick && (
      <Button
        onClick={onClaimClick}
        size="sm"
        className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs gap-1.5 px-5 mt-2 shadow-lg shadow-rose-600/25"
      >
        <Gift className="w-3.5 h-3.5" /> Claim S1 Event Rewards
      </Button>
    )}
  </div>
);

export const HistoryEmptyIllustration: React.FC<{ onBrowseClick?: () => void }> = ({ onBrowseClick }) => (
  <div className="text-center py-12 px-4 bg-[#0A0B0E] border border-white/10 rounded-3xl space-y-4">
    <svg className="w-28 h-28 sm:w-36 sm:h-36 mx-auto drop-shadow-[0_0_25px_rgba(56,189,248,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#818cf8"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="160" rx="58" ry="14" fill="rgba(56,189,248,0.12)"/>
      <circle cx="100" cy="95" r="48" fill="#12141C" stroke="url(#hist-grad)" strokeWidth="3"/>
      <circle cx="100" cy="95" r="38" fill="#181A26" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
      <circle cx="100" cy="95" r="15" fill="url(#hist-grad)"/>
      <circle cx="100" cy="71" r="6" fill="#12141C"/>
      <circle cx="100" cy="119" r="6" fill="#12141C"/>
      <circle cx="76" cy="95" r="6" fill="#12141C"/>
      <circle cx="124" cy="95" r="6" fill="#12141C"/>
      <path d="M136 116 C152 126, 162 148, 146 158" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round"/>
      <path d="M100 95 L100 87 M100 95 L107 98" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="46" cy="62" r="3" fill="#38bdf8"/>
      <path d="M154 58 L155.5 63 L160.5 64.5 L155.5 66 L154 71 L152.5 66 L147.5 64.5 L152.5 63 Z" fill="#38bdf8"/>
    </svg>
    <div className="space-y-1 max-w-sm mx-auto">
      <h4 className="text-base font-black text-white uppercase tracking-wider">No Watch History Yet</h4>
      <p className="text-xs text-yoru-text-muted">
        Start streaming any anime series or movie to log your watched episodes and accumulate watch time.
      </p>
    </div>
    {onBrowseClick && (
      <Button onClick={onBrowseClick} size="sm" className="font-bold text-xs gap-1.5 px-5 mt-2">
        <Play className="w-3.5 h-3.5" /> Start Streaming
      </Button>
    )}
  </div>
);
