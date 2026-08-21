import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserBadge } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateUserProfile: (data: { displayName?: string; photoURL?: string | null }) => Promise<void>;
  claimEventRewards: (eventId: string, avatars: string[], badge?: UserBadge) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  updateUserProfile: async () => {},
  claimEventRewards: async () => {}
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const isAdmin = currentUser.email === 'simoonabdulla@gmail.com' || currentUser.email === 'kamaluddin124578@gmail.com';
            if (isAdmin) {
              data.role = 'admin';
            }
            setProfile(data);
          } else {
             // Fallback profile if doc doesn't exist yet (created during sign in)
             setProfile({
               uid: currentUser.uid,
               email: currentUser.email,
               displayName: currentUser.displayName,
               photoURL: currentUser.photoURL,
               role: (currentUser.email === 'simoonabdulla@gmail.com' || currentUser.email === 'kamaluddin124578@gmail.com') ? 'admin' : 'user',
               createdAt: Date.now()
             });
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string | null }) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    // Update Firebase Auth user (only if photoURL is short standard URL <= 2000 chars and not data URL)
    const authProfileUpdate: { displayName?: string; photoURL?: string } = {};
    if (data.displayName !== undefined) {
      authProfileUpdate.displayName = data.displayName;
    }
    
    if (data.photoURL !== undefined) {
      if (data.photoURL && data.photoURL.length <= 2000 && !data.photoURL.startsWith('data:')) {
        authProfileUpdate.photoURL = data.photoURL;
      } else if (!data.photoURL) {
        authProfileUpdate.photoURL = '';
      }
    }

    try {
      if (Object.keys(authProfileUpdate).length > 0) {
        await updateAuthProfile(auth.currentUser, authProfileUpdate);
      }
    } catch (authErr) {
      console.warn("Could not update Firebase Auth profile directly, persisting in Firestore:", authErr);
    }

    // Update Firestore users collection (Firestore supports full compressed image data URLs up to 1MB)
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const updatePayload: Record<string, any> = {
      updatedAt: Date.now()
    };
    if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
    if (data.photoURL !== undefined) updatePayload.photoURL = data.photoURL || null;

    await setDoc(userRef, updatePayload, { merge: true });

    // Update local state
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.photoURL !== undefined ? { photoURL: data.photoURL || null } : {})
      };
    });

    if (auth.currentUser) {
      setUser({
        ...auth.currentUser,
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.photoURL !== undefined && data.photoURL && data.photoURL.length <= 2000 && !data.photoURL.startsWith('data:') ? { photoURL: data.photoURL } : {})
      } as User);
    }
  };

  const claimEventRewards = async (eventId: string, avatars: string[], badge?: UserBadge) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const updatePayload: Record<string, any> = {
      claimedEvents: arrayUnion(eventId),
      unlockedAvatars: arrayUnion(...avatars),
      updatedAt: Date.now()
    };

    if (badge) {
      updatePayload.badges = arrayUnion(badge);
    }

    await setDoc(userRef, updatePayload, { merge: true });

    setProfile(prev => {
      if (!prev) return null;
      const currentClaimed = prev.claimedEvents || [];
      const currentAvatars = prev.unlockedAvatars || [];
      const currentBadges = prev.badges || [];

      return {
        ...prev,
        claimedEvents: currentClaimed.includes(eventId) ? currentClaimed : [...currentClaimed, eventId],
        unlockedAvatars: Array.from(new Set([...currentAvatars, ...avatars])),
        badges: badge && !currentBadges.some(b => b.id === badge.id) ? [...currentBadges, badge] : currentBadges
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateUserProfile, claimEventRewards }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
