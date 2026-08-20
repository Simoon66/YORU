import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, Home, Compass, Download, Settings, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, logout, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Anime } from '../types';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AuthModal } from './AuthModal';

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 group", className)}>
    <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-shadow duration-500">
      <div className="w-3.5 h-3.5 bg-yoru-bg rotate-45 rounded-sm transition-transform duration-500 group-hover:rotate-90" />
    </div>
    <span className="text-xl md:text-2xl font-black tracking-[0.25em] text-white">YORU</span>
  </div>
);

export const Navigation = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const q = query(collection(db, 'anime'), where('published', '==', true));
        const snap = await getDocs(q);
        const results = snap.docs
          .map(d => d.data() as Anime)
          .filter(a => 
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            a.nativeTitle?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse', path: '/browse' },
  ];

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const mobileNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse', path: '/browse', icon: Compass },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: user ? '/profile' : '#login', icon: User, action: !user ? handleLogin : undefined },
  ];

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <nav 
        className={cn(
          "fixed top-0 w-full z-[100] transition-all duration-500 hidden md:block",
          isScrolled 
            ? "bg-yoru-bg/80 backdrop-blur-2xl border-b border-white/5 py-4 shadow-2xl" 
            : "bg-gradient-to-b from-yoru-bg/90 to-transparent py-6"
        )}
      >
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-12">
              <Link to="/">
                <Logo />
              </Link>
              
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link 
                      key={link.name} 
                      to={link.path}
                      className="relative group"
                    >
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                        isActive ? "text-white" : "text-yoru-text-muted group-hover:text-white"
                      )}>
                        {link.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yoru-accent rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 relative">
              <div ref={searchRef} className="relative">
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-yoru-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                  <Search className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-4 w-96 bg-yoru-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-white/10 flex items-center gap-3">
                        <Search className="w-4 h-4 text-yoru-text-muted shrink-0" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Search anime..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setIsSearchOpen(false);
                              navigate('/search', { state: { query: searchQuery } });
                            }
                          }}
                          className="w-full bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 placeholder-white/30"
                        />
                        {isSearching ? (
                           <Loader2 className="w-4 h-4 text-yoru-accent animate-spin shrink-0" />
                        ) : searchQuery ? (
                          <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          <div className="p-2 space-y-1">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted">Results</div>
                            {searchResults.map(anime => (
                              <Link 
                                key={anime.id}
                                to={`/anime/${anime.slug}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                              >
                                <img src={anime.poster} alt={anime.title} className="w-10 h-14 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-white truncate group-hover:text-yoru-accent transition-colors">{anime.title}</h4>
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
              
              {user ? (
                <div className="flex items-center gap-6">
                  <Link to="/watchlist" className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors">
                    Watchlist
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-yoru-accent hover:text-white transition-colors">
                      Admin
                    </Link>
                  )}
                  <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-yoru-accent transition-all duration-300 shadow-lg block">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
                        <User className="w-5 h-5 text-yoru-text-muted" />
                      </div>
                    )}
                  </Link>
                </div>
              ) : (
                <Button variant="primary" size="md" onClick={handleLogin} className="gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Nav (Just Logo and Search) */}
      <nav className={cn(
          "fixed top-0 w-full z-[100] transition-all duration-300 md:hidden",
          isScrolled ? "bg-yoru-bg/90 backdrop-blur-2xl border-b border-white/5 py-3" : "bg-gradient-to-b from-yoru-bg/90 to-transparent py-4"
        )}>
         <div className="px-5 flex justify-between items-center">
            <Link to="/">
              <Logo className="scale-90 origin-left" />
            </Link>
            <Link to="/search" className="p-2.5 text-white/70 hover:text-white bg-white/5 backdrop-blur-md rounded-full border border-white/10">
               <Search className="w-5 h-5" />
            </Link>
         </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-yoru-bg/80 backdrop-blur-2xl border-t border-white/5 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around px-2 py-3">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    navigate(item.path);
                  }
                }}
                className="relative flex flex-col items-center justify-center w-16 py-1 gap-1.5 transition-all group"
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-6 h-6 transition-colors duration-300", isActive ? "text-yoru-accent" : "text-yoru-text-muted group-hover:text-white/80")} />
                <span className={cn(
                  "text-[9px] font-bold tracking-widest uppercase transition-colors duration-300",
                  isActive ? "text-yoru-accent" : "text-yoru-text-muted"
                )}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
