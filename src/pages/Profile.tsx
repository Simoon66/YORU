import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  Check,
  AlertCircle,
  Film,
  Bookmark,
  Clock,
  Award,
  Crown,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  Gift,
  Maximize2,
  Save,
  Compass,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Anime } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { Button } from '../components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, logout } from '../lib/firebase';
import { SPECIAL_EVENT_S1, SIMOON_ADMIN_AVATAR, STANDARD_ANIME_AVATARS, GIRLS_ANIME_AVATARS } from '../data/avatarsData';
import { CharacterLoreModal } from '../components/profile/CharacterLoreModal';
import { ShareProfileModal } from '../components/profile/ShareProfileModal';
import { PublicProfileView } from '../components/profile/PublicProfileView';
import {
  WatchlistEmptyIllustration,
  CollectionEmptyIllustration,
  HistoryEmptyIllustration
} from '../components/profile/ProfileIllustrations';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateUserProfile, claimEventRewards } = useAuth();
  const navigate = useNavigate();
  const routeParams = useParams<{ userId?: string }>();
  const [searchParams] = useSearchParams();

  // Determine if viewing public profile
  const targetUserId = routeParams.userId || searchParams.get('u') || searchParams.get('user');
  const isViewingPublicProfile = Boolean(targetUserId && (!user || targetUserId !== user.uid));

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [selectedPhotoURL, setSelectedPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'collection' | 'watchlist' | 'history'>('profile');

  // Share Modal & Quick Copy
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);

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

  // Check if user has claimed the S1 special event
  const isEventClaimed = (profile?.claimedEvents || []).includes(SPECIAL_EVENT_S1.id);

  // Watch Time Calculation (standard ~23.5 min anime episode average)
  const watchHours = (watchedCount * 23.5 / 60).toFixed(1);

  // Check if form has unsaved modifications
  const hasChanges = (displayName.trim() !== originalDisplayName) || (selectedPhotoURL !== originalPhotoURL);

  // If viewing someone else's public profile, render public showcase view
  if (isViewingPublicProfile && targetUserId) {
    return (
      <div className="min-h-screen bg-[#030407] pt-24 sm:pt-28 pb-24 px-3.5 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <PublicProfileView userId={targetUserId} currentAuthUserUid={user?.uid} />
      </div>
    );
  }

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

  // Quick Copy Profile Link
  const handleQuickCopyLink = async () => {
    if (!user) return;
    const shareUrl = `${window.location.origin}/profile?u=${user.uid}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedQuickLink(true);
      setTimeout(() => setCopiedQuickLink(false), 2500);
    } catch (e) {
      console.error("Failed to copy", e);
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
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase mb-3">Profile Access</h1>
        <p className="text-xs sm:text-sm font-medium text-yoru-text-muted max-w-sm mb-8">
          Please sign in to manage your anime profile, watch history, and account settings.
        </p>
        <Link to="/">
          <Button size="lg" className="px-8 font-bold">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // Admin access validation (Strict: only admin sees Simoon avatar)
  const isSimoonAdmin = user.email === 'simoonabdulla@gmail.com';
  const isAdmin = profile?.role === 'admin' || user.email === 'kamaluddin124578@gmail.com' || isSimoonAdmin;

  return (
    <div className="min-h-screen bg-[#030407] pt-24 sm:pt-28 pb-24 px-3.5 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
      
      {/* Profile Header Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0A0B0E]/90 backdrop-blur-xl mb-6 sm:mb-8 p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-yoru-accent/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 sm:w-80 h-60 sm:h-80 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-7">
          
          {/* Avatar Display with responsive sizing */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white/20 p-1 bg-black/40 shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 group-hover:border-yoru-accent">
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
                  <User className="w-10 sm:w-12 h-10 sm:h-12 text-white/30" />
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-amber-500 text-black rounded-lg shadow-lg font-black" title="Admin">
                <Crown className="w-3.5 h-3.5" />
              </div>
            )}
            {isEventClaimed && !isAdmin && (
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg font-black" title="Event S1 Pioneer">
                <Flame className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* User Details & Total Watch Time Statistics */}
          <div className="flex-1 text-center md:text-left min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide truncate max-w-full">
                {profile?.displayName || user.displayName || 'Anime Fan'}
              </h1>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              ) : isEventClaimed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <Flame className="w-3 h-3 text-rose-400" /> S1 Pioneer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                  <Sparkles className="w-3 h-3 text-yoru-accent" /> Member
                </span>
              )}
            </div>

            {/* Clean Statistics Row: Total Watch Time & Episodes */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 mt-1">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 sm:py-3 rounded-2xl">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                   <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block mb-0.5">Watch Time</span>
                  <span className="text-sm sm:text-base font-black text-white truncate">
                    {watchHours} <span className="text-xs text-white/50 font-medium">hrs</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 sm:py-3 rounded-2xl">
                <div className="p-2 bg-yoru-accent/10 rounded-xl text-yoru-accent">
                   <Film className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block mb-0.5">Episodes</span>
                  <span className="text-sm sm:text-base font-black text-white truncate">
                    {isLoadingStats ? '...' : watchedCount} <span className="text-xs text-white/50 font-medium">eps</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Share Profile & Sign Out */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto pt-2 md:pt-0">
            {/* Share Profile Button */}
            <Button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="bg-yoru-accent hover:bg-yoru-accent/90 text-[#030407] font-black text-xs gap-1.5 px-4 h-9 shadow-lg shadow-white/5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Profile
            </Button>

            {/* Quick Copy Link Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleQuickCopyLink}
              className="h-9 px-3 text-xs font-bold gap-1 border-white/10"
              title="Copy public link"
            >
              {copiedQuickLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedQuickLink ? 'Copied' : 'Copy'}</span>
            </Button>

            {isAdmin && (
              <Link to="/admin">
                <Button variant="secondary" size="sm" className="h-9 gap-1.5 text-xs font-bold border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </Button>
              </Link>
            )}

            <Button 
              onClick={() => setIsSignOutModalOpen(true)} 
              variant="ghost" 
              size="sm" 
              className="h-9 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 border border-rose-500/20 text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </div>

        </div>
      </div>

      {/* Tabs Navigation (Responsive, single-line horizontal scroll) */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-6 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'profile'
              ? 'bg-yoru-accent text-[#030407] font-black shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span>Profile & Avatars</span>
        </button>

        <button
          onClick={() => handleTabClick('collection')}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'collection'
              ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/25'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>Special Collections ({isEventClaimed ? 2 : 0})</span>
          {isEventClaimed && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('watchlist')}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'watchlist'
              ? 'bg-yoru-accent text-[#030407] font-black shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          <span>Watchlist ({watchlistItems.length})</span>
        </button>

        <button
          onClick={() => handleTabClick('history')}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'history'
              ? 'bg-yoru-accent text-[#030407] font-black shadow-lg shadow-white/5'
              : 'text-yoru-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Watch History</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: PROFILE & AVATARS */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >

            {/* LIMITED EVENT BANNER: [Luffy & Zoro Special S1] with Interactive Tooltips */}
            <div className="relative rounded-3xl overflow-hidden border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-[#0E0C18] to-[#0A0B0E] p-5 sm:p-7 shadow-[0_10px_35px_rgba(244,63,94,0.15)]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                      <Flame className="w-3 h-3" /> {SPECIAL_EVENT_S1.tag}
                    </span>
                    {isEventClaimed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked Forever
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-300/80">
                        • Season 1 Exclusive
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Event: [{SPECIAL_EVENT_S1.name}]
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {SPECIAL_EVENT_S1.description}
                  </p>
                </div>

                {/* Event Avatars Preview & Claim Button with Hover Tooltips */}
                <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto justify-start lg:justify-end">
                  <div className="flex items-center gap-2.5">
                    {SPECIAL_EVENT_S1.avatars.map((av) => {
                      const isEquipped = selectedPhotoURL === av.url;
                      return (
                          <div key={av.id} className="text-center group cursor-pointer">
                            <div
                              onClick={() => {
                                if (isEventClaimed) {
                                  setSelectedPhotoURL(av.url);
                                } else {
                                  setInspectedAvatar(av);
                                }
                              }}
                              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 p-0.5 ${
                                isEquipped
                                  ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400'
                                  : isEventClaimed
                                  ? `${av.borderColor} hover:scale-105 hover:border-white shadow-lg`
                                  : 'border-rose-500/40 opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                            >
                              <img
                                src={av.url}
                                alt={av.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {isEquipped && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-black">
                                    <Check className="w-3 h-3" />
                                  </div>
                                </div>
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm text-[8px] font-black text-rose-300 text-center py-0.5 truncate px-1">
                                {av.badge}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-white/80 block mt-1 truncate max-w-[65px] mx-auto">
                              {av.name.split(' ')[0]}
                            </span>
                          </div>
                      );
                    })}
                  </div>

                  {/* Claim Button */}
                  {!isEventClaimed ? (
                    <Button
                      type="button"
                      size="default"
                      onClick={handleClaimSpecialEvent}
                      disabled={isClaimingEvent}
                      className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black shadow-lg shadow-rose-600/30 gap-1.5 border-0 px-5 text-xs"
                    >
                      {isClaimingEvent ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" /> Claim Luffy & Zoro
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>In Collection</span>
                    </div>
                  )}
                </div>
              </div>

              {eventClaimSuccess && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Success! Monkey D. Luffy and Roronoa Zoro special avatars are now in your permanent collection!
                  </span>
                </div>
              )}
            </div>

            {/* Profile Edit Form & Active Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Column */}
              <div className="lg:col-span-2 bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-yoru-accent" /> Profile Information
                  </h3>
                  <p className="text-xs text-yoru-text-muted mt-0.5">
                    Update your public screen name and select an avatar from the gallery.
                  </p>
                </div>

                <form onSubmit={handleSaveChanges} className="space-y-4">
                  {/* Display Name Input */}
                  <div className="space-y-1.5">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-yoru-accent transition-colors"
                    />
                  </div>

                  {/* Email Address (Hidden with toggle) */}
                  <div className="space-y-1.5">
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
                        {isEmailVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={isEmailVisible ? "text" : "password"}
                        disabled
                        value={user.email || ''}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/70 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Feedback Alerts */}
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Profile updated successfully!</span>
                    </div>
                  )}

                  {/* Save & Reset Button Group */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={isSaving || !displayName.trim()}
                      className="gap-2 px-6 font-bold text-xs h-10"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#030407] border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </>
                      )}
                    </Button>

                    {hasChanges && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResetChanges}
                        className="text-white/60 hover:text-white gap-1.5 text-xs h-10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Active Avatar Preview & Quick Card */}
              <div className="space-y-4">
                <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 shadow-xl text-center space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block">
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
                  <p className="text-[11px] text-yoru-text-muted">
                    Pick an avatar from the gallery below and click "Save Changes".
                  </p>
                </div>

                {/* Share Card Mini CTA */}
                <div className="bg-gradient-to-br from-white/5 to-[#0A0B0E] border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-yoru-accent" /> Public Showcase
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-[11px] text-yoru-accent hover:underline font-bold"
                    >
                      Share Link
                    </button>
                  </div>
                  <p className="text-[11px] text-yoru-text-muted leading-relaxed">
                    Allow friends and other anime fans to view your watch time and special collections.
                  </p>
                </div>
              </div>
            </div>

            {/* Special Admin Exclusive Avatar (Simoon / Strictly for Admins ONLY) */}
            {isAdmin && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Administrator Special Avatar (Simoon)
                  </h4>
                </div>
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoURL(SIMOON_ADMIN_AVATAR.url)}
                    className={`group relative rounded-2xl overflow-hidden w-16 h-16 sm:w-18 sm:h-18 border-2 transition-all shrink-0 ${
                      selectedPhotoURL === SIMOON_ADMIN_AVATAR.url
                        ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400'
                        : 'border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    <img
                      src={SIMOON_ADMIN_AVATAR.url}
                      alt={SIMOON_ADMIN_AVATAR.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {selectedPhotoURL === SIMOON_ADMIN_AVATAR.url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-black">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </button>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">Simoon Special Avatar</p>
                    <p className="text-[11px] text-yoru-text-muted">Exclusive profile avatar reserved for Administrators.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Anime Avatars Grid (Ultra Clean, 4-col on mobile, 6-col on tablet, 8-col on desktop) */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                    Standard Anime Avatars
                  </h3>
                  <p className="text-[11px] text-yoru-text-muted">
                    Tap any avatar to select and preview.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2.5 py-1 rounded-lg">
                  {STANDARD_ANIME_AVATARS.length} Available
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5">
                {STANDARD_ANIME_AVATARS.map((av) => {
                  const isSelected = selectedPhotoURL === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedPhotoURL(av.url)}
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-yoru-accent scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-yoru-accent/50'
                          : 'border-white/10 hover:border-white/40 hover:scale-102 bg-white/5'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-yoru-accent text-[#030407] flex items-center justify-center font-black">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Girls Anime Avatars Section */}
            <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Girls Avatars
                  </h3>
                  <p className="text-[11px] text-yoru-text-muted">
                    Tap any avatar to select and preview.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-lg">
                  {GIRLS_ANIME_AVATARS.length} Available
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5">
                {GIRLS_ANIME_AVATARS.map((av) => {
                  const isSelected = selectedPhotoURL === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedPhotoURL(av.url)}
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-yoru-accent scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-yoru-accent/50'
                          : 'border-white/10 hover:border-pink-400/40 hover:scale-102 bg-white/5'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-yoru-accent text-[#030407] flex items-center justify-center font-black">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 2: SPECIAL COLLECTIONS */}
        {activeTab === 'collection' && (
          <motion.div
            key="collection-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {isEventClaimed ? (
              <div className="space-y-5">
                {/* Event Overview Card */}
                <div className="relative rounded-3xl overflow-hidden border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-[#0E0C18] to-[#0A0B0E] p-5 sm:p-7 shadow-[0_10px_35px_rgba(244,63,94,0.15)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                          Special Collections
                        </span>
                        <span className="text-xs text-rose-400 font-semibold">• [Luffy & Zoro Special S1]</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-400" /> Season 1 Mythic Inventory (2 Items)
                      </h3>
                      <p className="text-xs text-white/70 mt-1 max-w-xl">
                        Season 1 limited-edition avatars with exclusive lore, battle auras, and permanent ownership badge.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-1.5 px-4 h-9 shadow-lg shadow-rose-500/20"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Collection
                    </Button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {SPECIAL_EVENT_S1.avatars.map((av) => {
                    const isEquipped = selectedPhotoURL === av.url;
                    return (
                      <div
                        key={av.id}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-gradient-to-br ${av.auraColor} backdrop-blur-md ${
                          isEquipped
                            ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50'
                            : `${av.borderColor} hover:border-white/40`
                        }`}
                      >
                        {/* Avatar Image */}
                          <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 bg-[#12141C] shadow-lg group cursor-pointer">
                            <img
                              src={av.url}
                              alt={av.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                              S1
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedAvatar(av);
                              }}
                              className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-white/80 hover:text-white rounded-md backdrop-blur-sm transition-colors"
                              title="Inspect Lore Card"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
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
                          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setSelectedPhotoURL(av.url);
                                handleSaveChanges();
                              }}
                              className={`text-xs px-3.5 py-1.5 h-8 font-bold ${
                                isEquipped
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                              }`}
                            >
                              {isEquipped ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Active Avatar
                                </span>
                              ) : (
                                'Equip Avatar'
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => setInspectedAvatar(av)}
                              className="text-xs text-white/60 hover:text-white underline font-medium cursor-pointer"
                            >
                              Inspect Lore
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <CollectionEmptyIllustration onClaimClick={handleClaimSpecialEvent} />
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <motion.div
            key="watchlist-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {watchlistItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {watchlistItems.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            ) : (
              <WatchlistEmptyIllustration onBrowseClick={() => navigate('/browse')} />
            )}
          </motion.div>
        )}

        {/* TAB 4: WATCH HISTORY */}
        {activeTab === 'history' && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {watchedCount > 0 ? (
              <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" /> Watch History Summary
                    </h3>
                    <p className="text-xs text-yoru-text-muted mt-0.5">
                      Completed episodes and total watch time.
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {watchHours} Hours Logged
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">
                      You have completed <strong className="text-yoru-accent">{watchedCount} episodes</strong> on Yoru Anime.
                    </p>
                    <p className="text-[11px] text-yoru-text-muted">
                      Your progress is continuously tracked across devices.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate('/browse')}
                    className="font-bold text-xs gap-1.5 px-4 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" /> Continue Streaming
                  </Button>
                </div>
              </div>
            ) : (
              <HistoryEmptyIllustration onBrowseClick={() => navigate('/browse')} />
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* CHARACTER LORE MODAL */}
      <CharacterLoreModal
        avatar={inspectedAvatar}
        onClose={() => setInspectedAvatar(null)}
        onEquip={(url) => {
          setSelectedPhotoURL(url);
          handleSaveChanges();
        }}
        isEquipped={selectedPhotoURL === inspectedAvatar?.url}
      />

      {/* SHARE PROFILE MODAL */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userId={user.uid}
        displayName={displayName || user.displayName || 'Anime Fan'}
        photoURL={selectedPhotoURL || user.photoURL || ''}
        watchedCount={watchedCount}
        watchHours={watchHours}
        isEventClaimed={isEventClaimed}
        isAdmin={isAdmin}
      />

      {/* SIGN OUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {isSignOutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-[#0E1018] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Sign Out</h3>
                <p className="text-xs text-yoru-text-muted">
                  Are you sure you want to sign out from your Yoru account?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="font-bold text-xs border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSignOut}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNSAVED CHANGES MODAL */}
      <AnimatePresence>
        {isUnsavedChangesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-[#0E1018] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Unsaved Changes</h3>
                <p className="text-xs text-yoru-text-muted">
                  You have unsaved changes in your profile. Would you like to save before switching tabs?
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={handleDiscardAndSwitchTab}
                  className="font-bold text-xs border-white/10 order-2 sm:order-1"
                >
                  Discard Changes
                </Button>
                <Button
                  onClick={handleSaveAndSwitchTab}
                  className="bg-yoru-accent text-[#030407] font-black text-xs order-1 sm:order-2 flex-1"
                >
                  Save & Switch Tab
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
