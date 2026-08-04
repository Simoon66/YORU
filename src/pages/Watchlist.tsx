import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Anime } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { getAnimeBySlug } from '../lib/data';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { Bookmark, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Watchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlist() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(collection(db, 'watchlist'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const animeIds = snap.docs.map(d => d.data().animeId);
        
        // We'll need to fetch the anime details for these IDs. 
        // In a real app, you might duplicate some anime data in the watchlist doc for faster reads,
        // or do a where('id', 'in', animeIds) query if <= 10.
        // For this demo, let's just fetch all anime and filter.
        const allAnimeSnap = await getDocs(collection(db, 'anime'));
        const allAnime = allAnimeSnap.docs.map(d => ({ id: d.id, ...d.data() } as Anime));
        
        const myAnime = allAnime.filter(a => animeIds.includes(a.id));
        setWatchlist(myAnime);
      } catch (e) {
        console.error("Error loading watchlist", e);
      }
      setIsLoading(false);
    }
    loadWatchlist();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-yoru-bg pt-32 pb-20 px-4 flex flex-col items-center text-center">
        <Bookmark className="w-16 h-16 text-yoru-text-muted mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-yoru-text-muted max-w-md">You need to sign in to view and manage your personal watchlist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yoru-bg pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-6 h-6 text-yoru-accent" />
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">My Watchlist</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
           {[...Array(6)].map((_, i) => (
             <SkeletonAnimeCard key={i} />
           ))}
        </div>
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {watchlist.map((anime, idx) => (
            <motion.div
               key={anime.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
            >
              <AnimeCard anime={anime} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yoru-surface-elevated mb-6">
            <Bookmark className="w-10 h-10 text-yoru-text-muted" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-yoru-text-muted mb-6">Find something great to watch and save it for later.</p>
          <Link to="/browse" className="bg-yoru-accent hover:bg-yoru-accent/90 text-white px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Browse Anime
          </Link>
        </div>
      )}
    </div>
  );
};
