import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Anime } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { Bookmark, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

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
      <div className="min-h-screen bg-yoru-bg pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <Bookmark className="w-8 h-8 text-white/40" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Sign In Required</h2>
        <p className="text-yoru-text-muted max-w-sm">You need to sign in to view and manage your personal watchlist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yoru-bg pt-28 pb-24 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto">
      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
        <div className="p-2.5 bg-yoru-accent/10 rounded-lg">
          <Bookmark className="w-6 h-6 text-yoru-accent" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">My Watchlist</h1>
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
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4), ease: [0.23,1,0.32,1] }}
            >
              <AnimeCard anime={anime} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center flex flex-col items-center glass-panel rounded-2xl mx-auto max-w-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Bookmark className="w-8 h-8 text-white/50" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Your watchlist is empty</h3>
          <p className="text-sm font-medium text-yoru-text-muted mb-8">Find something great to watch and save it for later.</p>
          <Link to="/browse">
             <Button size="lg" className="gap-2 px-8">
               <Search className="w-4 h-4" /> Browse Anime
             </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
