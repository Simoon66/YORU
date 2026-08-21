import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Shield, CheckCircle2, Lock } from 'lucide-react';

interface SpecialAvatarTooltipProps {
  children: React.ReactNode;
  name: string;
  title: string;
  lore: string;
  rarity?: string;
  element?: string;
  eventName?: string;
  badge?: string;
  isUnlocked?: boolean;
  position?: 'top' | 'bottom' | 'right' | 'left' | 'auto';
  className?: string;
}

export const SpecialAvatarTooltip: React.FC<SpecialAvatarTooltipProps> = ({
  children,
  name,
  title,
  lore,
  rarity = 'Mythic Event S1',
  element = 'Solar Freedom',
  eventName = 'Luffy & Zoro Special S1',
  badge = 'SPECIAL S1',
  isUnlocked = false,
  position = 'top',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2.5 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2.5 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2.5 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2.5 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: position === 'bottom' ? -6 : 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'bottom' ? -6 : 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${getPositionClasses()} z-50 pointer-events-none w-72 sm:w-80`}
          >
            {/* Tooltip Card Body */}
            <div className="bg-[#0C0E17]/95 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(244,63,94,0.2)] text-left relative overflow-hidden">
              
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

              {/* Event & Rarity Header */}
              <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                    <Flame className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 truncate">
                    {eventName}
                  </span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10 shrink-0">
                  {rarity}
                </span>
              </div>

              {/* Character Details */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h5 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                    {name}
                  </h5>
                  <span className="text-[9px] font-bold text-amber-300/90 shrink-0">
                    {badge}
                  </span>
                </div>
                
                <p className="text-[11px] font-semibold text-rose-300 truncate">
                  {title}
                </p>

                {/* Lore / Description */}
                <p className="text-[11px] text-white/75 leading-relaxed pt-1 line-clamp-3">
                  {lore}
                </p>
              </div>

              {/* Element & Status Footer */}
              <div className="relative z-10 flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-white/5 text-[10px]">
                <div className="flex items-center gap-1 text-white/60">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{element}</span>
                </div>

                {isUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Claimable in S1
                  </span>
                )}
              </div>

              {/* Pointer Arrow */}
              {position === 'top' && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0C0E17] border-r border-b border-rose-500/40 rotate-45" />
              )}
              {position === 'bottom' && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0C0E17] border-l border-t border-rose-500/40 rotate-45" />
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
