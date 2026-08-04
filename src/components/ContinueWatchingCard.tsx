import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

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
  const progressPercent = item.progress || 0;
  
  return (
    <Link to={`/watch/${item.slug}/${item.episodeNumber}`} className="group relative block w-full overflow-hidden rounded-lg bg-yoru-surface-elevated aspect-video border border-yoru-border">
      <img
        src={item.backdrop || item.coverImage}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-yoru-bg/50 to-transparent opacity-80" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/40">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yoru-accent text-white shadow-lg shadow-yoru-accent/30">
          <Play className="h-5 w-5 fill-current ml-1" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yoru-accent transition-colors">
          {item.title}
        </h4>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yoru-accent">
          Episode {item.episodeNumber}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
        <div 
          className="h-full bg-yoru-accent" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Link>
  );
};
