import { Episode, ServerLink } from '../types';

/**
 * Normalizes a single server link object to standard form:
 * - Names: "HD-1", "HD-2", "VidStream", "Abyss", etc.
 * - Types: 'sub' | 'dub' | 'multi'
 * - Non-empty embedLink
 */
export function normalizeServer(s: any): ServerLink | null {
  if (!s) return null;
  const embedLink = String(s.embedLink || s.link || '').trim();
  if (!embedLink) return null;

  let serverName = String(s.serverName || s.name || '').trim();
  let serverType: 'sub' | 'dub' | 'multi' = s.serverType || 'sub';

  // Normalize legacy names
  if (serverName === 'AniList Sub' || serverName === 'AniList') {
    serverName = 'HD-1';
    serverType = 'sub';
  } else if (serverName === 'AniList Dub') {
    serverName = 'HD-1';
    serverType = 'dub';
  } else if (serverName === 'MAL Sub' || serverName === 'MAL') {
    serverName = 'HD-2';
    serverType = 'sub';
  } else if (serverName === 'MAL Dub') {
    serverName = 'HD-2';
    serverType = 'dub';
  }

  // Infer serverType if missing or generic
  if (!s.serverType) {
    if (embedLink.includes('/dub') || serverName.toLowerCase().includes('dub')) {
      serverType = 'dub';
    } else if (embedLink.includes('/multi') || serverName.toLowerCase().includes('multi')) {
      serverType = 'multi';
    } else {
      serverType = 'sub';
    }
  }

  if (!serverName) {
    if (embedLink.includes('/ani/')) serverName = 'HD-1';
    else if (embedLink.includes('/mal/')) serverName = 'HD-2';
    else if (embedLink.includes('as-cdn21.top')) serverName = 'VidStream';
    else if (embedLink.includes('animesalt.ac')) serverName = 'Abyss';
    else serverName = 'HD-1';
  }

  return { serverName, embedLink, serverType };
}

/**
 * Takes raw Firestore documents (flat or nested, with possible duplicates)
 * and aggregates them into clean, deduplicated Episode objects grouped by season and episode number.
 */
export function normalizeEpisodes(rawDocs: any[]): Episode[] {
  if (!Array.isArray(rawDocs)) return [];
  const map = new Map<string, Episode>();

  for (const raw of rawDocs) {
    if (!raw) continue;
    const seasonId = String(raw.seasonId || 's1').trim() || 's1';
    const epNum = parseInt(String(raw.episodeNumber), 10);
    if (isNaN(epNum) || epNum <= 0) continue;

    const key = `${seasonId}_${epNum}`;
    let ep = map.get(key);

    if (!ep) {
      ep = {
        id: raw.id || `${raw.animeId || 'anime'}_${seasonId}_${epNum}`,
        animeId: raw.animeId || '',
        seasonId: seasonId,
        episodeNumber: epNum,
        title: raw.title || `Episode ${epNum}`,
        isFiller: Boolean(raw.isFiller),
        servers: [],
        thumbnailUrl: raw.thumbnailUrl || '',
        createdAt: raw.createdAt || Date.now(),
        published: raw.published !== undefined ? raw.published : true,
      };
      map.set(key, ep);
    }

    // Merge servers from array
    if (Array.isArray(raw.servers)) {
      for (const s of raw.servers) {
        const norm = normalizeServer(s);
        if (norm) {
          const exists = ep.servers.some(
            existing => existing.embedLink === norm.embedLink ||
              (existing.serverName === norm.serverName && existing.serverType === norm.serverType && existing.embedLink === norm.embedLink)
          );
          if (!exists) {
            ep.servers.push(norm);
          }
        }
      }
    }

    // Merge flat/legacy server fields if present
    if (raw.embedLink) {
      const norm = normalizeServer({
        serverName: raw.serverName,
        embedLink: raw.embedLink,
        serverType: raw.serverType
      });
      if (norm) {
        const exists = ep.servers.some(
          existing => existing.embedLink === norm.embedLink ||
            (existing.serverName === norm.serverName && existing.serverType === norm.serverType)
        );
        if (!exists) {
          ep.servers.push(norm);
        }
      }
    }

    // Keep highest-quality thumbnail / title
    if (!ep.thumbnailUrl && raw.thumbnailUrl) ep.thumbnailUrl = raw.thumbnailUrl;
    if (raw.title && raw.title !== `Episode ${epNum}` && ep.title === `Episode ${epNum}`) {
      ep.title = raw.title;
    }
    if (raw.isFiller) ep.isFiller = true;
  }

  return Array.from(map.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);
}
