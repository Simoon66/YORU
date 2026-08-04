import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 rounded-full border-2 border-yoru-accent"></div>
      <div className="absolute top-0 right-0 w-4 h-8 bg-yoru-bg rounded-r-full translate-x-1"></div>
    </div>
    <span className="text-2xl font-bold tracking-widest text-white">Y<span className="text-yoru-accent">O</span>RU</span>
  </div>
);

export const Navigation = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse', path: '/browse' },
    { name: 'Genres', path: '/genres' },
  ];

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled ? "bg-yoru-bg/90 backdrop-blur-md border-b border-yoru-border/50 py-3" : "bg-gradient-to-b from-yoru-bg/80 to-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-8">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Logo />
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    to={link.path}
                    className={cn(
                      "text-sm font-medium uppercase tracking-wider transition-colors hover:text-white",
                      location.pathname === link.path ? "text-white" : "text-yoru-text-muted"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/search" className="text-yoru-text-muted hover:text-white transition-colors">
                <Search className="w-5 h-5" />
              </Link>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/watchlist" className="text-sm font-medium text-yoru-text-muted hover:text-white transition-colors">
                    Watchlist
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium text-yoru-accent hover:text-yoru-accent-hover transition-colors">
                      Admin
                    </Link>
                  )}
                  <button onClick={logout} className="w-8 h-8 rounded-full overflow-hidden border border-yoru-border hover:border-yoru-accent transition-colors">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
                        <User className="w-4 h-4 text-yoru-text-muted" />
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={handleLogin} className="gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
               <Link to="/search" className="text-yoru-text-muted hover:text-white transition-colors">
                <Search className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-yoru-text-muted hover:text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-yoru-bg/95 backdrop-blur-xl pt-24 px-4 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-medium">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "transition-colors",
                    location.pathname === link.path ? "text-white" : "text-yoru-text-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-px bg-yoru-border my-2" />
              
              {user ? (
                <>
                  <Link to="/watchlist" onClick={() => setMobileMenuOpen(false)} className="text-yoru-text-muted">
                    Watchlist
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-yoru-accent">
                      Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-yoru-text-muted">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => { handleLogin(); setMobileMenuOpen(false); }} className="text-left text-yoru-accent">
                  Sign In with Google
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
