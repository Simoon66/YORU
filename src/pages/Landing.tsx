import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  Facebook, 
  Instagram, 
  MessagesSquare, 
  Send 
} from 'lucide-react';
import { Logo } from '../components/Navigation';
import { motion } from 'motion/react';
import desktopMoonBg from '../assets/images/yoru_desktop_moon_opt.webp';
import mobileMoonBg from '../assets/images/yoru_mobile_moon_opt.webp';

export const Landing: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  // Social Links in user-specified exact order: Facebook, Instagram, Discord, Telegram
  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      href: '#',
      color: 'hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: '#',
      color: 'hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10',
    },
    {
      name: 'Discord',
      icon: MessagesSquare,
      href: '#',
      color: 'hover:text-[#5865F2] hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10',
    },
    {
      name: 'Telegram',
      icon: Send,
      href: '#',
      color: 'hover:text-[#229ED9] hover:border-[#229ED9]/50 hover:bg-[#229ED9]/10',
    }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Cinematic Night Background Layer (Responsive Desktop / Mobile Wallpaper) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <picture className="w-full h-full block">
          <source media="(max-width: 640px)" srcSet={mobileMoonBg} type="image/webp" />
          <img
            src={desktopMoonBg}
            alt="YORU Night Backdrop"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[center_top] sm:object-center opacity-90 transition-opacity duration-500"
          />
        </picture>
        {/* Subtle Dark Vignette (Monochrome, no red) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/40 to-[#030407]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(3,4,7,0.8)_85%)]" />
      </div>

      {/* Subtle Monochrome Silver Moonlight Glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-slate-100/[0.03] rounded-full blur-[140px] pointer-events-none z-[1]" />

      {/* Minimal, Focused Single Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10 rounded-3xl bg-[#06080e]/65 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/5"
      >
        {/* Centered Logo */}
        <div className="flex justify-center mb-3">
          <Logo className="scale-115 sm:scale-125 origin-center" />
        </div>

        {/* Concise Tagline */}
        <p className="text-xs sm:text-sm text-yoru-text-muted text-center max-w-sm mx-auto leading-relaxed mb-6">
          Enter your world of limitless anime streaming in true 1080p Ultra HD.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative group mb-4">
          <div 
            className={`relative flex items-center rounded-2xl transition-all duration-300 border ${
              isFocused 
                ? 'bg-black/90 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.1)]' 
                : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
            }`}
          >
            <Search className="absolute left-4 sm:left-5 w-4 h-4 sm:w-5 sm:h-5 text-yoru-text-muted group-focus-within:text-white transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search anime..."
              className="w-full bg-transparent text-white placeholder-white/35 text-sm sm:text-base rounded-2xl pl-11 sm:pl-13 pr-28 sm:pr-32 py-3 sm:py-3.5 focus:outline-none transition-all"
            />
            <div className="absolute right-22 sm:right-26 flex items-center pointer-events-none opacity-50">
              <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-white/10 border border-white/20 rounded text-white tracking-wider">S</span>
            </div>
            <button
              type="submit"
              className="absolute right-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Single Primary Action Button: Visit Home -> */}
        <div className="mb-6">
          <Link
            to="/home"
            className="group relative inline-flex items-center justify-center w-full py-3 sm:py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base text-white bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 active:scale-[0.99] transition-all duration-300 shadow-sm"
          >
            <span>Visit Home</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>

        {/* Social Icons inside the card in specified order: Facebook, Instagram, Discord, Telegram */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-4 gap-2.5">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === '#') e.preventDefault();
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 transition-all duration-200 group ${item.color} active:scale-95`}
                  title={item.name}
                  aria-label={item.name}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline text-xs font-medium">{item.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
