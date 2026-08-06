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
    <div className="min-h-screen bg-yoru-bg pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Search Header */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-yoru-text-muted" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-10 py-4 bg-yoru-surface border border-yoru-border rounded-none text-white placeholder-yoru-text-muted focus:outline-none focus:border-yoru-accent focus:ring-1 focus:ring-yoru-accent transition-all text-lg font-bold tracking-wide"
              placeholder="Search anime, genres, or years..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-yoru-text-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="w-5 h-5 text-yoru-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-yoru-surface border border-yoru-border text-white text-sm font-bold uppercase tracking-widest py-3 px-4 focus:outline-none focus:border-yoru-accent flex-1 md:flex-none appearance-none"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="score">Highest Rated</option>
              <option value="newest">Recently Added</option>
              <option value="release">Release Date</option>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
            >
              <AnimeCard anime={anime} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yoru-surface-elevated mb-6">
            <SearchIcon className="w-10 h-10 text-yoru-text-muted" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-yoru-text-muted">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};
