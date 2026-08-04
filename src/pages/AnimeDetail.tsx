import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Anime, Episode } from '../types';
import { getAnimeBySlug, getEpisodesForAnime } from '../lib/data';
import { Play, Plus, MonitorPlay, Star, Calendar, Clock, Film, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

export const AnimeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistDocId, setWatchlistDocId] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setIsLoading(true);
      const data = await getAnimeBySlug(slug);
      setAnime(data);
      if (data) {
        const eps = await getEpisodesForAnime(data.id);
        setEpisodes(eps);
      }
      setIsLoading(false);
    }
    loadData();
  }, [slug]);

  useEffect(() => {
    async function checkWatchlist() {
      if (!user || !anime) {
        setIsWatchlisted(false);
        setWatchlistDocId(null);
        return;
      }
      try {
        const q = query(
          collection(db, 'watchlist'), 
          where('userId', '==', user.uid),
          where('animeId', '==', anime.id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsWatchlisted(true);
          setWatchlistDocId(snap.docs[0].id);
        } else {
          setIsWatchlisted(false);
          setWatchlistDocId(null);
        }
      } catch (e) {
        console.error("Error checking watchlist", e);
      }
    }
    checkWatchlist();
  }, [user, anime]);

  const toggleWatchlist = async () => {
    if (!user || !anime) {
      alert("Please sign in to add to your watchlist.");
      return;
    }
    
    setIsWatchlistLoading(true);
    try {
      if (isWatchlisted && watchlistDocId) {
        await deleteDoc(doc(db, 'watchlist', watchlistDocId));
        setIsWatchlisted(false);
        setWatchlistDocId(null);
      } else {
        const docRef = await addDoc(collection(db, 'watchlist'), {
          userId: user.uid,
          animeId: anime.id,
          createdAt: Date.now()
        });
        setIsWatchlisted(true);
        setWatchlistDocId(docRef.id);
      }
    } catch (e) {
      console.error("Error toggling watchlist", e);
      alert("An error occurred while updating your watchlist.");
    }
    setIsWatchlistLoading(false);
  };

  if (isLoading) return <div className="min-h-screen bg-yoru-bg animate-pulse" />;
  
  if (!anime) return (
    <div className="min-h-screen flex items-center justify-center bg-yoru-bg text-yoru-text-muted">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Not Found</h2>
        <p>The anime you are looking for does not exist.</p>
        <Link to="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-yoru-bg pb-20">
      {/* Backdrop Header */}
      <div className="relative h-[50vh] md:h-[60vh] w-full">
        <img src={anime.backdrop} alt={anime.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-yoru-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-yoru-bg via-yoru-bg/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Poster */}
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
             <img 
               src={anime.poster} 
               alt={anime.title} 
               className="w-full rounded-xl shadow-2xl shadow-black/50 border border-yoru-border"
             />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6 text-center md:text-left mt-4 md:mt-12">
             <div className="space-y-2">
               <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{anime.title}</h1>
               {anime.nativeTitle && (
                 <p className="text-yoru-text-muted italic">{anime.nativeTitle}</p>
               )}
             </div>

             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted">
                {anime.format && (
                  <span className="px-3 py-1 bg-yoru-surface-elevated border border-yoru-border rounded-none flex items-center gap-1">
                    <Film className="w-3 h-3" /> {anime.format}
                  </span>
                )}
                {anime.averageScore && (
                  <span className="px-3 py-1 bg-yoru-surface-elevated border border-yoru-border rounded-none flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" /> {anime.averageScore}
                  </span>
                )}
                {anime.status && (
                  <span className="px-3 py-1 bg-yoru-surface-elevated border border-yoru-border rounded-none">
                    {anime.status}
                  </span>
                )}
                {anime.season && (
                  <span className="px-3 py-1 bg-yoru-surface-elevated border border-yoru-border rounded-none flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {anime.season}
                  </span>
                )}
                <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3" /> {anime.totalEpisodes} Episodes</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {anime.episodeDuration}</span>
             </div>

             <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {anime.genres.map(g => (
                  <span key={g} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-yoru-accent/10 text-yoru-accent border border-yoru-accent/20 rounded-none">
                    {g}
                  </span>
                ))}
             </div>

             <div className="text-sm text-yoru-text-muted font-medium flex gap-4 justify-center md:justify-start">
               {anime.studios && <div><span className="text-yoru-text">Studios:</span> {anime.studios}</div>}
               {anime.startDate && <div><span className="text-yoru-text">Aired:</span> {anime.startDate} {anime.endDate ? `to ${anime.endDate}` : ''}</div>}
             </div>

             <p className="text-yoru-text leading-relaxed max-w-3xl line-clamp-6 hover:line-clamp-none transition-all">
               {anime.synopsis}
             </p>

             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                {episodes.length > 0 ? (
                  <Link to={`/watch/${anime.slug}/${episodes[0].episodeNumber}`}>
                    <Button size="lg" className="gap-2">
                      <Play className="w-4 h-4 fill-current" /> Play Episode 1
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" disabled className="gap-2">
                    Coming Soon
                  </Button>
                )}
                
                <Button 
                  variant={isWatchlisted ? "outline" : "secondary"} 
                  size="lg" 
                  className="gap-2"
                  onClick={toggleWatchlist}
                  disabled={isWatchlistLoading}
                >
                  {isWatchlistLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isWatchlisted ? (
                    <><Check className="w-4 h-4 text-yoru-accent" /> In Watchlist</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to Watchlist</>
                  )}
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
