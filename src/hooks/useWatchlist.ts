import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useWatchlist(animeId?: string) {
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistDocId, setWatchlistDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !animeId) {
      setIsInWatchlist(false);
      setWatchlistDocId(null);
      setIsLoading(false);
      return;
    }

    const checkWatchlist = async () => {
      try {
        const q = query(
          collection(db, 'watchlist'), 
          where('userId', '==', user.uid),
          where('animeId', '==', animeId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsInWatchlist(true);
          setWatchlistDocId(snap.docs[0].id);
        } else {
          setIsInWatchlist(false);
          setWatchlistDocId(null);
        }
      } catch (err) {
        console.error("Error checking watchlist:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkWatchlist();
  }, [user, animeId]);

  const toggleWatchlist = useCallback(async () => {
    if (!user) {
      alert("Please login to use watchlist");
      return;
    }
    if (!animeId) return;
    
    // Optimistic Update
    const prevIsInWatchlist = isInWatchlist;
    setIsInWatchlist(!prevIsInWatchlist);

    try {
      if (prevIsInWatchlist && watchlistDocId) {
        await deleteDoc(doc(db, 'watchlist', watchlistDocId));
        setWatchlistDocId(null);
      } else {
        const docRef = await addDoc(collection(db, 'watchlist'), {
          userId: user.uid,
          animeId: animeId,
          createdAt: Date.now()
        });
        setWatchlistDocId(docRef.id);
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      setIsInWatchlist(prevIsInWatchlist); // revert on error
    }
  }, [user, animeId, isInWatchlist, watchlistDocId]);

  return { isInWatchlist, toggleWatchlist, isLoading };
}
