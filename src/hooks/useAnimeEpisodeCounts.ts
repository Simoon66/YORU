import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Anime } from '../types';

export interface EpisodeCounts {
  sub: number;
  dub: number;
  multi: number;
}

// In-memory module cache to avoid redundant network requests
const countsCache = new Map<string, EpisodeCounts>();
const pendingRequests = new Map<string, Promise<EpisodeCounts>>();

export function useAnimeEpisodeCounts(anime: Anime): EpisodeCounts {
  const hasExactCounts =
    anime.subEpisodesCount !== undefined ||
    anime.dubEpisodesCount !== undefined ||
    anime.multiEpisodesCount !== undefined;

  const [counts, setCounts] = useState<EpisodeCounts>(() => {
    if (hasExactCounts) {
      return {
        sub: anime.subEpisodesCount ?? 0,
        dub: anime.dubEpisodesCount ?? 0,
        multi: anime.multiEpisodesCount ?? 0,
      };
    }
    if (countsCache.has(anime.id)) {
      return countsCache.get(anime.id)!;
    }
    // Instant fallback while loading asynchronously
    return {
      sub: anime.format?.toUpperCase() === 'MOVIE' ? 1 : (anime.totalEpisodes || 0),
      dub: 0,
      multi: 0,
    };
  });

  useEffect(() => {
    if (hasExactCounts) {
      setCounts({
        sub: anime.subEpisodesCount ?? 0,
        dub: anime.dubEpisodesCount ?? 0,
        multi: anime.multiEpisodesCount ?? 0,
      });
      return;
    }

    if (countsCache.has(anime.id)) {
      setCounts(countsCache.get(anime.id)!);
      return;
    }

    let isMounted = true;

    async function fetchCounts(): Promise<EpisodeCounts> {
      try {
        const epQ = query(collection(db, 'episodes'), where('animeId', '==', anime.id));
        const snap = await getDocs(epQ);

        const subEps = new Set<number>();
        const dubEps = new Set<number>();
        const multiEps = new Set<number>();

        snap.forEach((docSnap) => {
          const epData = docSnap.data();
          const epNum = typeof epData.episodeNumber === 'number' ? epData.episodeNumber : 1;

          // Check servers array
          if (Array.isArray(epData.servers)) {
            epData.servers.forEach((s: any) => {
              if (s?.serverType === 'sub') subEps.add(epNum);
              if (s?.serverType === 'dub') dubEps.add(epNum);
              if (s?.serverType === 'multi') multiEps.add(epNum);
            });
          }

          // Check direct serverType property (used in movies & flat episode records)
          if (epData.serverType === 'sub') subEps.add(epNum);
          if (epData.serverType === 'dub') dubEps.add(epNum);
          if (epData.serverType === 'multi') multiEps.add(epNum);
        });

        let sub = subEps.size;
        let dub = dubEps.size;
        let multi = multiEps.size;

        // Fallback for anime/movies without episode records yet
        if (sub === 0 && dub === 0 && multi === 0) {
          if (anime.format?.toUpperCase() === 'MOVIE') {
            sub = 1;
          } else if (anime.totalEpisodes) {
            sub = anime.totalEpisodes;
          }
        }

        const calculated = { sub, dub, multi };
        countsCache.set(anime.id, calculated);
        return calculated;
      } catch (err) {
        console.warn('Failed to fetch counts for anime:', anime.title, err);
        const fallback = { sub: anime.totalEpisodes || 0, dub: 0, multi: 0 };
        countsCache.set(anime.id, fallback);
        return fallback;
      }
    }

    if (!pendingRequests.has(anime.id)) {
      pendingRequests.set(anime.id, fetchCounts());
    }

    pendingRequests.get(anime.id)!.then((result) => {
      if (isMounted) {
        setCounts(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [anime.id, anime.subEpisodesCount, anime.dubEpisodesCount, anime.multiEpisodesCount, anime.totalEpisodes, hasExactCounts]);

  return counts;
}
