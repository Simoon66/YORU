import { collection, getDocs, doc, getDoc, query, where, limit, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Anime, Episode, SpotlightSlide } from '../types';

// Mock data fallback
export const mockAnimeList: Anime[] = [
  {
    id: "a1",
    title: "Shadows of the Eclipse",
    nativeTitle: "エクリプスの影",
    slug: "shadows-of-the-eclipse",
    synopsis: "In a world where the sun never truly rises, a young warrior discovers the power of the twilight to combat the creatures of the eternal night.",
    poster: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80&w=600",
    backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1920",
    genres: ["Action", "Dark Fantasy", "Supernatural"],
    format: "TV",
    status: "Releasing",
    startDate: "Sep 29, 2026",
    endDate: "",
    season: "Fall 2026",
    averageScore: "91%",
    studios: "MAPPA",
    episodeDuration: "24 mins",
    totalEpisodes: 24,
    seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    published: true,
  },
  {
    id: "a2",
    title: "Neon Echoes",
    nativeTitle: "ネオン・エコーズ",
    slug: "neon-echoes",
    synopsis: "A cyberpunk detective story set in Neo-Dhaka, where digital memories are traded like currency, and someone is erasing the city's past.",
    poster: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=600",
    backdrop: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=1920",
    genres: ["Sci-Fi", "Mystery", "Cyberpunk"],
    format: "TV",
    status: "Finished",
    startDate: "Jan 10, 2025",
    endDate: "Mar 25, 2025",
    season: "Winter 2025",
    averageScore: "85%",
    studios: "Bones",
    episodeDuration: "23 mins",
    totalEpisodes: 12,
    seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    published: true,
  }
];

export const mockEpisodes: Episode[] = [
  {
    id: "e1",
    animeId: "a1",
    seasonId: "s1",
    episodeNumber: 1,
    title: "The Long Night Begins",
    servers: [
      {
        serverName: "HD-1",
        serverType: "sub",
        embedLink: "https://www.youtube.com/embed/aqz-KE-bpKQ"
      }
    ],
    thumbnailUrl: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&q=80&w=800",
    isFiller: false,
    createdAt: Date.now(),
    published: true,
  },
  {
    id: "e2",
    animeId: "a1",
    seasonId: "s1",
    episodeNumber: 2,
    title: "Shadow Stalker",
    servers: [
      {
        serverName: "HD-1",
        serverType: "sub",
        embedLink: "https://www.youtube.com/embed/aqz-KE-bpKQ"
      }
    ],
    thumbnailUrl: "https://images.unsplash.com/photo-1509205477838-a534e43a8ce9?auto=format&fit=crop&q=80&w=800",
    isFiller: false,
    createdAt: Date.now(),
    published: true,
  }
];

export async function getTrendingAnime(): Promise<Anime[]> {
  try {
    const q = query(collection(db, 'anime'), where('published', '==', true), limit(10));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return mockAnimeList;
    return querySnapshot.docs.map(doc => doc.data() as Anime);
  } catch (e) {
    console.warn("Failed to fetch from Firebase, using mock data", e);
    return mockAnimeList;
  }
}

export async function getAnimeBySlug(slug: string): Promise<Anime | null> {
  try {
    const q = query(collection(db, 'anime'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return mockAnimeList.find(a => a.slug === slug) || null;
    }
    return querySnapshot.docs[0].data() as Anime;
  } catch (e) {
    return mockAnimeList.find(a => a.slug === slug) || null;
  }
}

export async function getEpisodesForAnime(animeId: string): Promise<Episode[]> {
  try {
    const q = query(collection(db, 'episodes'), where('animeId', '==', animeId), orderBy('episodeNumber', 'asc'));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return mockEpisodes.filter(e => e.animeId === animeId);
    }
    return querySnapshot.docs.map(doc => doc.data() as Episode);
  } catch (e) {
    return mockEpisodes.filter(e => e.animeId === animeId);
  }
}

export async function getAllAnime(): Promise<Anime[]> {
   try {
    const q = query(collection(db, 'anime'), where('published', '==', true));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return mockAnimeList;
    return querySnapshot.docs.map(doc => doc.data() as Anime);
  } catch (e) {
    return mockAnimeList;
  }
}


export interface HistoryItem {
  animeId: string;
  slug: string;
  title: string;
  coverImage: string;
  backdrop: string;
  episodeNumber: number;
  seasonId?: string;
  updatedAt: number;
}

export async function getWatchHistory(userId: string): Promise<HistoryItem[]> {
  try {
    const q = query(
      collection(db, 'watchProgress'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const progressList = snap.docs.map(d => d.data());
    progressList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    // Take top 4
    const top4 = progressList.slice(0, 4);
    
    const historyItems: HistoryItem[] = [];
    for (const prog of top4) {
      const animeSnap = await getDoc(doc(db, 'anime', prog.animeId));
      if (!animeSnap.exists()) continue;
      const animeData = animeSnap.data();
      
      let epNumber = 1;
      let seasonId = 's1';
      if (prog.lastWatchedEpisode) {
        const epSnap = await getDoc(doc(db, 'episodes', prog.lastWatchedEpisode));
        if (epSnap.exists()) {
          epNumber = epSnap.data().episodeNumber;
          seasonId = epSnap.data().seasonId || 's1';
        }
      }
      
      historyItems.push({
        animeId: prog.animeId,
        slug: animeData.slug,
        title: animeData.title,
        coverImage: animeData.poster,
        backdrop: animeData.backdrop,
        episodeNumber: epNumber,
        seasonId: seasonId,
        updatedAt: prog.updatedAt || 0
      });
    }
    return historyItems;
  } catch(e) {
    console.error("Failed to fetch watch history:", e);
    return [];
  }
}

export async function clearWatchHistory(userId?: string): Promise<boolean> {
  try {
    localStorage.removeItem('yoru_watch_history');
    if (userId) {
      const q = query(
        collection(db, 'watchProgress'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }
    return true;
  } catch (e) {
    console.error("Failed to clear watch history:", e);
    return false;
  }
}

export async function getSpotlightSlides(): Promise<SpotlightSlide[]> {
  try {
    const q = query(
      collection(db, 'spotlights'),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SpotlightSlide));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  } catch (e) {
    console.warn("Failed to fetch spotlight slides:", e);
    return [];
  }
}

export async function getAllSpotlightSlides(): Promise<SpotlightSlide[]> {
  try {
    const snap = await getDocs(collection(db, 'spotlights'));
    if (snap.empty) return [];
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SpotlightSlide));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  } catch (e) {
    console.error("Failed to fetch all spotlight slides:", e);
    return [];
  }
}

