import React, { useCallback, useEffect, useState, useRef } from 'react';
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
    { loop: true, duration: 30 },
    [Autoplay({ delay: 6000, stopOnInteraction: true })]
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
    <div className="aspect-[16/9] sm:aspect-[21/9] md:aspect-auto md:h-[85vh] bg-yoru-surface-elevated flex items-center justify-center">
      <div className="shuriken-loader"></div>
    </div>
  );

  return (
    <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-auto md:h-[85vh] w-full bg-yoru-bg">
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
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                
                {/* Gradients for cinematic look */}
                <div className="absolute inset-0 bg-gradient-to-r from-yoru-bg via-yoru-bg/70 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-yoru-bg/30 to-transparent pointer-events-none" />
                
                <div className="absolute inset-0 flex flex-col justify-end pb-4 md:pb-32 pt-12 md:pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
                  <div 
                    className={clsx(
                      "max-w-2xl space-y-1 md:space-y-4 pointer-events-auto transition-all duration-1000 ease-out transform",
                      isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    )}
                  >
                    <div className="flex items-center gap-1.5 md:gap-3">
                      <span className="text-[7px] md:text-xs font-bold uppercase tracking-[0.2em] text-yoru-accent">
                        {anime.season} • {anime.format}
                      </span>
                    </div>
                    
                    <h1 className="text-xl sm:text-3xl md:text-7xl font-black tracking-tight text-white uppercase text-shadow-md">
                      {anime.title}
                    </h1>
                    
                    <div className="flex items-center gap-1.5 md:gap-2 text-[6px] md:text-[10px] text-white/70 font-bold uppercase tracking-widest flex-wrap">
                      {anime.genres.map((genre, idx) => (
                        <React.Fragment key={genre}>
                          <span>{genre}</span>
                          {idx < anime.genres.length - 1 && <span className="text-yoru-accent">•</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    <p className="text-[8px] md:text-base text-white/70 leading-snug md:leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3 text-shadow-sm">
                      {anime.synopsis}
                    </p>
                    
                    <div className="flex items-center gap-2 md:gap-4 pt-1 md:pt-4">
                      <Link to={`/watch/${anime.slug}/1`}>
                        <Button size="lg" className="gap-1 md:gap-2 px-3 py-1.5 md:px-10 md:py-4 text-[7px] md:text-xs h-auto md:h-auto">
                          <Play className="w-2 h-2 md:w-4 md:h-4 fill-current" /> Watch Now
                        </Button>
                      </Link>
                      <Link to={`/anime/${anime.slug}`}>
                        <Button variant="secondary" size="lg" className="gap-1 md:gap-2 px-3 py-1.5 md:px-10 md:py-4 text-[7px] md:text-xs h-auto md:h-auto">
                          <Plus className="w-2 h-2 md:w-4 md:h-4" /> My List
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
      
      {/* Pagination Dots */}
      <div className="absolute bottom-2 md:bottom-6 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
        <div className="pointer-events-auto flex gap-1 md:gap-2">
          {featured.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={clsx(
                "h-0.5 md:h-1.5 rounded-full transition-all duration-300",
                index === selectedIndex ? "w-3 md:w-8 bg-yoru-accent" : "w-1 md:w-3 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
