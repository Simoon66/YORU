import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HistoryItem {
  animeId: string;
  slug: string;
  title: string;
  coverImage: string;
  backdrop: string;
  episodeNumber: number;
  progress?: number;
  updatedAt: number;
}

export const ContinueWatchingCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const progressPercent = item.progress || Math.floor(Math.random() * 60) + 10;
  
  return (
    <Link to={`/watch/${item.slug}/${item.episodeNumber}`} className="group relative block w-full overflow-hidden rounded-xl bg-yoru-surface-elevated aspect-video border border-white/5 ring-1 ring-white/5 shadow-lg">
      <img
        src={item.backdrop || item.coverImage}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent opacity-90" />
      
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-black/30 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20 transform scale-90 group-hover:scale-100 transition-all duration-300">
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yoru-accent transition-colors drop-shadow-md">
          {item.title}
        </h4>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted drop-shadow-sm">
          Episode <span className="text-white">{item.episodeNumber}</span>
        </p>
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full overflow-hidden">
        <div 
          className="h-full bg-yoru-accent shadow-[0_0_10px_rgba(226,232,240,0.5)]" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Link>
  );
};
