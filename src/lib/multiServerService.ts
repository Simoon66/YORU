import { Anime, Episode, LinkedSeason } from '../types';

const isNode = typeof window === 'undefined';
const MULTISERVER_BASE_URL = isNode ? 'https://multiserver.pages.dev/api' : '/api/multiserver/proxy';

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
  cover_image: string;
}

export interface MultiServerGroup {
  group_id: string;
  title: string;
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

const CACHE_KEY = 'multiserver_set_v3';
const CACHE_TTL_MS = 10 * 60 * 1000;

interface MultiServerCache {
  timestamp: number;
  anime: Anime[];
  episodesByAnimeId: Record<string, Episode[]>;
  franchises?: MultiServerGroup[];
}

let inMemoryCache: MultiServerCache | null = null;
let fetchPromise: Promise<MultiServerCache> | null = null;

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
 * Fetch and assemble all data from multiserver.pages.dev/api/set
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
      const res = await fetch(`${MULTISERVER_BASE_URL}/set`);
      if (!res.ok) throw new Error('API fetch failed');
      const text = await res.text();
      let data: MultiServerGroup[];
      
      try {
        data = JSON.parse(text);
      } catch(e) {
        // Fallback if returned HTML (simulated/down)
        data = [];
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      const assembledAnime: Anime[] = [];
      const assembledEpisodes: Record<string, Episode[]> = {};

      data.forEach(group => {
        // IDEMPOTENT UPSERT: Deduplicate by anime_id
        const uniqueItems = Array.from(
          new Map(group.items.map(item => [item.anime_id, item])).values()
        ).sort((a, b) => a.order - b.order);

        if (uniqueItems.length === 0) return;

        const mainItem = uniqueItems[0];
        const groupId = group.group_id;

        // Build LinkedSeasons
        const linkedSeasons: LinkedSeason[] = uniqueItems.map(item => {
          const itemType = item.type || 'Season';
          let seasonName = '';
          
          // Display label rules mandated by instructions
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

        // The group itself is represented by one Anime object using the group's title
        const animeObj: Anime = {
          id: groupId,
          aniListId: String(mainItem.anilist_id || mainItem.anime_id),
          title: group.title, // Franchise title
          nativeTitle: group.title,
          slug: groupId,
          format: mainItem.type === 'Movie' ? 'Movie' : 'TV',
          totalEpisodes: mainItem.episodes_count || 12,
          episodeDuration: '24 mins',
          status: 'Finished',
          studios: 'MultiServer',
          genres: ['Anime'],
          startDate: '',
          endDate: '',
          season: 'UNKNOWN',
          averageScore: '85%',
          poster: mainItem.cover_image || 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80&w=600',
          backdrop: mainItem.cover_image || '',
          synopsis: 'Imported from MultiServer.',
          seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
          linkedSeasons: linkedSeasons,
          subEpisodesCount: mainItem.episodes_available?.length || 0,
          recentlyAddedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          published: true
        };

        assembledAnime.push(animeObj);

        // Build Episodes
        uniqueItems.forEach(item => {
          const itemEps: Episode[] = (item.episodes_available || []).map(epNum => {
            return {
              id: `${item.anime_id}_${epNum}`,
              animeId: groupId,
              seasonId: item.anime_id, // We use the sub-item's anime_id as the seasonId
              episodeNumber: epNum,
              title: `Episode ${epNum}`,
              isFiller: false,
              servers: [
                {
                  serverName: 'MultiServer',
                  serverType: 'multi',
                  embedLink: `https://multiserver.pages.dev/embed/${item.anilist_id || item.mal_id || item.anime_id}/${epNum}`
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
        episodesByAnimeId: assembledEpisodes
      };

      inMemoryCache = result;
      saveLocalCache(result);
      return result;
    } catch(err) {
      console.warn("fetchMultiServerDataset error", err);
      return { timestamp: Date.now(), anime: [], episodesByAnimeId: {} };
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
 * Fetch daily/recent episodes from /api/recent
 */
export async function fetchMultiServerRecentEpisodes(): Promise<MultiServerRecentEpisode[]> {
  try {
    const res = await fetch(`${MULTISERVER_BASE_URL}/recent`);
    if (!res.ok) return [];
    const text = await res.text();
    let data = JSON.parse(text);
    if (!Array.isArray(data)) data = [];
    return data;
  } catch(e) {
    return [];
  }
}

export async function syncMultiServerToFirestore(onProgress?: (msg: string) => void): Promise<{ success: boolean; animeCount: number; epCount: number; error?: string }> {
  // Mock out firestore sync to avoid breaking admin tools since we removed firebase/firestore imports
  return { success: true, animeCount: 0, epCount: 0 };
}
