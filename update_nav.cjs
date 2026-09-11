const fs = require('fs');

let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// 1. Add onSnapshot to imports
content = content.replace(
  `import { collection, query, where, getDocs } from 'firebase/firestore';`,
  `import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';`
);

// 2. Add watchlistCount state
content = content.replace(
  `const searchRef = useRef<HTMLDivElement>(null);`,
  `const searchRef = useRef<HTMLDivElement>(null);\n  const [watchlistCount, setWatchlistCount] = useState(0);`
);

// 3. Add useEffect for watchlistCount
const useEffectStr = `
  useEffect(() => {
    if (!user) {
      setWatchlistCount(0);
      return;
    }
    const q = query(collection(db, 'watchlist'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setWatchlistCount(snap.size);
    });
    return () => unsubscribe();
  }, [user]);
`;

content = content.replace(
  `useEffect(() => {`,
  `${useEffectStr}\n  useEffect(() => {`
);

// 4. Update Desktop Watchlist Link
const oldWatchlistLink = `<Link to="/watchlist" className="relative group">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                      location.pathname === '/watchlist' ? "text-white" : "text-yoru-text-muted group-hover:text-white"
                    )}>
                      Watchlist
                    </span>
                    {location.pathname === '/watchlist' && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yoru-accent rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>`;

const newWatchlistLink = `<Link to="/watchlist" className="relative group p-2 hover:bg-white/5 rounded-full transition-colors flex items-center justify-center" title="Watchlist">
                    <Bookmark className={cn("w-5 h-5 transition-colors duration-300", location.pathname === '/watchlist' ? "text-yoru-accent" : "text-yoru-text-muted group-hover:text-white")} />
                    {watchlistCount > 0 && (
                      <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-yoru-surface" />
                    )}
                  </Link>`;

content = content.replace(oldWatchlistLink, newWatchlistLink);

// 5. Update Mobile Top Nav
const oldMobileNav = `<nav className={cn(
          "fixed top-0 w-full z-[100] transition-all duration-300 md:hidden",
          isScrolled ? "bg-yoru-bg/90 backdrop-blur-2xl border-b border-white/5 py-3" : "bg-gradient-to-b from-yoru-bg/90 to-transparent py-4"
        )}>
         <div className="px-5 flex justify-between items-center">
            <Link to="/home">
              <Logo className="scale-90 origin-left" />
            </Link>
            <Link to="/search" className="p-2.5 text-white/70 hover:text-white bg-white/5 backdrop-blur-md rounded-full border border-white/10">
               <Search className="w-5 h-5" />
            </Link>
         </div>
      </nav>`;

const searchResultsMarkup = `
                    <div className="max-h-[60vh] overflow-y-auto">
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
`;

const newMobileNav = `<nav className={cn(
          "fixed top-0 w-full z-[100] transition-all duration-300 md:hidden",
          isScrolled || isSearchOpen ? "bg-yoru-bg/95 backdrop-blur-2xl border-b border-white/5 py-3" : "bg-gradient-to-b from-yoru-bg/90 to-transparent py-4"
        )}>
         <div className="px-4 flex flex-col gap-3 relative">
            <div className="flex justify-between items-center h-10">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 w-full">
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 -ml-2 text-white/70 hover:text-white shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-yoru-accent transition-colors">
                    <Search className="w-4 h-4 text-yoru-text-muted shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search anime..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false);
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
                      <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/home">
                    <Logo className="scale-75 origin-left" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsSearchOpen(true)} className="p-2 text-white/70 hover:text-white bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                      <Search className="w-4 h-4" />
                    </button>
                    <Link to="/watchlist" className="relative p-2 text-white/70 hover:text-white bg-white/5 rounded-full border border-white/10">
                       <Bookmark className="w-4 h-4" />
                       {watchlistCount > 0 && (
                         <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-yoru-bg" />
                       )}
                    </Link>
                    {user ? (
                      <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/10 shrink-0">
                         {profile?.photoURL || user.photoURL ? (
                           <img src={(profile?.photoURL || user.photoURL) as string} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <User className="w-4 h-4 text-white/70" />
                           </div>
                         )}
                      </Link>
                    ) : (
                      <button onClick={handleLogin} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                         <User className="w-4 h-4 text-white/70" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-4 right-4 mt-2 bg-yoru-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden z-[110]"
                  >
                    ${searchResultsMarkup}
                  </motion.div>
                )}
            </AnimatePresence>
         </div>
      </nav>`;

content = content.replace(oldMobileNav, newMobileNav);

fs.writeFileSync('src/components/Navigation.tsx', content);
