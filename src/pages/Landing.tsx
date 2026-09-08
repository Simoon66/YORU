import React, { useState } from 'react';
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
import itachiMoonBg from '../assets/images/itachi_moon_landing_1788858080790.jpg';

export const Landing: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

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
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center pt-10 sm:pt-16 pb-28 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Anime Image Layer (Full Moon Itachi Atmosphere) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src={itachiMoonBg}
          alt="Itachi Uchiha Moon Silhouette"
          className="w-full h-full object-cover object-[center_30%] sm:object-center opacity-100"
        />
        {/* Cinematic Vignette & Bottom Fade ensuring foreground text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030407]/40 via-transparent to-[#030407]/90" />
      </div>

      {/* Atmospheric Ambient Glows (Echoing the Ruby Red Sharingan and Silver Moon) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none z-[1]" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-slate-100/5 rounded-full blur-[140px] pointer-events-none z-[1]" />

      <div className="w-full max-w-6xl mx-auto relative z-10 mt-16 lg:mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Main Card (Search & Portal Hub) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-black/30 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative overflow-hidden"
          >
            {/* Top Subtle Japanese Ambient Tag */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span>夜 // YORU PORTAL</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Ultra HD 1080p</span>
              </div>
            </div>

            {/* Logo Section */}
            <div className="mb-8">
              <div className="inline-block mb-3">
                <Logo className="scale-110 sm:scale-125 origin-left" />
              </div>
              <p className="text-sm sm:text-base text-yoru-text-muted mt-2 max-w-lg leading-relaxed">
                Enter your world of limitless anime streaming in true 1080p Ultra HD with crystal-clear audio, customizable subtitles, and intelligent server routing.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div 
                  className={`relative flex items-center rounded-2xl transition-all duration-300 border ${
                    isFocused 
                      ? 'bg-black/80 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
                  }`}
                >
                  <Search className="absolute left-4 sm:left-5 w-5 h-5 text-yoru-text-muted group-focus-within:text-white transition-colors pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search anime by title, character, or genre..."
                    className="w-full bg-transparent text-white placeholder-white/35 text-sm sm:text-base rounded-2xl pl-12 sm:pl-14 pr-28 sm:pr-32 py-4 sm:py-4.5 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Visit Home Action Button */}
            <div className="mb-8">
              <Link
                to="/home"
                className="group relative inline-flex items-center justify-center w-full py-4 sm:py-4.5 px-6 rounded-2xl font-black text-base sm:text-lg text-black bg-white hover:bg-white/95 active:scale-[0.99] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_45px_rgba(255,255,255,0.38)]"
              >
                <span>Visit Home</span>
                <ArrowRight className="w-5 h-5 ml-2.5 transition-transform duration-300 group-hover:translate-x-2" />
              </Link>
            </div>

            {/* Social Join Links */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  Join Our Community
                </span>
                <span className="text-[11px] text-white/40">
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
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/80 transition-all duration-200 group ${item.color} active:scale-95`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-semibold">{item.name}</span>
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
            className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-black/30 border border-white/10 p-6 sm:p-8 lg:p-10 backdrop-blur-md shadow-2xl ring-1 ring-white/5"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-yoru-accent/15 border border-yoru-accent/30 text-yoru-accent mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                About YORU
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug mb-4">
                The Next-Generation Anime Experience
              </h2>

              <p className="text-sm sm:text-base text-yoru-text-muted leading-relaxed mb-6">
                YORU is built from the ground up for anime fans who value clarity, speed, and aesthetics. Stream your favorite series with high-speed CDN delivery, customizable subtitles, and intelligent multi-server routing.
              </p>

              {/* Feature points */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-emerald-400 shrink-0 mt-0.5">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Full HD 1080p Playback</h3>
                    <p className="text-xs text-yoru-text-muted leading-relaxed mt-0.5">
                      Adaptive high-bitrate streaming with seamless Sub and Dub tracks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Instant CDN Delivery</h3>
                    <p className="text-xs text-yoru-text-muted leading-relaxed mt-0.5">
                      Optimized cache servers in Tokyo & Dhaka ensure bufferless playback.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 shrink-0 mt-0.5">
                    <CloudCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Cloud Watch Synchronization</h3>
                    <p className="text-xs text-yoru-text-muted leading-relaxed mt-0.5">
                      Sync episode progress and continue watching across all your devices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-sky-400 shrink-0 mt-0.5">
                    <MessageSquareHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Community & Discussions</h3>
                    <p className="text-xs text-yoru-text-muted leading-relaxed mt-0.5">
                      Connect with fellow fans, join episode discussions, and share thoughts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom quick stats */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-base sm:text-lg font-black text-white">1080p</div>
                <div className="text-[11px] text-yoru-text-muted font-medium">Ultra HD</div>
              </div>
              <div className="border-x border-white/10">
                <div className="text-base sm:text-lg font-black text-white">Sub & Dub</div>
                <div className="text-[11px] text-yoru-text-muted font-medium">Dual Audio</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-white">Multi-Server</div>
                <div className="text-[11px] text-yoru-text-muted font-medium">Fast CDN</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
