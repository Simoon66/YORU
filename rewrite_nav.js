const fs = require('fs');

let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// The navLinks block was already removed or maybe not. Let's find it.
content = content.replace(
  /<div className="hidden md:flex items-center gap-8">\s*\{navLinks\.map\(\(link\) => \{.*?\}\)\}\s*<\/div>/s,
  ''
);

// We want to replace the whole search section with a custom bar
// The search block starts at <div ref={searchRef} className="relative">
// and ends right before {user ? (

let searchBlockRegex = /<div ref=\{searchRef\} className="relative">.*?<\/div>\s*(?=\{user \? \()/s;

const newSearchBlock = `
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center gap-2">
              <div ref={searchRef} className="relative flex-1">
                <div className="flex items-center bg-yoru-surface-elevated/50 border border-white/10 rounded-full px-4 py-2 focus-within:border-yoru-accent transition-colors backdrop-blur-md">
                  <Search className="w-4 h-4 text-yoru-text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search anime..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchOpen(false);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev > -1 ? prev - 1 : -1));
                      } else if (e.key === 'Enter') {
                        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
                          setIsSearchOpen(false);
                          navigate(\`/anime/\${searchResults[focusedIndex].slug}\`);
                        } else if (searchQuery) {
                          setIsSearchOpen(false);
                          navigate('/search', { state: { query: searchQuery } });
                        }
                      }
                    }}
                    className="w-full bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 placeholder-white/30 ml-2"
                  />
                  {isSearching ? (
                     <Loader2 className="w-4 h-4 text-yoru-accent animate-spin shrink-0" />
                  ) : searchQuery ? (
                    <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-yoru-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                    >
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          <div className="p-2 space-y-1">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted">Results</div>
                            {searchResults.map((anime, idx) => (
                              <Link 
                                key={anime.id}
                                to={\`/anime/\${anime.slug}\`}
                                onClick={() => setIsSearchOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                                  focusedIndex === idx ? "bg-white/10" : "hover:bg-white/5"
                                )}
                              >
                                <div className="relative shrink-0">
                                  <img src={anime.poster} alt={anime.title} className="w-10 h-14 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow" />
                                  {is18PlusAnime(anime) && (
                                    <span className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-red-600/95 text-white text-[8px] font-black rounded shadow">
                                      18+
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    "text-sm font-bold truncate transition-colors",
                                    focusedIndex === idx ? "text-yoru-accent" : "text-white group-hover:text-yoru-accent"
                                  )}>{anime.title}</h4>
                                  <p className="text-[10px] text-yoru-text-muted truncate mt-0.5">{anime.nativeTitle}</p>
                                </div>
                              </Link>
                            ))}
                            <Link 
                              to="/search" 
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-3 text-center text-xs font-bold uppercase tracking-widest text-yoru-accent hover:bg-yoru-accent/10 rounded-lg transition-colors mt-2"
                            >
                              View All Results
                            </Link>
                          </div>
                        ) : searchQuery && !isSearching ? (
                          <div className="p-8 text-center text-sm text-yoru-text-muted">
                            No anime found matching "{searchQuery}"
                          </div>
                        ) : !searchQuery ? (
                          <div className="p-6 text-center">
                            <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-xs font-medium text-yoru-text-muted">Type to search for an anime</p>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/search"
                className="p-2.5 text-yoru-text-muted hover:text-white bg-yoru-surface-elevated/50 border border-white/10 rounded-full hover:border-yoru-accent transition-all shrink-0"
                title="Filter Anime"
              >
                <Filter className="w-5 h-5" />
              </Link>

              <button
                onClick={async () => {
                  try {
                    const all = await getAllAnime();
                    const published = all.filter(a => a.published);
                    if (published.length > 0) {
                      const random = published[Math.floor(Math.random() * published.length)];
                      navigate(\`/anime/\${random.slug}\`);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="p-2.5 text-yoru-text-muted hover:text-yoru-accent bg-yoru-surface-elevated/50 border border-white/10 rounded-full hover:border-yoru-accent transition-all shrink-0"
                title="Random Anime"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>
`;

content = content.replace(searchBlockRegex, newSearchBlock);
fs.writeFileSync('src/components/Navigation.tsx', content);
