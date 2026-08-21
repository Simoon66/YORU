import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Anime, UserBadge } from '../types';
import { Button } from '../components/ui/Button';
import { AnimeCard } from '../components/AnimeCard';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Film, 
  Bookmark, 
  LogOut, 
  Clock, 
  Edit3, 
  Save, 
  AlertCircle,
  Play,
  Settings,
  Eye,
  EyeOff,
  Crown,
  Flame,
  Swords,
  Gift,
  Award,
  Lock,
  CheckCircle2,
  RotateCcw,
  Maximize2,
  X,
  Compass
} from 'lucide-react';

// Custom Anime Empty State Illustrations
const WatchlistEmptyIllustration = () => (
  <svg className="w-36 h-36 mx-auto mb-4 drop-shadow-[0_0_25px_rgba(99,102,241,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wl-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85"/>
        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3"/>
      </linearGradient>
      <linearGradient id="wl-glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="165" rx="60" ry="14" fill="rgba(99,102,241,0.12)" />
    {/* Floating Anime Card / Bookmark stack */}
    <rect x="48" y="45" width="84" height="112" rx="14" fill="#141622" stroke="rgba(255,255,255,0.12)" strokeWidth="2" transform="rotate(-8 90 100)"/>
    <rect x="66" y="40" width="84" height="112" rx="14" fill="#1A1C2C" stroke="rgba(255,255,255,0.18)" strokeWidth="2" transform="rotate(6 108 96)"/>
    <rect x="58" y="36" width="84" height="112" rx="14" fill="url(#wl-grad1)" stroke="#818cf8" strokeWidth="2.5"/>
    {/* Ribbon bookmark hanging */}
    <path d="M88 36 V96 L100 85 L112 96 V36 H88 Z" fill="#f43f5e" />
    {/* Sparkles / Anime stars */}
    <circle cx="156" cy="48" r="3" fill="#fbbf24" />
    <path d="M156 38 L158.5 45.5 L166 48 L158.5 50.5 L156 58 L153.5 50.5 L146 48 L153.5 45.5 Z" fill="#fbbf24"/>
    <path d="M42 128 L43.5 133 L48 135 L43.5 137 L42 142 L40.5 137 L36 135 L40.5 133 Z" fill="#818cf8"/>
    <circle cx="52" cy="58" r="2.5" fill="#38bdf8"/>
    {/* Play / Bookmark icon in card */}
    <circle cx="100" cy="85" r="16" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.25)"/>
    <path d="M96 77 L108 85 L96 93 Z" fill="#ffffff"/>
  </svg>
);

const CollectionEmptyIllustration = () => (
  <svg className="w-40 h-40 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="col-chest" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b1528" stopOpacity="0.95"/>
        <stop offset="100%" stopColor="#1a0f1d" stopOpacity="0.95"/>
      </linearGradient>
      <linearGradient id="col-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047"/>
        <stop offset="50%" stopColor="#f59e0b"/>
        <stop offset="100%" stopColor="#d97706"/>
      </linearGradient>
    </defs>
    {/* Glowing base pedestal */}
    <ellipse cx="100" cy="158" rx="68" ry="16" fill="rgba(244,63,94,0.15)"/>
    <ellipse cx="100" cy="158" rx="46" ry="10" fill="rgba(244,63,94,0.3)"/>
    {/* Chest Body */}
    <rect x="50" y="96" width="100" height="56" rx="12" fill="url(#col-chest)" stroke="#f43f5e" strokeWidth="2.5"/>
    <rect x="46" y="74" width="108" height="30" rx="9" fill="#241020" stroke="url(#col-gold)" strokeWidth="2.5"/>
    {/* Chest Golden Banding */}
    <path d="M72 74 V152" stroke="url(#col-gold)" strokeWidth="3"/>
    <path d="M128 74 V152" stroke="url(#col-gold)" strokeWidth="3"/>
    <rect x="90" y="92" width="20" height="24" rx="5" fill="url(#col-gold)"/>
    <circle cx="100" cy="101" r="3" fill="#241020"/>
    <path d="M100 104 V110" stroke="#241020" strokeWidth="2" strokeLinecap="round"/>
    {/* Glowing Anime Runes / Floating Sparkles */}
    <path d="M100 38 L103.5 47 L112 50 L103.5 53 L100 62 L96.5 53 L88 50 L96.5 47 Z" fill="#f43f5e"/>
    <circle cx="152" cy="78" r="3.5" fill="#fde047"/>
    <path d="M156 74 L158 79 L163 81 L158 83 L156 88 L154 83 L149 81 L154 79 Z" fill="#fbbf24"/>
    <circle cx="44" cy="82" r="2.5" fill="#ec4899"/>
    {/* Aura rays */}
    <path d="M100 28 V18 M84 34 L74 24 M116 34 L126 24" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7"/>
  </svg>
);

const HistoryEmptyIllustration = () => (
  <svg className="w-36 h-36 mx-auto mb-4 drop-shadow-[0_0_25px_rgba(56,189,248,0.25)]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8"/>
        <stop offset="100%" stopColor="#818cf8"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="160" rx="58" ry="14" fill="rgba(56,189,248,0.12)"/>
    {/* Film Reel */}
    <circle cx="100" cy="95" r="48" fill="#12141C" stroke="url(#hist-grad)" strokeWidth="3"/>
    <circle cx="100" cy="95" r="38" fill="#181A26" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
    <circle cx="100" cy="95" r="15" fill="url(#hist-grad)"/>
    {/* Reel cutouts */}
    <circle cx="100" cy="71" r="6" fill="#12141C"/>
    <circle cx="100" cy="119" r="6" fill="#12141C"/>
    <circle cx="76" cy="95" r="6" fill="#12141C"/>
    <circle cx="124" cy="95" r="6" fill="#12141C"/>
    {/* Film strip curve */}
    <path d="M136 116 C152 126, 162 148, 146 158" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round"/>
    {/* Clock Hands / Play Spark */}
    <path d="M100 95 L100 87 M100 95 L107 98" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
    {/* Floating particles */}
    <circle cx="46" cy="62" r="3" fill="#38bdf8"/>
    <path d="M154 58 L155.5 63 L160.5 64.5 L155.5 66 L154 71 L152.5 66 L147.5 64.5 L152.5 63 Z" fill="#38bdf8"/>
  </svg>
);

const STANDARD_ANIME_AVATARS = [
  { id: '1', name: 'Anime Avatar 1', url: 'https://i.imgur.com/NCWFUpu.png' },
  { id: '2', name: 'Anime Avatar 2', url: 'https://i.imgur.com/Doknd92.png' },
  { id: '3', name: 'Anime Avatar 3', url: 'https://i.imgur.com/Wa7SSgr.png' },
  { id: '4', name: 'Anime Avatar 4', url: 'https://i.imgur.com/dBirDzX.png' },
  { id: '5', name: 'Anime Avatar 5', url: 'https://i.imgur.com/5i5hJJp.png' },
  { id: '6', name: 'Anime Avatar 6', url: 'https://i.imgur.com/NlP1jD0.png' },
  { id: '7', name: 'Anime Avatar 7', url: 'https://i.imgur.com/BgImE9f.png' },
  { id: '8', name: 'Anime Avatar 8', url: 'https://i.imgur.com/jwaF1Nq.png' },
  { id: '9', name: 'Anime Avatar 9', url: 'https://i.imgur.com/a7KxNqc.png' },
  { id: '10', name: 'Anime Avatar 10', url: 'https://i.imgur.com/7KIKTy8.png' },
  { id: '11', name: 'Anime Avatar 11', url: 'https://i.imgur.com/6yGKVtT.png' },
  { id: '12', name: 'Anime Avatar 12', url: 'https://i.imgur.com/4H4nIzA.png' },
  { id: '13', name: 'Anime Avatar 13', url: 'https://i.imgur.com/PIlT5Fs.png' },
  { id: '14', name: 'Anime Avatar 14', url: 'https://i.imgur.com/zcQgSB4.png' },
  { id: '15', name: 'Anime Avatar 15', url: 'https://i.imgur.com/ej2IGZc.png' },
  { id: '16', name: 'Anime Avatar 16', url: 'https://i.imgur.com/pdvV7x9.png' },
  { id: '17', name: 'Anime Avatar 17', url: 'https://i.imgur.com/k09dSBG.png' },
];

const SPECIAL_EVENT_S1 = {
  id: 'luffy_zoro_s1',
  name: 'Luffy & Zoro Special S1',
  tag: 'Limited Event S1',
  season: 'Season 1 Special',
  description: 'Limited-time Season 1 Special Event! Claim exclusive Monkey D. Luffy and Roronoa Zoro profile avatars to keep in your permanent collection forever.',
  avatars: [
    {
      id: 'event_luffy_s1',
      name: 'Monkey D. Luffy',
      title: 'Sun God / Gear 5',
      lore: 'The Warrior of Liberation who brings smiles and laughter to the world. Wields the absolute freedom of the Mythical Zoan Hito Hito no Mi.',
      rarity: 'Mythic Event S1',
      element: 'Solar Freedom',
      url: 'https://i.imgur.com/ldir3jC.png',
      badge: 'SUN GOD NIKA',
      auraColor: 'from-amber-500/30 via-rose-500/20 to-purple-500/30',
      borderColor: 'border-amber-500/60'
    },
    {
      id: 'event_zoro_s1',
      name: 'Roronoa Zoro',
      title: 'King of Hell / 3-Sword Style',
      lore: 'The master swordsman of the Straw Hats who tamed the legendary blade Enma. Awakened Conqueror\'s Haki to conquer all who stand before him.',
      rarity: 'Mythic Event S1',
      element: 'Conqueror Hellfire',
      url: 'https://i.imgur.com/s3DmTBC.png',
      badge: 'KING OF HELL',
      auraColor: 'from-emerald-500/30 via-teal-500/20 to-purple-500/30',
      borderColor: 'border-emerald-500/60'
    }
  ],
  badge: {
    id: 'badge_luffy_zoro_s1',
    title: 'Luffy & Zoro S1 Pioneer',
    description: 'Claimed the Season 1 exclusive Luffy & Zoro event reward.',
    icon: 'Crown',
    event: 'Luffy & Zoro Special S1',
    unlockedAt: Date.now()
  } as UserBadge
};

const SIMOON_ADMIN_AVATAR = {
  id: 'simoon_admin',
  name: 'Simoon (Admin Exclusive)',
  url: 'https://i.imgur.com/nHJox0D.jpeg'
};

export const ProfilePage: React.FC = () => {
  const { user, profile, updateUserProfile, claimEventRewards } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [selectedPhotoURL, setSelectedPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'collection' | 'watchlist' | 'history'>('profile');

  // Event Claim state
  const [isClaimingEvent, setIsClaimingEvent] = useState(false);
  const [eventClaimSuccess, setEventClaimSuccess] = useState(false);

  // Inspector Modal for Special Collection items
  const [inspectedAvatar, setInspectedAvatar] = useState<any | null>(null);

  // Privacy & Modal states
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<'profile' | 'collection' | 'watchlist' | 'history' | null>(null);
  const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] = useState(false);

  // Stats and Activity state
  const [watchedCount, setWatchedCount] = useState(0);
  const [watchlistItems, setWatchlistItems] = useState<Anime[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Initial reference values
  const originalDisplayName = profile?.displayName || user?.displayName || '';
  const originalPhotoURL = profile?.photoURL || user?.photoURL || '';

  // Initialize values
  useEffect(() => {
    if (user) {
      setDisplayName(originalDisplayName);
      setSelectedPhotoURL(originalPhotoURL);
    }
  }, [user, profile]);

  // Load user data & statistics
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setIsLoadingStats(false);
        return;
      }
      setIsLoadingStats(true);
      try {
        // 1. Fetch Watchlist
        const watchlistQ = query(collection(db, 'watchlist'), where('userId', '==', user.uid));
        const watchlistSnap = await getDocs(watchlistQ);
        const animeIds = watchlistSnap.docs.map(d => d.data().animeId);

        const animeSnap = await getDocs(collection(db, 'anime'));
        const allAnime = animeSnap.docs.map(d => ({ id: d.id, ...d.data() } as Anime));
        const userWatchlist = allAnime.filter(a => animeIds.includes(a.id));
        setWatchlistItems(userWatchlist);

        // 2. Fetch Watched Episodes count
        const progressQ = query(collection(db, 'watchProgress'), where('userId', '==', user.uid));
        const progressSnap = await getDocs(progressQ);
        let totalWatched = 0;
        progressSnap.forEach(d => {
          const data = d.data();
          if (Array.isArray(data.watchedEpisodeIds)) {
            const validEpisodes = new Set(data.watchedEpisodeIds.map((id: string) => {
              const parts = id.split('_');
              return parts[parts.length - 1];
            }));
            totalWatched += validEpisodes.size;
          }
        });

        // Check local storage for additional local count if offline
        try {
          const localHistory = JSON.parse(localStorage.getItem('yoru_watch_history') || '[]');
          setWatchHistory(localHistory);
          if (totalWatched === 0 && localHistory.length > 0) {
            totalWatched = localHistory.length;
          }
        } catch (e) {}

        setWatchedCount(totalWatched);
      } catch (e) {
        console.error("Error loading user profile statistics", e);
      } finally {
        setIsLoadingStats(false);
      }
    }

    loadUserData();
  }, [user]);

  // Check if form has unsaved modifications
  const hasChanges = (displayName.trim() !== originalDisplayName) || (selectedPhotoURL !== originalPhotoURL);

  // Handle Reset Changes
  const handleResetChanges = () => {
    setDisplayName(originalDisplayName);
    setSelectedPhotoURL(originalPhotoURL);
    setErrorMessage('');
  };

  // Handle saving profile changes
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a display name.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Display name cannot exceed 50 characters.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        displayName: trimmedName,
        photoURL: selectedPhotoURL || null,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Tab Switch with Unsaved check
  const handleTabClick = (tab: 'profile' | 'collection' | 'watchlist' | 'history') => {
    if (tab === activeTab) return;
    if (hasChanges) {
      setPendingTabChange(tab);
      setIsUnsavedChangesModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleDiscardAndSwitchTab = () => {
    handleResetChanges();
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    setIsUnsavedChangesModalOpen(false);
  };

  const handleSaveAndSwitchTab = async () => {
    await handleSaveChanges();
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    setIsUnsavedChangesModalOpen(false);
  };

  // Handle Claiming Event
  const handleClaimSpecialEvent = async () => {
    if (!user || isClaimingEvent) return;
    setIsClaimingEvent(true);
    try {
      const avatarUrls = SPECIAL_EVENT_S1.avatars.map(a => a.url);
      await claimEventRewards(SPECIAL_EVENT_S1.id, avatarUrls, SPECIAL_EVENT_S1.badge);
      setEventClaimSuccess(true);
      // Auto select Luffy avatar on claim
      if (!selectedPhotoURL) {
        setSelectedPhotoURL(SPECIAL_EVENT_S1.avatars[0].url);
      }
      setTimeout(() => setEventClaimSuccess(false), 5000);
    } catch (err: any) {
      console.error("Error claiming event:", err);
      setErrorMessage(err.message || 'Failed to claim event reward.');
    } finally {
      setIsClaimingEvent(false);
    }
  };

  const handleConfirmSignOut = async () => {
    try {
      await logout();
      setIsSignOutModalOpen(false);
      navigate('/');
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030407] pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <User className="w-8 h-8 text-white/50" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-3">Profile Access</h1>
        <p className="text-sm font-medium text-yoru-text-muted max-w-sm mb-8">
          Please sign in to manage your anime profile, watch history, and account settings.
        </p>
        <Link to="/">
          <Button size="lg" className="px-8">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // Admin access validation (Strict: only admin sees Simoon avatar)
  const isSimoonAdmin = user.email === 'simoonabdulla@gmail.com';
  const isAdmin = profile?.role === 'admin' || user.email === 'kamaluddin124578@gmail.com' || isSimoonAdmin;
  
  // Check if user has claimed the S1 special event
  const isEventClaimed = (profile?.claimedEvents || []).includes(SPECIAL_EVENT_S1.id);
  const unlockedAvatarsList = profile?.unlockedAvatars || [];

  return (
    <div className="min-h-screen bg-[#030407] pt-28 pb-28 px-4 md:px-6 lg:px-8 max-w-6xl mx-auto relative">
      
      {/* Profile Header Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0A0B0E]/80 backdrop-blur-xl mb-8 p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yoru-accent/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          
          {/* Avatar Display */}
          <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white/20 p-1 bg-black/40 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:border-yoru-accent">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#12141C] flex items-center justify-center">
                {selectedPhotoURL ? (
                  <img 
                    src={selectedPhotoURL} 
                    alt="Profile Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setSelectedPhotoURL('')}
                  />
                ) : (
                  <User className="w-14 h-14 text-white/30" />
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-amber-500 text-black rounded-lg shadow-lg font-black" title="Admin">
                <Crown className="w-4 h-4" />
              </div>
            )}
            {isEventClaimed && !isAdmin && (
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg font-black" title="Event S1 Pioneer">
                <Flame className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Details & Identity */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                {profile?.displayName || user.displayName || 'Anime Fan'}
              </h1>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </span>
              ) : isEventClaimed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> S1 Event Pioneer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 border border-white/10">
                  <Sparkles className="w-3 h-3 text-yoru-accent" /> Member
                </span>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-white/70">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Film className="w-4 h-4 text-yoru-accent" />
                <span>
                  <strong className="text-white font-bold text-sm">{isLoadingStats ? '...' : watchedCount}</strong> Episodes Watched
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>
                  <strong className="text-white font-bold text-sm">{isLoadingStats ? '...' : watchlistItems.length}</strong> Bookmarked
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong className="text-white font-bold text-sm">{profile?.badges?.length || (isEventClaimed ? 1 : 0)}</strong> Badges
                </span>
              </div>

              {profile?.createdAt && (
                <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-yoru-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto mt-2 md:mt-0">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Panel
                </Button>
              </Link>
            )}
            <Button 
              onClick={() => setIsSignOutModalOpen(true)} 
              variant="ghost" 
              size="sm" 
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>

        </div>
      </div>

      {/* Tabs Navigation (Responsive, single-line horizontal scroll) */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-8 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-yoru-accent text-[#030407] shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">Profile & Avatars</span>
          <span className="hidden sm:inline">Edit Profile & Avatars</span>
        </button>

        <button
          onClick={() => handleTabClick('collection')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200 ${
            activeTab === 'collection'
              ? 'bg-yoru-accent text-[#030407] shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>Special Collections ({isEventClaimed ? 2 : 0})</span>
          {isEventClaimed && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('watchlist')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200 ${
            activeTab === 'watchlist'
              ? 'bg-yoru-accent text-[#030407] shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4 shrink-0" />
          <span>Watchlist ({watchlistItems.length})</span>
        </button>

        <button
          onClick={() => handleTabClick('history')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-yoru-accent text-[#030407] shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">History</span>
          <span className="hidden sm:inline">Watch History</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >

            {/* LIMITED EVENT BANNER: [Luffy & Zoro Special S1] */}
            <div className="relative rounded-3xl overflow-hidden border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-[#0E0C18] to-[#0A0B0E] p-6 md:p-8 shadow-[0_10px_35px_rgba(244,63,94,0.15)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse">
                      <Flame className="w-3.5 h-3.5" /> {SPECIAL_EVENT_S1.tag}
                    </span>
                    {isEventClaimed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Claimed & Permanent
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-300/80">
                        • Limited Season Exclusive
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Event: [{SPECIAL_EVENT_S1.name}]
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {SPECIAL_EVENT_S1.description}
                  </p>
                </div>

                {/* Event Avatars Preview & Claim Button */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-start lg:justify-end">
                  <div className="flex items-center gap-3">
                    {SPECIAL_EVENT_S1.avatars.map((av) => {
                      const isEquipped = selectedPhotoURL === av.url;
                      return (
                        <div key={av.id} className="text-center group">
                          <button
                            type="button"
                            onClick={() => {
                              if (isEventClaimed) {
                                setSelectedPhotoURL(av.url);
                              } else {
                                setInspectedAvatar(av);
                              }
                            }}
                            className={`relative rounded-2xl overflow-hidden w-16 h-16 sm:w-20 sm:h-20 border-2 transition-all duration-300 bg-[#12141C] ${
                              isEquipped
                                ? 'border-yoru-accent ring-2 ring-yoru-accent/50 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                : isEventClaimed
                                ? 'border-rose-500/50 hover:border-rose-400 hover:scale-102'
                                : 'border-white/10 opacity-75'
                            }`}
                          >
                            <img
                              src={av.url}
                              alt={av.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {isEquipped && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-yoru-accent text-[#030407] flex items-center justify-center font-black">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm text-[8px] font-bold text-rose-300 text-center py-0.5 truncate px-1">
                              {av.name.split(' ')[0]}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Claim Action */}
                  <div>
                    {isEventClaimed ? (
                      <div className="bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-center">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Unlocked in Profile
                        </span>
                        <span className="text-[10px] text-white/50 block mt-0.5">
                          Usable anytime forever
                        </span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleClaimSpecialEvent}
                        disabled={isClaimingEvent}
                        className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold px-6 py-3 shadow-lg shadow-rose-600/30 gap-2 border-0"
                      >
                        {isClaimingEvent ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4" /> Claim Event Avatars
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {eventClaimSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  🎉 Congratulations! Luffy & Zoro avatars have been permanently added to your personal collection!
                </motion.div>
              )}
            </div>

            {/* Top Row: Profile Details & Account Security */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Details Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSaveChanges} className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                      <Edit3 className="w-5 h-5 text-yoru-accent" /> Profile Information
                    </h3>
                    <p className="text-xs text-yoru-text-muted">
                      Change your display name and choose your active anime avatar below.
                    </p>
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                        Display Name
                      </label>
                      <span className="text-[10px] text-yoru-text-muted">
                        {displayName.length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yoru-accent transition-colors"
                    />
                  </div>

                  {/* Email Address (Hidden with toggle) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                        Email Address
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsEmailVisible(!isEmailVisible)}
                        className="text-[11px] font-semibold text-yoru-accent hover:underline flex items-center gap-1"
                      >
                        {isEmailVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {isEmailVisible ? 'Hide Email' : 'Show Email'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={isEmailVisible ? "text" : "password"}
                        disabled
                        value={user.email || ''}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/70 font-mono cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[11px] text-yoru-text-muted block">
                      Protected email address linked to your account.
                    </span>
                  </div>

                  {/* Feedback Alerts */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                      <Check className="w-5 h-5 shrink-0" />
                      <span>Your profile was updated successfully!</span>
                    </div>
                  )}

                  {/* Save & Reset Button Group */}
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Button
                      type="submit"
                      disabled={isSaving || !displayName.trim()}
                      size="lg"
                      className="gap-2 px-8 font-bold"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#030407] border-t-transparent rounded-full animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile
                        </>
                      )}
                    </Button>

                    {hasChanges && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResetChanges}
                        className="text-white/60 hover:text-white gap-1.5 text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Changes
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Account Overview Card */}
              <div className="space-y-6">
                <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-yoru-accent" /> Account Overview
                  </h4>
                  
                  <div className="space-y-3 text-xs text-yoru-text-muted">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span>Status</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span>Account Type</span>
                      <span className="text-white font-medium">Google Authentication</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span>Role</span>
                      <span className={isAdmin ? "text-amber-400 font-bold uppercase flex items-center gap-1" : "text-yoru-text-muted font-bold uppercase"}>
                        {isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        {isAdmin ? 'Administrator' : 'Standard Member'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span>Special Collection</span>
                      <span className={isEventClaimed ? "text-rose-400 font-bold uppercase" : "text-white/50"}>
                        {isEventClaimed ? 'Luffy & Zoro S1 (Claimed)' : 'Not Claimed'}
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Button in Account Overview */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSignOutModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-white/70 hover:text-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out from Device
                    </button>
                  </div>
                </div>

                {/* Selected Avatar Preview Card */}
                <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 shadow-xl text-center space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-yoru-text-muted block">
                    Active Avatar Preview
                  </span>
                  <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-yoru-accent/50 p-1 bg-black/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-[#12141C] flex items-center justify-center">
                      {selectedPhotoURL ? (
                        <img 
                          src={selectedPhotoURL} 
                          alt="Current" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-10 h-10 text-white/30" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-yoru-text-muted">
                    Choose from your unlocked collection below and click "Save Profile".
                  </p>
                </div>
              </div>
            </div>

            {/* Special Collections Grid (Luffy & Zoro Special S1) - Displayed for Claimed Users */}
            {isEventClaimed && (
              <div className="bg-gradient-to-r from-rose-950/30 via-[#0A0B0E] to-[#0A0B0E] border border-rose-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                        Special Collections
                      </span>
                      <span className="text-xs text-rose-400 font-semibold">• [Luffy & Zoro Special S1]</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-5 h-5 text-rose-400" /> Season 1 Mythic Inventory (2 Items)
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('collection')}
                    className="text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                  >
                    View All in Collection Tab
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {SPECIAL_EVENT_S1.avatars.map((av) => {
                    const isEquipped = selectedPhotoURL === av.url;
                    return (
                      <div
                        key={av.id}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-br ${av.auraColor} backdrop-blur-md ${
                          isEquipped
                            ? 'border-yoru-accent shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-2 ring-yoru-accent/50'
                            : `${av.borderColor} hover:border-white/40`
                        }`}
                      >
                        {/* Avatar Image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 bg-[#12141C] shadow-lg group">
                          <img
                            src={av.url}
                            alt={av.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            S1
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedAvatar(av)}
                            className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-sm transition-colors"
                            title="Inspect Character Card"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
                              {av.badge}
                            </span>
                            <span className="text-[10px] font-bold text-rose-300">
                              {av.rarity}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-white tracking-wide">{av.name}</h4>
                            <p className="text-xs text-rose-300 font-semibold">{av.title}</p>
                          </div>

                          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                            {av.lore}
                          </p>

                          {/* Equip Action */}
                          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                            <Button
                              type="button"
                              size="sm"
                              variant={isEquipped ? "secondary" : "outline"}
                              onClick={() => setSelectedPhotoURL(av.url)}
                              className={`text-xs px-4 py-1.5 h-8 font-bold ${
                                isEquipped
                                  ? 'bg-yoru-accent text-[#030407] font-black'
                                  : 'border-white/20 text-white hover:bg-white/10'
                              }`}
                            >
                              {isEquipped ? (
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" /> Active Avatar
                                </span>
                              ) : (
                                'Equip Avatar'
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => setInspectedAvatar(av)}
                              className="text-xs text-white/60 hover:text-white underline font-medium"
                            >
                              Inspect Card
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Admin Exclusive Avatar (Simoon / Strictly for Admins ONLY) */}
            {isAdmin && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Administrator Special Avatar (Simoon)
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoURL(SIMOON_ADMIN_AVATAR.url)}
                    className={`group relative rounded-2xl overflow-hidden w-20 h-20 border-2 transition-all duration-300 shrink-0 ${
                      selectedPhotoURL === SIMOON_ADMIN_AVATAR.url
                        ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400'
                        : 'border-amber-500/40 hover:border-amber-400 hover:scale-102'
                    }`}
                  >
                    <img
                      src={SIMOON_ADMIN_AVATAR.url}
                      alt={SIMOON_ADMIN_AVATAR.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {selectedPhotoURL === SIMOON_ADMIN_AVATAR.url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-bold text-white">Simoon Special Avatar</p>
                    <p className="text-xs text-yoru-text-muted">Exclusive profile picture strictly reserved for Simoon & Administrators.</p>
                    {selectedPhotoURL === SIMOON_ADMIN_AVATAR.url && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 mt-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Standard Anime Avatars Gallery */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-yoru-accent" /> Standard Anime Avatars
                </h3>
                <p className="text-xs text-yoru-text-muted">
                  Select your favorite character icon from the collection below and click "Save Profile".
                </p>
              </div>

              {/* Standard Anime Avatars Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {STANDARD_ANIME_AVATARS.map((avatar, index) => {
                  const isSelected = selectedPhotoURL === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedPhotoURL(avatar.url)}
                      className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 bg-[#12141C] ${
                        isSelected
                          ? 'border-yoru-accent scale-105 shadow-[0_0_20px_rgba(255,255,255,0.25)] ring-2 ring-yoru-accent/50'
                          : 'border-white/10 hover:border-white/30 hover:scale-102'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={`Avatar ${index + 1}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-yoru-accent text-[#030407] flex items-center justify-center font-black shadow-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white text-center py-0.5 truncate px-1">
                        #{index + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* Special Collections & Badges Tab */}
        {activeTab === 'collection' && (
          <motion.div
            key="collection-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Collection Summary Header */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-400" /> Permanent Inventory & Special Collections
                  </h3>
                  <p className="text-xs text-yoru-text-muted mt-1">
                    Your collection items and event badges are permanently bound to your account profile.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                    <span className="text-xs text-yoru-text-muted block">Special Items</span>
                    <span className="text-sm font-bold text-rose-400">{isEventClaimed ? 2 : 0}</span>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                    <span className="text-xs text-yoru-text-muted block">Total Badges</span>
                    <span className="text-sm font-bold text-emerald-400">{profile?.badges?.length || (isEventClaimed ? 1 : 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIAL COLLECTIONS SHOWCASE GRID */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-base md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" /> Special Collections: [Luffy & Zoro Special S1]
                  </h4>
                  <p className="text-xs text-yoru-text-muted mt-0.5">
                    Exclusive event items collected during active seasons. Usable as your profile avatar anytime.
                  </p>
                </div>
                {isEventClaimed && (
                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                    2/2 Collected
                  </span>
                )}
              </div>

              {isEventClaimed ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {SPECIAL_EVENT_S1.avatars.map((av) => {
                    const isEquipped = selectedPhotoURL === av.url;
                    return (
                      <div
                        key={av.id}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-br ${av.auraColor} backdrop-blur-md ${
                          isEquipped
                            ? 'border-yoru-accent shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-2 ring-yoru-accent/50'
                            : `${av.borderColor} hover:border-white/40`
                        }`}
                      >
                        {/* High-res character display */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 bg-[#12141C] shadow-2xl group">
                          <img
                            src={av.url}
                            alt={av.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow">
                            EVENT S1
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedAvatar(av)}
                            className="absolute bottom-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-black text-white/80 hover:text-white rounded-lg backdrop-blur-sm transition-colors"
                            title="Inspect Character Card"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lore & Stats */}
                        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
                              {av.badge}
                            </span>
                            <span className="text-[10px] font-bold text-rose-300">
                              {av.rarity}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-lg font-black text-white tracking-wide">{av.name}</h4>
                            <p className="text-xs text-rose-300 font-semibold">{av.title}</p>
                          </div>

                          <p className="text-xs text-white/70 leading-relaxed">
                            {av.lore}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <Button
                              size="sm"
                              variant={isEquipped ? "secondary" : "outline"}
                              onClick={() => {
                                setSelectedPhotoURL(av.url);
                                setActiveTab('profile');
                              }}
                              className={`text-xs px-4 py-1.5 h-8 font-bold ${
                                isEquipped
                                  ? 'bg-yoru-accent text-[#030407] font-black'
                                  : 'border-white/20 text-white hover:bg-white/10'
                              }`}
                            >
                              {isEquipped ? (
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" /> Equipped
                                </span>
                              ) : (
                                'Equip Avatar'
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectedAvatar(av)}
                              className="text-xs text-white/70 hover:text-white h-8"
                            >
                              Full Lore Card
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Custom Empty State Illustration for Collection */
                <div className="text-center py-12 px-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <CollectionEmptyIllustration />
                  <h4 className="text-base md:text-lg font-black text-white uppercase tracking-wider mb-2">
                    No Special Collections Yet
                  </h4>
                  <p className="text-xs text-yoru-text-muted mb-6 max-w-md mx-auto leading-relaxed">
                    You haven't claimed any limited season event items yet. Head to the "Edit Profile & Avatars" tab to claim the limited [Luffy & Zoro Special S1] event!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-rose-600/30 gap-2 border-0"
                  >
                    <Gift className="w-4 h-4" /> Claim Luffy & Zoro Event Now
                  </Button>
                </div>
              )}
            </div>

            {/* Badges Showcase */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" /> Event & Account Badges
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* S1 Event Badge */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isEventClaimed
                    ? 'bg-gradient-to-br from-rose-950/30 to-[#12141C] border-rose-500/40 shadow-lg'
                    : 'bg-white/[0.02] border-white/5 opacity-60'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isEventClaimed ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-white/5 text-white/30'
                    }`}>
                      <Flame className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white truncate">Luffy & Zoro S1 Pioneer</h5>
                        {isEventClaimed && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-yoru-text-muted mt-1 leading-snug">
                        Season 1 exclusive event reward for claiming Luffy & Zoro special avatars.
                      </p>
                      <span className="text-[10px] font-bold text-rose-400 block mt-2">
                        {isEventClaimed ? '• Permanent Badge' : '• Locked (Claim in Events)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Member Badge */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/20 to-[#12141C] border border-white/10 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white truncate">YORU Community Member</h5>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-xs text-yoru-text-muted mt-1 leading-snug">
                        Verified account holder with cloud watch sync and anime history.
                      </p>
                      <span className="text-[10px] font-bold text-emerald-400 block mt-2">
                        • Permanent Badge
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Badge (if admin) */}
                {isAdmin && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-[#12141C] border border-amber-500/40 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white truncate">Administrator</h5>
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </div>
                        <p className="text-xs text-yoru-text-muted mt-1 leading-snug">
                          System administrator badge with Simoon executive access privileges.
                        </p>
                        <span className="text-[10px] font-bold text-amber-400 block mt-2">
                          • Executive Role
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <motion.div
            key="watchlist-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {watchlistItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlistItems.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            ) : (
              /* Custom Empty State Illustration for Watchlist */
              <div className="text-center py-16 px-6 bg-[#0A0B0E] border border-white/10 rounded-3xl shadow-xl">
                <WatchlistEmptyIllustration />
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                  Your Watchlist is Empty
                </h3>
                <p className="text-xs text-yoru-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
                  Discover trending anime series, movies, and seasonal shows, and bookmark them to start your custom watchlist.
                </p>
                <Link to="/browse">
                  <Button size="lg" className="px-8 font-bold gap-2">
                    <Compass className="w-4 h-4" /> Browse Trending Anime
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Watch History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {watchHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#0A0B0E] border border-white/10 rounded-xl p-4 flex gap-4 items-center hover:border-white/20 transition-colors group"
                  >
                    {item.poster ? (
                      <img src={item.poster} alt={item.title} className="w-14 h-20 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-14 h-20 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                        <Film className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-yoru-accent transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-yoru-text-muted mt-1">
                        Episode {item.episodeNumber}
                      </p>
                      <span className="text-[10px] text-white/40 block mt-2">
                        {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    <Link to={`/watch/${item.slug || item.animeId}/${item.episodeNumber}`}>
                      <button className="p-2.5 bg-yoru-accent/10 text-yoru-accent rounded-full hover:bg-yoru-accent hover:text-[#030407] transition-all cursor-pointer">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              /* Custom Empty State Illustration for History */
              <div className="text-center py-16 px-6 bg-[#0A0B0E] border border-white/10 rounded-3xl shadow-xl">
                <HistoryEmptyIllustration />
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                  No Watch History Yet
                </h3>
                <p className="text-xs text-yoru-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
                  Start streaming anime episodes and your playback checkpoints will be safely tracked here.
                </p>
                <Link to="/browse">
                  <Button size="lg" className="px-8 font-bold gap-2">
                    <Play className="w-4 h-4 fill-current" /> Start Watching
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING DISCORD-STYLE UNSAVED CHANGES BAR */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg"
          >
            <div className="bg-[#111217]/95 backdrop-blur-2xl border border-white/15 p-3.5 sm:p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  Don't forget to save your changes!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChanges}
                  className="text-xs font-bold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveChanges()}
                  disabled={isSaving || !displayName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-extrabold px-4 sm:px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNSAVED CHANGES TAB/LEAVE WARNING MODAL */}
      <AnimatePresence>
        {isUnsavedChangesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D0F17] border border-white/15 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                  Unsaved Changes
                </h3>
                <p className="text-xs text-yoru-text-muted">
                  You have made changes to your profile. Do you want to save your changes before leaving this tab?
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleSaveAndSwitchTab}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save & Continue
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDiscardAndSwitchTab}
                  className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  Discard Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHARACTER LORE CARD INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectedAvatar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-[#0E1018] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-6 overflow-hidden"
            >
              <button
                onClick={() => setInspectedAvatar(null)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-yoru-accent p-1 bg-black/60 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                  <img
                    src={inspectedAvatar.url}
                    alt={inspectedAvatar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div>
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {inspectedAvatar.rarity}
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mt-2">
                    {inspectedAvatar.name}
                  </h3>
                  <p className="text-xs font-bold text-rose-400">
                    {inspectedAvatar.title}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block mb-1">
                    Character Lore
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {inspectedAvatar.lore}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left text-xs">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block">Element / Aura</span>
                    <span className="font-semibold text-white">{inspectedAvatar.element}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block">Status</span>
                    <span className="font-semibold text-emerald-400">Permanently Owned</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoURL(inspectedAvatar.url);
                      setInspectedAvatar(null);
                    }}
                    className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold"
                  >
                    Equip as Active Avatar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {isSignOutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D0F17] border border-white/15 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <LogOut className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                  Sign Out of YORU?
                </h3>
                <p className="text-xs text-yoru-text-muted">
                  Are you sure you want to sign out? You will need to sign in again to access your watchlist and history.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
