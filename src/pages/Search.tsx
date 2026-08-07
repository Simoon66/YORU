import React, { useState, useEffect, useMemo } from 'react';
import { Anime } from '../types';
import { getAllAnime } from '../lib/data';
import { AnimeCard } from '../components/AnimeCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import { GenreChips } from '../components/GenreChips';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

type SortOption = 'relevance' | 'score' | 'newest' | 'release';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getAllAnime();
      setAllAnime(data);
      setResults(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    allAnime.forEach(a => {
      a.genres?.forEach(g => genres.add(g));
    });
    return Array.from(genres).sort();
  }, [allAnime]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  useEffect(() => {
    let filtered = [...allAnime];
    
    if (query.trim()) {
      const lowerQ = query.toLowerCase();
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(lowerQ) ||
        a.nativeTitle?.toLowerCase().includes(lowerQ) ||
        a.genres?.some(g => g.toLowerCase().includes(lowerQ))
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(a => 
        selectedGenres.every(g => a.genres?.includes(g))
      );
    }

    if (sortBy === 'score') {
      filtered.sort((a, b) => {
        const scoreA = parseInt(a.averageScore?.replace('%', '') || '0');
        const scoreB = parseInt(b.averageScore?.replace('%', '') || '0');
        return scoreB - scoreA;
      });
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortBy === 'release') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.startDate || '2000-01-01').getTime();
        const dateB = new Date(b.startDate || '2000-01-01').getTime();
        return dateB - dateA;
      });
    }

    setResults(filtered);
  }, [query, selectedGenres, sortBy, allAnime]);

  return (
    <div className="min-h-screen bg-yoru-bg pt-28 pb-24 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto">
      
      {/* Search Header */}
      <div className="flex flex-col gap-6 mb-12 relative z-20">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-yoru-surface-elevated p-2 rounded-2xl border border-white/5 shadow-xl">
          <div className="relative w-full max-w-2xl flex-1 flex items-center">
            <div className="pl-6 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-yoru-text-muted" />
            </div>
            <input
              type="text"
              className="block w-full pl-4 pr-12 py-4 bg-transparent border-none text-white placeholder-white/30 focus:outline-none focus:ring-0 text-lg font-bold tracking-wide"
              placeholder="Search anime, genres, or years..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto px-4 md:px-0 md:pr-4 pb-4 md:pb-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0">
            <SlidersHorizontal className="w-5 h-5 text-yoru-text-muted ml-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none text-white text-xs font-bold uppercase tracking-widest py-3 px-2 focus:outline-none focus:ring-0 flex-1 md:flex-none appearance-none cursor-pointer hover:text-yoru-accent transition-colors"
            >
              <option value="relevance" className="bg-[#0a0b10]">Sort by Relevance</option>
              <option value="score" className="bg-[#0a0b10]">Highest Rated</option>
              <option value="newest" className="bg-[#0a0b10]">Recently Added</option>
              <option value="release" className="bg-[#0a0b10]">Release Date</option>
            </select>
          </div>
        </div>

        {/* Genre Tags */}
        <GenreChips 
          availableGenres={availableGenres}
          selectedGenres={selectedGenres}
          onToggleGenre={toggleGenre}
          onClearFilters={() => setSelectedGenres([])}
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
           {[...Array(12)].map((_, i) => (
             <SkeletonAnimeCard key={i} />
           ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {results.map((anime, idx) => (
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
            <SearchIcon className="w-8 h-8 text-white/50" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">No results found</h3>
          <p className="text-sm font-medium text-yoru-text-muted">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
