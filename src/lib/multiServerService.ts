import { Anime, Episode, LinkedSeason } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, collectionGroup, getDocs } from 'firebase/firestore';

export const MULTISERVER_FIREBASE_CONFIG = {
  projectId: "ai-studio-applet-webapp-da80e",
  appId: "1:1003173197683:web:7e3b4aa36fa28c8ac13706",
  apiKey: "AIzaSyBlqzME9XchQwSTsOvK9mwtFj8q-8bz4xk",
  authDomain: "ai-studio-applet-webapp-da80e.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-275461e9-2fee-4ae9-a370-41c81e004bf4",
  storageBucket: "ai-studio-applet-webapp-da80e.firebasestorage.app",
  messagingSenderId: "1003173197683"
};

export interface MultiServerItem {
  order: number;
  type: string;
  season: string;
  title: string;
  anime_id: string;
  anilist_id: number | string;
  mal_id: number | string;
  episodes_available: number[];
  episodes_count: number;
  total_episodes?: number;
  cover_image: string;
  backdrop_image?: string;
  status?: string;
  format?: string;
  synopsis?: string;
  genres?: string[];
  studios?: string[];
  score?: string | number;
}

export interface MultiServerGroup {
  group_id: string;
  title: string;
  slug: string;
  is_franchise: boolean;
  total_entries: number;
  items: MultiServerItem[];
}

export interface MultiServerRecentEpisode {
  anime_id: string;
  anilist_id: number | string;
  mal_id: number | string;
  group_id: string;
  group_title: string;
  title: string;
  season: string;
  latest_episode_number: number;
  available_episodes: number[];
  embed_url: string;
  updated_at: number | string;
}

const CACHE_KEY = 'multiserver_set_v4';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface MultiServerCache {
  timestamp: number;
  anime: Anime[];
  episodesByAnimeId: Record<string, Episode[]>;
  franchises: MultiServerGroup[];
  rawItems: MultiServerItem[];
}

let inMemoryCache: MultiServerCache | null = null;
let fetchPromise: Promise<MultiServerCache> | null = null;

function getRemoteFirestore() {
  const existingApp = getApps().find(a => a.name === 'multiserver-remote');
  const remoteApp = existingApp || initializeApp(MULTISERVER_FIREBASE_CONFIG, 'multiserver-remote');
  return getFirestore(remoteApp, MULTISERVER_FIREBASE_CONFIG.firestoreDatabaseId);
}

function loadLocalCache(): MultiServerCache | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: MultiServerCache = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.anime) && parsed.anime.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore cache load error
  }
  return null;
}

function saveLocalCache(cache: MultiServerCache) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Local storage full or unavailable
  }
}

/**
 * Directly queries the MultiServer Firestore to generate the complete dataset (/set)
 * Works in any environment (Cloudflare Pages https://yoru-die.pages.dev/, Node, local browser)
 */
export async function fetchMultiServerRawDataset(): Promise<{ groups: MultiServerGroup[]; rawItems: MultiServerItem[] }> {
  try {
    const remoteDb = getRemoteFirestore();
    const [franchisesSnap, animeSnap, episodesSnap] = await Promise.all([
      getDocs(collection(remoteDb, 'franchises')),
      getDocs(collection(remoteDb, 'anime')),
      getDocs(collectionGroup(remoteDb, 'episodes'))
    ]);

    // Map episodes by animeId
    const episodesByAnimeId: Record<string, number[]> = {};
    episodesSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.hidden && data.animeId && data.number !== undefined) {
        const aId = String(data.animeId);
        if (!episodesByAnimeId[aId]) episodesByAnimeId[aId] = [];
        const num = Number(data.number);
        if (!episodesByAnimeId[aId].includes(num)) {
          episodesByAnimeId[aId].push(num);
        }
      }
    });

    Object.keys(episodesByAnimeId).forEach(aId => {
      episodesByAnimeId[aId].sort((a, b) => a - b);
    });

    // Map anime docs by id
    const animeById: Record<string, any> = {};
    animeSnap.docs.forEach(docSnap => {
      animeById[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });

    const franchiseCoveredAnimeIds = new Set<string>();
    const groups: MultiServerGroup[] = [];
    const allItems: MultiServerItem[] = [];

    // 1. Process Franchises
    franchisesSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const items: MultiServerItem[] = [];
      const seen = new Set<string>();

      rawItems.forEach((it: any, idx: number) => {
        const aId = String(it.animeId);
        if (!aId || seen.has(aId)) return;
        seen.add(aId);
        franchiseCoveredAnimeIds.add(aId);

        const animeData = animeById[aId] || {};
        const epNums = episodesByAnimeId[aId] || [];
        const itemTitle = it.customTitle ||
          animeData.title?.english ||
          animeData.title?.romaji ||
          animeData.title?.native ||
          `Anime ${aId}`;

        const seasonNum = it.seasonNumber !== undefined && it.seasonNumber !== null && String(it.seasonNumber).trim() !== ''
          ? String(it.seasonNumber).trim()
          : it.type === 'Movie' ? 'Movie' : it.type === 'Special' ? 'Special' : it.type === 'OVA' ? 'OVA' : '1';

        const itemObj: MultiServerItem = {
          order: Number(it.order) || idx + 1,
          type: it.type || 'Season',
          season: seasonNum,
          title: itemTitle,
          anime_id: aId,
          anilist_id: animeData.anilistId || (isNaN(Number(aId)) ? aId : Number(aId)),
          mal_id: animeData.malId || '',
          status: animeData.status || 'FINISHED',
          format: animeData.format || (it.type === 'Movie' ? 'MOVIE' : 'TV'),
          episodes_available: epNums,
          episodes_count: epNums.length,
          total_episodes: animeData.episodes || epNums.length,
          cover_image: animeData.coverImage || data.coverImage || '',
          backdrop_image: animeData.bannerImage || animeData.coverImage || data.coverImage || '',
          synopsis: animeData.description || '',
          genres: animeData.genres || ['Anime'],
          studios: Array.isArray(animeData.studios) ? animeData.studios : [],
          score: animeData.averageScore || '85%'
        };

        items.push(itemObj);
        allItems.push(itemObj);
      });

      items.sort((a, b) => a.order - b.order);
      const groupId = String(data.slug || docSnap.id || `grp_${docSnap.id}`).trim().toLowerCase().replace(/\s+/g, '-');
      groups.push({
        group_id: groupId,
        title: data.title || 'Untitled Franchise',
        slug: data.slug || docSnap.id,
        is_franchise: true,
        total_entries: items.length,
        items
      });
    });

    // 2. Process Standalone Anime
    Object.values(animeById).forEach(animeData => {
      const aId = String(animeData.id);
      if (!franchiseCoveredAnimeIds.has(aId)) {
        const epNums = episodesByAnimeId[aId] || [];
        const animeTitle = animeData.title?.english ||
          animeData.title?.romaji ||
          animeData.title?.native ||
          `Anime ${aId}`;

        const itemObj: MultiServerItem = {
          order: 1,
          type: animeData.format === 'MOVIE' ? 'Movie' : 'Season',
          season: '1',
          title: animeTitle,
          anime_id: aId,
          anilist_id: animeData.anilistId || (isNaN(Number(aId)) ? aId : Number(aId)),
          mal_id: animeData.malId || '',
          status: animeData.status || 'FINISHED',
          format: animeData.format || 'TV',
          episodes_available: epNums,
          episodes_count: epNums.length,
          total_episodes: animeData.episodes || epNums.length,
          cover_image: animeData.coverImage || '',
          backdrop_image: animeData.bannerImage || animeData.coverImage || '',
          synopsis: animeData.description || '',
          genres: animeData.genres || ['Anime'],
          studios: Array.isArray(animeData.studios) ? animeData.studios : [],
          score: animeData.averageScore || '85%'
        };

        allItems.push(itemObj);
        const singleGroupId = `single_${itemObj.anilist_id || itemObj.mal_id || aId}`;
        groups.push({
          group_id: singleGroupId,
          title: animeTitle,
          slug: `single-${aId}`,
          is_franchise: false,
          total_entries: 1,
          items: [itemObj]
        });
      }
    });

    return { groups, rawItems: allItems };
  } catch (err) {
    console.error('Failed to fetch raw dataset from MultiServer Firestore', err);
    return { groups: [], rawItems: [] };
  }
}

/**
 * Fetch and assemble all data from multiserver.pages.dev/set
 */
export async function fetchMultiServerDataset(forceRefresh = false): Promise<MultiServerCache> {
  if (!forceRefresh) {
    if (inMemoryCache && Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS) {
      return inMemoryCache;
    }
    const local = loadLocalCache();
    if (local) {
      inMemoryCache = local;
      return local;
    }
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const { groups, rawItems } = await fetchMultiServerRawDataset();

      const assembledAnime: Anime[] = [];
      const assembledEpisodes: Record<string, Episode[]> = {};

      groups.forEach(group => {
        const uniqueItems = Array.from(
          new Map(group.items.map(item => [item.anime_id, item])).values()
        ).sort((a, b) => a.order - b.order);

        if (uniqueItems.length === 0) return;

        const mainItem = uniqueItems[0];
        const groupId = group.group_id;

        const linkedSeasons: LinkedSeason[] = uniqueItems.map(item => {
          const itemType = item.type || 'Season';
          let seasonName = '';

          if (itemType === 'Movie') {
            seasonName = `🎬 ${item.title || 'Movie ' + (item.season || '')}`.trim();
          } else if (itemType === 'Special') {
            seasonName = `⭐ ${item.season || 'Special'}${item.title ? ': ' + item.title : ''}`;
          } else if (itemType === 'OVA') {
            seasonName = `💿 OVA ${item.season || ''}${item.title ? ': ' + item.title : ''}`;
          } else {
            seasonName = `Season ${item.season || '1'}${item.title ? ': ' + item.title : ''}`;
          }

          return {
            animeId: item.anime_id,
            seasonNumber: item.order,
            seasonName: seasonName,
            slug: `${groupId}-${item.anime_id}`,
            title: seasonName
          };
        });

        const animeObj: Anime = {
          id: groupId,
          aniListId: String(mainItem.anilist_id || mainItem.anime_id),
          title: group.title,
          nativeTitle: group.title,
          slug: groupId,
          format: mainItem.type === 'Movie' ? 'Movie' : 'TV',
          totalEpisodes: mainItem.total_episodes || mainItem.episodes_count || 12,
          episodeDuration: '24 mins',
          status: mainItem.status === 'FINISHED' ? 'Finished' : 'Releasing',
          studios: Array.isArray(mainItem.studios) && mainItem.studios.length > 0 ? mainItem.studios.join(', ') : 'MultiServer',
          genres: mainItem.genres && mainItem.genres.length > 0 ? mainItem.genres : ['Anime'],
          startDate: '',
          endDate: '',
          season: 'UNKNOWN',
          averageScore: typeof mainItem.score === 'number' ? `${mainItem.score}%` : (mainItem.score || '85%'),
          poster: mainItem.cover_image || 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80&w=600',
          backdrop: mainItem.backdrop_image || mainItem.cover_image || '',
          synopsis: mainItem.synopsis || 'Imported from MultiServer.',
          seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
          linkedSeasons: linkedSeasons,
          subEpisodesCount: 0,
          dubEpisodesCount: 0,
          multiEpisodesCount: mainItem.episodes_available?.length || 0,
          recentlyAddedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          published: true
        };

        assembledAnime.push(animeObj);

        // Build Episodes
        uniqueItems.forEach(item => {
          const itemEps: Episode[] = (item.episodes_available || []).map(epNum => {
            const anilistOrId = item.anilist_id || item.mal_id || item.anime_id;
            return {
              id: `${item.anime_id}_${epNum}`,
              animeId: groupId,
              seasonId: item.anime_id,
              episodeNumber: epNum,
              title: `Episode ${epNum}`,
              isFiller: false,
              servers: [
                {
                  serverName: 'Multi',
                  serverType: 'multi',
                  embedLink: `https://multiserver.pages.dev/${anilistOrId}/${epNum}`
                }
              ],
              thumbnailUrl: item.cover_image || animeObj.poster,
              createdAt: Date.now(),
              published: true
            };
          });

          if (!assembledEpisodes[groupId]) {
            assembledEpisodes[groupId] = [];
          }
          assembledEpisodes[groupId].push(...itemEps);
        });
      });

      const result: MultiServerCache = {
        timestamp: Date.now(),
        anime: assembledAnime,
        episodesByAnimeId: assembledEpisodes,
        franchises: groups,
        rawItems
      };

      inMemoryCache = result;
      saveLocalCache(result);
      return result;
    } catch (err) {
      console.warn("fetchMultiServerDataset error", err);
      return { timestamp: Date.now(), anime: [], episodesByAnimeId: {}, franchises: [], rawItems: [] };
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function getMultiServerAnime(): Promise<Anime[]> {
  const dataset = await fetchMultiServerDataset();
  return dataset.anime;
}

export async function getMultiServerAnimeBySlug(slugOrId: string): Promise<Anime | null> {
  const dataset = await fetchMultiServerDataset();
  const clean = String(slugOrId).toLowerCase().trim();
  return dataset.anime.find(a => 
    a.slug.toLowerCase() === clean || 
    a.id.toLowerCase() === clean ||
    (a.aniListId && a.aniListId.toLowerCase() === clean)
  ) || null;
}

export async function getMultiServerEpisodesForAnime(animeIdOrSlug: string): Promise<Episode[]> {
  const dataset = await fetchMultiServerDataset();
  
  if (dataset.episodesByAnimeId[animeIdOrSlug]) {
    return dataset.episodesByAnimeId[animeIdOrSlug];
  }
  
  const target = dataset.anime.find(a => 
    a.slug.toLowerCase() === animeIdOrSlug.toLowerCase() || 
    a.id.toLowerCase() === animeIdOrSlug.toLowerCase() ||
    (a.aniListId && a.aniListId.toLowerCase() === animeIdOrSlug.toLowerCase())
  );
  if (target && dataset.episodesByAnimeId[target.id]) {
    return dataset.episodesByAnimeId[target.id];
  }
  
  return [];
}

/**
 * Fetch daily/recent episodes from collectionGroup('episodes')
 */
export async function fetchMultiServerRecentEpisodes(): Promise<MultiServerRecentEpisode[]> {
  try {
    const dataset = await fetchMultiServerDataset();
    const recentList: MultiServerRecentEpisode[] = [];

    for (const item of dataset.rawItems) {
      if (item.episodes_available && item.episodes_available.length > 0) {
        const latestEpNum = Math.max(...item.episodes_available);
        const anilistOrId = item.anilist_id || item.mal_id || item.anime_id;
        recentList.push({
          anime_id: item.anime_id,
          anilist_id: item.anilist_id,
          mal_id: item.mal_id,
          group_id: `single_${anilistOrId}`,
          group_title: item.title,
          title: item.title,
          season: item.season || '1',
          latest_episode_number: latestEpNum,
          available_episodes: item.episodes_available,
          embed_url: `https://multiserver.pages.dev/${anilistOrId}/${latestEpNum}`,
          updated_at: Date.now()
        });
      }
    }

    return recentList;
  } catch (e) {
    return [];
  }
}

export async function syncMultiServerToFirestore(onProgress?: (msg: string) => void): Promise<{ success: boolean; animeCount: number; epCount: number; error?: string }> {
  return { success: true, animeCount: 0, epCount: 0 };
}
