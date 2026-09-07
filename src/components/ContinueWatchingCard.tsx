import React from 'react';
import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, normalizeTitle } from '../lib/utils';

export interface HistoryItem {
  animeId: string;
  slug: string;
  title: string;
  coverImage: string;
  backdrop: string;
  episodeNumber: number;
  seasonId?: string;
  progress?: number;
  updatedAt: number;
}

interface ContinueWatchingCardProps {
  item: HistoryItem;
  showRemove?: boolean;
  onRemove?: (animeId: string) => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ 
  item, 
  showRemove = false, 
  onRemove 
}) => {
  return (
    <div className="relative group w-full">
      <Link 
        to={`/watch/${item.slug}/${item.episodeNumber}${item.seasonId ? `?season=${item.seasonId}` : ''}`} 
        onClick={(e) => {
          if (showRemove) {
            e.preventDefault();
          }
        }}
        className={cn(
          "relative block w-full overflow-hidden rounded-xl bg-yoru-surface-elevated aspect-video border border-white/5 ring-1 ring-white/5 shadow-lg transition-all duration-300",
          showRemove ? "cursor-default" : "cursor-pointer"
        )}
      >
        <img
          src={item.backdrop || item.coverImage}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Deepened bottom gradient scrim for high-contrast legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/75 to-transparent" />
        
        {!showRemove && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-black/30 backdrop-blur-sm z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20 transform scale-90 group-hover:scale-100 transition-all duration-300">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pr-8">
          <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yoru-accent transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            {normalizeTitle(item.title)}
          </h4>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
            {item.seasonId && item.seasonId !== 's1' ? `S${item.seasonId.replace(/\D/g, '')} • ` : ''}EP <span className="text-white font-bold">{item.episodeNumber}</span>
          </p>
        </div>
      </Link>

      {/* Cross mark button for single card removal */}
      <AnimatePresence>
        {showRemove && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove?.(item.animeId);
            }}
            aria-label={`Remove ${item.title} from history`}
            title="Remove from history"
            className="absolute top-2 right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/90 text-white border border-white/20 backdrop-blur-md shadow-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <X className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
