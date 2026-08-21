import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { normalizeEpisodes } from '../lib/episodeUtils';
import { Anime, Episode } from '../types';
import { Play, Plus, Star, Calendar, Clock, Loader2, PlayCircle, Info, Hash, Monitor, Tv, Video, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WatchlistButton } from '../components/WatchlistButton';
import { motion } from 'motion/react';
import clsx from 'clsx';

export const AnimeDetail = () => {
  const { slug } = useParams();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<string>('s1');

  useEffect(() => {
    const fetchAnime = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, 'anime'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const animeData = querySnapshot.docs[0].data() as Anime;
          setAnime(animeData);
          if (animeData.seasons && animeData.seasons.length > 0) {
            setActiveSeason(animeData.seasons[0].id);
          }
          
          const epQ = query(collection(db, 'episodes'), where('animeId', '==', animeData.id));
          const epSnap = await getDocs(epQ);
          const rawDocs = epSnap.docs.map(d => ({ ...d.data(), id: d.id }));
          const normalized = normalizeEpisodes(rawDocs);
          setEpisodes(normalized);
        }
      } catch (error) {
        console.error("Error fetching anime:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnime();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#030407] flex items-center justify-center cinematic-vignette">
      <div className="shuriken-loader"></div>
    </div>
  );

  if (!anime) return (
    <div className="min-h-screen bg-[#030407] flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <Info className="w-12 h-12 text-yoru-text-muted mx-auto" />
        <h2 className="text-2xl font-bold uppercase tracking-widest">Anime Not Found</h2>
      </div>
    </div>
  );

  const seasonEpisodes = episodes.filter(e => e.seasonId === activeSeason);
  const currentSeasonInfo = anime.seasons?.find(s => s.id === activeSeason);
  const firstEpisodeOfSeason = seasonEpisodes[0];

  return (
    <div className="min-h-screen bg-[#030407] pb-24 md:pb-32 selection:bg-yoru-accent/30 selection:text-white">
      {/* Cinematic Hero */}
      <div className="relative w-full min-h-[60vh] md:min-h-[75vh] flex flex-col">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={anime.backdrop} 
            alt={anime.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#030407] via-[#030407]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/20 to-transparent" />
        <div className="absolute inset-0 cinematic-vignette opacity-50" />
        
        <div className="relative z-10 pt-28 md:pt-36 pb-12 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto flex flex-col justify-end grow w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 w-full items-end mt-auto">
            
            {/* Poster */}
            <div className="md:col-span-3 lg:col-span-3 w-[45%] sm:w-1/3 md:w-full max-w-[180px] md:max-w-none mx-auto md:mx-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 aspect-[2/3] w-full"
              >
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
              </motion.div>
            </div>

            {/* Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-9 lg:col-span-8 space-y-4 md:space-y-6 pb-2 flex flex-col items-center md:items-start text-center md:text-left"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <span className="px-3 py-1 rounded bg-white/10 backdrop-blur-md text-white border border-white/5">{anime.format}</span>
                <span className="px-3 py-1 rounded bg-yoru-accent/20 text-yoru-accent border border-yoru-accent/20">HD</span>
                <span className="px-3 py-1 rounded bg-yoru-surface-elevated text-yoru-text-muted border border-white/5 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yoru-warning fill-current" /> {anime.averageScore}
                </span>
                <span className="px-3 py-1 rounded bg-yoru-surface-elevated text-yoru-text-muted border border-white/5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {anime.startDate?.substring(0,4)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-[1.1] text-shadow-lg">
                {anime.title}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
                {anime.genres.map((g, i) => (
                  <React.Fragment key={g}>
                    <span className="text-white/80">{g}</span>
                    {i < anime.genres.length - 1 && <span className="text-yoru-accent/50">•</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-sm md:text-base text-yoru-text-muted leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-4">
                {anime.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3 sm:gap-4 pt-2 md:pt-4">
                {firstEpisodeOfSeason ? (
                  <Link to={`/watch/${anime.slug}`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 gap-2 shadow-xl shadow-white/5 text-sm sm:text-base">
                      <Play className="w-5 h-5 fill-current" /> Watch Now
                    </Button>
                  </Link>
                ) : (
                   <Button size="lg" disabled className="w-full sm:w-auto px-8 py-3.5 gap-2 text-sm sm:text-base">
                     <Play className="w-5 h-5" /> No Episodes Yet
                   </Button>
                )}
                <div className="w-full sm:w-auto">
                  <WatchlistButton animeId={anime.id!} className="w-full sm:w-auto px-8 py-3.5 backdrop-blur-md text-sm sm:text-base" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-12 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Metadata */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mb-1">Native Title</span>
              <span className="text-sm font-medium text-white">{anime.nativeTitle || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mb-1">Studios</span>
              <span className="text-sm font-medium text-white">{anime.studios || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mb-1">Status</span>
              <span className="text-sm font-medium text-white">{anime.status || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mb-1">Duration</span>
              <span className="text-sm font-medium text-white">{anime.episodeDuration || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mb-1">Total Episodes</span>
              <span className="text-sm font-medium text-white">{anime.totalEpisodes || '-'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Episodes */}
        <div className="lg:col-span-9 space-y-6 md:space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-yoru-accent hidden sm:block" />
                Episodes
              </h2>
              {currentSeasonInfo && (
                <p className="text-xs md:text-sm font-medium text-yoru-text-muted mt-1.5 tracking-wide">{currentSeasonInfo.name}</p>
              )}
            </div>
            
            {/* Season Selector */}
            {anime.seasons && anime.seasons.length > 1 && (
              <div className="flex w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                {anime.seasons.length > 4 ? (
                  <select
                    value={activeSeason}
                    onChange={(e) => setActiveSeason(e.target.value)}
                    className="w-full sm:w-auto bg-yoru-surface-elevated border border-white/5 text-xs font-bold uppercase tracking-widest text-white rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer focus:border-yoru-accent transition-colors"
                  >
                    {anime.seasons.sort((a,b) => a.order - b.order).map((s, idx) => (
                      <option key={`${s.id}-${idx}`} value={s.id} className="bg-[#0F1117] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2 bg-yoru-surface p-1 rounded-xl border border-white/5 min-w-max">
                    {anime.seasons.sort((a,b) => a.order - b.order).map((s, idx) => (
                      <button
                         key={`${s.id}-${idx}`}
                         onClick={() => setActiveSeason(s.id)}
                         className={clsx(
                           "px-4 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap",
                           activeSeason === s.id 
                             ? "bg-white text-[#030407] shadow-md" 
                             : "text-yoru-text-muted hover:text-white hover:bg-white/5"
                         )}
                       >
                         {s.name}
                       </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {seasonEpisodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {seasonEpisodes.map((ep) => (
                <Link 
                  key={ep.id}
                  to={`/watch/${anime.slug}/${ep.episodeNumber}?season=${activeSeason}`}
                  className="group relative block rounded-2xl overflow-hidden bg-[#0A0B0F] border border-white/5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-row sm:flex-col h-24 sm:h-auto"
                >
                  <div className="w-32 sm:w-full sm:aspect-[16/9] shrink-0 relative overflow-hidden bg-[#111]">
                    {ep.thumbnailUrl ? (
                      <img 
                        src={ep.thumbnailUrl} 
                        alt={ep.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent opacity-80 hidden sm:block" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 transform scale-75 group-hover:scale-100 transition-all">
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-white ml-0.5" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 right-2 sm:left-3 sm:right-3 flex justify-between items-center">
                      <span className="hidden sm:block text-xs font-black text-white tracking-widest drop-shadow-md">EP {ep.episodeNumber}</span>
                      <span className="sm:hidden text-[10px] font-black text-white px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-md">EP {ep.episodeNumber}</span>
                      {ep.isFiller && (
                        <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-yoru-warning/20 text-yoru-warning border border-yoru-warning/30 backdrop-blur-md">
                          Filler
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 flex flex-col justify-center sm:justify-start flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                      {ep.title}
                    </h3>
                    {ep.isFiller && (
                      <span className="sm:hidden self-start mt-1.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-yoru-warning/20 text-yoru-warning border border-yoru-warning/30">
                        Filler
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 sm:py-24 text-center border border-white/5 bg-white/5 rounded-2xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
              </div>
              <p className="text-sm font-medium text-yoru-text-muted">No episodes available for this season yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

