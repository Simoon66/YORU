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

interface EpisodeCardProps {
  ep: Episode;
  anime: Anime;
  activeSeason: string;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ ep, anime, activeSeason }) => {
  const [imgError, setImgError] = useState(false);
  const imageSrc = (!imgError && ep.thumbnailUrl) ? ep.thumbnailUrl : (anime.backdrop || anime.poster);

  return (
    <Link 
      to={`/watch/${anime.slug}/${ep.episodeNumber}?season=${activeSeason}`}
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden bg-[#0A0B0F] border border-white/5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
    >
      <div className="w-full aspect-video relative overflow-hidden bg-[#14161F] shrink-0">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={`Episode ${ep.episodeNumber}`} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
            <PlayCircle className="w-8 h-8 text-white/20 mb-1" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Episode {ep.episodeNumber}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-transparent to-transparent opacity-80" />
        
        {/* Play hover button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 transform scale-75 group-hover:scale-100 transition-all">
            <Play className="w-4 h-4 fill-current text-white ml-0.5" />
          </div>
        </div>
        
        {/* Subtle Watermark Tag for unique visual identification on shared backdrops (Issue 6) */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white/90">
          #{ep.episodeNumber}
        </div>

        {/* Status badges only — NO redundant 'EP XX' overlay on the thumbnail (fixes Issues 7 & 12) */}
        {ep.isFiller && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-sm">
              Filler
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-1.5 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-yoru-text-muted mb-1">
            <span className="text-yoru-accent">EP {ep.episodeNumber}</span>
            {ep.isFiller && <span className="text-amber-400">• Filler</span>}
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {ep.title && ep.title !== `Episode ${ep.episodeNumber}` ? ep.title : `Episode ${ep.episodeNumber}`}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export const AnimeDetail = () => {
  const { slug } = useParams();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<string>('s1');
  const [selectedChunkIdx, setSelectedChunkIdx] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState<string>('');

  useEffect(() => {
    setSelectedChunkIdx(0);
  }, [activeSeason]);

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
  const cleanEpisodes = seasonEpisodes.filter(e => {
    const title = (e.title || '').toLowerCase();
    return !title.includes('facebook') && !title.includes('reel') && !title.includes('sponsor');
  });
  const currentSeasonInfo = anime.seasons?.find(s => s.id === activeSeason);
  const firstEpisodeOfSeason = cleanEpisodes[0] || seasonEpisodes[0];

  const CHUNK_SIZE = 50;
  const totalChunks = Math.ceil(cleanEpisodes.length / CHUNK_SIZE);
  const displayedEpisodes = cleanEpisodes.length > CHUNK_SIZE
    ? cleanEpisodes.slice(selectedChunkIdx * CHUNK_SIZE, (selectedChunkIdx + 1) * CHUNK_SIZE)
    : cleanEpisodes;

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= cleanEpisodes.length) {
      const chunkIdx = Math.floor((num - 1) / CHUNK_SIZE);
      setSelectedChunkIdx(chunkIdx);
      setJumpInput('');
    }
  };

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
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold uppercase tracking-wider">
                <span className="px-3.5 py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-sm">
                  {anime.format || 'TV'}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-yoru-accent text-[#030407] font-black shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                  HD
                </span>
                {anime.averageScore && (
                  <span className="px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5 font-bold shadow-sm">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{anime.averageScore}</span>
                  </span>
                )}
                {anime.startDate && (
                  <span className="px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5 font-bold shadow-sm">
                    <Calendar className="w-4 h-4 text-white/80" />
                    <span>{anime.startDate.substring(0, 4)}</span>
                  </span>
                )}
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
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto h-12 sm:h-14 min-h-[48px] px-8 py-3.5 gap-2 shadow-xl shadow-white/5 text-xs sm:text-sm font-bold uppercase tracking-wider"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> WATCH NOW
                    </Button>
                  </Link>
                ) : (
                   <Button 
                     size="lg" 
                     disabled 
                     className="w-full sm:w-auto h-12 sm:h-14 min-h-[48px] px-8 py-3.5 gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider"
                   >
                     <Play className="w-4 h-4 sm:w-5 sm:h-5" /> NO EPISODES YET
                   </Button>
                )}
                <div className="w-full sm:w-auto">
                  <WatchlistButton 
                    animeId={anime.id!} 
                    className="w-full sm:w-auto h-12 sm:h-14 min-h-[48px] px-8 py-3.5 backdrop-blur-md text-xs sm:text-sm font-bold uppercase tracking-wider" 
                  />
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

          {cleanEpisodes.length > 0 ? (
            <div className="space-y-6">
              {/* Pagination & Jump-to Controls (Addresses Issue 3 & Issue 8) */}
              {totalChunks > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: totalChunks }).map((_, idx) => {
                      const start = idx * CHUNK_SIZE + 1;
                      const end = Math.min((idx + 1) * CHUNK_SIZE, cleanEpisodes.length);
                      const isActive = selectedChunkIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedChunkIdx(idx)}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            isActive
                              ? "bg-white text-[#030407] shadow-sm font-bold"
                              : "bg-white/5 text-yoru-text-muted hover:text-white hover:bg-white/10"
                          )}
                        >
                          {start}–{end}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Jump-to episode input */}
                  <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={cleanEpisodes.length}
                      value={jumpInput}
                      onChange={(e) => setJumpInput(e.target.value)}
                      placeholder="Jump to ep..."
                      className="w-28 h-8 px-2.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                      aria-label="Jump to episode number"
                    />
                    <button
                      type="submit"
                      disabled={!jumpInput.trim()}
                      className="h-8 px-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Go
                    </button>
                  </form>
                </div>
              )}

              {/* Uniform Episode Grid (Addresses Issue 1, 2, 4, 6, 7, 8, 9, 12) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {displayedEpisodes.map((ep) => (
                  <EpisodeCard 
                    key={ep.id}
                    ep={ep}
                    anime={anime}
                    activeSeason={activeSeason}
                  />
                ))}
              </div>
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

