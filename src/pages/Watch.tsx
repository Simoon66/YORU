import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Anime, Episode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Maximize, SkipBack, SkipForward, Server, Flag, Lightbulb, PlayCircle, Loader2, Check } from 'lucide-react';
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
  const [autoNext, setAutoNext] = useState(true);
  const [isLightDimmed, setIsLightDimmed] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLightDimmed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightDimmed]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [currentEpisode?.embedLink]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
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
          
          let targetEpisodeNum = episodeNum ? parseInt(episodeNum) : null;
          let targetSeasonId = seasonParam;

          // Smart Resume Logic
          if (!episodeNum) {
            let lastWatchedId = null;
            if (user) {
              const progressRef = doc(db, 'watchProgress', `${user.uid}_${animeData.id}`);
              const progressDoc = await getDoc(progressRef);
              if (progressDoc.exists()) {
                const data = progressDoc.data();
                lastWatchedId = data.lastWatchedEpisode;
                setWatchedEpisodes(data.watchedEpisodeIds || []);
              }
            } else {
               const history = JSON.parse(localStorage.getItem('yoru_watch_history') || '[]');
               const item = history.find((h: any) => h.animeId === animeData.id);
               if (item) {
                 targetEpisodeNum = item.episodeNumber;
               }
            }
            
            if (lastWatchedId) {
                const lastWatchedEp = allEps.find(e => e.id === lastWatchedId);
                if (lastWatchedEp) {
                   targetEpisodeNum = lastWatchedEp.episodeNumber;
                   targetSeasonId = lastWatchedEp.seasonId;
                }
            }

            if (!targetEpisodeNum && allEps.length > 0) {
                const firstEps = allEps.sort((a, b) => a.episodeNumber - b.episodeNumber);
                targetEpisodeNum = firstEps[0].episodeNumber;
                targetSeasonId = firstEps[0].seasonId;
            }
            
            if (targetEpisodeNum) {
               navigate(`/watch/${animeData.slug}/${targetEpisodeNum}?season=${targetSeasonId}`, { replace: true });
               return; 
            }
          }

          if (user) {
            const progressRef = doc(db, 'watchProgress', `${user.uid}_${animeData.id}`);
            const progressDoc = await getDoc(progressRef);
            if (progressDoc.exists()) {
              setWatchedEpisodes(progressDoc.data().watchedEpisodeIds || []);
            }
          }
          
          // Find current episode
          if (targetEpisodeNum) {
            const matchingEps = allEps.filter(e => 
              e.episodeNumber === targetEpisodeNum && 
              e.seasonId === targetSeasonId
            );
            
            if (matchingEps.length > 0) {
              const savedType = localStorage.getItem('preferredServerType') || 'sub';
              const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
              
              let selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType && e.serverName === savedName);
              if (!selectedEp) selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType);
              if (!selectedEp) selectedEp = matchingEps[0];
              
              setCurrentEpisode(selectedEp);
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
  }, [slug, episodeNum, seasonParam, user, navigate]);

  useEffect(() => {
    if (currentEpisode && anime) {
      const markWatched = async () => {
        const newWatched = Array.from(new Set([...watchedEpisodes, currentEpisode.id]));
        setWatchedEpisodes(newWatched);
        
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
          const existingIdx = history.findIndex((h: any) => h.animeId === anime.id);
          if (existingIdx !== -1) history.splice(existingIdx, 1);
          history.unshift(newHistoryItem);
          localStorage.setItem('yoru_watch_history', JSON.stringify(history.slice(0, 10)));
        } catch (e) {
          console.error("Local storage save error", e);
        }

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
      
      const timer = setTimeout(markWatched, 5000); 
      return () => clearTimeout(timer);
    }
  }, [currentEpisode, user, anime]);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-yoru-accent animate-spin" />
    </div>
  );

  if (!anime || !currentEpisode) return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center text-white">
       <div className="text-center space-y-4">
         <h2 className="text-2xl font-bold uppercase tracking-widest text-yoru-text-muted">Episode Not Found</h2>
       </div>
    </div>
  );

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

  const toggleTheaterMode = () => setIsTheaterMode(!isTheaterMode);

  const isCompact = uniqueEpisodes.length > 100;

  return (
    <div className={clsx("min-h-screen pt-[60px] md:pt-[72px] pb-24 transition-colors duration-500", isLightDimmed ? "bg-[#030407]" : "bg-[#0A0B0E]")}>
      
      {/* Light Dimmer Overlay */}
      {isLightDimmed && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9990] transition-opacity duration-500 cursor-pointer" 
          onClick={() => setIsLightDimmed(false)}
        />
      )}

      <div className="w-full flex flex-col relative">
        
        {/* TOP SECTION: Player & Toolbar */}
        <div className={clsx("w-full mx-auto transition-all duration-500 flex flex-col",
          isTheaterMode ? "max-w-full" : "max-w-[1440px] px-0 md:px-6 lg:px-8 pt-0 md:pt-8"
        )}>
          <div className={clsx("w-full mx-auto flex flex-col bg-[#0F1117] shadow-2xl transition-all duration-500",
            !isLightDimmed && "overflow-hidden",
            isTheaterMode ? "max-w-full rounded-none border-0" : "max-w-[1100px] rounded-none md:rounded-2xl border-0 md:border border-white/5"
          )}>
            {/* Player */}
            <div className={clsx("relative w-full bg-black transition-all duration-500", 
              isTheaterMode ? "h-[40vh] sm:h-[60vh] md:h-[75vh] lg:h-[85vh] max-h-[calc(100vh-60px)] md:max-h-[calc(100vh-80px)]" : "aspect-video max-h-[calc(100vh-60px)] md:max-h-[calc(100vh-80px)]",
              isLightDimmed ? "z-[9999]" : "z-10"
            )}>
              {!iframeLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-yoru-accent animate-spin mb-4" />
                  <p className="text-white/70 text-sm font-medium animate-pulse tracking-wide">Loading video player...</p>
                </div>
              )}
              <iframe
                src={autoplay ? (currentEpisode.embedLink.includes('?') ? `${currentEpisode.embedLink}&autoplay=1&autoPlay=1` : `${currentEpisode.embedLink}?autoplay=1&autoPlay=1`) : currentEpisode.embedLink}
                allowFullScreen
                className={clsx(
                  "absolute inset-0 w-full h-full border-0 transition-opacity duration-500",
                  iframeLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIframeLoaded(true)}
              />
            </div>

            {/* Quick Control Ribbon */}
            <div className="flex flex-wrap items-center justify-between p-3 md:p-4 gap-4 bg-[#0F1117] relative z-10">
              <div className="flex items-center gap-4">
                <button onClick={toggleTheaterMode} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors">
                  <Maximize className="w-4 h-4" /> <span className="hidden sm:inline">{isTheaterMode ? 'Collapse' : 'Expand'}</span>
                </button>
                
                <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                
                <label className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.preventDefault(); setAutoplay(!autoplay); }}>
                  <div className={clsx("w-7 h-4 rounded-full relative transition-colors duration-300", autoplay ? "bg-yoru-accent" : "bg-white/10")}>
                    <div className={clsx("absolute top-[2px] w-3 h-3 rounded-full shadow-md transition-all duration-300", autoplay ? "left-[14px] bg-black" : "left-[2px] bg-white")} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted group-hover:text-white transition-colors">Auto Play</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.preventDefault(); setAutoNext(!autoNext); }}>
                  <div className={clsx("w-7 h-4 rounded-full relative transition-colors duration-300", autoNext ? "bg-yoru-accent" : "bg-white/10")}>
                    <div className={clsx("absolute top-[2px] w-3 h-3 rounded-full shadow-md transition-all duration-300", autoNext ? "left-[14px] bg-black" : "left-[2px] bg-white")} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted group-hover:text-white transition-colors hidden sm:inline">Auto Next</span>
                </label>

                <button onClick={() => setIsLightDimmed(!isLightDimmed)} className={clsx("flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors", isLightDimmed ? "text-yoru-accent" : "text-yoru-text-muted hover:text-white")}>
                  <Lightbulb className={clsx("w-4 h-4", isLightDimmed && "fill-yoru-accent")} /> <span className="hidden sm:inline">Light</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  disabled={!prevEpisode}
                  onClick={() => prevEpisode && navigate(`/watch/${anime.slug}/${prevEpisode.episodeNumber}?season=${seasonParam}`)}
                  className="p-1.5 text-yoru-text-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  disabled={!nextEpisode}
                  onClick={() => nextEpisode && navigate(`/watch/${anime.slug}/${nextEpisode.episodeNumber}?season=${seasonParam}`)}
                  className="p-1.5 text-yoru-text-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
                <div className="h-4 w-px bg-white/10 hidden sm:block mx-1"></div>
                <button className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
                <div className="hidden sm:block">
                  <WatchlistButton animeId={anime.id} size="sm" variant="secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Servers & Episodes */}
        <div className="w-full max-w-[1440px] mx-auto px-0 md:px-6 lg:px-8 mt-2 md:mt-8">
           <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-2 md:gap-4">

          {/* 2. Server Selection Hub */}
          <div className="bg-[#0F1117] md:rounded-2xl p-4 md:p-6 border-b md:border border-white/5 flex flex-col gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted">
               <Server className="w-3.5 h-3.5" /> Servers
             </div>
             
             <div className="flex flex-col gap-3">
               {['sub', 'dub', 'multi'].map((type) => {
                 const serversOfType = currentEpisodeServers.filter(ep => (ep.serverType === type) || (!ep.serverType && type === 'sub'));
                 if (serversOfType.length === 0) return null;
                 return (
                   <div key={type} className="flex items-center gap-3">
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 w-12 shrink-0">
                       {type}:
                     </span>
                     <div className="flex flex-wrap gap-2">
                       {serversOfType.map(serverEp => (
                         <button
                           key={serverEp.id}
                           onClick={() => handleServerChange(serverEp.id)}
                           className={clsx(
                             "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 border",
                             currentEpisode.id === serverEp.id
                               ? "bg-yoru-accent/10 text-yoru-accent border-yoru-accent shadow-[0_0_10px_rgba(244,117,33,0.1)]"
                               : "bg-white/5 text-yoru-text-muted border-transparent hover:bg-white/10 hover:text-white"
                           )}
                         >
                           {serverEp.serverName || 'HD-1'}
                         </button>
                       ))}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* 3. Dynamic Episode Selector */}
          <div className="bg-[#0F1117] md:rounded-2xl p-4 md:p-6 border-b md:border border-white/5 mt-2 md:mt-0">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Episodes</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted px-2 py-1 bg-white/5 rounded">
                    {uniqueEpisodes.length} Episodes
                  </span>
                </div>
                {/* Season selector simplified if multiple seasons */}
                {anime.seasons && anime.seasons.length > 1 && (
                  <select 
                    value={seasonParam}
                    onChange={(e) => navigate(`/watch/${anime.slug}/${currentEpisode.episodeNumber}?season=${e.target.value}`)}
                    className="bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white rounded px-3 py-1.5 outline-none"
                  >
                    {anime.seasons.sort((a,b)=>a.order-b.order).map(s => (
                      <option key={s.id} value={s.id} className="bg-[#0F1117]">{s.name}</option>
                    ))}
                  </select>
                )}
             </div>

             {/* Render Grid or List based on episode count */}
             {isCompact ? (
               <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                 {uniqueEpisodes.map((ep) => {
                    const isActive = ep.episodeNumber === currentEpisode.episodeNumber;
                    const isWatched = episodes.filter(e => e.episodeNumber === ep.episodeNumber && e.seasonId === ep.seasonId).some(e => watchedEpisodes.includes(e.id));
                    
                    let btnClass = "bg-white/5 text-yoru-text-muted hover:bg-white/10 hover:text-white";
                    if (isActive) btnClass = "bg-yoru-accent text-[#030407] shadow-[0_0_10px_rgba(244,117,33,0.3)] relative overflow-hidden";
                    else if (isWatched) btnClass = "bg-white/5 text-white/30 border border-white/5";
                    else if (ep.isFiller) btnClass = "bg-yoru-warning/10 text-yoru-warning/70 border border-yoru-warning/20 hover:bg-yoru-warning/20 hover:text-yoru-warning";

                    return (
                      <button
                        key={ep.id}
                        onClick={() => navigate(`/watch/${anime.slug}/${ep.episodeNumber}?season=${seasonParam}`)}
                        className={clsx("aspect-square flex items-center justify-center rounded text-[11px] font-bold transition-all duration-200", btnClass)}
                      >
                        {isActive ? (
                           <div className="flex items-end gap-[2px] h-3">
                             <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite]" style={{height: '60%'}}></div>
                             <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite_0.2s]" style={{height: '100%'}}></div>
                             <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite_0.4s]" style={{height: '40%'}}></div>
                           </div>
                        ) : (
                          ep.episodeNumber
                        )}
                      </button>
                    )
                 })}
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uniqueEpisodes.map((ep) => {
                    const isActive = ep.episodeNumber === currentEpisode.episodeNumber;
                    const isWatched = episodes.filter(e => e.episodeNumber === ep.episodeNumber && e.seasonId === ep.seasonId).some(e => watchedEpisodes.includes(e.id));
                    
                    let btnClass = "bg-white/5 text-yoru-text-muted hover:bg-white/10 hover:text-white";
                    if (isActive) btnClass = "bg-yoru-accent/10 text-yoru-accent border-yoru-accent shadow-[0_0_10px_rgba(244,117,33,0.1)] relative overflow-hidden";
                    else if (isWatched) btnClass = "bg-white/5 text-white/30 border border-white/5";
                    else if (ep.isFiller) btnClass = "bg-yoru-warning/10 text-yoru-warning/70 border border-yoru-warning/20 hover:bg-yoru-warning/20 hover:text-yoru-warning";

                    return (
                      <button
                        key={ep.id}
                        onClick={() => navigate(`/watch/${anime.slug}/${ep.episodeNumber}?season=${seasonParam}`)}
                        className={clsx("flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 border border-transparent", btnClass)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className={clsx("w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-[10px]", isActive ? "bg-yoru-accent text-[#030407]" : "bg-black/20")}>
                             {isActive ? (
                                <div className="flex items-end gap-[2px] h-3">
                                  <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite]" style={{height: '60%'}}></div>
                                  <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite_0.2s]" style={{height: '100%'}}></div>
                                  <div className="w-[2px] bg-[#030407] animate-[pulse_1s_ease-in-out_infinite_0.4s]" style={{height: '40%'}}></div>
                                </div>
                             ) : (
                               ep.episodeNumber
                             )}
                           </div>
                           <span className="text-xs font-semibold truncate leading-tight flex-1">
                             {ep.title || `Episode ${ep.episodeNumber}`}
                           </span>
                        </div>
                        {isWatched && !isActive && <Check className="w-4 h-4 shrink-0 text-white/20 ml-2" />}
                      </button>
                    )
                 })}
               </div>
             )}
          </div>

           </div>
        </div>

      </div>
    </div>
  );
};
