const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const regex = /  return \(\n    <div className="min-h-screen bg-yoru-bg pt-\[60px\] md:pt-\[72px\] pb-24">[\s\S]*?<div className="px-4 md:px-0"><CommentSection animeId=\{anime.id\} episodeId=\{currentEpisode.id\} \/><\/div>\n        <\/div>\n      <\/div>\n    <\/div>\n  \);/;

const replacement = `  return (
    <div className="min-h-screen bg-yoru-bg pt-[60px] md:pt-[72px] pb-24">
      <div className="w-full max-w-[1500px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8 flex flex-col xl:flex-row gap-0 xl:gap-8 items-start">
        
        {/* Left Column (Player & Controls) */}
        <div className="w-full xl:flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
          
          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-widest truncate text-white/50 px-4 md:px-0">
             <Link to={\`/anime/\${anime.slug}\`} className="hover:text-white transition-colors truncate">
               {anime.title}
             </Link>
             <span className="text-white/20">/</span>
             <span className="text-yoru-accent truncate">EP {currentEpisode.episodeNumber}</span>
          </div>

          {/* 1. Player */}
          <div className="relative aspect-video w-full bg-[#030407] md:rounded-2xl overflow-hidden md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b md:border border-white/5 ring-0 md:ring-1 ring-white/5">
              <iframe
                src={currentEpisode.embedLink}
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
          </div>

          {/* 2. Episode Title & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 md:p-6 md:glass-panel md:rounded-2xl md:border border-white/5 bg-yoru-surface/30 md:bg-transparent">
              <div className="space-y-3 min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-wider md:tracking-widest text-white leading-tight break-words line-clamp-2 md:line-clamp-none">
                  {anime.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
                  <span>{currentSeasonInfo?.name || 'Season 1'}</span>
                  <span className="text-white/20">•</span>
                  <span>Episode <span className="text-white">{currentEpisode.episodeNumber}</span></span>
                  {currentEpisode.isFiller && (
                    <span className="px-2 py-0.5 rounded bg-yoru-warning/20 text-yoru-warning border border-yoru-warning/30 ml-2 shadow-sm">Filler</span>
                  )}
                </div>
              </div>

              {/* Autoplay & Navigation */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap sm:flex-nowrap">
                 <WatchlistButton animeId={anime.id} size="icon" variant="secondary" className="w-10 h-10 rounded-full" showText={false} />
                 
                 <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted group-hover:text-white transition-colors">Auto Play</span>
                   <div className={clsx("w-9 h-5 rounded-full relative transition-colors duration-300", autoplay ? "bg-yoru-accent" : "bg-white/10 border border-white/20")}>
                     <div className={clsx(
                       "absolute top-[2px] w-4 h-4 rounded-full shadow-md transition-all duration-300",
                       autoplay ? "left-[18px] bg-black" : "left-[2px] bg-white"
                     )} />
                   </div>
                   <input type="checkbox" className="hidden" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
                 </label>

                 <div className="flex items-center gap-3">
                   <Button 
                     variant="secondary" 
                     size="icon" 
                     disabled={!prevEpisode}
                     onClick={() => prevEpisode && navigate(\`/watch/\${anime.slug}/\${prevEpisode.episodeNumber}?season=\${seasonParam}\`)}
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </Button>
                   <Button 
                     variant="secondary" 
                     size="icon" 
                     disabled={!nextEpisode}
                     onClick={() => nextEpisode && navigate(\`/watch/\${anime.slug}/\${nextEpisode.episodeNumber}?season=\${seasonParam}\`)}
                   >
                     <ChevronRight className="w-5 h-5" />
                   </Button>
                 </div>
              </div>
          </div>

          {/* 3. Server Selector */}
          <div className="flex flex-col gap-6 mt-2 px-4 md:px-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2 border-b border-white/5 pb-2">
                <Server className="w-4 h-4" /> Servers
              </span>
              <div className="flex flex-col gap-4">
                {['sub', 'dub', 'multi'].map((type) => {
                  const serversOfType = currentEpisodeServers.filter(ep => (ep.serverType === type) || (!ep.serverType && type === 'sub'));
                  if (serversOfType.length === 0) return null;
                  return (
                    <div key={type} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/50 w-16">
                        {type}:
                      </span>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {serversOfType.map(serverEp => (
                          <button
                            key={serverEp.id}
                            onClick={() => handleServerChange(serverEp.id)}
                            className={clsx(
                              "min-h-[40px] px-5 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ease-out border",
                              currentEpisode.id === serverEp.id 
                                ? "bg-yoru-accent text-[#030407] border-yoru-accent shadow-[0_4px_10px_rgba(226,232,240,0.2)] scale-100" 
                                : "bg-yoru-surface-elevated text-yoru-text-muted border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]"
                            )}
                          >
                            {serverEp.serverName || 'Default'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
          
          {/* 6. Comments (Desktop) */}
          <div className="hidden xl:block mt-8 border-t border-white/5 pt-8">
            <CommentSection animeId={anime.id} episodeId={currentEpisode.id} />
          </div>

        </div>

        {/* Right Sidebar (Seasons & Episodes) */}
        <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-4 md:gap-6 mt-8 xl:mt-0 px-4 md:px-0">
          <div className="xl:bg-yoru-surface-elevated/30 xl:backdrop-blur-xl xl:p-6 xl:rounded-2xl xl:border xl:border-white/5 xl:shadow-2xl flex flex-col gap-6">
            
            {/* 4. Season Selector */}
            {anime.seasons && anime.seasons.length > 1 && (
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Seasons
                  </span>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                      {anime.seasons.sort((a,b)=>a.order-b.order).map(s => (
                        <button
                          key={s.id}
                          onClick={() => navigate(\`/watch/\${anime.slug}/\${currentEpisode.episodeNumber}?season=\${s.id}\`)}
                          className={clsx(
                            "min-h-[44px] px-6 py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ease-out border flex-shrink-0",
                            seasonParam === s.id 
                              ? "bg-white text-[#030407] border-white shadow-[0_4px_10px_rgba(255,255,255,0.2)]"
                              : "bg-yoru-surface-elevated text-yoru-text-muted border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                  </div>
                </div>
            )}

            {/* 5. Episode Grid */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2">
                  <PlaySquare className="w-4 h-4" /> Episodes
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 xl:max-h-[600px] xl:overflow-y-auto custom-scrollbar xl:pr-2">
                 {uniqueEpisodes.map((ep) => {
                    const isActive = ep.episodeNumber === currentEpisode.episodeNumber;
                    const episodeServersIds = episodes.filter(e => e.episodeNumber === ep.episodeNumber && e.seasonId === ep.seasonId).map(e => e.id);
                    const isWatched = episodeServersIds.some(id => watchedEpisodes.includes(id));
                    const isFiller = ep.isFiller;
                    
                    let bgClass = "bg-yoru-surface-elevated border-white/5 text-yoru-text hover:border-white/20 hover:text-white hover:-translate-y-[2px] active:scale-[0.98]";
                    
                    if (isActive) {
                      bgClass = "bg-yoru-accent text-[#030407] border-yoru-accent shadow-[0_4px_10px_rgba(226,232,240,0.2)]";
                    } else if (isWatched) {
                      bgClass = "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]";
                    } else if (isFiller) {
                      bgClass = "bg-[#1f1a18] border-yoru-warning/30 text-yoru-warning/80 hover:border-yoru-warning/60 hover:text-yoru-warning hover:-translate-y-[2px] active:scale-[0.98]";
                    }
                    
                    return (
                      <Link
                        key={ep.id}
                        to={\`/watch/\${anime.slug}/\${ep.episodeNumber}?season=\${seasonParam}\`}
                        className={clsx(
                          "flex items-center justify-center aspect-square min-h-[44px] rounded-lg border font-bold text-xs md:text-sm transition-all duration-200 ease-out relative overflow-hidden group",
                          bgClass
                        )}
                        title={ep.title || \`Episode \${ep.episodeNumber}\`}
                      >
                        <span className="relative z-10">{ep.episodeNumber}</span>
                        {isWatched && !isActive && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <Check className="w-4 h-4 text-white/70" />
                          </div>
                        )}
                      </Link>
                    );
                 })}
              </div>
            </div>

          </div>
        </div>

        {/* 6. Comments (Mobile) */}
        <div className="block xl:hidden mt-8 border-t border-white/5 pt-8 px-4 w-full">
          <CommentSection animeId={anime.id} episodeId={currentEpisode.id} />
        </div>

      </div>
    </div>
  );`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Watch.tsx', content);
