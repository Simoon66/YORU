import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, collectionGroup } from 'firebase/firestore';
import { Anime, Episode, LinkedSeason, ServerLink } from '../types';

const MULTISERVER_CONFIG = {
  projectId: 'ai-studio-applet-webapp-da80e',
  appId: '1:1003173197683:web:7e3b4aa36fa28c8ac13706',
  apiKey: 'AIzaSyBlqzME9XchQwSTsOvK9mwtFj8q-8bz4xk',
  authDomain: 'ai-studio-applet-webapp-da80e.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-275461e9-2fee-4ae9-a370-41c81e004bf4'
};

function getMultiServerDb() {
  const appName = 'multiServerApplet';
  const existingApp = getApps().find(a => a.name === appName);
  const app = existingApp || initializeApp(MULTISERVER_CONFIG, appName);
  return getFirestore(app, MULTISERVER_CONFIG.firestoreDatabaseId);
}

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

interface MultiServerCache {
  timestamp: number;
  anime: Anime[];
  episodesByAnimeId: Record<string, Episode[]>;
  franchises: any[];
}

let inMemoryCache: MultiServerCache | null = null;
let fetchPromise: Promise<MultiServerCache> | null = null;

const CACHE_KEY = 'yoru_multiserver_cache_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache in browser

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
 * Fetch and assemble all data from multiserver.pages.dev
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
      const db = getMultiServerDb();
      const [animeSnap, epSnap, embedsSnap, franchisesSnap] = await Promise.all([
        getDocs(collection(db, 'anime')),
        getDocs(collectionGroup(db, 'episodes')),
        getDocs(collection(db, 'embeds')),
        getDocs(collection(db, 'franchises'))
      ]);

      // 1. Index all Embeds
      const embedMap = new Map<string, any>();
      embedsSnap.docs.forEach(d => {
        const data = d.data();
        embedMap.set(d.id, data);
        if (data.embedId) embedMap.set(data.embedId, data);
        if (data.animeId && data.episodeNumber !== undefined) {
          embedMap.set(`${data.animeId}_${data.episodeNumber}`, data);
        }
      });

      // 2. Index raw episodes by anime ID
      const rawEpisodesByAnime = new Map<string, any[]>();
      epSnap.docs.forEach(d => {
        const data = d.data();
        if (data.hidden) return;
        const aId = String(data.animeId || d.ref.parent.parent?.id || '');
        if (!aId) return;
        if (!rawEpisodesByAnime.has(aId)) rawEpisodesByAnime.set(aId, []);
        rawEpisodesByAnime.get(aId)!.push({
          id: d.id,
          ...data
        });
      });

      // 3. Process franchises to build linked seasons
      const franchiseItemsByAnimeId = new Map<string, {
        franchiseTitle: string;
        allEntries: Array<{
          animeId: string;
          title: string;
          seasonName: string;
          seasonNumber: number;
          order: number;
        }>;
      }>();

      // Build quick lookup for anime display titles
      const animeTitleLookup = new Map<string, string>();
      animeSnap.docs.forEach(d => {
        const raw = d.data();
        const t = raw.title?.english?.trim() || raw.title?.romaji?.trim() || raw.title?.native?.trim() || `Anime ${d.id}`;
        animeTitleLookup.set(String(d.id), t);
      });

      const rawFranchises: any[] = franchisesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      rawFranchises.forEach((f: any) => {
        const items = Array.isArray(f.items) ? f.items : [];
        const entries = items.map((it: any, idx: number) => {
          const aIdStr = String(it.animeId);
          const trueTitle = it.customTitle || animeTitleLookup.get(aIdStr) || `Season ${it.seasonNumber || idx + 1}`;
          return {
            animeId: aIdStr,
            title: trueTitle,
            seasonName: it.type === 'Movie' ? 'Movie' : (it.seasonNumber ? `Season ${it.seasonNumber}` : trueTitle),
            seasonNumber: idx + 1,
            order: Number(it.order) || idx + 1
          };
        }).sort((a: any, b: any) => a.order - b.order);

        entries.forEach((entry: any) => {
          franchiseItemsByAnimeId.set(entry.animeId, {
            franchiseTitle: f.title || 'Franchise',
            allEntries: entries
          });
        });
      });

      // 4. Assemble Anime and Episode records
      const assembledAnime: Anime[] = [];
      const assembledEpisodes: Record<string, Episode[]> = {};

      animeSnap.docs.forEach(d => {
        const raw = d.data();
        const aId = String(d.id);
        const englishTitle = raw.title?.english?.trim() || '';
        const romajiTitle = raw.title?.romaji?.trim() || '';
        const nativeTitle = raw.title?.native?.trim() || '';
        const displayTitle = englishTitle || romajiTitle || nativeTitle || `Anime ${aId}`;
        const slug = slugify(displayTitle) || `anime-${aId}`;

        // Build Episodes for this anime
        const rawEps = rawEpisodesByAnime.get(aId) || [];
        rawEps.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

        let hasMulti = false;
        let hasSub = false;
        let hasDub = false;

        const episodes: Episode[] = rawEps.map((ep, idx) => {
          const epNum = Number(ep.number) || (idx + 1);
          const embed = embedMap.get(ep.embedId) || embedMap.get(ep.id) || embedMap.get(`${aId}_${epNum}`);
          const rawServers: any[] = embed && Array.isArray(embed.servers) ? embed.servers : [];

          const serverLinks: ServerLink[] = [];

          // MultiServer provided video streams (VidStream, StreamHG, etc.)
          rawServers.forEach(srv => {
            if (srv.enabled === false) return;
            const sName = srv.name || 'VidStream';
            const sType = sName.toLowerCase().includes('dub') ? 'dub' : 'multi';
            if (sType === 'dub') hasDub = true;
            else hasMulti = true;

            serverLinks.push({
              serverName: sName,
              serverType: sType,
              embedLink: srv.url
            });
          });

          // Embed player fallback from multiserver.pages.dev
          serverLinks.push({
            serverName: 'MultiServer',
            serverType: 'multi',
            embedLink: `https://multiserver.pages.dev/${aId}/${epNum}`
          });
          hasMulti = true;

          // MegaPlay fallback
          serverLinks.push({
            serverName: 'HD-1',
            serverType: 'sub',
            embedLink: `https://megaplay.buzz/stream/ani/${aId}/${epNum}/sub`
          });
          hasSub = true;

          const epDocId = `ms_${aId}_${epNum}`;
          return {
            id: epDocId,
            animeId: aId,
            seasonId: 's1',
            episodeNumber: epNum,
            title: ep.title || `Episode ${epNum}`,
            isFiller: !!ep.isFiller,
            servers: serverLinks,
            thumbnailUrl: raw.coverImage || '',
            createdAt: ep.createdAt || Date.now(),
            published: true
          };
        });

        assembledEpisodes[aId] = episodes;

        // Build linked seasons from franchise if present
        const franchiseData = franchiseItemsByAnimeId.get(aId);
        let linkedSeasons: LinkedSeason[] | undefined;
        if (franchiseData && franchiseData.allEntries.length > 1) {
          linkedSeasons = franchiseData.allEntries.map(e => {
            const eTitle = e.title;
            const eSlug = slugify(eTitle) || `anime-${e.animeId}`;
            return {
              animeId: e.animeId,
              seasonNumber: e.seasonNumber,
              seasonName: e.seasonName,
              slug: eSlug,
              title: eTitle
            };
          });
        }

        const totalEps = Number(raw.episodes) || episodes.length || 12;
        const scoreVal = raw.averageScore ? `${raw.averageScore}%` : '85%';

        let studioName = '';
        if (Array.isArray(raw.studios) && raw.studios.length > 0) {
          studioName = String(raw.studios[0]);
        } else if (typeof raw.studios === 'string') {
          studioName = raw.studios;
        }

        const animeObj: Anime = {
          id: aId,
          aniListId: String(raw.anilistId || aId),
          title: displayTitle,
          nativeTitle: nativeTitle || romajiTitle || displayTitle,
          slug: slug,
          format: raw.format || 'TV',
          totalEpisodes: totalEps,
          episodeDuration: raw.duration ? `${raw.duration} mins` : '24 mins',
          status: raw.status === 'FINISHED' ? 'Finished' : (raw.status === 'RELEASING' ? 'Releasing' : (raw.status || 'Finished')),
          startDate: raw.startDate ? String(raw.startDate.year || raw.startDate) : '',
          endDate: raw.endDate ? String(raw.endDate.year || raw.endDate) : '',
          season: raw.season || '',
          averageScore: scoreVal,
          studios: studioName || 'Animation Studio',
          genres: Array.isArray(raw.genres) ? raw.genres : ['Anime'],
          poster: raw.coverImage || 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80&w=600',
          backdrop: raw.bannerImage || raw.coverImage || '',
          synopsis: cleanHtml(raw.description || 'No synopsis available.'),
          seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
          linkedSeasons: linkedSeasons,
          subEpisodesCount: episodes.length > 0 ? episodes.length : totalEps,
          dubEpisodesCount: hasDub ? episodes.length : 0,
          multiEpisodesCount: hasMulti ? episodes.length : 0,
          recentlyAddedAt: raw.updatedAt || Date.now(),
          createdAt: raw.updatedAt || Date.now(),
          updatedAt: raw.updatedAt || Date.now(),
          published: true
        };

        assembledAnime.push(animeObj);
      });

      const result: MultiServerCache = {
        timestamp: Date.now(),
        anime: assembledAnime,
        episodesByAnimeId: assembledEpisodes,
        franchises: rawFranchises
      };

      inMemoryCache = result;
      saveLocalCache(result);
      return result;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Get all anime from MultiServer
 */
export async function getMultiServerAnime(): Promise<Anime[]> {
  try {
    const dataset = await fetchMultiServerDataset();
    return dataset.anime;
  } catch (err) {
    console.warn('Failed to load MultiServer anime:', err);
    return [];
  }
}

/**
 * Find anime by slug or id from MultiServer
 */
export async function getMultiServerAnimeBySlug(slugOrId: string): Promise<Anime | null> {
  try {
    const dataset = await fetchMultiServerDataset();
    const clean = String(slugOrId).toLowerCase().trim();
    return dataset.anime.find(a => 
      a.slug.toLowerCase() === clean || 
      a.id.toLowerCase() === clean ||
      (a.aniListId && a.aniListId.toLowerCase() === clean)
    ) || null;
  } catch {
    return null;
  }
}

/**
 * Get all episodes for an anime from MultiServer
 */
export async function getMultiServerEpisodesForAnime(animeIdOrSlug: string): Promise<Episode[]> {
  try {
    const dataset = await fetchMultiServerDataset();
    // Match by direct ID
    if (dataset.episodesByAnimeId[animeIdOrSlug]) {
      return dataset.episodesByAnimeId[animeIdOrSlug];
    }
    // Match by slug or aniListId
    const target = dataset.anime.find(a => 
      a.slug.toLowerCase() === animeIdOrSlug.toLowerCase() || 
      a.id.toLowerCase() === animeIdOrSlug.toLowerCase() ||
      a.aniListId === animeIdOrSlug
    );
    if (target && dataset.episodesByAnimeId[target.id]) {
      return dataset.episodesByAnimeId[target.id];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Sync entire MultiServer dataset to current Firestore database (yuro-live)
 * Requires Admin privileges on current user.
 */
export async function syncMultiServerToFirestore(onProgress?: (msg: string) => void): Promise<{ success: boolean; animeCount: number; epCount: number; error?: string }> {
  try {
    const { db: localDb } = await import('./firebase');
    const { doc, setDoc } = await import('firebase/firestore');

    onProgress?.('Fetching latest data from MultiServer dataset...');
    const dataset = await fetchMultiServerDataset(true);
    let animeSaved = 0;
    let episodesSaved = 0;

    for (const anime of dataset.anime) {
      onProgress?.(`Saving anime "${anime.title}"...`);
      const animeRef = doc(localDb, 'anime', anime.id);
      await setDoc(animeRef, anime, { merge: true });
      animeSaved++;

      const eps = dataset.episodesByAnimeId[anime.id] || [];
      for (const ep of eps) {
        const epRef = doc(localDb, 'episodes', ep.id);
        await setDoc(epRef, ep, { merge: true });
        episodesSaved++;
      }
    }

    onProgress?.(`Successfully synced ${animeSaved} anime and ${episodesSaved} episodes to Firestore!`);
    return { success: true, animeCount: animeSaved, epCount: episodesSaved };
  } catch (err: any) {
    console.error('Error during MultiServer sync to Firestore:', err);
    return { success: false, animeCount: 0, epCount: 0, error: err.message || 'Permission denied or network error' };
  }
}

