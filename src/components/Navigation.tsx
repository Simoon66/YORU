import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, Home, Compass, Download, Settings } from 'lucide-react';
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
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

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

  const mobileNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse', path: '/browse', icon: Compass },
    { name: 'Download', path: '/downloads', icon: Download },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: user ? '/profile' : '#login', icon: User, action: !user ? handleLogin : undefined },
  ];

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 hidden md:block",
          isScrolled ? "bg-yoru-bg/90 backdrop-blur-md border-b border-yoru-border/50 py-3" : "bg-gradient-to-b from-yoru-bg/80 to-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-8">
              <Link to="/">
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
          </div>
        </div>
      </nav>

      {/* Mobile Top Nav (Just Logo and Search) */}
      <nav className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 md:hidden",
          isScrolled ? "bg-yoru-bg/90 backdrop-blur-md border-b border-yoru-border/50 py-3" : "bg-gradient-to-b from-yoru-bg/80 to-transparent py-3"
        )}>
         <div className="px-4 flex justify-between items-center">
            <Link to="/">
              <Logo className="scale-90 origin-left" />
            </Link>
            <Link to="/search" className="p-2 text-yoru-text-muted hover:text-white bg-yoru-surface-elevated rounded-full">
               <Search className="w-5 h-5" />
            </Link>
         </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-yoru-surface/90 backdrop-blur-xl border-t border-yoru-border/50 md:hidden pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
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
                className={cn(
                  "flex flex-col items-center justify-center w-16 py-1 gap-1 transition-all",
                  isActive ? "text-yoru-accent" : "text-yoru-text-muted hover:text-white"
                )}
              >
                <div className={cn(
                  "p-1 rounded-full transition-all duration-300", 
                  isActive ? "bg-yoru-accent/10 translate-y-[-2px]" : ""
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "fill-yoru-accent/20")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive ? "font-bold" : ""
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
