import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Anime } from '../types';

// The user provided specific slides to display
const SLIDES = [
  {
    bg: 'https://image.tmdb.org/t/p/original/aqLo1Xp8KrMq9zmGn89gOcTZZdw.jpg',
    logo: 'https://image.tmdb.org/t/p/original/hrqJ7LYIHWUNpCMOSCkYc9IYHIh.png',
    num: '1',
    title: 'Dr. STONE: SCIENCE FUTURE Part 2',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'Senku and his allies push the boundaries of science to face their greatest challenge yet — reshaping the future of humanity.',
    link: '/browse'
  },
  {
    bg: 'https://image.tmdb.org/t/p/original/17W1t50gFAY9F5PqL5SjTOSc8yD.jpg',
    logo: 'https://image.tmdb.org/t/p/original/rmpCg2VWLrU1tZwG1jskEug7ytH.png',
    num: '2',
    title: 'SAKAMOTO DAYS Part 2',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'The legendary hitman turned shopkeeper returns, blending comedy, action, and pure chaos in his everyday life.',
    link: '/browse'
  },
  {
    bg: 'https://image.tmdb.org/t/p/original/10DSXrtycu2W9i0L7tHi7EBPVEX.jpg',
    logo: 'https://image.tmdb.org/t/p/original/A9jO4m2vVmvuEhTMf6E6sK16kMp.png',
    num: '3',
    title: 'DAN DA DAN Season 2',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'Okarun and Momo dive back into bizarre supernatural battles with even crazier stakes.',
    link: '/browse'
  },
  {
    bg: 'https://image.tmdb.org/t/p/original/dQapyvANzx24FkVQ8P4WTu2lJNM.jpg',
    logo: 'https://image.tmdb.org/t/p/original/auG2vlnTaCzIEIYLl2zVGQH8muu.png',
    num: '4',
    title: 'Lord of Mysteries',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'A gripping journey into a world of secret societies, supernatural powers, and unraveling conspiracies.',
    link: '/browse'
  },
  {
    bg: 'https://image.tmdb.org/t/p/original/mrapJp0qb6Fvo3IW9IrjCK9IgSo.jpg',
    logo: 'https://image.tmdb.org/t/p/original/ccEM7BBPoBky3bvtJuxkDYNVPae.png',
    num: '5',
    title: 'Gachiakuta',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'Thrown into a city of trash, Rudo must fight to survive and uncover the truth behind his exile.',
    link: '/browse'
  },
  {
    bg: 'https://i.imgur.com/nmzt97b.jpeg',
    logo: 'https://image.tmdb.org/t/p/original/fmMVL1iFT898mVbq1yD1feDualB.png',
    num: '6',
    title: 'Dekin no Mogura: The Earthbound Mole',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'A mysterious mole warrior emerges to protect the earth from unseen threats.',
    link: '/browse'
  },
  {
    bg: 'https://image.tmdb.org/t/p/original/5nmg2cEZxA09VyDvioAuqd5jOW0.jpg',
    logo: 'https://image.tmdb.org/t/p/original/sSoQShcfjlAUeWhXoHXtFNFNgfl.png',
    num: '7',
    title: 'Clevatess',
    type: 'TV',
    dur: '24m',
    year: '2025',
    hd: 'yes',
    desc: 'A tale of kings, betrayal, and the rebirth of a feared legend in a land of magic.',
    link: '/browse'
  }
];

// Custom SVGs from the user snippet
const Icons = {
  TV: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v2h8v-2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 14H3V5h18z"/></svg>,
  Movie: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4z"/></svg>,
  OVA: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>,
  ONA: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c5.1-5.1 13.4-5.1 18.5 0l2-2C17.9 3.4 6.1 3.4 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.1 9.3 8.9 9.3 5 13z"/></svg>,
  Special: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>,
  Year: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/></svg>,
  Play: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Up: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>,
  Down: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
};

interface HeroProps {
  featured: Anime[]; // Kept for prop compatibility
}

export const Hero: React.FC<HeroProps> = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleMove = (step: number) => {
    setCurrentIndex((prev) => (prev + step + SLIDES.length) % SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 45) handleMove(-1);
    else if (dx < -45) handleMove(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dx = e.clientX - touchStartX.current;
    if (dx > 45) handleMove(-1);
    else if (dx < -45) handleMove(1);
  };

  return (
    <div className="w-full relative overflow-hidden bg-yoru-bg pb-6">
      <div 
        className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden group select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Slides Container */}
        <div 
          className="flex h-full transition-transform duration-700 ease-[0.25,1,0.5,1]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const TypeIcon = Icons[slide.type as keyof typeof Icons] || Icons.TV;

            return (
              <div 
                key={idx} 
                className="relative flex-[0_0_100%] w-full h-full flex items-center bg-cover bg-top"
                style={{ backgroundImage: `url(${slide.bg})` }}
              >
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none" />
                
                {/* Content */}
                <div 
                  className={clsx(
                    "relative z-10 px-6 sm:px-10 max-w-[85%] sm:max-w-[420px] md:max-w-[520px] transition-all duration-700 delay-100",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                >
                  <div className="text-[13px] text-yoru-accent font-bold mb-1.5">
                    #{slide.num} Spotlight
                  </div>
                  
                  {slide.logo ? (
                    <img 
                      src={slide.logo} 
                      alt={slide.title} 
                      className="max-h-[40px] sm:max-h-[55px] mb-2.5 object-contain block pointer-events-none" 
                    />
                  ) : (
                    <h2 className="text-[18px] sm:text-[22px] md:text-[28px] font-bold text-white mb-2.5 leading-[1.2]">
                      {slide.title}
                    </h2>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3.5">
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><TypeIcon /></div> {slide.type}
                    </span>
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><Icons.Clock /></div> {slide.dur}
                    </span>
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><Icons.Year /></div> {slide.year}
                    </span>
                    {slide.hd === 'yes' && (
                      <span className="px-2 py-[2px] rounded text-[11px] font-bold bg-[#1a6fdb] text-white border border-white/25 ml-1">
                        HD
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] sm:text-[13px] leading-[1.6] text-white/80 mb-5 line-clamp-3 md:line-clamp-none">
                    {slide.desc}
                  </p>

                  <Link 
                    to={slide.link} 
                    className="inline-flex items-center gap-[7px] bg-yoru-accent text-[#030407] px-[22px] py-[10px] rounded-[30px] font-bold text-[13px] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_22px_rgba(226,232,240,0.75)]"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag conflict
                  >
                    <Icons.Play /> Watch Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav Arrows Stack (Right edge) */}
        <div className="absolute right-[18px] top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); handleMove(-1); }}
            className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] rounded-lg bg-[#141414]/65 text-white flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-yoru-accent hover:text-[#030407] hover:shadow-[0_0_14px_rgba(226,232,240,0.65)] border-none outline-none"
          >
            <Icons.Up />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleMove(1); }}
            className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] rounded-lg bg-[#141414]/65 text-white flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-yoru-accent hover:text-[#030407] hover:shadow-[0_0_14px_rgba(226,232,240,0.65)] border-none outline-none"
          >
            <Icons.Down />
          </button>
        </div>

        {/* Dots (Bottom center) */}
        <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 flex gap-[7px] z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={clsx(
                "w-[7px] h-[7px] rounded-full transition-all duration-300 outline-none border-none",
                idx === currentIndex 
                  ? "bg-yoru-accent scale-[1.35] shadow-[0_0_7px_rgba(226,232,240,0.8)]" 
                  : "bg-white/35 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
