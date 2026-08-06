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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 mr-2 text-yoru-text-muted">
        <Tag className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Filter by Genre:</span>
      </div>
      {availableGenres.map((genre) => (
        <button
          key={genre}
          onClick={() => onToggleGenre(genre)}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all rounded-none",
            selectedGenres.includes(genre)
              ? "bg-yoru-accent border-yoru-accent text-white"
              : "bg-transparent border-yoru-border text-yoru-text-muted hover:border-yoru-accent/50 hover:text-white"
          )}
        >
          {genre}
        </button>
      ))}
      {selectedGenres.length > 0 && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-yoru-error hover:text-yoru-error/80 ml-2"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
