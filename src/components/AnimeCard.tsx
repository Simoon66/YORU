import React from 'react';
import { Anime } from '../types';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  return (
    <Link to={`/anime/${anime.slug}`} className="group relative block w-full transition-all duration-300">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-yoru-surface-elevated ring-1 ring-yoru-border group-hover:ring-yoru-accent/50 transition-all">
        <img 
          src={anime.poster} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <h4 className="text-xs font-bold truncate mb-1 text-white group-hover:text-yoru-accent transition-colors">
          {anime.title}
        </h4>
        <div className="flex gap-2 items-center">
          <span className="text-[9px] text-white/40 uppercase tracking-widest">{anime.genres[0] || anime.format}</span>
        </div>
      </div>
    </Link>
  );
};
