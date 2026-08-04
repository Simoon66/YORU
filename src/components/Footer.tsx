import React from 'react';
import { Logo } from './Navigation';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="px-4 sm:px-10 py-6 flex flex-col md:flex-row items-center justify-between border-t border-yoru-border bg-yoru-bg text-[10px] uppercase tracking-widest text-white/30 gap-4 md:gap-0 mt-20">
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
         <span>&copy; {new Date().getFullYear()} YORU ENTERTAINMENT</span>
         <a href="#" className="hover:text-yoru-accent/50 transition-colors">Privacy</a>
         <a href="#" className="hover:text-yoru-accent/50 transition-colors">Terms</a>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <span>Servers: Tokyo / Dhaka Optimized</span>
      </div>
    </footer>
  );
};
