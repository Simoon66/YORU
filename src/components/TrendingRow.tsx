import React from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useFramerDragScroll } from '../hooks/useFramerDragScroll';

interface TrendingRowProps {
  animeList: Anime[];
  maxItems?: number;
}

export const TrendingRow: React.FC<TrendingRowProps> = ({ 
  animeList, 
  maxItems = 10 
}) => {
  const items = animeList.slice(0, maxItems);

  const {
    containerRef,
    innerRef,
    constraints,
    x,
    isDragging,
    scroll,
    handleDragStart,
    handleDragEnd
  } = useFramerDragScroll(items.length);

  if (items.length === 0) return null;

  return (
    <div className="relative group/trending">
      {/* Left Scroll Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-yoru-surface/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/trending:opacity-100 transition-opacity hover:bg-white hover:text-black shadow-xl cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Scroll Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-yoru-surface/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/trending:opacity-100 transition-opacity hover:bg-white hover:text-black shadow-xl cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Horizontal Carousel */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden"
      >
        <motion.div
          ref={innerRef}
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.15}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="flex gap-8 xs:gap-10 sm:gap-12 md:gap-16 pb-6 pt-2 cursor-grab active:cursor-grabbing select-none"
        >
          {items.map((anime, index) => {
            const isDoubleDigit = index + 1 >= 10;
            return (
              <div
                key={anime.id}
                className="relative shrink-0 w-[145px] xs:w-[160px] sm:w-[185px] md:w-[205px] lg:w-[220px] select-none"
                onClickCapture={(e) => {
                  if (isDragging) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
              >
                {/* Poster Card */}
                <div className="w-full relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
                  >
                    <AnimeCard anime={anime} />
                  </motion.div>
                </div>

                {/* Giant Outlined Rank Number (Positioned directly ON TOP of the bottom right of the poster) */}
                <div 
                  className={`absolute -bottom-2 -right-6 sm:-right-8 md:-right-10 select-none pointer-events-none z-20 ${
                    isDoubleDigit ? 'translate-x-1/6' : 'translate-x-1/4'
                  }`}
                >
                  <span 
                    className="font-black text-[100px] xs:text-[110px] sm:text-[140px] md:text-[170px] lg:text-[200px] leading-none tracking-tighter block select-none"
                    style={{
                      fontFamily: "'Impact', 'Arial Black', sans-serif",
                      WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.85)',
                      color: 'transparent',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
