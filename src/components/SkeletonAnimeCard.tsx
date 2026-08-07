import React from 'react';

export const SkeletonAnimeCard = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-yoru-surface-elevated animate-pulse border border-white/5 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent z-10 opacity-80" />
      </div>
      <div className="space-y-2 px-1">
        <div className="h-3.5 bg-yoru-surface-elevated rounded animate-pulse w-3/4" />
        <div className="h-2.5 bg-yoru-surface-elevated rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
};
