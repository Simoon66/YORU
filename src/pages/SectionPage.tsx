import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Anime } from '../types';
import { getAllAnime, getAnimeReleaseTimestamp, getAnimeEndTimestamp } from '../lib/data';
import { AnimeCard } from '../components/AnimeCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { Sparkles, ArrowRight, Film, Clock, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const SectionPage = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getAllAnime();
        setAllAnime(data);
      } catch (err) {
        console.error("Failed to load anime data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const sectionDetails = useMemo(() => {
    switch (sectionId) {
      case 'latest-releases':
        return { title: 'Latest Releases', icon: Flame, description: 'Newly released anime from the last 7 days.' };
      case 'recently-added':
        return { title: 'Recently Added', icon: Clock, description: 'Anime recently added to our catalog in the last 7 days.' };
      case 'latest-completed':
        return { title: 'Latest Completed', icon: Sparkles, description: 'TV series that finished airing in the last 7 days.' };
      case 'latest-movies':
        return { title: 'Latest Movies', icon: Film, description: 'Movies added or released in the last 7 days.' };
      default:
        return { title: 'Anime Section', icon: Sparkles, description: 'Discover anime' };
    }
  }, [sectionId]);

  const filteredAnimeList = useMemo(() => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let list: Anime[] = [];

    if (sectionId === 'latest-releases') {
      list = [...allAnime].filter(a => {
        const ts = getAnimeReleaseTimestamp(a);
        return ts >= now - SEVEN_DAYS_MS && ts <= now;
      }).sort((a, b) => getAnimeReleaseTimestamp(b) - getAnimeReleaseTimestamp(a));
    } else if (sectionId === 'recently-added') {
      list = [...allAnime].filter(a => {
        const ts = a.recentlyAddedAt || a.createdAt || 0;
        return ts >= now - SEVEN_DAYS_MS && ts <= now + 86400000; // allow slightly future
      }).sort((a, b) => {
        const timeA = a.recentlyAddedAt || a.createdAt || 0;
        const timeB = b.recentlyAddedAt || b.createdAt || 0;
        return timeB - timeA;
      });
    } else if (sectionId === 'latest-completed') {
      list = [...allAnime].filter(a => {
        const isFinished = (a.status || '').toLowerCase() === 'finished';
        const isTV = (a.format || 'TV').toUpperCase() === 'TV';
        const ts = getAnimeEndTimestamp(a);
        return isFinished && isTV && ts >= now - SEVEN_DAYS_MS && ts <= now;
      }).sort((a, b) => getAnimeEndTimestamp(b) - getAnimeEndTimestamp(a));
    } else if (sectionId === 'latest-movies') {
      list = [...allAnime].filter(a => {
        const isMovie = (a.format || '').toUpperCase() === 'MOVIE';
        const ts = a.recentlyAddedAt || a.createdAt || getAnimeReleaseTimestamp(a);
        return isMovie && ts >= now - SEVEN_DAYS_MS && ts <= now + 86400000;
      }).sort((a, b) => {
        const timeA = a.recentlyAddedAt || a.createdAt || getAnimeReleaseTimestamp(a);
        const timeB = b.recentlyAddedAt || b.createdAt || getAnimeReleaseTimestamp(b);
        return timeB - timeA;
      });
    }

    return list;
  }, [allAnime, sectionId]);

  const Icon = sectionDetails.icon;

  return (
    <div className="min-h-screen bg-yoru-bg pb-24 pt-24 md:pt-28">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-accent mb-2">
              <Icon className="w-4 h-4" />
              <span>Section</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {sectionDetails.title}
            </h1>
            <p className="text-yoru-text-muted text-sm mt-1 max-w-2xl">
              {sectionDetails.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
              {isLoading ? 'Loading...' : `${filteredAnimeList.length} ${filteredAnimeList.length === 1 ? 'Title' : 'Titles'}`}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <SkeletonAnimeCard key={i} />
            ))}
          </div>
        ) : filteredAnimeList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredAnimeList.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
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
              <h3 className="text-lg font-bold text-white">No Matching Releases</h3>
              <p className="text-xs text-yoru-text-muted leading-relaxed">
                No anime found in this section from the last 7 days.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
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
