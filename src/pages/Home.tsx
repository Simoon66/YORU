import React, { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { AnimeCard } from '../components/AnimeCard';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { Anime } from '../types';
import { getTrendingAnime, getAllAnime, getWatchHistory } from '../lib/data';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

interface HistoryItem {
  animeId: string;
  slug: string;
  title: string;
  coverImage: string;
  backdrop: string;
  episodeNumber: number;
  updatedAt: number;
}

export const Home = () => {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Anime[]>([]);
  const [latest, setLatest] = useState<Anime[]>([]);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [trendingData, allData] = await Promise.all([
        getTrendingAnime(),
        getAllAnime()
      ]);
      setTrending(trendingData);
      setLatest(allData); // In a real app, this would be a separate query sorting by createdAt
      
      try {
        if (user) {
          const h = await getWatchHistory(user.uid);
          setWatchHistory(h as any);
        } else {
          const history = localStorage.getItem('yoru_watch_history');
          if (history) setWatchHistory(JSON.parse(history).slice(0, 4));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
      
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const SectionHeader = ({ title, linkTo }: { title: string, linkTo?: string }) => (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-yoru-accent">
        {title}
      </h3>
      {linkTo && (
        <Link to={linkTo} className="flex items-center text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors">
          View All <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-yoru-bg pb-20">
         <div className="aspect-[16/9] sm:aspect-[21/9] md:aspect-auto md:h-[85vh] bg-yoru-surface-elevated flex items-center justify-center border-b border-yoru-border">
            <div className="shuriken-loader"></div>
         </div>
         <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-12 space-y-20">
            <section>
              <div className="h-4 w-32 bg-yoru-surface-elevated mb-6 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => <SkeletonAnimeCard key={i} />)}
              </div>
            </section>
            <section>
              <div className="h-4 w-48 bg-yoru-surface-elevated mb-6 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => <SkeletonAnimeCard key={i} />)}
              </div>
            </section>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yoru-bg pb-20">
      <Hero featured={trending.slice(0, 5)} />
      
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-12 space-y-20">
        
        {/* Continue Watching Section */}
        {watchHistory.length > 0 && (
          <section>
            <SectionHeader title="Continue Watching" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {watchHistory.map((item, index) => (
                <motion.div
                  key={item.animeId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ContinueWatchingCard item={item} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section>
          <SectionHeader title="Trending Now" linkTo="/browse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {trending.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Latest Releases Section */}
        <section>
          <SectionHeader title="Latest Releases" linkTo="/browse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {latest.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </div>
        </section>
        
      </div>
    </div>
  );
};
