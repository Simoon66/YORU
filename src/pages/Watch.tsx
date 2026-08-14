import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Anime, Episode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlaySquare, ChevronLeft, ChevronRight, Server, LayoutGrid, Info, Check } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';
import { WatchlistButton } from '../components/WatchlistButton';

export const Watch = () => {
  const { slug, episodeNum } = useParams();
  const [searchParams] = useSearchParams();
  const seasonParam = searchParams.get('season') || 's1';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [autoplay, setAutoplay] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !episodeNum) return;
      try {
        const q = query(collection(db, 'anime'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const animeData = querySnapshot.docs[0].data() as Anime;
          setAnime(animeData);
          
          const epQ = query(collection(db, 'episodes'), where('animeId', '==', animeData.id));
          const epSnap = await getDocs(epQ);
          const allEps = epSnap.docs.map(d => d.data() as Episode);
          setEpisodes(allEps);
          
          const matchingEps = allEps.filter(e => 
            e.episodeNumber === parseInt(episodeNum) && 
            e.seasonId === seasonParam
          );
          
          if (matchingEps.length > 0) {
            const savedType = localStorage.getItem('preferredServerType') || 'sub';
            const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
            
            let selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType && e.serverName === savedName);
            
            if (!selectedEp) {
              selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType);
            }
            
            if (!selectedEp) {
              selectedEp = matchingEps[0];
            }
            
            setCurrentEpisode(selectedEp);
          }

          if (user) {
            const progressRef = doc(db, 'watchProgress', `${user.uid}_${animeData.id}`);
            const progressDoc = await getDoc(progressRef);
            if (progressDoc.exists()) {
              setWatchedEpisodes(progressDoc.data().watchedEpisodeIds || []);
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, episodeNum, seasonParam, user]);

  useEffect(() => {
    if (currentEpisode && anime) {
      const markWatched = async () => {
        const newWatched = Array.from(new Set([...watchedEpisodes, currentEpisode.id]));
        setWatchedEpisodes(newWatched);
        
        // LocalStorage for Guests & Backup
        try {
          const history = JSON.parse(localStorage.getItem('yoru_watch_history') || '[]');
          const newHistoryItem = {
            animeId: anime.id,
            slug: anime.slug,
            title: anime.title,
            coverImage: anime.poster,
            backdrop: anime.backdrop,
            episodeNumber: currentEpisode.episodeNumber,
            updatedAt: Date.now()
          };
          const existingIdx = history.findIndex((h) => h.animeId === anime.id);
          if (existingIdx !== -1) history.splice(existingIdx, 1);
          history.unshift(newHistoryItem);
          localStorage.setItem('yoru_watch_history', JSON.stringify(history.slice(0, 10)));
        } catch (e) {
          console.error("Local storage save error", e);
        }

        // Firestore for Logged-In Users
        if (user) {
          const progressRef = doc(db, 'watchProgress', `${user.uid}_${anime.id}`);
          await setDoc(progressRef, {
            userId: user.uid,
            animeId: anime.id,
            watchedEpisodeIds: newWatched,
            lastWatchedEpisode: currentEpisode.id,
            updatedAt: Date.now()
          }, { merge: true });
        }
      };
      
      const timer = setTimeout(markWatched, 5000); // 5 seconds for faster testing (usually 30s)
      return () => clearTimeout(timer);
    }
  }, [currentEpisode, user, anime]);

  if (loading) return (
    <div className="min-h-screen bg-yoru-bg flex items-center justify-center cinematic-vignette">
      <div className="shuriken-loader"></div>
    </div>
  );

  if (!anime || !currentEpisode) return (
    <div className="min-h-screen bg-yoru-bg flex items-center justify-center text-white">
       <div className="text-center space-y-4">
         <Info className="w-12 h-12 text-yoru-text-muted mx-auto" />
         <h2 className="text-2xl font-bold uppercase tracking-widest">Episode Not Found</h2>
       </div>
    </div>
  );

  const currentSeasonInfo = anime.seasons?.find(s => s.id === seasonParam);
  
  const seasonEpisodes = episodes.filter(e => e.seasonId === seasonParam);
  const uniqueEpisodes = Array.from(new Set(seasonEpisodes.map(e => e.episodeNumber)))
    .map(num => seasonEpisodes.find(e => e.episodeNumber === num)!)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  const currentEpisodeServers = episodes.filter(e => 
    e.episodeNumber === currentEpisode.episodeNumber && 
    e.seasonId === currentEpisode.seasonId
  );

  const handleServerChange = (epId: string) => {
    const newEp = currentEpisodeServers.find(ep => ep.id === epId);
    if (newEp) {
      setCurrentEpisode(newEp);
      if (newEp.serverType) localStorage.setItem('preferredServerType', newEp.serverType);
      if (newEp.serverName) localStorage.setItem('preferredServerName', newEp.serverName);
    }
  };

  const currentIndex = uniqueEpisodes.findIndex(e => e.episodeNumber === currentEpisode.episodeNumber);
  const nextEpisode = currentIndex < uniqueEpisodes.length - 1 ? uniqueEpisodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? uniqueEpisodes[currentIndex - 1] : null;

  return (
    <div className="min-h-screen bg-yoru-bg pt-[60px] md:pt-[72px] pb-24">
      <div className="w-full max-w-[1440px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8 flex flex-col gap-0 md:gap-8">
        
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-widest truncate text-white/50 px-4 md:px-0">
             <Link to={`/anime/${anime.slug}`} className="hover:text-white transition-colors truncate">
               {anime.title}
             </Link>
             <span className="text-white/20">/</span>
             <span className="text-yoru-accent truncate">EP {currentEpisode.episodeNumber}</span>
        </div>

        <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-4 md:gap-6">
        {/* 1. Player */}
        <div className="relative aspect-video w-full bg-[#030407] md:rounded-2xl overflow-hidden md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b md:border border-white/5 ring-0 md:ring-1 ring-white/5">
            <iframe
              src={currentEpisode.embedLink}
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
        </div>

        {/* 2. Episode Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 md:p-6 md:glass-panel md:rounded-2xl md:border border-white/5 bg-yoru-surface/30 md:bg-transparent">
              <div className="space-y-3 min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-wider md:tracking-widest text-white leading-tight break-words line-clamp-2 md:line-clamp-none">
                  {anime.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
                  <span>{currentSeasonInfo?.name || 'Season 1'}</span>
                  <span className="text-white/20">•</span>
                  <span>Episode <span className="text-white">{currentEpisode.episodeNumber}</span></span>
                  {currentEpisode.isFiller && (
                    <span className="px-2 py-0.5 rounded bg-yoru-warning/20 text-yoru-warning border border-yoru-warning/30 ml-2 shadow-sm">Filler</span>
                  )}
                </div>
              </div>

              {/* Autoplay & Navigation */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap sm:flex-nowrap">
                 <WatchlistButton animeId={anime.id} size="icon" variant="secondary" className="w-10 h-10 rounded-full" showText={false} />
                 <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted group-hover:text-white transition-colors">Auto Play</span>
                   <div className={clsx("w-9 h-5 rounded-full relative transition-colors duration-300", autoplay ? "bg-yoru-accent" : "bg-white/10 border border-white/20")}>
                     <div className={clsx(
                       "absolute top-[2px] w-4 h-4 rounded-full shadow-md transition-all duration-300",
                       autoplay ? "left-[18px] bg-black" : "left-[2px] bg-white"
                     )} />
                   </div>
                   <input type="checkbox" className="hidden" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
                 </label>

                 <div className="flex items-center gap-3">
                   <Button 
                     variant="secondary" 
                     size="icon" 
                     disabled={!prevEpisode}
                     onClick={() => prevEpisode && navigate(`/watch/${anime.slug}/${prevEpisode.episodeNumber}?season=${seasonParam}`)}
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </Button>
                   <Button 
                     variant="secondary" 
                     size="icon" 
                     disabled={!nextEpisode}
                     onClick={() => nextEpisode && navigate(`/watch/${anime.slug}/${nextEpisode.episodeNumber}?season=${seasonParam}`)}
                   >
                     <ChevronRight className="w-5 h-5" />
                   </Button>
                 </div>
              </div>
        </div>

        {/* 3. Server Selector */}
        <div className="flex flex-col gap-6 mt-2 px-4 md:px-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2 border-b border-white/5 pb-2">
              <Server className="w-4 h-4" /> Servers
            </span>
            <div className="flex flex-col gap-4">
              {['sub', 'dub', 'multi'].map((type) => {
                const serversOfType = currentEpisodeServers.filter(ep => (ep.serverType === type) || (!ep.serverType && type === 'sub'));
                if (serversOfType.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/50 w-16">
                      {type}:
                    </span>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {serversOfType.map(serverEp => (
                        <button
                          key={serverEp.id}
                          onClick={() => handleServerChange(serverEp.id)}
                          className={clsx(
                            "min-h-[40px] px-5 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ease-out border",
                            currentEpisode.id === serverEp.id
                              ? "bg-yoru-accent text-[#030407] border-yoru-accent shadow-[0_4px_10px_rgba(226,232,240,0.2)] scale-100"
                              : "bg-yoru-surface-elevated text-yoru-text-muted border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]"
                          )}
                        >
                          {serverEp.serverName || 'Default'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>

        </div>
        {/* 4. Season Selector */}
        {anime.seasons && anime.seasons.length > 1 && (
            <div className="flex flex-col gap-4 mt-4 px-4 md:px-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Seasons
              </span>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                  {anime.seasons.sort((a,b)=>a.order-b.order).map(s => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/watch/${anime.slug}/${currentEpisode.episodeNumber}?season=${s.id}`)}
                      className={clsx(
                        "min-h-[44px] px-6 py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ease-out border flex-shrink-0",
                        seasonParam === s.id 
                          ? "bg-white text-[#030407] border-white shadow-[0_4px_10px_rgba(255,255,255,0.2)]"
                          : "bg-yoru-surface-elevated text-yoru-text-muted border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
              </div>
            </div>
        )}

        {/* 5. Episode Grid */}
        <div className="flex flex-col gap-4 mt-4 px-4 md:px-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2">
              <PlaySquare className="w-4 h-4" /> Episodes
          </span>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2 md:gap-3">
             {uniqueEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisode.episodeNumber;
                const episodeServersIds = episodes.filter(e => e.episodeNumber === ep.episodeNumber && e.seasonId === ep.seasonId).map(e => e.id);
                const isWatched = episodeServersIds.some(id => watchedEpisodes.includes(id));
                const isFiller = ep.isFiller;

                let bgClass = "bg-yoru-surface-elevated border-white/5 text-yoru-text hover:border-white/20 hover:text-white hover:-translate-y-[2px] active:scale-[0.98]";
                
                if (isActive) {
                  bgClass = "bg-yoru-accent text-[#030407] border-yoru-accent shadow-[0_4px_10px_rgba(226,232,240,0.2)]";
                } else if (isWatched) {
                  bgClass = "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]";
                } else if (isFiller) {
                  bgClass = "bg-[#1f1a18] border-yoru-warning/30 text-yoru-warning/80 hover:border-yoru-warning/60 hover:text-yoru-warning hover:-translate-y-[2px] active:scale-[0.98]";
                }

                return (
                                    <Link
                    key={ep.id}
                    to={`/watch/${anime.slug}/${ep.episodeNumber}?season=${seasonParam}`}
                    className={clsx(
                      "flex items-center justify-center aspect-square min-h-[44px] rounded-lg border font-bold text-xs md:text-sm transition-all duration-200 ease-out relative overflow-hidden group",
                      bgClass
                    )}
                    title={ep.title || `Episode ${ep.episodeNumber}`}
                  >
                    <span className="relative z-10">{ep.episodeNumber}</span>
                    {isWatched && !isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-4 h-4 text-white/70" />
                      </div>
                    )}
                  </Link>
                );
             })}
          </div>
        </div>

        {/* 6. Comments */}
        <div className="mt-12 border-t border-white/5 pt-8">
          <div className="px-4 md:px-0"><CommentSection animeId={anime.id} episodeId={currentEpisode.id} /></div>
        </div>
        
      </div>
    </div>
  );
};
