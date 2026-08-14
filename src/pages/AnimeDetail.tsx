import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Anime, Episode } from '../types';
import { Play, Plus, Star, Calendar, Clock, Loader2, PlayCircle, Info } from 'lucide-react';
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
          const eps = epSnap.docs.map(d => d.data() as Episode)
            .sort((a, b) => a.episodeNumber - b.episodeNumber);
          
          const uniqueEps: Episode[] = [];
          const seen = new Set();
          for (const ep of eps) {
            const key = `${ep.seasonId}-${ep.episodeNumber}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueEps.push(ep);
            }
          }
          setEpisodes(uniqueEps);
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
    <div className="min-h-screen bg-yoru-bg flex items-center justify-center cinematic-vignette">
      <div className="shuriken-loader"></div>
    </div>
  );

  if (!anime) return (
    <div className="min-h-screen bg-yoru-bg flex items-center justify-center text-white">
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
    <div className="min-h-screen bg-yoru-bg pb-32">
      {/* Cinematic Hero */}
      <div className="relative h-[60vh] md:h-[75vh] w-full">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={anime.backdrop} 
            alt={anime.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-yoru-bg via-yoru-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-yoru-bg/20 to-transparent" />
        <div className="absolute inset-0 cinematic-vignette opacity-50" />
        
        <div className="absolute inset-0 pt-32 pb-12 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto flex items-end">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 w-full items-end">
            
            {/* Left: Poster (Desktop) */}
            <div className="hidden md:block md:col-span-3 lg:col-span-3">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 aspect-[2/3] w-full"
              >
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
              </motion.div>
            </div>

            {/* Right: Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-9 lg:col-span-8 space-y-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <span className="px-3 py-1 rounded bg-white/10 backdrop-blur-md text-white border border-white/5">{anime.format}</span>
                <span className="px-3 py-1 rounded bg-yoru-accent/20 text-yoru-accent border border-yoru-accent/20">HD</span>
                <span className="px-3 py-1 rounded bg-yoru-surface-elevated text-yoru-text-muted border border-yoru-border flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yoru-warning fill-current" /> {anime.averageScore}
                </span>
                <span className="px-3 py-1 rounded bg-yoru-surface-elevated text-yoru-text-muted border border-yoru-border flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {anime.startDate?.substring(0,4)}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-[1.1] text-shadow-lg">
                {anime.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
                {anime.genres.map((g, i) => (
                  <React.Fragment key={g}>
                    <span className="text-white/80">{g}</span>
                    {i < anime.genres.length - 1 && <span className="text-yoru-accent/50">•</span>}
                  </React.Fragment>
                ))}
              </div>

              <p className="text-sm md:text-base text-yoru-text-muted leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-4">
                {anime.synopsis}
              </p>

              <div className="flex items-center gap-4 pt-4">
                {firstEpisodeOfSeason ? (
                  <Link to={`/watch/${anime.slug}/${firstEpisodeOfSeason.episodeNumber}?season=${activeSeason}`}>
                    <Button size="lg" className="px-8 py-3.5 gap-2 shadow-xl shadow-white/5">
                      <Play className="w-5 h-5 fill-current" /> Watch Episode 1
                    </Button>
                  </Link>
                ) : (
                   <Button size="lg" disabled className="px-8 py-3.5 gap-2">
                     <Play className="w-5 h-5" /> No Episodes Yet
                   </Button>
                )}
                <WatchlistButton animeId={anime.id!} className="px-8 py-3.5 backdrop-blur-md" />
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
        <div className="lg:col-span-9 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white">Episodes</h2>
              {currentSeasonInfo && (
                <p className="text-sm font-medium text-yoru-text-muted mt-1 tracking-wide">{currentSeasonInfo.name}</p>
              )}
            </div>
            
            {/* Season Selector */}
            {anime.seasons && anime.seasons.length > 1 && (
              <div className="flex bg-yoru-surface-elevated p-1 rounded-lg border border-white/5">
                {anime.seasons.sort((a,b) => a.order - b.order).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSeason(s.id)}
                    className={clsx(
                      "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-md",
                      activeSeason === s.id 
                        ? "bg-white text-[#030407] shadow-md" 
                        : "text-yoru-text-muted hover:text-white"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {seasonEpisodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {seasonEpisodes.map((ep) => (
                <Link 
                  key={ep.id}
                  to={`/watch/${anime.slug}/${ep.episodeNumber}?season=${activeSeason}`}
                  className="group relative block rounded-xl overflow-hidden bg-yoru-surface-elevated border border-white/5 hover:border-white/20 transition-all duration-300"
                >
                  <div className="aspect-[16/9] w-full relative overflow-hidden bg-[#111]">
                    {ep.thumbnailUrl ? (
                      <img 
                        src={ep.thumbnailUrl} 
                        alt={ep.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 transform scale-75 group-hover:scale-100 transition-all">
                        <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center">
                      <span className="text-sm font-bold text-white tracking-widest drop-shadow-md">EP {ep.episodeNumber}</span>
                      {ep.isFiller && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-yoru-warning/20 text-yoru-warning border border-yoru-warning/30 backdrop-blur-md">
                          Filler
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-yoru-text-muted group-hover:text-white transition-colors truncate">
                      {ep.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center glass-panel rounded-xl">
              <PlayCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-sm font-medium text-yoru-text-muted">No episodes available for this season yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
