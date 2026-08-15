export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface Season {
  id: string;
  name: string;
  order: number;
}

export interface Anime {
  id: string;
  title: string;
  nativeTitle: string;
  aniListId?: string;
  slug: string;
  format: string; // 'TV', 'Movie', 'OVA', 'Special'
  totalEpisodes: number;
  episodeDuration: string; // e.g., '24 mins'
  status: string; // 'Finished', 'Releasing', 'Not yet released'
  startDate: string;
  endDate: string;
  season: string; // e.g., 'Fall 2023'
  averageScore: string; // e.g., '91%'
  studios: string; // e.g., 'MADHOUSE'
  genres: string[];
  poster: string;
  backdrop: string;
  synopsis: string;
  seasons: Season[];
  createdAt: number;
  updatedAt: number;
  published: boolean;
}

export interface Episode {
  id: string;
  animeId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  embedLink: string;
  serverName: string; // e.g., 'HD-1', 'Mega'
  serverType?: 'sub' | 'dub' | 'multi';
  thumbnailUrl: string;
  isFiller: boolean;
  createdAt: number;
  published: boolean;
}

export interface Comment {
  id: string;
  animeId: string;
  episodeId: string;
  userId: string;
  userDisplayName: string | null;
  userPhotoURL: string | null;
  text: string;
  createdAt: number;
}

export interface WatchProgress {
  id: string;
  userId: string;
  animeId: string;
  episodeId: string;
  progress: number; // in seconds
  completed: boolean;
  updatedAt: number;
}

export interface SpotlightSlide {
  id: string;
  order: number; // 1, 2, 3, etc. for #1 Spotlight, #2 Spotlight...
  animeId: string;
  animeTitle?: string;
  animeSlug?: string;
  targetSeasonId?: string; // target season e.g. "s1", "s2"
  targetSeasonName?: string;
  badge?: string; // e.g. "#1 Spotlight", "Trending", "New Season"
  logo?: string; // Custom TMDB/web logo PNG URL
  backdrop: string; // Custom TMDB/web backdrop image URL
  synopsis: string; // Custom synopsis / hook (line-clamp-2 on Hero)
  active: boolean; // toggle visibility
  format?: string; // 'TV', 'Movie', 'OVA', 'ONA', 'Special'
  duration?: string; // e.g. '24m'
  year?: string; // e.g. '2025'
  isHd?: boolean; // HD indicator
  createdAt?: number;
  updatedAt?: number;
}

