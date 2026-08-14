import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, Home, Compass, Download, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
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
          "fixed top-0 w-full z-50 transition-all duration-500 hidden md:block",
          isScrolled 
            ? "bg-yoru-bg/80 backdrop-blur-2xl border-b border-white/5 py-4 shadow-2xl" 
            : "bg-gradient-to-b from-yoru-bg/90 to-transparent py-6"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
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

            <div className="hidden md:flex items-center gap-8">
              <Link to="/search" className="text-yoru-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                <Search className="w-5 h-5" />
              </Link>
              
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
          "fixed top-0 w-full z-50 transition-all duration-300 md:hidden",
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-yoru-bg/80 backdrop-blur-2xl border-t border-white/5 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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
