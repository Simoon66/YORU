import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Anime, Episode } from '../types';
import { getAnimeBySlug, getEpisodesForAnime } from '../lib/data';
import { Lightbulb, Monitor, PlaySquare, ChevronLeft, ChevronRight, Server, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { CommentSection } from '../components/CommentSection';

export const Watch = () => {
  const { slug, episodeNum } = useParams<{ slug: string, episodeNum: string }>();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('yoru_watched');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  // UI states
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isLightOff, setIsLightOff] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [currentSeasonId, setCurrentSeasonId] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!slug || !episodeNum) return;
      setIsLoading(true);
      const data = await getAnimeBySlug(slug);
      setAnime(data);
      if (data) {
        const eps = await getEpisodesForAnime(data.id);
        setEpisodes(eps);
        const ep = eps.find(e => e.episodeNumber.toString() === episodeNum);
        setCurrentEpisode(ep || null);
        if (ep) setCurrentSeasonId(ep.seasonId);
        else if (data.seasons.length > 0) setCurrentSeasonId(data.seasons[0].id);
      }
      setIsLoading(false);
    }
    loadData();
  }, [slug, episodeNum]);

  // Mark as watched automatically & persist to localStorage
  useEffect(() => {
    if (currentEpisode && !watchedEpisodes.includes(currentEpisode.id)) {
      const newWatched = [...watchedEpisodes, currentEpisode.id];
      setWatchedEpisodes(newWatched);
      localStorage.setItem('yoru_watched', JSON.stringify(newWatched));
    }
  }, [currentEpisode, watchedEpisodes]);

  // Update continue watching history
  useEffect(() => {
    if (!anime || !currentEpisode) return;
    
    let simulatedProgress = 0;

    const updateHistory = (prog: number) => {
      try {
        const storedHistory = localStorage.getItem('yoru_watch_history');
        let history = storedHistory ? JSON.parse(storedHistory) : [];
        
        // Preserve progress if same episode
        const existing = history.find((h: any) => h.animeId === anime.id);
        if (existing && existing.episodeNumber === currentEpisode.episodeNumber && prog === 0) {
           simulatedProgress = existing.progress || 0;
        } else {
           simulatedProgress = prog;
        }
        
        // Remove existing entry for this anime
        history = history.filter((h: any) => h.animeId !== anime.id);
        
        // Add new entry
        history.unshift({
          animeId: anime.id,
          slug: anime.slug,
          title: anime.title,
          coverImage: anime.coverImage,
          backdrop: anime.backdrop,
          episodeNumber: currentEpisode.episodeNumber,
          progress: simulatedProgress,
          updatedAt: Date.now()
        });
        
        // Keep only last 20
        history = history.slice(0, 20);
        localStorage.setItem('yoru_watch_history', JSON.stringify(history));
      } catch (e) {
        console.error('Failed to save watch history', e);
      }
    };

    updateHistory(0);

    const intervalId = setInterval(() => {
       simulatedProgress += 1;
       if (simulatedProgress > 100) simulatedProgress = 100;
       updateHistory(simulatedProgress);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [anime, currentEpisode]);

  // Add global keyboard event listeners for video player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Try to post message to iframe for common players if possible, 
      // or at least intercept and prevent default for scrolling
      if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        // Find the iframe
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          // Prevent default scrolling for spacebar and arrows
          if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
          }
          // Note: Full control requires iframe API support (e.g. YouTube).
          // We can try to send standard media keys or just focus the iframe so it can handle it natively.
          iframe.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) return (
    <div className="min-h-screen bg-yoru-bg pt-20 flex items-center justify-center">
      <div className="shuriken-loader"></div>
    </div>
  );
  if (!anime || !currentEpisode) return <div className="min-h-screen bg-yoru-bg text-white flex items-center justify-center">Episode Not Found</div>;

  const seasonEpisodes = episodes.filter(e => e.seasonId === currentSeasonId);

  // Deduplicate for the episodes grid
  const uniqueSeasonEpisodesMap = new Map<number, Episode>();
  seasonEpisodes.forEach(ep => {
    if (!uniqueSeasonEpisodesMap.has(ep.episodeNumber)) {
      uniqueSeasonEpisodesMap.set(ep.episodeNumber, ep);
    }
  });
  const uniqueSeasonEpisodes = Array.from(uniqueSeasonEpisodesMap.values()).sort((a,b) => a.episodeNumber - b.episodeNumber);

  const nextEp = uniqueSeasonEpisodes.find(e => e.episodeNumber === currentEpisode.episodeNumber + 1);
  const prevEp = uniqueSeasonEpisodes.find(e => e.episodeNumber === currentEpisode.episodeNumber - 1);

  // Available servers for the CURRENT episode
  const currentEpisodeServers = episodes.filter(e => e.episodeNumber === currentEpisode.episodeNumber && e.seasonId === currentEpisode.seasonId);

  const handleServerChange = (epId: string) => {
    const newEp = currentEpisodeServers.find(ep => ep.id === epId);
    if (newEp) setCurrentEpisode(newEp);
  };

  return (
    <div className={clsx("min-h-screen font-sans transition-colors duration-500", isLightOff ? "bg-black" : "bg-yoru-bg pb-12")}>
      
      {/* Light Off Overlay */}
      {isLightOff && (
        <div className="fixed inset-0 bg-black/95 z-[60] pointer-events-none" />
      )}

      {/* Main Container */}
      <div className={clsx("mx-auto transition-all duration-500 relative pt-20", isCinemaMode ? "max-w-[1600px] px-0" : "max-w-6xl px-4 sm:px-6", isLightOff ? "z-[60]" : "z-10")}>
        
        {/* Top Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm font-medium text-yoru-text-muted">
             <Link to="/" className="hover:text-white transition-colors">Home</Link>
             <span className="mx-2">•</span>
             <Link to={`/anime/${anime.slug}`} className="hover:text-white transition-colors">{anime.title}</Link>
             <span className="mx-2">•</span>
             <span className="text-white">Episode {currentEpisode.episodeNumber}</span>
          </div>
        </div>

        {/* Player Section */}
        <div className={clsx("bg-black w-full relative group shadow-2xl", isCinemaMode ? "aspect-[21/9]" : "aspect-video")}>
           {currentEpisode.embedLink ? (
             <iframe 
               src={currentEpisode.embedLink.startsWith('http') ? currentEpisode.embedLink : `https://megaplay.buzz/stream/s-2/${currentEpisode.embedLink}/sub`} 
               className="w-full h-full border-0"
               allowFullScreen
               allow="autoplay; encrypted-media"
             />
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-yoru-text-muted">
               <PlaySquare className="w-16 h-16 mb-4 opacity-50" />
               <p>No playable source found</p>
             </div>
           )}
        </div>

        {/* Player Controls Bar */}
        <div className="bg-yoru-surface border border-yoru-border border-t-0 p-3 flex flex-wrap items-center justify-between gap-4 relative z-50 mb-8">
          <div className="flex items-center gap-2 md:gap-4 text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
             <button onClick={() => setAutoplay(!autoplay)} className={clsx("flex items-center gap-2 hover:text-white transition-colors", autoplay && "text-yoru-accent")}>
               <div className={clsx("w-8 h-4 rounded-full relative transition-colors", autoplay ? "bg-yoru-accent" : "bg-yoru-border")}>
                 <div className={clsx("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", autoplay ? "left-4.5" : "left-0.5")} />
               </div>
               Auto Play
             </button>
             
             <div className="w-px h-4 bg-yoru-border hidden md:block" />

             <button 
               onClick={() => prevEp && navigate(`/watch/${anime.slug}/${prevEp.episodeNumber}`)}
               disabled={!prevEp}
               className="flex items-center gap-1 hover:text-white disabled:opacity-50 disabled:hover:text-yoru-text-muted transition-colors"
             >
               <ChevronLeft className="w-4 h-4" /> Prev
             </button>
             <button 
               onClick={() => nextEp && navigate(`/watch/${anime.slug}/${nextEp.episodeNumber}`)}
               disabled={!nextEp}
               className="flex items-center gap-1 hover:text-white disabled:opacity-50 disabled:hover:text-yoru-text-muted transition-colors"
             >
               Next <ChevronRight className="w-4 h-4" />
             </button>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
             <div className="relative group/help">
               <button className="flex items-center gap-2 hover:text-white transition-colors">
                 <HelpCircle className="w-4 h-4" />
               </button>
               <div className="absolute bottom-full mb-2 right-0 hidden group-hover/help:block w-48 bg-yoru-surface-elevated border border-yoru-border p-3 text-[10px] text-white shadow-xl normal-case tracking-normal z-50">
                 <div className="font-bold mb-2 uppercase tracking-widest text-yoru-accent">Shortcuts</div>
                 <div className="flex justify-between mb-1"><span>Play/Pause</span><kbd className="bg-yoru-bg px-1 rounded">Space</kbd></div>
                 <div className="flex justify-between mb-1"><span>Forward</span><kbd className="bg-yoru-bg px-1 rounded">Right Arrow</kbd></div>
                 <div className="flex justify-between"><span>Backward</span><kbd className="bg-yoru-bg px-1 rounded">Left Arrow</kbd></div>
                 <div className="absolute -bottom-1 right-2 w-2 h-2 bg-yoru-surface-elevated border-b border-r border-yoru-border rotate-45"></div>
               </div>
             </div>
             <button onClick={() => setIsLightOff(!isLightOff)} className={clsx("flex items-center gap-2 hover:text-white transition-colors", isLightOff && "text-yoru-accent")}>
               <Lightbulb className="w-4 h-4" /> Light
             </button>
             <button onClick={() => setIsCinemaMode(!isCinemaMode)} className={clsx("flex items-center gap-2 hover:text-white transition-colors hidden md:flex", isCinemaMode && "text-yoru-accent")}>
               <Monitor className="w-4 h-4" /> Cinema
             </button>
          </div>
        </div>

        {/* Info (Title) */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {anime.title}
          </h1>
          {currentEpisode.title && (
             <p className="text-yoru-text-muted mt-1 font-medium">{currentEpisode.title}</p>
          )}
        </div>

        {/* Servers & Seasons Row */}
        <div className="flex flex-col md:flex-row md:items-stretch gap-6 mb-6">
          
          {/* Seasons Dropdown */}
          {anime.seasons.length > 0 && (
            <div className="flex-shrink-0">
              <div className="flex items-center h-full bg-yoru-surface border border-yoru-border px-4 py-3">
                <select 
                  value={currentSeasonId} 
                  onChange={(e) => setCurrentSeasonId(e.target.value)}
                  className="bg-transparent text-sm font-bold tracking-widest uppercase text-white focus:outline-none cursor-pointer w-full [&>option]:bg-yoru-surface [&>option]:text-white"
                >
                  {anime.seasons.sort((a,b)=>a.order-b.order).map(season => (
                    <option key={season.id} value={season.id} className="bg-[#1C1C1C] text-white py-2">{season.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Servers Buttons */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 border border-yoru-border bg-yoru-surface p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-text-muted shrink-0">
              <Server className="w-4 h-4" /> Servers:
            </div>
            <div className="flex flex-wrap gap-2">
              {currentEpisodeServers.map(serverEp => (
                <button
                  key={serverEp.id}
                  onClick={() => handleServerChange(serverEp.id)}
                  className={clsx(
                    "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border",
                    currentEpisode.id === serverEp.id
                      ? "bg-yoru-accent/10 border-yoru-accent/50 text-yoru-accent"
                      : "bg-yoru-surface-elevated border-yoru-border text-yoru-text hover:bg-yoru-border hover:text-white"
                  )}
                >
                  {serverEp.serverName || 'Default'}
                </button>
              ))}
            </div>
            <div className="md:ml-auto text-xs text-yoru-text-muted italic">
              If one server doesn't work, please try another one.
            </div>
          </div>
        </div>

        {/* Episodes Grid */}
        <div className="bg-yoru-surface border border-yoru-border p-4">
           <div className="flex items-center justify-between mb-4">
             <div className="text-sm font-bold text-white uppercase tracking-widest">Episodes</div>
           </div>
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {uniqueSeasonEpisodes.map(ep => {
                const isCurrent = ep.episodeNumber === currentEpisode.episodeNumber;
                // Watched logic: if they watched ANY server of this episode, mark it as watched
                const episodeServersIds = episodes.filter(e => e.episodeNumber === ep.episodeNumber && e.seasonId === ep.seasonId).map(e => e.id);
                const isWatched = episodeServersIds.some(id => watchedEpisodes.includes(id));
                
                let bgClass = "bg-yoru-surface-elevated hover:bg-yoru-accent/20 border-yoru-border";
                let textClass = "text-yoru-text";
                
                if (isCurrent) {
                  bgClass = "bg-yoru-accent border-yoru-accent";
                  textClass = "text-white";
                } else if (ep.isFiller) {
                  bgClass = "bg-gray-800/80 border-orange-500/30 hover:border-orange-500";
                  textClass = "text-orange-400";
                } else if (isWatched) {
                  bgClass = "bg-white/5 border-white/10 opacity-75";
                  textClass = "text-yoru-text-muted";
                }

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${anime.slug}/${ep.episodeNumber}`}
                    className={clsx(
                      "aspect-square flex items-center justify-center text-xs font-bold border transition-all",
                      bgClass, textClass
                    )}
                    title={ep.title || `Episode ${ep.episodeNumber}`}
                  >
                    {ep.episodeNumber}
                  </Link>
                );
              })}
           </div>
        </div>

        {/* Comment Section */}
        {anime && currentEpisode && (
          <CommentSection animeId={anime.id} episodeId={currentEpisode.id} />
        )}
      </div>
    </div>
  );
};
