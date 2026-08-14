const fs = require('fs');
let content = fs.readFileSync('src/components/WatchlistButton.tsx', 'utf8');

// replace the button render
content = content.replace(
  /return \([\s\S]*?\);\n\};/,
  `return (
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
        "transition-all duration-300 ease-[0.23,1,0.32,1] shadow-md group overflow-hidden relative",
        isInWatchlist && variant !== 'icon' ? 'bg-yoru-accent/20 text-yoru-accent border-yoru-accent/50 hover:bg-yoru-accent/30 hover:border-yoru-accent' : '',
        isInWatchlist && variant === 'icon' ? 'bg-yoru-accent text-[#030407]' : '',
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-white/20 transition-transform duration-500 rounded-full",
        isInWatchlist ? "scale-100 opacity-0" : "scale-0 opacity-100"
      )} />
      <div className={cn(
        "flex items-center justify-center transition-transform duration-500 relative z-10",
        isInWatchlist ? "rotate-0 scale-110" : "rotate-90 scale-100"
      )}>
        {isInWatchlist ? (
          <Check className={cn("w-5 h-5", variant === 'icon' ? "text-[#030407]" : "text-yoru-accent drop-shadow-[0_0_8px_rgba(var(--yoru-accent),0.8)]")} />
        ) : (
          <Plus className="w-5 h-5 group-hover:text-white transition-colors" />
        )}
      </div>
      {showText && (
        <span className="ml-2 font-bold uppercase tracking-widest text-[10px] md:text-xs relative z-10">
          {isInWatchlist ? 'Added' : 'Watchlist'}
        </span>
      )}
    </Button>
  );
};`
);
fs.writeFileSync('src/components/WatchlistButton.tsx', content);
