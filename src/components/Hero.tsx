import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import clsx from 'clsx';
import { EmblaCarouselType } from 'embla-carousel';

interface HeroProps {
  featured: Anime[];
}

const TWEEN_FACTOR_BASE = 0.52;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

export const Hero: React.FC<HeroProps> = ({ featured }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40 },
    [Autoplay({ delay: 7000, stopOnInteraction: true })]
  );
  
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode) => {
      return slideNode.querySelector('.embla__parallax__layer') as HTMLElement;
    });
  }, []);

  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
  }, []);

  const tweenParallax = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: string) => {
      const engine = emblaApi.internalEngine();
      const scrollProgress = emblaApi.scrollProgress();
      const slidesInView = emblaApi.slidesInView();
      const isScrollEvent = eventName === 'scroll';

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress;
        const slidesInSnap = engine.slideRegistry[snapIndex];

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target();

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target);
                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress);
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress);
                }
              }
            });
          }

          const translate = diffToTarget * (-1 * tweenFactor.current) * 100;
          const tweenNode = tweenNodes.current[slideIndex];
          if (tweenNode) {
            tweenNode.style.transform = `translateX(${translate}%)`;
          }
        });
      });
    },
    []
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenParallax(emblaApi);
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('scroll', tweenParallax);
    emblaApi.on('slideFocus', tweenParallax);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', tweenParallax);
      emblaApi.off('slideFocus', tweenParallax);
    };
  }, [emblaApi, onSelect, setTweenNodes, setTweenFactor, tweenParallax]);

  if (!featured || featured.length === 0) return (
    <div className="aspect-[16/9] md:h-[90vh] bg-yoru-bg flex items-center justify-center cinematic-vignette">
      <div className="shuriken-loader"></div>
    </div>
  );

  return (
    <div className="relative aspect-[16/9] md:h-[90vh] w-full bg-yoru-bg">
      <div className="overflow-hidden h-full w-full" ref={emblaRef}>
        <div className="flex h-full w-full touch-pan-y">
          {featured.map((anime, index) => {
            const isActive = index === selectedIndex;
            return (
              <div key={anime.id} className="relative flex-[0_0_100%] min-w-0 h-full w-full overflow-hidden">
                <div className="embla__parallax__layer absolute inset-0 w-full h-full">
                  <img
                    src={anime.backdrop}
                    alt={anime.title}
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                    draggable={false}
                  />
                </div>
                
                {/* Refined Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-yoru-bg via-yoru-bg/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-yoru-bg/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 cinematic-vignette opacity-60 pointer-events-none" />
                
                <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-32 pt-12 md:pt-28 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto pointer-events-none">
                  <div 
                    className={clsx(
                      "max-w-2xl space-y-4 md:space-y-6 pointer-events-auto transition-all duration-1000 ease-[0.23,1,0.32,1] transform",
                      isActive ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-yoru-text bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                        {anime.season} • {anime.format}
                      </span>
                    </div>
                    
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-white uppercase text-shadow-lg leading-[1.1]">
                      {anime.title}
                    </h1>
                    
                    <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-xs text-white/80 font-bold uppercase tracking-widest flex-wrap">
                      {anime.genres.map((genre, idx) => (
                        <React.Fragment key={genre}>
                          <span className="text-shadow-sm">{genre}</span>
                          {idx < anime.genres.length - 1 && <span className="text-yoru-accent/50">•</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    <p className="text-xs md:text-base text-yoru-text-muted leading-relaxed max-w-xl line-clamp-3 text-shadow-md">
                      {anime.synopsis}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-4 md:pt-6">
                      <Link to={`/watch/${anime.slug}/1`}>
                        <Button size="lg" className="gap-2 px-8 py-3.5 shadow-xl">
                          <Play className="w-5 h-5 fill-current" /> Watch Now
                        </Button>
                      </Link>
                      <Link to={`/anime/${anime.slug}`}>
                        <Button variant="secondary" size="lg" className="gap-2 px-8 py-3.5 backdrop-blur-md">
                          <Plus className="w-5 h-5" /> Info
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Refined Pagination Dots */}
      <div className="absolute bottom-6 md:bottom-12 left-0 right-0 flex justify-center gap-3 z-20 pointer-events-none">
        <div className="pointer-events-auto flex gap-2 p-3 rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
          {featured.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-500 ease-out",
                index === selectedIndex 
                  ? "w-8 bg-yoru-accent shadow-[0_0_10px_rgba(226,232,240,0.5)]" 
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
