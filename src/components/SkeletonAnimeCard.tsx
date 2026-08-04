import React from 'react';

export const SkeletonAnimeCard = () => {
  return (
    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-yoru-surface animate-pulse border border-yoru-border">
      <div className="absolute inset-0 bg-gradient-to-t from-yoru-bg via-transparent to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 space-y-2">
        <div className="h-4 bg-yoru-surface-elevated rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-yoru-surface-elevated rounded w-12" />
          <div className="h-3 bg-yoru-surface-elevated rounded w-16" />
        </div>
      </div>
      <div className="absolute top-2 right-2 z-20 h-5 w-10 bg-yoru-surface-elevated rounded-full" />
    </div>
  );
};
