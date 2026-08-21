import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  ShieldCheck,
  Flame,
  Sparkles,
  Crown,
  Clock,
  Film,
  Bookmark,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Compass,
  Maximize2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, Anime } from '../../types';
import { SPECIAL_EVENT_S1 } from '../../data/avatarsData';
import { SpecialAvatarTooltip } from './SpecialAvatarTooltip';
import { CharacterLoreModal } from './CharacterLoreModal';
import { Button } from '../ui/Button';
import { ShareProfileModal } from './ShareProfileModal';

interface PublicProfileViewProps {
  userId: string;
  currentAuthUserUid?: string;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  userId,
  currentAuthUserUid
}) => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [watchedCount, setWatchedCount] = useState<number>(0);
  const [watchlistCount, setWatchlistCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [inspectedAvatar, setInspectedAvatar] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    async function loadPublicData() {
      setIsLoading(true);
      setNotFound(false);
      try {
        // 1. Fetch User Profile Document
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const data = userSnap.data() as UserProfile;
        setProfileData(data);

        // 2. Fetch Watch Progress
        try {
          const progressQ = query(collection(db, 'watchProgress'), where('userId', '==', userId));
          const progressSnap = await getDocs(progressQ);
          let totalWatched = 0;
          progressSnap.forEach(d => {
            const pData = d.data();
            if (Array.isArray(pData.watchedEpisodeIds)) {
              const validEpisodes = new Set(pData.watchedEpisodeIds.map((id: string) => {
                const parts = id.split('_');
                return parts[parts.length - 1];
              }));
              totalWatched += validEpisodes.size;
            }
          });
          setWatchedCount(totalWatched);
        } catch (e) {
          console.warn("Could not load public watch progress", e);
        }

        // 3. Fetch Watchlist count
        try {
          const watchlistQ = query(collection(db, 'watchlist'), where('userId', '==', userId));
          const watchlistSnap = await getDocs(watchlistQ);
          setWatchlistCount(watchlistSnap.size);
        } catch (e) {
          console.warn("Could not load public watchlist count", e);
        }

      } catch (err) {
        console.error("Error loading public profile:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      loadPublicData();
    }
  }, [userId]);

  const watchHours = (watchedCount * 23.5 / 60).toFixed(1);
  const isEventClaimed = (profileData?.claimedEvents || []).includes(SPECIAL_EVENT_S1.id);
  const isAdmin = profileData?.role === 'admin' || profileData?.email === 'kamaluddin124578@gmail.com' || profileData?.email === 'simoonabdulla@gmail.com';
  const isOwnProfile = currentAuthUserUid === userId;

  const handleQuickCopy = async () => {
    try {
      const shareUrl = window.location.href;
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 border-3 border-yoru-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-white/60">Loading anime profile showcase...</p>
      </div>
    );
  }

  if (notFound || !profileData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-white/40" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
          Profile Not Found
        </h2>
        <p className="text-sm text-yoru-text-muted mb-8 leading-relaxed">
          The requested anime showcase profile does not exist or has been made private.
        </p>
        <Link to="/browse">
          <Button size="lg" className="px-8 font-bold">
            Explore Anime on Yoru
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Back / Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-xs font-bold text-yoru-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Explore Catalog
        </Link>

        {isOwnProfile && (
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            Edit Your Profile
          </Link>
        )}
      </div>

      {/* Public Profile Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0A0B0E]/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Glow Aura Backgrounds */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yoru-accent/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          
          {/* Avatar Display */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white/20 p-1 bg-black/50 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#12141C] flex items-center justify-center">
                {profileData.photoURL ? (
                  <img
                    src={profileData.photoURL}
                    alt={profileData.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-white/30" />
                )}
              </div>
            </div>

            {isAdmin ? (
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-amber-500 text-black rounded-lg shadow-lg font-black" title="Admin">
                <Crown className="w-4 h-4" />
              </div>
            ) : isEventClaimed ? (
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg font-black" title="Season 1 Pioneer">
                <Flame className="w-4 h-4" />
              </div>
            ) : null}
          </div>

          {/* User Showcase Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {profileData.displayName || 'Anime Fan'}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </span>
                ) : isEventClaimed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    <Flame className="w-3.5 h-3.5 text-rose-400" /> S1 Event Pioneer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 border border-white/10">
                    <Sparkles className="w-3 h-3 text-yoru-accent" /> Yoru Member
                  </span>
                )}
              </div>
              <p className="text-xs text-yoru-text-muted">
                Public Anime Watch & Collection Showcase
              </p>
            </div>

            {/* Clean Statistics Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-yoru-text-muted block">Total Watch Time</span>
                  <span className="text-sm font-black text-emerald-400">{watchHours} hrs</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                <Film className="w-4 h-4 text-yoru-accent shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-yoru-text-muted block">Episodes Watched</span>
                  <span className="text-sm font-black text-white">{watchedCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-yoru-text-muted block">Bookmarked</span>
                  <span className="text-sm font-black text-amber-300">{watchlistCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Share Action */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            <Button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="bg-yoru-accent text-[#030407] font-bold text-xs gap-2 px-5 shadow-lg shadow-white/5"
            >
              <Share2 className="w-4 h-4" /> Share Profile
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleQuickCopy}
              className="text-xs font-bold gap-1.5 border-white/10"
              title="Copy Profile Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>

        </div>
      </div>

      {/* Special Collection Showcase (Season 1 Mythic Items) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              Special Collection Showcase
            </h3>
          </div>
          {isEventClaimed ? (
            <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              2 Mythic Avatars Owned
            </span>
          ) : (
            <span className="text-xs text-yoru-text-muted">
              No special items claimed yet
            </span>
          )}
        </div>

        {isEventClaimed ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SPECIAL_EVENT_S1.avatars.map((av) => (
              <div
                key={av.id}
                className={`relative rounded-2xl overflow-hidden border-2 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-gradient-to-br ${av.auraColor} backdrop-blur-md ${av.borderColor}`}
              >
                <SpecialAvatarTooltip
                  name={av.name}
                  title={av.title}
                  lore={av.lore}
                  rarity={av.rarity}
                  element={av.element}
                  eventName={av.eventName}
                  badge={av.badge}
                  isUnlocked={true}
                  position="top"
                >
                  <div
                    onClick={() => setInspectedAvatar(av)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 bg-[#12141C] shadow-lg cursor-pointer group"
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                      S1
                    </span>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </SpecialAvatarTooltip>

                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
                      {av.badge}
                    </span>
                    <span className="text-[10px] font-bold text-rose-300">
                      {av.rarity}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white tracking-wide">{av.name}</h4>
                  <p className="text-xs text-rose-300 font-semibold">{av.title}</p>
                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                    {av.lore}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setInspectedAvatar(av)}
                      className="text-xs text-rose-300 hover:text-white underline font-semibold flex items-center gap-1 mx-auto sm:mx-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Character Lore & Card
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-white/30 mx-auto" />
            <p className="text-sm font-semibold text-white/70">
              This user has not claimed any limited season event items yet.
            </p>
          </div>
        )}
      </div>

      {/* Call to action footer banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-yoru-accent/10 via-[#0A0B0E] to-purple-500/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h4 className="text-base font-black text-white uppercase tracking-wider">
            Stream Thousands of Anime on Yoru
          </h4>
          <p className="text-xs text-yoru-text-muted">
            Track your watch progress, collect exclusive avatars, and curate your watchlist.
          </p>
        </div>
        <Link to="/browse">
          <Button className="font-bold text-xs px-6 whitespace-nowrap">
            <Compass className="w-4 h-4 mr-1.5" /> Browse Catalog
          </Button>
        </Link>
      </div>

      {/* Character Lore Modal */}
      <CharacterLoreModal
        avatar={inspectedAvatar}
        onClose={() => setInspectedAvatar(null)}
        onEquip={() => {}}
        isEquipped={false}
      />

      {/* Share Profile Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userId={userId}
        displayName={profileData.displayName || 'Anime Fan'}
        photoURL={profileData.photoURL || ''}
        watchedCount={watchedCount}
        watchHours={watchHours}
        isEventClaimed={isEventClaimed}
        isAdmin={isAdmin}
      />
    </div>
  );
};
