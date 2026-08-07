import React from 'react';
import { Tag } from 'lucide-react';
import { cn } from '../lib/utils';

interface GenreChipsProps {
  availableGenres: string[];
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClearFilters: () => void;
}

export const GenreChips: React.FC<GenreChipsProps> = ({
  availableGenres,
  selectedGenres,
  onToggleGenre,
  onClearFilters,
}) => {
  if (!availableGenres.length) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap bg-yoru-surface-elevated/50 p-4 rounded-xl border border-white/5">
      <div className="flex items-center gap-2 mr-2 text-yoru-text-muted">
        <Tag className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Genres</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => onToggleGenre(genre)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md border",
              selectedGenres.includes(genre)
                ? "bg-white text-[#030407] border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                : "bg-white/5 border-white/10 text-yoru-text-muted hover:border-white/30 hover:text-white"
            )}
          >
            {genre}
          </button>
        ))}
        {selectedGenres.length > 0 && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-yoru-error/80 hover:text-yoru-error ml-2 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
