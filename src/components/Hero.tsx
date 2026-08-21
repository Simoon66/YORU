import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Anime, SpotlightSlide } from '../types';
import { getSpotlightSlides, getEpisodesForAnime, getWatchHistory } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';
import { Play, ChevronUp, ChevronDown } from 'lucide-react';

// Fallback curated slides in case database has no spotlights yet
const FALLBACK_SLIDES: SpotlightSlide[] = [
  {
    id: 'f1',
    order: 1,
    animeId: '',
    animeTitle: 'Dr. STONE: SCIENCE FUTURE Part 2',
    animeSlug: 'dr-stone-science-future-part-2',
    badge: '#1 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/aqLo1Xp8KrMq9zmGn89gOcTZZdw.jpg',
    logo: 'https://image.tmdb.org/t/p/original/hrqJ7LYIHWUNpCMOSCkYc9IYHIh.png',
    synopsis: 'Senku and his allies push the boundaries of science to face their greatest challenge yet — reshaping the future of humanity.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    id: 'f2',
    order: 2,
    animeId: '',
    animeTitle: 'SAKAMOTO DAYS Part 2',
    animeSlug: 'sakamoto-days-part-2',
    badge: '#2 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/17W1t50gFAY9F5PqL5SjTOSc8yD.jpg',
    logo: 'https://image.tmdb.org/t/p/original/rmpCg2VWLrU1tZwG1jskEug7ytH.png',
    synopsis: 'The legendary hitman turned shopkeeper returns, blending comedy, action, and pure chaos in his everyday life.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    id: 'f3',
    order: 3,
    animeId: '',
    animeTitle: 'DAN DA DAN Season 2',
    animeSlug: 'dan-da-dan-season-2',
    badge: '#3 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/10DSXrtycu2W9i0L7tHi7EBPVEX.jpg',
    logo: 'https://image.tmdb.org/t/p/original/A9jO4m2vVmvuEhTMf6E6sK16kMp.png',
    synopsis: 'Okarun and Momo dive back into bizarre supernatural battles with even crazier stakes.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    id: 'f4',
    order: 4,
    animeId: '',
    animeTitle: 'Lord of Mysteries',
    animeSlug: 'lord-of-mysteries',
    badge: '#4 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/dQapyvANzx24FkVQ8P4WTu2lJNM.jpg',
    logo: 'https://image.tmdb.org/t/p/original/auG2vlnTaCzIEIYLl2zVGQH8muu.png',
    synopsis: 'A gripping journey into a world of secret societies, supernatural powers, and unraveling conspiracies.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    id: 'f5',
    order: 5,
    animeId: '',
    animeTitle: 'Gachiakuta',
    animeSlug: 'gachiakuta',
    badge: '#5 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/mrapJp0qb6Fvo3IW9IrjCK9IgSo.jpg',
    logo: 'https://image.tmdb.org/t/p/original/ccEM7BBPoBky3bvtJuxkDYNVPae.png',
    synopsis: 'Thrown into a city of trash, Rudo must fight to survive and uncover the truth behind his exile.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  }
];

const Icons = {
  TV: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v2h8v-2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 14H3V5h18z"/></svg>,
  Movie: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4z"/></svg>,
  OVA: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>,
  ONA: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c5.1-5.1 13.4-5.1 18.5 0l2-2C17.9 3.4 6.1 3.4 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.1 9.3 8.9 9.3 5 13z"/></svg>,
  Special: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>,
  Year: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/></svg>,
};

interface HeroProps {
  featured?: Anime[];
}

export const Hero: React.FC<HeroProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [slides, setSlides] = useState<SpotlightSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const touchStartX = useRef(0);

  // Fetch admin-controlled spotlight slides from Firestore
  useEffect(() => {
    async function loadSpotlights() {
      try {
        const customSlides = await getSpotlightSlides();
        if (customSlides && customSlides.length > 0) {
          setSlides(customSlides);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch (e) {
        console.warn("Using fallback slides:", e);
        setSlides(FALLBACK_SLIDES);
      } finally {
        setIsLoading(false);
      }
    }
    loadSpotlights();
  }, []);

  // Auto rotation
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMove = (step: number) => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + step + slides.length) % slides.length);
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

  // Smart Watch Now Handler for targeted seasons & smart resume
  const handleWatchNow = async (slide: SpotlightSlide, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!slide.animeSlug && !slide.animeId) {
      navigate('/browse');
      return;
    }

    const slug = slide.animeSlug || slide.animeId;
    const targetSeason = slide.targetSeasonId || 's1';

    setIsNavigating(true);

    try {
      // 1. Check if user already watched an episode in this target season
      let resumeEpNumber: number | null = null;

      // Check LocalStorage first
      const localHistory = localStorage.getItem('yoru_watch_history');
      if (localHistory) {
        try {
          const items = JSON.parse(localHistory);
          const matched = items.find((it: any) => 
            (it.slug === slug || it.animeId === slide.animeId) && 
            (!it.seasonId || it.seasonId === targetSeason)
          );
          if (matched && matched.episodeNumber) {
            resumeEpNumber = matched.episodeNumber;
          }
        } catch (err) {
          console.error("Local history parse error:", err);
        }
      }

      // If user is logged in and not found in local, check Firestore
      if (!resumeEpNumber && user && slide.animeId) {
        try {
          const remoteHistory = await getWatchHistory(user.uid);
          const matched = remoteHistory.find(it => it.animeId === slide.animeId);
          if (matched && matched.episodeNumber) {
            resumeEpNumber = matched.episodeNumber;
          }
        } catch (err) {
          console.error("Remote history error:", err);
        }
      }

      // If user previously watched an episode in that season, resume it!
      if (resumeEpNumber) {
        navigate(`/watch/${slug}/${resumeEpNumber}?season=${targetSeason}`);
        return;
      }

      // If not watched yet, find episode 1 of the targeted season
      if (slide.animeId) {
        const episodes = await getEpisodesForAnime(slide.animeId);
        const seasonEps = episodes.filter(ep => ep.seasonId === targetSeason);
        if (seasonEps.length > 0) {
          const firstEp = seasonEps.sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
          navigate(`/watch/${slug}/${firstEp.episodeNumber}?season=${targetSeason}`);
          return;
        }
      }

      // Fallback: start at episode 1 with target season param
      navigate(`/watch/${slug}/1?season=${targetSeason}`);
    } catch (err) {
      console.error("Failed smart watch redirect:", err);
      navigate(`/watch/${slug}`);
    } finally {
      setIsNavigating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full relative overflow-hidden bg-yoru-bg pb-6">
        <div className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden bg-white/[0.02] animate-pulse flex flex-col justify-end p-6 sm:px-10 pb-12 sm:pb-16 border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
          <div className="relative z-10 max-w-[85%] sm:max-w-[440px] md:max-w-[540px] space-y-4">
            <div className="h-4 w-28 bg-white/10 rounded"></div>
            <div className="h-10 sm:h-14 w-3/4 bg-white/10 rounded"></div>
            <div className="flex gap-3">
              <div className="h-5 w-14 bg-white/10 rounded"></div>
              <div className="h-5 w-14 bg-white/10 rounded"></div>
              <div className="h-5 w-14 bg-white/10 rounded"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-4 w-full bg-white/10 rounded"></div>
              <div className="h-4 w-5/6 bg-white/10 rounded"></div>
            </div>
            <div className="h-10 w-36 bg-white/10 rounded-[30px] mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

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
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const TypeIcon = Icons[slide.format as keyof typeof Icons] || Icons.TV;

            return (
              <div 
                key={slide.id || idx} 
                className="relative flex-[0_0_100%] w-full h-full flex items-center bg-cover bg-top"
                style={{ backgroundImage: `url(${slide.backdrop})` }}
              >
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent pointer-events-none" />
                
                {/* Content */}
                <div 
                  className={clsx(
                    "relative z-10 px-6 sm:px-10 max-w-[85%] sm:max-w-[440px] md:max-w-[540px] transition-all duration-700 delay-100",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                >
                  {/* Spotlight Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] sm:text-[13px] text-yoru-accent font-bold">
                      {slide.badge || `#${slide.order || idx + 1} Spotlight`}
                    </span>
                  </div>
                  
                  {/* Logo and Title */}
                  {slide.logo && (
                    <img 
                      src={slide.logo} 
                      alt={slide.animeTitle || 'Anime Logo'} 
                      className="max-h-[40px] sm:max-h-[55px] mb-3 object-contain block pointer-events-none drop-shadow-lg" 
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                  )}
                  <h2 className="text-[18px] sm:text-[22px] md:text-[28px] font-bold text-white mb-2.5 leading-[1.2] drop-shadow-md">
                    {slide.animeTitle}
                  </h2>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><TypeIcon /></div> {slide.format || 'TV'}
                    </span>
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><Icons.Clock /></div> {slide.duration || '24m'}
                    </span>
                    <span className="flex items-center gap-[5px] text-white/85 text-[12px] font-medium">
                      <div className="text-white/65"><Icons.Year /></div> {slide.year || '2025'}
                    </span>
                    {slide.isHd && (
                      <span className="px-2 py-[2px] rounded text-[10px] font-bold bg-[#1a6fdb] text-white border border-white/25 ml-1">
                        HD
                      </span>
                    )}
                  </div>

                  {/* Synopsis - Strict 2-line clamp with '...' */}
                  <p className="text-[12px] sm:text-[13px] leading-[1.6] text-white/80 mb-5 line-clamp-2">
                    {slide.synopsis}
                  </p>

                  {/* Watch Now Button */}
                  <button 
                    onClick={(e) => handleWatchNow(slide, e)}
                    disabled={isNavigating}
                    className="inline-flex items-center gap-[8px] bg-yoru-accent text-[#030407] px-[22px] py-[10px] rounded-[30px] font-bold text-[13px] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_22px_rgba(226,232,240,0.75)] cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Play className="w-4 h-4 fill-current" /> Watch Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav Arrows Stack (Right edge) */}
        {slides.length > 1 && (
          <div className="absolute right-[18px] top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); handleMove(-1); }}
              className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] rounded-lg bg-[#141414]/65 text-white flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-yoru-accent hover:text-[#030407] hover:shadow-[0_0_14px_rgba(226,232,240,0.65)] border-none outline-none cursor-pointer"
              title="Previous Slide"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleMove(1); }}
              className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] rounded-lg bg-[#141414]/65 text-white flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-yoru-accent hover:text-[#030407] hover:shadow-[0_0_14px_rgba(226,232,240,0.65)] border-none outline-none cursor-pointer"
              title="Next Slide"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dots (Bottom center) */}
        {slides.length > 1 && (
          <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 flex gap-[7px] z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={clsx(
                  "w-[7px] h-[7px] rounded-full transition-all duration-300 outline-none border-none cursor-pointer",
                  idx === currentIndex 
                    ? "bg-yoru-accent scale-[1.35] shadow-[0_0_7px_rgba(226,232,240,0.8)]" 
                    : "bg-white/35 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
