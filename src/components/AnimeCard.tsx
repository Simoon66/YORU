import React, { useState, useRef } from 'react';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [floatingPos, setFloatingPos] = useState<'left' | 'right'>('right');

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const isCloseToRightEdge = window.innerWidth - rect.right < 360;
      setFloatingPos(isCloseToRightEdge ? 'left' : 'right');
    }
  };

  return (
    <div 
      ref={cardRef}
      className={cn("group relative block w-full", isHovered ? "z-50" : "z-10")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/anime/${anime.slug}`} 
        className="block w-full transition-all duration-300"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-yoru-surface-elevated ring-1 ring-yoru-border group-hover:ring-yoru-accent/50 transition-all rounded-md">
          {/* Poster Image */}
          <img 
            src={anime.poster} 
            alt={anime.title} 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-700",
              isHovered ? "scale-110 opacity-0" : "scale-100 opacity-100"
            )}
            loading="lazy"
          />

          {/* Backdrop Image (Hover) */}
          <img 
            src={anime.backdrop} 
            alt={`${anime.title} Backdrop`} 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-700",
              isHovered ? "scale-100 opacity-100" : "scale-110 opacity-0"
            )}
            loading="lazy"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
              <Play className="w-6 h-6 fill-current ml-1" />
            </div>
          </div>

          {/* Bottom Tags on Main Card */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-sm bg-yoru-accent text-white text-[10px] font-bold">CC</span>
             </div>
             <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-white">{anime.format}</span>
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-bold truncate mb-1 text-white group-hover:text-yoru-accent transition-colors">
            {anime.title}
          </h4>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-white/50">{anime.status}</span>
          </div>
        </div>
      </Link>

      {/* Floating Detail Card */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: floatingPos === 'right' ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: floatingPos === 'right' ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-[320px] bg-[#1a1c23]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-xl p-5 z-[100] hidden md:block cursor-default",
              floatingPos === 'right' ? "left-full ml-4" : "right-full mr-4"
            )}
          >
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-[#62a1dc] leading-tight line-clamp-2">
                {anime.title}
              </h3>
              
              <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
                <span className="px-2 py-0.5 border border-white/20 rounded-full bg-white/5 text-white/80">PG-13</span>
                <span className="px-2 py-0.5 border border-white/20 rounded-full bg-white/5 text-white/80">HD</span>
                <span className="px-2 py-0.5 border border-white/20 rounded-full bg-[#62a1dc]/20 text-[#62a1dc]">⭐ {anime.averageScore || 'N/A'}</span>
              </div>

              <p className="text-[13px] text-white/70 line-clamp-4 leading-relaxed mt-1">
                {anime.synopsis}
              </p>

              <div className="space-y-1.5 text-[12px] mt-2 font-medium">
                <div className="flex"><span className="text-white/50 w-20">Other names:</span><span className="text-white/90 truncate flex-1">{anime.nativeTitle || '-'}</span></div>
                <div className="flex"><span className="text-white/50 w-20">Year:</span><span className="text-white/90">{anime.startDate?.substring(0,4) || 'N/A'}</span></div>
                <div className="flex"><span className="text-white/50 w-20">Duration:</span><span className="text-white/90">{anime.episodeDuration || 'N/A'}</span></div>
                <div className="flex"><span className="text-white/50 w-20">Status:</span><span className="text-white/90">{anime.status}</span></div>
                <div className="flex"><span className="text-white/50 w-20">Genre:</span><span className="text-[#62a1dc] truncate flex-1 hover:underline cursor-pointer">{anime.genres?.slice(0,3).join(', ')}</span></div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <Link to={`/watch/${anime.slug}/1`} className="flex-1 bg-[#8fa4b8]/30 hover:bg-[#8fa4b8]/50 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm">
                  <Play className="w-4 h-4 fill-current" /> Watch Now
                </Link>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
