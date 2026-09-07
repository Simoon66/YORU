import React, { useState, useRef } from 'react';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { Play, Plus, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, normalizeTitle } from '../lib/utils';
import { Button } from './ui/Button';
import { WatchlistButton } from './WatchlistButton';
import { useAnimeEpisodeCounts } from '../hooks/useAnimeEpisodeCounts';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [floatingPos, setFloatingPos] = useState<'left' | 'right'>('right');
  const counts = useAnimeEpisodeCounts(anime);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const isCloseToRightEdge = window.innerWidth - rect.right < 360;
      setFloatingPos(isCloseToRightEdge ? 'left' : 'right');
    }
  };

  const displayTitle = normalizeTitle(anime.title);

  return (
    <div 
      ref={cardRef}
      className={cn("anime-poster-card group relative block w-full", isHovered ? "z-50" : "z-10")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/anime/${anime.slug}`} 
        className="block w-full transition-all duration-300"
        aria-label={`${displayTitle}, ${anime.format || 'Anime'}, ${anime.status || ''}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-yoru-surface-elevated ring-1 ring-yoru-border group-hover:ring-yoru-accent/50 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-500 rounded-lg">
          
          <img 
            src={anime.poster} 
            alt="" 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
              isHovered ? "scale-105 opacity-0" : "scale-100 opacity-100"
            )}
            loading="lazy"
          />
          
          <img 
            src={anime.backdrop} 
            alt="" 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
              isHovered ? "scale-100 opacity-100" : "scale-105 opacity-0"
            )}
            loading="lazy"
          />

          {/* Consistent bottom gradient overlay for legible badges */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
          
          {/* Server Episode Badges */}
          <div className="absolute bottom-2 left-2 flex items-center flex-wrap gap-1.5 z-20" aria-hidden="true">
            {counts.sub > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#030407]/90 text-white text-[11px] font-bold tracking-wider border border-white/20 backdrop-blur-sm shadow-md">
                <svg aria-hidden="true" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="M10 10H8.5a1.5 1.5 0 0 0-1.5 1.5v1A1.5 1.5 0 0 0 8.5 15H10" />
                  <path d="M17 10h-1.5a1.5 1.5 0 0 0-1.5 1.5v1a1.5 1.5 0 0 0 1.5 1.5H17" />
                </svg>
                <span>{counts.sub}</span>
              </div>
            )}
            {counts.dub > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#030407]/90 text-white text-[11px] font-bold tracking-wider border border-white/20 backdrop-blur-sm shadow-md">
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span>{counts.dub}</span>
              </div>
            )}
            {counts.multi > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#030407]/90 text-white text-[11px] font-bold tracking-wider border border-white/20 backdrop-blur-sm shadow-md">
                <svg aria-hidden="true" className="h-3.5 w-3.5 text-yoru-accent shrink-0" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="m13 19 3.5-9 3.5 9m-6.125-2h5.25M3 7h7m0 0h2m-2 0c0 1.63-.793 3.926-2.239 5.655M7.5 6.818V5m.261 7.655C6.79 13.82 5.521 14.725 4 15m3.761-2.345L5 10m2.761 2.655L10.2 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                </svg>
                <span>{counts.multi}</span>
              </div>
            )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 text-white transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
        
        <div className="mt-3.5 space-y-1 flex flex-col justify-between">
          <h3 className="text-[13px] md:text-sm font-semibold leading-tight line-clamp-2 text-white group-hover:text-yoru-accent transition-colors duration-300 min-h-[2.5rem]">
            {displayTitle}
          </h3>
          <div className="flex gap-2 items-center text-xs font-medium text-yoru-text-muted">
            {anime.status && anime.status !== 'FINISHED' && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-semibold tracking-wider">
                {anime.status}
              </span>
            )}
            {(anime.startDate?.substring(0, 4) || anime.season) && (
              <span className="text-[11px] text-yoru-text-muted">{anime.startDate?.substring(0, 4) || anime.season}</span>
            )}
          </div>
        </div>
      </Link>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: floatingPos === 'right' ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: floatingPos === 'right' ? -10 : 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-[340px] bg-yoru-surface/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl p-6 z-[100] hidden lg:block cursor-default",
              floatingPos === 'right' ? "left-full ml-4" : "right-full mr-4"
            )}
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">
                {anime.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                {anime.format && !['TV', 'HD'].includes(anime.format.toUpperCase()) && (
                  <span className="px-2 py-1 rounded bg-yoru-accent text-yoru-accent-content shadow-sm">{anime.format}</span>
                )}
                <span className="px-2 py-1 rounded border border-white/20 text-white flex items-center gap-1">
                  ⭐ {anime.averageScore || 'N/A'}
                </span>
              </div>

              <p className="text-sm text-yoru-text-muted line-clamp-4 leading-relaxed mt-1">
                {anime.synopsis}
              </p>

              <div className="space-y-2 text-xs mt-2 text-yoru-text-muted">
                <div className="flex"><span className="w-24 opacity-70">Japanese:</span><span className="text-white truncate flex-1">{anime.nativeTitle || '-'}</span></div>
                <div className="flex"><span className="w-24 opacity-70">Aired:</span><span className="text-white">{anime.startDate?.substring(0,4) || 'N/A'}</span></div>
                <div className="flex"><span className="w-24 opacity-70">Status:</span><span className="text-white">{anime.status}</span></div>
                <div className="flex"><span className="w-24 opacity-70">Genres:</span><span className="text-white truncate flex-1">{anime.genres?.slice(0,3).join(', ')}</span></div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                <Link to={`/watch/${anime.slug}/1`} className="flex-1">
                  <Button variant="primary" className="w-full gap-2">
                    <Play className="w-4 h-4 fill-current" /> Watch Now
                  </Button>
                </Link>
                <WatchlistButton animeId={anime.id!} variant="secondary" size="icon" showText={false} className="shrink-0 rounded-full w-10 h-10" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
