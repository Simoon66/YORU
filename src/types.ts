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
