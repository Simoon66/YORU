import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Anime, Episode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Maximize, SkipBack, SkipForward, Server, Flag, Lightbulb, PlayCircle, Loader2, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';
import { WatchlistButton } from '../components/WatchlistButton';
import { normalizeEpisodes } from '../lib/episodeUtils';

export const Watch = () => {
  const { slug, episodeNum } = useParams();
  const [searchParams] = useSearchParams();
  const seasonParam = searchParams.get('season');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);
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
          const rawDocs = epSnap.docs.map(d => ({ ...d.data(), id: d.id }));
          
          // Normalize and deduplicate all episodes and their server links
          const allEps = normalizeEpisodes(rawDocs);
          setEpisodes(allEps);
          
          // Determine best active season
          const seasons = animeData.seasons && animeData.seasons.length > 0 
            ? animeData.seasons 
            : [{ id: 's1', name: 'Season 1', order: 1 }];

          let targetSeasonId = seasonParam;
          if (!targetSeasonId || !allEps.some(e => e.seasonId === targetSeasonId)) {
            if (seasonParam && seasons.some(s => s.id === seasonParam)) {
              targetSeasonId = seasonParam;
            } else if (allEps.length > 0) {
              targetSeasonId = allEps[0].seasonId;
            } else {
              targetSeasonId = seasons[0]?.id || 's1';
            }
          }

          let targetEpisodeNum = episodeNum ? parseInt(episodeNum, 10) : null;

          // Smart Resume Logic if no episode number in URL
          if (!episodeNum) {
            let lastWatchedId: string | null = null;
            if (user) {
              const progressRef = doc(db, 'watchProgress', `${user.uid}_${animeData.id}`);
              const progressDoc = await getDoc(progressRef);
              if (progressDoc.exists()) {
                const data = progressDoc.data();
                lastWatchedId = data.lastWatchedEpisode || null;
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
              const seasonEps = allEps.filter(e => e.seasonId === targetSeasonId);
              const firstEp = seasonEps.length > 0 ? seasonEps[0] : allEps[0];
              targetEpisodeNum = firstEp.episodeNumber;
              targetSeasonId = firstEp.seasonId;
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
          
          // Find selected episode
          if (targetEpisodeNum !== null) {
            let selectedEp = allEps.find(e => 
              e.episodeNumber === targetEpisodeNum && 
              e.seasonId === targetSeasonId
            );

            // Fallback: if not found in target season, search across all seasons
            if (!selectedEp) {
              selectedEp = allEps.find(e => e.episodeNumber === targetEpisodeNum);
            }

            // Fallback: take first available episode in season or overall
            if (!selectedEp && allEps.length > 0) {
              const seasonEps = allEps.filter(e => e.seasonId === targetSeasonId);
              selectedEp = seasonEps[0] || allEps[0];
            }

            if (selectedEp) {
              setCurrentEpisode(selectedEp);
              
              const savedType = localStorage.getItem('preferredServerType') || 'sub';
              const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
              
              if (selectedEp.servers && selectedEp.servers.length > 0) {
                let sIdx = selectedEp.servers.findIndex(s => (s.serverType || 'sub') === savedType && s.serverName === savedName);
                if (sIdx === -1) sIdx = selectedEp.servers.findIndex(s => (s.serverType || 'sub') === savedType);
                if (sIdx === -1) sIdx = 0;
                setActiveServerIdx(sIdx);
              } else {
                setActiveServerIdx(0);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading watch page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, episodeNum, seasonParam, user, navigate]);

  // Current active season identifier
  const currentSeasonId = currentEpisode?.seasonId || seasonParam || 's1';
  const seasonEpisodes = episodes.filter(e => e.seasonId === currentSeasonId);
  const uniqueEpisodes = [...seasonEpisodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

  const currentEpisodeServers = currentEpisode?.servers || [];
  const activeServer = currentEpisodeServers[activeServerIdx] || currentEpisodeServers[0] || null;
  const rawEmbedLink = activeServer?.embedLink || (currentEpisode as any)?.embedLink || '';

  const finalIframeSrc = rawEmbedLink ? (
    autoplay 
      ? (rawEmbedLink.includes('?') ? `${rawEmbedLink}&autoplay=1&autoPlay=1` : `${rawEmbedLink}?autoplay=1&autoPlay=1`)
      : rawEmbedLink
  ) : '';

  useEffect(() => {
    setIframeLoaded(false);
  }, [finalIframeSrc, currentEpisode?.id, activeServerIdx]);

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
            seasonId: currentEpisode.seasonId,
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
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center text-white p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="w-12 h-12 text-yoru-accent mx-auto" />
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Episode Not Found</h2>
        <p className="text-sm text-yoru-text-muted">
          No episodes are available for this season yet.
        </p>
        <Button onClick={() => navigate(anime ? `/anime/${anime.slug}` : '/')} variant="primary" size="md">
          Back to Anime
        </Button>
      </div>
    </div>
  );

  const handleServerChange = (sIdx: number) => {
    setActiveServerIdx(sIdx);
    const newServer = currentEpisodeServers[sIdx];
    if (newServer) {
      if (newServer.serverType) localStorage.setItem('preferredServerType', newServer.serverType);
      if (newServer.serverName) localStorage.setItem('preferredServerName', newServer.serverName);
    }
  };

  const currentIndex = uniqueEpisodes.findIndex(e => e.episodeNumber === currentEpisode.episodeNumber);
  const nextEpisode = currentIndex >= 0 && currentIndex < uniqueEpisodes.length - 1 ? uniqueEpisodes[currentIndex + 1] : null;
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
              {finalIframeSrc ? (
                <>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                      <Loader2 className="w-10 h-10 text-yoru-accent animate-spin mb-4" />
                      <p className="text-white/70 text-sm font-medium animate-pulse tracking-wide">Loading video player...</p>
                    </div>
                  )}
                  <iframe
                    key={`${currentEpisode.id}_${activeServerIdx}`}
                    src={finalIframeSrc}
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    className={clsx(
                      "absolute inset-0 w-full h-full border-0 transition-opacity duration-500",
                      iframeLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setIframeLoaded(true)}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07080B] text-center p-6 space-y-3">
                  <PlayCircle className="w-12 h-12 text-yoru-accent/60 animate-pulse" />
                  <p className="text-white font-bold tracking-wide text-sm">No streaming embed link available for this server.</p>
                  <p className="text-xs text-yoru-text-muted">Please select another server below or check back later.</p>
                </div>
              )}
            </div>

            {/* Quick Control Ribbon */}
            <div className="flex flex-wrap items-center justify-between p-3 md:p-4 gap-4 bg-[#0F1117] relative z-10 border-t border-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleTheaterMode} 
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors"
                  title="Toggle Theater Mode"
                >
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

                <button 
                  onClick={() => setIsLightDimmed(!isLightDimmed)} 
                  className={clsx("flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors", isLightDimmed ? "text-yoru-accent font-bold" : "text-yoru-text-muted hover:text-white")}
                  title="Dim Background Lights"
                >
                  <Lightbulb className={clsx("w-4 h-4", isLightDimmed && "fill-yoru-accent")} /> <span className="hidden sm:inline">Light</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  disabled={!prevEpisode}
                  onClick={() => prevEpisode && navigate(`/watch/${anime.slug}/${prevEpisode.episodeNumber}?season=${currentSeasonId}`)}
                  className="p-1.5 text-yoru-text-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Previous Episode"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  disabled={!nextEpisode}
                  onClick={() => nextEpisode && navigate(`/watch/${anime.slug}/${nextEpisode.episodeNumber}?season=${currentSeasonId}`)}
                  className="p-1.5 text-yoru-text-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Next Episode"
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
           <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-3 md:gap-4">

          {/* 2. Server Selection Hub */}
          <div className="bg-[#0F1117] md:rounded-2xl p-4 md:p-6 border-b md:border border-white/5 flex flex-col gap-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted">
                 <Server className="w-3.5 h-3.5 text-yoru-accent" /> Servers
               </div>
               {currentEpisodeServers.length > 0 && (
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 bg-white/5 px-2 py-0.5 rounded">
                   {currentEpisodeServers.length} Available
                 </span>
               )}
             </div>
             
             {currentEpisodeServers.length > 0 ? (
               <div className="flex flex-col gap-3">
                 {(['sub', 'dub', 'multi'] as const).map((type) => {
                   const serversOfType = currentEpisodeServers
                     .map((s, originalIdx) => ({ s, originalIdx }))
                     .filter(({ s }) => (s.serverType === type) || (!s.serverType && type === 'sub'));

                   if (serversOfType.length === 0) return null;

                   return (
                     <div key={type} className="flex items-center gap-3">
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 w-14 shrink-0">
                         {type}:
                       </span>
                       <div className="flex flex-wrap gap-2">
                         {serversOfType.map(({ s: serverEp, originalIdx }) => {
                           const isActive = activeServerIdx === originalIdx;
                           return (
                             <button
                               key={`${type}-${originalIdx}-${serverEp.serverName}`}
                               onClick={() => handleServerChange(originalIdx)}
                               className={clsx(
                                 "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 border",
                                 isActive
                                   ? "bg-yoru-accent text-[#030407] border-yoru-accent font-black shadow-[0_0_12px_rgba(244,117,33,0.35)]"
                                   : "bg-white/5 text-yoru-text-muted border-transparent hover:bg-white/10 hover:text-white"
                               )}
                             >
                               {serverEp.serverName || `Server ${originalIdx + 1}`}
                             </button>
                           );
                         })}
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-xs text-yoru-text-muted py-1 flex items-center gap-2">
                 <AlertCircle className="w-3.5 h-3.5 text-yoru-warning" /> No servers configured for this episode yet.
               </div>
             )}
          </div>

          {/* 3. Dynamic Episode Selector */}
          <div className="bg-[#0F1117] md:rounded-2xl p-4 md:p-6 border-b md:border border-white/5 mt-2 md:mt-0">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Episodes</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted px-2 py-1 bg-white/5 rounded">
                    {uniqueEpisodes.length} {uniqueEpisodes.length === 1 ? 'Episode' : 'Episodes'}
                  </span>
                </div>

                {/* Season selector */}
                {anime.seasons && anime.seasons.length > 1 && (
                  <select 
                    value={currentSeasonId}
                    onChange={(e) => {
                      const newSeason = e.target.value;
                      const targetEpInNewSeason = episodes.find(ep => ep.seasonId === newSeason)?.episodeNumber || 1;
                      navigate(`/watch/${anime.slug}/${targetEpInNewSeason}?season=${newSeason}`);
                    }}
                    className="bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white rounded px-3 py-1.5 outline-none hover:border-yoru-accent/50 focus:border-yoru-accent transition-colors"
                  >
                    {anime.seasons.sort((a,b)=>a.order-b.order).map((s, idx) => (
                      <option key={`${s.id}-${idx}`} value={s.id} className="bg-[#0F1117] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
             </div>

             {/* Render Grid or List based on episode count */}
             {uniqueEpisodes.length === 0 ? (
               <div className="text-center py-12 text-yoru-text-muted text-xs font-medium">
                 No episodes found in this season.
               </div>
             ) : isCompact ? (
               <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                 {uniqueEpisodes.map((ep) => {
                    const isActive = ep.episodeNumber === currentEpisode.episodeNumber;
                    const isWatched = watchedEpisodes.includes(ep.id) || watchedEpisodes.some(wid => wid.endsWith(`_${ep.seasonId}_${ep.episodeNumber}`));
                    
                    let btnClass = "bg-white/5 text-yoru-text-muted hover:bg-white/10 hover:text-white";
                    if (isActive) btnClass = "bg-yoru-accent text-[#030407] shadow-[0_0_10px_rgba(244,117,33,0.3)] relative overflow-hidden font-black";
                    else if (isWatched) btnClass = "bg-white/5 text-white/30 border border-white/5";
                    else if (ep.isFiller) btnClass = "bg-yoru-warning/10 text-yoru-warning/70 border border-yoru-warning/20 hover:bg-yoru-warning/20 hover:text-yoru-warning";

                    return (
                      <button
                        key={`${ep.seasonId}_${ep.episodeNumber}`}
                        onClick={() => navigate(`/watch/${anime.slug}/${ep.episodeNumber}?season=${currentSeasonId}`)}
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
                    const isWatched = watchedEpisodes.includes(ep.id) || watchedEpisodes.some(wid => wid.endsWith(`_${ep.seasonId}_${ep.episodeNumber}`));
                    
                    let btnClass = "bg-white/5 text-yoru-text-muted hover:bg-white/10 hover:text-white";
                    if (isActive) btnClass = "bg-yoru-accent/10 text-yoru-accent border-yoru-accent shadow-[0_0_10px_rgba(244,117,33,0.1)] relative overflow-hidden font-bold";
                    else if (isWatched) btnClass = "bg-white/5 text-white/30 border border-white/5";
                    else if (ep.isFiller) btnClass = "bg-yoru-warning/10 text-yoru-warning/70 border border-yoru-warning/20 hover:bg-yoru-warning/20 hover:text-yoru-warning";

                    return (
                      <button
                        key={`${ep.seasonId}_${ep.episodeNumber}`}
                        onClick={() => navigate(`/watch/${anime.slug}/${ep.episodeNumber}?season=${currentSeasonId}`)}
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
