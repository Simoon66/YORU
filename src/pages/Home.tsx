import React, { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { AnimeCard } from '../components/AnimeCard';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { HorizontalAnimeRow } from '../components/HorizontalAnimeRow';
import { Anime } from '../types';
import { 
  getTrendingAnime, 
  getAllAnime, 
  getRecentlyAddedAnime, 
  getLatestReleasesAnime, 
  getLatestCompletedAnime, 
  getLatestMovies, 
  getWatchHistory, 
  clearWatchHistory, 
  removeWatchHistoryItem 
} from '../lib/data';
import { ChevronRight, Trash2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

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
  const [latestReleases, setLatestReleases] = useState<Anime[]>([]);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Anime[]>([]);
  const [latestCompleted, setLatestCompleted] = useState<Anime[]>([]);
  const [latestMovies, setLatestMovies] = useState<Anime[]>([]);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [allData, trendingData, recentData] = await Promise.all([
        getAllAnime(),
        getTrendingAnime(10),
        getRecentlyAddedAnime(10)
      ]);

      const releases = getLatestReleasesAnime(allData, 10);
      const completed = getLatestCompletedAnime(allData, 10);
      const movies = getLatestMovies(allData, 10);

      setLatestReleases(releases);
      setTrending(trendingData);
      setRecentlyAdded(recentData);
      setLatestCompleted(completed);
      setLatestMovies(movies);
      
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

  const [isClearMode, setIsClearMode] = useState(false);

  const handleClearAllHistory = async () => {
    setIsClearing(true);
    await clearWatchHistory(user?.uid);
    setWatchHistory([]);
    setIsClearing(false);
    setIsClearMode(false);
  };

  const handleRemoveSingleItem = async (animeId: string) => {
    setWatchHistory(prev => {
      const updated = prev.filter(item => item.animeId !== animeId);
      if (updated.length === 0) {
        setIsClearMode(false);
      }
      return updated;
    });
    await removeWatchHistoryItem(animeId, user?.uid);
  };

  const SectionHeader = ({ title, linkTo, action }: { title: string, linkTo?: string, action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-sm font-semibold tracking-wide text-yoru-accent">
        {title}
      </h2>
      <div className="flex items-center gap-4">
        {action}
        {linkTo && (
          <Link to={linkTo} className="flex items-center text-xs font-medium text-yoru-text-muted hover:text-white transition-colors">
            View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
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
    <main className="min-h-screen bg-yoru-bg pb-20">
      <h1 className="sr-only">YORU — Stream Anime Online</h1>
      <Hero featured={trending.slice(0, 5)} />
      
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-12 space-y-20">
        
        {/* Continue Watching Section */}
        {watchHistory.length > 0 && (
          <section>
            <SectionHeader 
              title="Continue Watching" 
              action={
                isClearMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAllHistory}
                      disabled={isClearing}
                      aria-label="Clear all watch history?"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400/30"
                      title="Clear all watch history?"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isClearing ? 'Clearing...' : 'Clear all watch history?'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsClearMode(false)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium text-yoru-text-muted hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsClearMode(true)}
                    disabled={isClearing}
                    aria-label="Clear history"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-yoru-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/30"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear History</span>
                  </button>
                )
              }
            />
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-6 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <AnimatePresence>
                {watchHistory.map((item) => (
                  <motion.div
                    key={item.animeId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, width: 0, marginLeft: 0, marginRight: 0, padding: 0 }}
                    transition={{ duration: 0.25 }}
                    className="min-w-[280px] sm:min-w-[320px] snap-start"
                  >
                    <ContinueWatchingCard 
                      item={item} 
                      showRemove={isClearMode}
                      onRemove={handleRemoveSingleItem}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* 1. Latest Releases (sorted by release date) */}
        {latestReleases.length > 0 && (
          <section id="latest-releases-section">
            <SectionHeader title="Latest Releases" linkTo="/browse?sort=release" />
            <HorizontalAnimeRow animeList={latestReleases} maxItems={10} />
          </section>
        )}

        {/* 2. Trending (Top 10 most watched, Netflix style numbers, no view more) */}
        {trending.length > 0 && (
          <section id="trending-section">
            <SectionHeader title="Trending" />
            <HorizontalAnimeRow animeList={trending} maxItems={10} showRank={true} />
          </section>
        )}

        {/* 3. Recently Added (recently added to the site) */}
        {recentlyAdded.length > 0 && (
          <section id="recently-added-section">
            <SectionHeader title="Recently Added" linkTo="/recent" />
            <HorizontalAnimeRow animeList={recentlyAdded} maxItems={10} />
          </section>
        )}

        {/* 4. Latest Completed (finished TV series, sorted by finish date) */}
        {latestCompleted.length > 0 && (
          <section id="latest-completed-section">
            <SectionHeader title="Latest Completed" linkTo="/browse?status=finished&format=tv" />
            <HorizontalAnimeRow animeList={latestCompleted} maxItems={10} />
          </section>
        )}

        {/* 5. Latest Movie (latest added movies) */}
        {latestMovies.length > 0 && (
          <section id="latest-movies-section">
            <SectionHeader title="Latest Movie" linkTo="/browse?format=movie" />
            <HorizontalAnimeRow animeList={latestMovies} maxItems={10} />
          </section>
        )}
        
      </div>
    </main>
  );
};
