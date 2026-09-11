import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HorizontalAnimeRowProps {
  animeList: Anime[];
  maxItems?: number;
}

export const HorizontalAnimeRow: React.FC<HorizontalAnimeRowProps> = ({ 
  animeList, 
  maxItems = 10
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Take up to maxItems items strictly as requested
  const items = animeList.slice(0, maxItems);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsMouseDown(true);
    setHasDragged(false);
    setStartX(e.clientX);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  useEffect(() => {
    if (!isMouseDown) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const walk = (e.clientX - startX) * 1.4;
      if (Math.abs(walk) > 6) {
        setHasDragged(true);
      }
      containerRef.current.scrollLeft = scrollLeftState - walk;
    };

    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setTimeout(() => setHasDragged(false), 100);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown, startX, scrollLeftState]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollDistance = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth'
    });
  };

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

      {/* Single Horizontal Row with Drag and Touch Swipe */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 md:gap-5 pb-4 pt-1 hide-scrollbar select-none active:cursor-grabbing ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x'
        }}
      >
        {items.map((anime, index) => (
          <div
            key={anime.id}
            className="w-[145px] xs:w-[160px] sm:w-[185px] md:w-[205px] lg:w-[220px] shrink-0 snap-start"
            onClickCapture={(e) => {
              // Prevent click on AnimeCard if user was actively dragging
              if (hasDragged) {
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
      </div>
    </div>
  );
};
