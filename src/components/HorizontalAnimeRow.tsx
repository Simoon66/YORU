import React from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useFramerDragScroll } from '../hooks/useFramerDragScroll';

interface HorizontalAnimeRowProps {
  animeList: Anime[];
  maxItems?: number;
}

export const HorizontalAnimeRow: React.FC<HorizontalAnimeRowProps> = ({ 
  animeList, 
  maxItems = 10
}) => {
  // Take up to maxItems items strictly as requested
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
    <div className="relative group/row">
      {/* Left Scroll Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-yoru-surface/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white hover:text-black shadow-xl cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Scroll Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-yoru-surface/90 border border-white/10 items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white hover:text-black shadow-xl cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Single Horizontal Row with Framer Motion Drag and Touch Swipe */}
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
          className="flex gap-3 sm:gap-4 md:gap-5 pb-4 pt-1 cursor-grab active:cursor-grabbing select-none"
        >
          {items.map((anime, index) => (
            <div
              key={anime.id}
              className="w-[145px] xs:w-[160px] sm:w-[185px] md:w-[205px] lg:w-[220px] shrink-0"
              onClickCapture={(e) => {
                // Prevent click on AnimeCard if user was actively dragging
                if (isDragging) {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
