import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

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

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
