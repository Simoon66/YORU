import React from 'react';
import { Logo } from './Navigation';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="px-4 md:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between border-t border-white/5 bg-[#020204] text-xs text-white/50 gap-4 md:gap-0 relative z-10 mt-auto">
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
         <span className="text-white/60">&copy; {new Date().getFullYear()} YORU Entertainment</span>
         <a href="#" className="hover:text-white transition-colors">Privacy</a>
         <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>
      <div className="flex items-center gap-2.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5 text-xs text-white/70">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" aria-hidden="true"></div>
        <span>Servers: Tokyo / Dhaka Optimized</span>
      </div>
    </footer>
  );
};
