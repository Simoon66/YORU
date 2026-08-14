import React from 'react';
import { Plus, Check } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface WatchlistButtonProps {
  animeId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  showText?: boolean;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({ 
  animeId, 
  className,
  variant = 'secondary',
  size = 'lg',
  showText = true
}) => {
  const { isInWatchlist, toggleWatchlist, isLoading } = useWatchlist(animeId);

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist();
      }}
      disabled={isLoading}
      className={cn(
        "transition-all duration-300 ease-[0.23,1,0.32,1] hover:scale-105 active:scale-95 shadow-md hover:shadow-xl group",
        isInWatchlist && variant !== 'icon' ? 'bg-yoru-accent/20 text-yoru-accent border-yoru-accent/50 hover:bg-yoru-accent/30 hover:border-yoru-accent' : '',
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-transform duration-500",
        isInWatchlist ? "rotate-0" : "rotate-180"
      )}>
        {isInWatchlist ? (
          <Check className="w-5 h-5 text-yoru-accent drop-shadow-[0_0_8px_rgba(var(--yoru-accent),0.8)]" />
        ) : (
          <Plus className="w-5 h-5 group-hover:text-white transition-colors" />
        )}
      </div>
      {showText && (
        <span className="ml-2 font-bold uppercase tracking-widest text-[10px] md:text-xs">
          {isInWatchlist ? 'Added' : 'Watchlist'}
        </span>
      )}
    </Button>
  );
};
