import React, { useEffect, useState } from 'react';
import { Anime } from '../types';
import { getRecentlyAddedAnime } from '../lib/data';
import { AnimeCard } from '../components/AnimeCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { Clock, Sparkles, Film, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const RecentAnime = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      setIsLoading(true);
      // maxCount = 0 or -1 returns all items within the last 1 week
      const data = await getRecentlyAddedAnime(100);
      setAnimeList(data);
      setIsLoading(false);
    }
    loadRecent();
  }, []);

  return (
    <div className="min-h-screen bg-yoru-bg pb-24 pt-24 md:pt-28">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-accent mb-2">
              <Clock className="w-4 h-4" />
              <span>Last 7 Days</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Recently Added
            </h1>
            <p className="text-yoru-text-muted text-sm mt-1 max-w-xl">
              Freshly indexed anime added to YORU in the past 7 days.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
              {isLoading ? 'Checking...' : `${animeList.length} ${animeList.length === 1 ? 'Title' : 'Titles'}`}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <SkeletonAnimeCard key={i} />
            ))}
          </div>
        ) : animeList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {animeList.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-yoru-surface border border-yoru-border rounded-2xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-yoru-accent">
              <Film className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No New Additions This Week</h3>
              <p className="text-xs text-yoru-text-muted leading-relaxed">
                No new titles were added within the last 7 days. Check back soon or explore our comprehensive catalog!
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yoru-accent text-yoru-bg font-bold text-xs uppercase tracking-wider hover:bg-yoru-accent/90 transition-colors"
              >
                <span>Browse All Anime</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
