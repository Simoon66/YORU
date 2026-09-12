export interface UserBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  event?: string;
  unlockedAt?: number;
  color?: string; // For community badges
}

export type UserRole = 'admin' | 'moderator' | 'staff' | 'special' | 'user' | 'guest';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  username?: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  claimedEvents?: string[];
  unlockedAvatars?: string[];
  badges?: UserBadge[];
  activeBadgeId?: string;
  // Community stats
  postCount?: number;
  commentCount?: number;
  reactionsReceived?: number;
  watchCount?: number; // total episodes completed
  isBanned?: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  gifUrl?: string;
  hashtags?: string[];
  status: 'active' | 'locked' | 'deleted';
  commentsEnabled: boolean;
  isPinned: boolean;
  isAnnouncement: boolean;
  commentCount: number;
  reactions?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string | null;
  content: string;
  gifUrl?: string;
  status: 'active' | 'deleted';
  reactions?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityReaction {
  id: string; // userId_targetId
  targetType: 'post' | 'comment';
  targetId: string;
  userId: string;
  reactionType: string;
  createdAt: number;
}

export interface ModerationLog {
  id: string;
  actorId: string;
  action: string; // 'warn', 'ban', 'delete_post', 'delete_comment'
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason?: string;
  createdAt: number;
}

export interface RoleAuditLog {
  id: string;
  action: 'ROLE_CHANGE' | 'BAN_TOGGLE';
  targetUserId: string;
  targetUserEmail: string | null;
  targetUserName?: string | null;
  targetUserPhotoURL?: string | null;
  oldRole?: string;
  newRole?: string;
  isBanned?: boolean;
  performedByUid: string;
  performedByEmail: string | null;
  performedByName?: string | null;
  performedByPhotoURL?: string | null;
  timestamp: number;
}

export interface Season {
  id: string;
  name: string;
  order: number;
}

export interface LinkedSeason {
  animeId: string;
  seasonNumber: number;
  seasonName: string;
  slug: string;
  title: string;
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
  isAdult?: boolean;
  is18Plus?: boolean;
  poster: string;
  backdrop: string;
  synopsis: string;
  seasons: Season[];
  seasonGroupId?: string;
  seasonNumber?: number;
  linkedSeasons?: LinkedSeason[];
  subEpisodesCount?: number;
  dubEpisodesCount?: number;
  multiEpisodesCount?: number;
  recentlyAddedAt?: number;
  createdAt: number;
  updatedAt: number;
  published: boolean;
  isBanned?: boolean;
}

export interface AnikotoSyncStats {
  totalChecked: number;
  newAnimeAdded: number;
  episodesAdded: number;
  episodesUpdated: number;
  skippedCount: number;
  durationMs?: number;
}

export interface AnikotoSyncSettings {
  autoSyncEnabled: boolean;
  intervalMinutes: number;
  lastSyncTimestamp?: number;
  lastSyncStatus?: 'idle' | 'running' | 'success' | 'error';
  lastSyncMessage?: string;
  lastSyncStats?: AnikotoSyncStats;
}

export interface ServerLink {
  serverName: string;
  embedLink: string;
  serverType?: 'sub' | 'dub' | 'multi';
}

export interface Episode {
  id: string;
  animeId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  isFiller: boolean;
  servers: ServerLink[];
  thumbnailUrl: string;
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
  gifUrl?: string;
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

