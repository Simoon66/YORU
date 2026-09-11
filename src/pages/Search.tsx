import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Anime } from '../types';
import { getAllAnime, getAnimeReleaseTimestamp } from '../lib/data';
import { AnimeCard } from '../components/AnimeCard';
import { SkeletonAnimeCard } from '../components/SkeletonAnimeCard';
import {
  Filter as FilterIcon,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Grid2X2,
  List,
  ChevronDown,
  Star,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface FilterState {
  title: string;
  genre: string;
  season: string;
  year: string;
  type: string;
  status: string;
  language: string;
  rating: string;
  source: string;
  episodeRange: string;
  sort: string;
  exclude: string;
}

const DEFAULT_FILTERS: FilterState = {
  title: '',
  genre: 'all',
  season: 'all',
  year: 'all',
  type: 'all',
  status: 'all',
  language: 'all',
  rating: 'all',
  source: 'all',
  episodeRange: 'all',
  sort: 'default',
  exclude: 'none'
};

const ALPHABET_LIST = ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Read initial params from URL
  const initialTitle = searchParams.get('q') || searchParams.get('search') || '';
  const initialType = searchParams.get('format') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  const initialSort = searchParams.get('sort') || 'default';
  const initialLetter = searchParams.get('letter') || 'ALL';

  // Form input state (pending submission)
  const [formFilters, setFormFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    title: initialTitle,
    type: initialType,
    status: initialStatus,
    sort: initialSort
  });

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    title: initialTitle,
    type: initialType,
    status: initialStatus,
    sort: initialSort
  });

  // A to Z filter
  const [selectedLetter, setSelectedLetter] = useState<string>(initialLetter.toUpperCase());

  // Grid view mode
  const [viewMode, setViewMode] = useState<'grid-6' | 'grid-4' | 'list'>('grid-6');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 24;

  // Catalog data
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch all anime once on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getAllAnime();
        setAllAnime(data);
      } catch (err) {
        console.error('Failed to load anime for Browse:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Sync when URL params change externally
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    const format = searchParams.get('format') || 'all';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'default';
    const letter = (searchParams.get('letter') || 'ALL').toUpperCase();

    setFormFilters(prev => ({
      ...prev,
      title: q,
      type: format,
      status: status,
      sort: sort
    }));

    setAppliedFilters(prev => ({
      ...prev,
      title: q,
      type: format,
      status: status,
      sort: sort
    }));

    setSelectedLetter(letter);
  }, [searchParams]);

  // Extract available genres
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    allAnime.forEach(a => {
      a.genres?.forEach(g => {
        if (g && g.trim()) genres.add(g.trim());
      });
    });
    return Array.from(genres).sort();
  }, [allAnime]);

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allAnime.forEach(a => {
      const yr = getAnimeYear(a);
      if (yr) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allAnime]);

  // Compute Top Rated Anime for the right sidebar
  const topRatedAnime = useMemo(() => {
    return [...allAnime]
      .sort((a, b) => {
        const scoreA = parseFloat((a.averageScore || '0').replace('%', ''));
        const scoreB = parseFloat((b.averageScore || '0').replace('%', ''));
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [allAnime]);

  // Helper functions
  function getAnimeYear(anime: Anime): number | null {
    if (anime.startDate) {
      const m = anime.startDate.match(/\b(19\d\d|20\d\d)\b/);
      if (m) return parseInt(m[1], 10);
    }
    if (anime.season) {
      const m = anime.season.match(/\b(19\d\d|20\d\d)\b/);
      if (m) return parseInt(m[1], 10);
    }
    if (anime.synopsis) {
      const m = anime.synopsis.match(/\b(19\d\d|20\d\d)\b/);
      if (m) return parseInt(m[1], 10);
    }
    if (anime.createdAt) {
      const d = new Date(anime.createdAt);
      const y = d.getFullYear();
      if (y >= 1990 && y <= 2030) return y;
    }
    return null;
  }

  function getAnimeSeason(anime: Anime): string {
    const combined = `${anime.season || ''} ${anime.startDate || ''} ${anime.synopsis || ''}`.toLowerCase();
    if (combined.includes('winter')) return 'winter';
    if (combined.includes('spring')) return 'spring';
    if (combined.includes('summer')) return 'summer';
    if (combined.includes('fall') || combined.includes('autumn')) return 'fall';
    return '';
  }

  function getAnimeSource(anime: Anime): string {
    if ((anime as any).source) return String((anime as any).source).toLowerCase();
    const syn = (anime.synopsis || '').toLowerCase();
    if (syn.includes('source: manga') || syn.includes('manga adaptation') || syn.includes('from manga')) return 'manga';
    if (syn.includes('source: light novel') || syn.includes('light novel')) return 'light_novel';
    if (syn.includes('source: original') || syn.includes('original anime')) return 'original';
    if (syn.includes('source: visual novel') || syn.includes('visual novel')) return 'visual_novel';
    if (syn.includes('source: game') || syn.includes('game adaptation')) return 'game';
    return 'other';
  }

  // Handle Input Changes
  const handleInputChange = (field: keyof FilterState, value: string) => {
    setFormFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Filter button click
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({ ...formFilters });
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (formFilters.title.trim()) params.set('q', formFilters.title.trim());
    if (formFilters.type !== 'all') params.set('format', formFilters.type);
    if (formFilters.status !== 'all') params.set('status', formFilters.status);
    if (formFilters.sort !== 'default') params.set('sort', formFilters.sort);
    if (selectedLetter !== 'ALL') params.set('letter', selectedLetter);
    setSearchParams(params, { replace: true });
  };

  // Handle Reset button click
  const handleResetFilters = () => {
    setFormFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedLetter('ALL');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  // Handle A to Z Alphabet click
  const handleSelectLetter = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    if (letter === 'ALL') {
      params.delete('letter');
    } else {
      params.set('letter', letter);
    }
    setSearchParams(params, { replace: true });
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.title.trim()) count++;
    if (appliedFilters.genre !== 'all') count++;
    if (appliedFilters.season !== 'all') count++;
    if (appliedFilters.year !== 'all') count++;
    if (appliedFilters.type !== 'all') count++;
    if (appliedFilters.status !== 'all') count++;
    if (appliedFilters.language !== 'all') count++;
    if (appliedFilters.rating !== 'all') count++;
    if (appliedFilters.source !== 'all') count++;
    if (appliedFilters.episodeRange !== 'all') count++;
    if (appliedFilters.sort !== 'default') count++;
    if (appliedFilters.exclude !== 'none') count++;
    if (selectedLetter !== 'ALL') count++;
    return count;
  }, [appliedFilters, selectedLetter]);

  // Main Filtering Logic
  const filteredAnimeList = useMemo(() => {
    let list = [...allAnime];

    // 1. TITLE filter
    if (appliedFilters.title.trim()) {
      const q = appliedFilters.title.toLowerCase().trim();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.nativeTitle?.toLowerCase().includes(q) ||
        a.slug?.toLowerCase().includes(q) ||
        a.genres?.some(g => g.toLowerCase().includes(q))
      );
    }

    // 2. A to Z Alphabet filter
    if (selectedLetter && selectedLetter !== 'ALL') {
      list = list.filter(a => {
        const titleStr = (a.title || '').trim().toUpperCase();
        const nativeStr = (a.nativeTitle || '').trim().toUpperCase();
        if (selectedLetter === '#') {
          const firstChar = titleStr[0] || '';
          return !/^[A-Z]$/.test(firstChar);
        }
        return titleStr.startsWith(selectedLetter) || nativeStr.startsWith(selectedLetter);
      });
    }

    // 3. GENRE filter
    if (appliedFilters.genre && appliedFilters.genre !== 'all') {
      list = list.filter(a =>
        a.genres?.some(g => g.toLowerCase() === appliedFilters.genre.toLowerCase())
      );
    }

    // 4. SEASON filter
    if (appliedFilters.season && appliedFilters.season !== 'all') {
      list = list.filter(a => getAnimeSeason(a) === appliedFilters.season.toLowerCase());
    }

    // 5. YEAR filter
    if (appliedFilters.year && appliedFilters.year !== 'all') {
      if (appliedFilters.year.includes('-')) {
        const [start, end] = appliedFilters.year.split('-').map(Number);
        list = list.filter(a => {
          const yr = getAnimeYear(a);
          return yr !== null && yr >= start && yr <= end;
        });
      } else if (appliedFilters.year === 'before_2000') {
        list = list.filter(a => {
          const yr = getAnimeYear(a);
          return yr !== null && yr < 2000;
        });
      } else {
        const targetYear = parseInt(appliedFilters.year, 10);
        list = list.filter(a => getAnimeYear(a) === targetYear);
      }
    }

    // 6. TYPE filter
    if (appliedFilters.type && appliedFilters.type !== 'all') {
      const targetType = appliedFilters.type.toUpperCase();
      list = list.filter(a => {
        const aFormat = (a.format || 'TV').toUpperCase();
        if (targetType === 'SPECIAL') {
          return aFormat === 'SPECIAL' || aFormat === 'OVA';
        }
        return aFormat === targetType;
      });
    }

    // 7. STATUS filter
    if (appliedFilters.status && appliedFilters.status !== 'all') {
      const st = appliedFilters.status.toLowerCase();
      list = list.filter(a => {
        const animeStatus = (a.status || '').toLowerCase();
        if (st === 'finished') {
          return animeStatus.includes('finish') || animeStatus.includes('complete');
        }
        if (st === 'releasing' || st === 'airing') {
          return animeStatus.includes('releas') || animeStatus.includes('air') || animeStatus.includes('ongoing');
        }
        if (st === 'upcoming') {
          return animeStatus.includes('not') || animeStatus.includes('upcoming');
        }
        return animeStatus === st;
      });
    }

    // 8. LANGUAGE filter
    if (appliedFilters.language && appliedFilters.language !== 'all') {
      const lang = appliedFilters.language.toLowerCase();
      list = list.filter(a => {
        if (lang === 'dub') {
          return (a.dubEpisodesCount && a.dubEpisodesCount > 0);
        }
        if (lang === 'multi') {
          return (a.multiEpisodesCount && a.multiEpisodesCount > 0);
        }
        if (lang === 'sub') {
          return (a.subEpisodesCount && a.subEpisodesCount > 0) || true;
        }
        return true;
      });
    }

    // 9. RATING filter
    if (appliedFilters.rating && appliedFilters.rating !== 'all') {
      const minRating = parseInt(appliedFilters.rating, 10);
      if (!isNaN(minRating)) {
        list = list.filter(a => {
          const score = parseInt(a.averageScore?.replace('%', '') || '0', 10);
          return score >= minRating;
        });
      }
    }

    // 10. SOURCE filter
    if (appliedFilters.source && appliedFilters.source !== 'all') {
      list = list.filter(a => getAnimeSource(a) === appliedFilters.source.toLowerCase());
    }

    // 11. EPISODE RANGE filter
    if (appliedFilters.episodeRange && appliedFilters.episodeRange !== 'all') {
      const range = appliedFilters.episodeRange;
      list = list.filter(a => {
        const count = a.totalEpisodes || a.subEpisodesCount || 0;
        if (range === '1-12') return count >= 1 && count <= 12;
        if (range === '13-24') return count >= 13 && count <= 24;
        if (range === '25-50') return count >= 25 && count <= 50;
        if (range === '50-100') return count >= 50 && count <= 100;
        if (range === '100+') return count > 100;
        return true;
      });
    }

    // 12. EXCLUDE LIST filter
    if (appliedFilters.exclude && appliedFilters.exclude !== 'none') {
      const excl = appliedFilters.exclude.toLowerCase();
      if (excl === 'adult') {
        list = list.filter(a => !a.isAdult && !a.is18Plus && !a.genres?.some(g => g.toLowerCase().includes('hentai') || g.toLowerCase().includes('erotica')));
      } else if (excl === 'movie') {
        list = list.filter(a => (a.format || '').toUpperCase() !== 'MOVIE');
      } else if (excl === 'special') {
        list = list.filter(a => {
          const fmt = (a.format || '').toUpperCase();
          return fmt !== 'SPECIAL' && fmt !== 'OVA';
        });
      }
    }

    // 13. SORTING
    const sortVal = appliedFilters.sort;
    if (sortVal === 'score') {
      list.sort((a, b) => {
        const scoreA = parseInt(a.averageScore?.replace('%', '') || '0', 10);
        const scoreB = parseInt(b.averageScore?.replace('%', '') || '0', 10);
        return scoreB - scoreA;
      });
    } else if (sortVal === 'newest') {
      list.sort((a, b) => {
        const timeA = a.recentlyAddedAt || a.createdAt || 0;
        const timeB = b.recentlyAddedAt || b.createdAt || 0;
        return timeB - timeA;
      });
    } else if (sortVal === 'release') {
      list.sort((a, b) => getAnimeReleaseTimestamp(b) - getAnimeReleaseTimestamp(a));
    } else if (sortVal === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortVal === 'title_desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (sortVal === 'episodes') {
      list.sort((a, b) => (b.totalEpisodes || 0) - (a.totalEpisodes || 0));
    }

    return list;
  }, [allAnime, appliedFilters, selectedLetter]);

  // Total pages and paginated slice
  const totalItems = filteredAnimeList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedAnimeList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAnimeList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAnimeList, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const selectStyle = "w-full bg-yoru-surface hover:bg-yoru-surface-elevated border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white/90 focus:outline-none focus:border-yoru-accent transition-colors appearance-none cursor-pointer pr-6";
  const selectOptionStyle = "bg-yoru-surface-elevated text-white py-1";

  return (
    <div className="min-h-screen bg-yoru-bg text-white pt-20 pb-20 px-3 sm:px-4 md:px-6 max-w-[1720px] mx-auto">
      
      {/* 2-Column Responsive Layout: Left (Main Content & Grid), Right (Top Rated Sidebar) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left / Main Section */}
        <div className="w-full lg:flex-1 min-w-0">
          
          {/* Section Title: "Filter" exactly as in screenshot */}
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
            Filter
          </h1>

          {/* Ultra-Compact Filter Bar (2 rows of 6 controls, exactly matching reference image) */}
          <form onSubmit={handleApplyFilters} className="space-y-2 mb-3">
            
            {/* Row 1: title, Select genre, Select season, Select year, Select type, Select status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              
              {/* 1. Title Input */}
              <div className="relative">
                <input
                  type="text"
                  value={formFilters.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="title"
                  className="w-full bg-yoru-surface border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yoru-accent transition-colors"
                />
              </div>

              {/* 2. Select Genre */}
              <div className="relative">
                <select
                  value={formFilters.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select genre</option>
                  {availableGenres.map(g => (
                    <option key={g} value={g} className={selectOptionStyle}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 3. Select Season */}
              <div className="relative">
                <select
                  value={formFilters.season}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select season</option>
                  <option value="winter" className={selectOptionStyle}>Winter</option>
                  <option value="spring" className={selectOptionStyle}>Spring</option>
                  <option value="summer" className={selectOptionStyle}>Summer</option>
                  <option value="fall" className={selectOptionStyle}>Fall</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 4. Select Year */}
              <div className="relative">
                <select
                  value={formFilters.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select year</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={String(yr)} className={selectOptionStyle}>
                      {yr}
                    </option>
                  ))}
                  <option value="2026" className={selectOptionStyle}>2026</option>
                  <option value="2025" className={selectOptionStyle}>2025</option>
                  <option value="2024" className={selectOptionStyle}>2024</option>
                  <option value="2023" className={selectOptionStyle}>2023</option>
                  <option value="2022" className={selectOptionStyle}>2022</option>
                  <option value="2020-2021" className={selectOptionStyle}>2020 - 2021</option>
                  <option value="2010-2019" className={selectOptionStyle}>2010s</option>
                  <option value="2000-2009" className={selectOptionStyle}>2000s</option>
                  <option value="before_2000" className={selectOptionStyle}>Before 2000</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 5. Select Type */}
              <div className="relative">
                <select
                  value={formFilters.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select type</option>
                  <option value="tv" className={selectOptionStyle}>TV</option>
                  <option value="movie" className={selectOptionStyle}>Movie</option>
                  <option value="ova" className={selectOptionStyle}>OVA</option>
                  <option value="ona" className={selectOptionStyle}>ONA</option>
                  <option value="special" className={selectOptionStyle}>Special</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 6. Select Status */}
              <div className="relative">
                <select
                  value={formFilters.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select status</option>
                  <option value="finished" className={selectOptionStyle}>Finished</option>
                  <option value="releasing" className={selectOptionStyle}>Releasing</option>
                  <option value="upcoming" className={selectOptionStyle}>Upcoming</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            </div>

            {/* Row 2: Select language, Select rating, Select source, Episode range, Default, Exclude list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              
              {/* 7. Select Language */}
              <div className="relative">
                <select
                  value={formFilters.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select language</option>
                  <option value="sub" className={selectOptionStyle}>SUB</option>
                  <option value="dub" className={selectOptionStyle}>DUB</option>
                  <option value="multi" className={selectOptionStyle}>MULTI</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 8. Select Rating */}
              <div className="relative">
                <select
                  value={formFilters.rating}
                  onChange={(e) => handleInputChange('rating', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select rating</option>
                  <option value="90" className={selectOptionStyle}>90%+</option>
                  <option value="80" className={selectOptionStyle}>80%+</option>
                  <option value="70" className={selectOptionStyle}>70%+</option>
                  <option value="60" className={selectOptionStyle}>60%+</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 9. Select Source */}
              <div className="relative">
                <select
                  value={formFilters.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Select source</option>
                  <option value="manga" className={selectOptionStyle}>Manga</option>
                  <option value="light_novel" className={selectOptionStyle}>Light Novel</option>
                  <option value="original" className={selectOptionStyle}>Original</option>
                  <option value="visual_novel" className={selectOptionStyle}>Visual Novel</option>
                  <option value="game" className={selectOptionStyle}>Video Game</option>
                  <option value="other" className={selectOptionStyle}>Other</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 10. Episode Range */}
              <div className="relative">
                <select
                  value={formFilters.episodeRange}
                  onChange={(e) => handleInputChange('episodeRange', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={selectOptionStyle}>Episode range</option>
                  <option value="1-12" className={selectOptionStyle}>1 - 12</option>
                  <option value="13-24" className={selectOptionStyle}>13 - 24</option>
                  <option value="25-50" className={selectOptionStyle}>25 - 50</option>
                  <option value="50-100" className={selectOptionStyle}>50 - 100</option>
                  <option value="100+" className={selectOptionStyle}>100+</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 11. Default (Sort By) */}
              <div className="relative">
                <select
                  value={formFilters.sort}
                  onChange={(e) => handleInputChange('sort', e.target.value)}
                  className={selectStyle}
                >
                  <option value="default" className={selectOptionStyle}>Default</option>
                  <option value="score" className={selectOptionStyle}>Rating</option>
                  <option value="newest" className={selectOptionStyle}>Recently Added</option>
                  <option value="release" className={selectOptionStyle}>Release Date</option>
                  <option value="title_asc" className={selectOptionStyle}>Name A-Z</option>
                  <option value="title_desc" className={selectOptionStyle}>Name Z-A</option>
                  <option value="episodes" className={selectOptionStyle}>Episodes</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 12. Exclude List */}
              <div className="relative">
                <select
                  value={formFilters.exclude}
                  onChange={(e) => handleInputChange('exclude', e.target.value)}
                  className={selectStyle}
                >
                  <option value="none" className={selectOptionStyle}>Exclude list</option>
                  <option value="adult" className={selectOptionStyle}>Exclude 18+</option>
                  <option value="movie" className={selectOptionStyle}>Exclude Movies</option>
                  <option value="special" className={selectOptionStyle}>Exclude Specials</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            </div>

            {/* Row 3: Action Buttons & A to Z Alphabet bar inline */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              
              <div className="flex items-center gap-2">
                {/* Cyan Filter Button matching reference screenshot */}
                <button
                  type="submit"
                  className="bg-[#13b5ea] hover:bg-[#0ea5e9] text-white font-semibold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                >
                  <FilterIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Filter</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-white/60 hover:text-white text-xs px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Compact A to Z Alphabet Bar (slim, no vertical space wasted) */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full scrollbar-none">
                {ALPHABET_LIST.map(letter => {
                  const isActive = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleSelectLetter(letter)}
                      className={cn(
                        "h-6 min-w-[22px] px-1 text-[11px] font-bold rounded transition-colors shrink-0 cursor-pointer flex items-center justify-center",
                        isActive
                          ? "bg-cyan-500 text-black font-extrabold shadow-sm"
                          : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                      )}
                      title={`Filter by ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

            </div>

          </form>

          {/* Grid View Controls & Counter Bar (Right above cards) */}
          <div ref={resultsRef} className="flex items-center justify-between gap-4 mb-3 pt-2">
            <div className="text-xs text-white/50 font-medium">
              {isLoading ? (
                <span>Loading catalog...</span>
              ) : (
                <span>
                  Found <strong className="text-white">{totalItems}</strong> titles
                  {selectedLetter !== 'ALL' && ` starting with "${selectedLetter}"`}
                </span>
              )}
            </div>

            {/* Layout Toggle Icons as seen in image.png */}
            <div className="flex items-center gap-1.5 text-white/40">
              <button
                type="button"
                onClick={() => setViewMode('grid-6')}
                className={cn(
                  "p-1 rounded hover:text-white transition-colors cursor-pointer",
                  viewMode === 'grid-6' ? "text-yoru-accent" : "text-white/40"
                )}
                title="6 Columns Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid-4')}
                className={cn(
                  "p-1 rounded hover:text-white transition-colors cursor-pointer",
                  viewMode === 'grid-4' ? "text-yoru-accent" : "text-white/40"
                )}
                title="4 Columns Grid"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1 rounded hover:text-white transition-colors cursor-pointer",
                  viewMode === 'list' ? "text-yoru-accent" : "text-white/40"
                )}
                title="Compact List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Anime Cards Grid - Displays Immediately Below! */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(itemsPerPage)].map((_, i) => (
                <SkeletonAnimeCard key={i} />
              ))}
            </div>
          ) : paginatedAnimeList.length > 0 ? (
            <div className="space-y-8">
              <div className={cn(
                "grid gap-3 sm:gap-3.5",
                viewMode === 'grid-6'
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  : viewMode === 'grid-4'
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
              )}>
                {paginatedAnimeList.map((anime) => (
                  <div key={anime.id} className="relative">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-4 pb-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-white/50">
                    Page {currentPage} of {totalPages} ({totalItems} total)
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={cn(
                        "px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors border",
                        currentPage === 1
                          ? "opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-white/40"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white cursor-pointer"
                      )}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                      .reduce<(number | string)[]>((acc, page, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && page - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) => {
                        if (typeof item === 'string') {
                          return (
                            <span key={`el-${idx}`} className="px-1.5 text-white/40">
                              ...
                            </span>
                          );
                        }
                        const isCurrent = currentPage === item;
                        return (
                          <button
                            key={item}
                            onClick={() => handlePageChange(item)}
                            className={cn(
                              "w-7 h-7 rounded-md text-xs font-bold transition-colors flex items-center justify-center cursor-pointer",
                              isCurrent
                                ? "bg-cyan-500 text-black font-extrabold shadow-sm"
                                : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={cn(
                        "px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors border",
                        currentPage === totalPages
                          ? "opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-white/40"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white cursor-pointer"
                      )}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="py-14 text-center bg-yoru-surface/40 border border-white/5 rounded-xl px-6 my-4">
              <h3 className="text-base font-bold text-white mb-1">
                No anime found
              </h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
                {selectedLetter !== 'ALL'
                  ? `No anime found starting with letter "${selectedLetter}". Try another letter or reset filters.`
                  : 'No anime matches your selected filter criteria. Try adjusting or resetting your selections.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

        </div>

        {/* Right Section: "Top rated anime" Sidebar (matching reference image) */}
        <div className="w-full lg:w-[280px] xl:w-[310px] shrink-0">
          <div className="sticky top-20">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center justify-between">
              <span>Top rated anime</span>
            </h2>

            <div className="space-y-2">
              {topRatedAnime.map((anime) => {
                // Calculate display rating (e.g. 9.75 out of 10)
                const scoreRaw = parseFloat((anime.averageScore || '85').replace('%', ''));
                const scoreDisplay = (scoreRaw / 10).toFixed(2);

                return (
                  <Link
                    key={anime.id}
                    to={`/anime/${anime.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-[#121924]/70 hover:bg-yoru-surface-elevated border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                  >
                    {/* Poster thumbnail */}
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-12 h-14 object-cover rounded shrink-0 bg-white/5"
                      loading="lazy"
                    />

                    {/* Meta info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-yoru-accent transition-colors line-clamp-2 leading-tight">
                        {anime.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {scoreDisplay}
                        </span>
                        <span>•</span>
                        <span>{anime.format || 'TV'}</span>
                        {anime.duration && (
                          <>
                            <span>•</span>
                            <span>{anime.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
