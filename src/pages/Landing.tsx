import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  MessagesSquare, 
  Send, 
  Facebook, 
  Instagram, 
  Zap, 
  Tv, 
  CloudCheck, 
  MessageSquareHeart,
  ShieldCheck,
  Flame,
  Sparkles
} from 'lucide-react';
import { Logo } from '../components/Navigation';
import { motion } from 'motion/react';
import cinematicMoonBg from '../assets/images/yoru_cinematic_moon_1788859700515.jpg';

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

  const socialLinks = [
    {
      name: 'Discord',
      icon: MessagesSquare,
      href: '#',
      color: 'hover:text-[#5865F2] hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10',
      description: 'Chat & voice with fans'
    },
    {
      name: 'Telegram',
      icon: Send,
      href: '#',
      color: 'hover:text-[#229ED9] hover:border-[#229ED9]/50 hover:bg-[#229ED9]/10',
      description: 'Instant episode alerts'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: '#',
      color: 'hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10',
      description: 'Follow page updates'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: '#',
      color: 'hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10',
      description: 'Art & anime reels'
    }
  ];

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Background Anime Image Layer (Full Moon Itachi Atmosphere) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src={cinematicMoonBg}
          alt="Cinematic Moon Silhouette"
          className="w-full h-full object-cover object-[center_30%] sm:object-center opacity-100"
        />
        {/* Cinematic Vignette & Bottom Fade ensuring foreground text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030407]/40 via-transparent to-[#030407]/90" />
      </div>

      {/* Atmospheric Ambient Glows (Echoing the Ruby Red Sharingan and Silver Moon) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none z-[1]" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-slate-100/5 rounded-full blur-[140px] pointer-events-none z-[1]" />

      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          
          {/* Main Card (Search & Portal Hub) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-black/30 backdrop-blur-md border border-white/10 p-5 sm:p-6 lg:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative overflow-hidden"
          >
            {/* Top Subtle Japanese Ambient Tag */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span>夜 // Yoru Portal</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Ultra HD 1080p</span>
              </div>
            </div>

            {/* Logo Section */}
            <div className="mb-4">
              <div className="inline-block mb-1.5">
                <Logo className="scale-100 origin-left" />
              </div>
              <p className="text-xs text-yoru-text-muted mt-2 max-w-[420px] leading-relaxed">
                Enter your world of limitless anime streaming in true 1080p Ultra HD with crystal-clear audio, customizable subtitles, and intelligent server routing.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div 
                  className={`relative flex items-center rounded-2xl transition-all duration-300 border ${
                    isFocused 
                      ? 'bg-black/80 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
                  }`}
                >
                  <Search className="absolute left-4 sm:left-5 w-4 h-4 text-yoru-text-muted group-focus-within:text-white transition-colors pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search anime by title, character, or genre..."
                    className="w-full bg-transparent text-white placeholder-white/35 text-sm rounded-2xl pl-10 sm:pl-12 pr-28 sm:pr-32 py-2.5 sm:py-3 focus:outline-none transition-all"
                  />
                  <div className="absolute right-24 sm:right-28 flex items-center gap-2 pointer-events-none opacity-50">
                    <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-white/10 border border-white/20 rounded text-white tracking-widest">S</span>
                  </div>
                  <button
                    type="submit"
                    className="absolute right-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Visit Home Action Button */}
            <div className="mb-4">
              <Link
                to="/home"
                className="group relative inline-flex items-center justify-center w-full py-2.5 px-6 rounded-2xl font-semibold text-sm text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.99] transition-all duration-300 shadow-sm"
              >
                <span>Visit Home</span>
                <ArrowRight className="w-4 h-4 ml-2.5 transition-transform duration-300 group-hover:translate-x-2" />
              </Link>
            </div>

            {/* Social Join Links */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  Join Our Community
                </span>
                <span className="text-xs text-white/40">
                  Connect & Stay Updated
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        if (item.href === '#') {
                          e.preventDefault();
                        }
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/80 transition-all duration-200 group ${item.color} active:scale-95`}
                      title={item.description}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="text-[11px] font-semibold">{item.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* About The Website Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-black/60 border border-white/10 p-5 sm:p-6 lg:p-7 backdrop-blur-xl shadow-2xl ring-1 ring-white/5"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-yoru-accent/15 border border-yoru-accent/30 text-yoru-accent mb-3">
                <ShieldCheck className="w-3 h-3" />
                About YORU
              </div>

              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug mb-3">
                The Next-Generation Anime Experience
              </h1>

              <p className="text-xs text-white/80 leading-relaxed mb-4 font-medium">
                YORU is built from the ground up for anime fans who value clarity, speed, and aesthetics. Stream your favorite series with high-speed CDN delivery, customizable subtitles, and intelligent multi-server routing.
              </p>

              {/* Feature points */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 shrink-0 mt-0">
                    <Tv className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white">Full HD 1080p Playback</h3>
                    <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                      Adaptive high-bitrate streaming with seamless <span className="text-white font-medium">Sub and Dub tracks</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 shrink-0 mt-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white">Instant CDN Delivery</h3>
                    <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                      Optimized cache servers in <span className="text-white font-medium">Tokyo & Dhaka</span> ensure bufferless playback.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 shrink-0 mt-0">
                    <CloudCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white">Cloud Watch Synchronization</h3>
                    <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                      Sync episode progress and <span className="text-white font-medium">continue watching across all your devices</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-sky-400 shrink-0 mt-0">
                    <MessageSquareHeart className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white">Community & Discussions</h3>
                    <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                      Connect with fellow fans, <span className="text-white font-medium">join episode discussions</span>, and share thoughts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom quick stats */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm sm:text-base font-black text-white">1080p</div>
                <div className="text-[10px] text-yoru-text-muted font-medium">Ultra HD</div>
              </div>
              <div className="border-x border-white/10">
                <div className="text-sm sm:text-base font-black text-white">Sub & Dub</div>
                <div className="text-[10px] text-yoru-text-muted font-medium">Dual Audio</div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">Multi-Server</div>
                <div className="text-[10px] text-yoru-text-muted font-medium">Fast CDN</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
