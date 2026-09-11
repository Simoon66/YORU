import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface TrendingRowProps {
  animeList: Anime[];
  maxItems?: number;
}

export const TrendingRow: React.FC<TrendingRowProps> = ({ 
  animeList, 
  maxItems = 10 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

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
        onMouseDown={handleMouseDown}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-5 sm:gap-6 md:gap-8 pb-6 pt-2 hide-scrollbar select-none active:cursor-grabbing ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x'
        }}
      >
        {items.map((anime, index) => {
          const isDoubleDigit = index + 1 >= 10;
          return (
            <div
              key={anime.id}
              className="flex items-end shrink-0 snap-start w-[210px] xs:w-[230px] sm:w-[260px] md:w-[290px] lg:w-[310px] relative select-none"
              onClickCapture={(e) => {
                if (hasDragged) {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            >
              {/* Poster Card (Takes up left portion of slot) */}
              <div className="w-[145px] xs:w-[160px] sm:w-[185px] md:w-[205px] lg:w-[220px] z-10 shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              </div>

              {/* Giant Outlined Rank Number (Right Side, Layered Behind slightly but visible in gap) */}
              <div 
                className={`absolute bottom-16 right-2 select-none pointer-events-none z-0 ${
                  isDoubleDigit ? 'translate-x-1/4' : 'translate-x-1/3'
                }`}
              >
                <span 
                  className="font-black text-[120px] sm:text-[150px] md:text-[180px] lg:text-[210px] leading-none tracking-tighter block select-none select-none"
                  style={{
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    WebkitTextStroke: '3px rgba(255, 255, 255, 0.35)',
                    color: 'transparent',
                    filter: 'drop-shadow(0 6px 15px rgba(0,0,0,0.7))',
                  }}
                >
                  {index + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
