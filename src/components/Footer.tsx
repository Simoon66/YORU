import React from 'react';
import { Logo } from './Navigation';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="px-4 md:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 bg-[#020204] text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 gap-6 md:gap-0 relative z-10 mt-auto">
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
         <span className="text-white/50">&copy; {new Date().getFullYear()} YORU ENTERTAINMENT</span>
         <a href="#" className="hover:text-white transition-colors">Privacy</a>
         <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>
      <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
        <span>Servers: Tokyo / Dhaka Optimized</span>
      </div>
    </footer>
  );
};
