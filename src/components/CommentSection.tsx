import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Comment, UserProfile } from '../types';
import { MessageSquare, Send, Trash2, User, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { UserBadgeDisplay } from './UserBadgeDisplay';

interface CommentSectionProps {
  animeId: string;
  episodeId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ animeId, episodeId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, UserProfile>>({});
  const [newComment, setNewComment] = useState('');
  const [newCommentGif, setNewCommentGif] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [animeId, episodeId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      let loadedComments: Comment[] = [];
      try {
        const q = query(
          collection(db, 'comments'),
          where('animeId', '==', animeId),
          where('episodeId', '==', episodeId)
        );
        const snap = await getDocs(q);
        loadedComments = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Comment[];
      } catch (innerErr) {
        // Fallback in case of index constraint: query by episodeId only and filter in memory
        const fallbackQ = query(
          collection(db, 'comments'),
          where('episodeId', '==', episodeId)
        );
        const snap = await getDocs(fallbackQ);
        loadedComments = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Comment))
          .filter(c => !c.animeId || c.animeId === animeId);
      }

      // Sort comments descending by createdAt in memory
      loadedComments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setComments(loadedComments);
      
      const userIds = Array.from(new Set(loadedComments.map(c => c.userId)));
      fetchUsers(userIds);
    } catch (e) {
      console.error("Error loading comments:", e);
    }
    setIsLoading(false);
  };

  const fetchUsers = async (userIds: string[]) => {
    const newCache = { ...usersCache };
    let fetched = false;
    for (const uid of userIds) {
      if (!newCache[uid]) {
        try {
          const docSnap = await getDoc(doc(db, 'users', uid));
          if (docSnap.exists()) {
            newCache[uid] = docSnap.data() as UserProfile;
            fetched = true;
          }
        } catch (e) {}
      }
    }
    if (fetched) {
      setUsersCache(prev => ({...prev, ...newCache}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newComment.trim() && !newCommentGif.trim())) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        animeId,
        episodeId,
        userId: user.uid,
        userDisplayName: profile?.displayName || user.displayName || 'Anonymous',
        userPhotoURL: profile?.photoURL || user.photoURL || null,
        text: newComment.trim(),
        gifUrl: newCommentGif.trim() || null,
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([{ ...commentData, id: docRef.id } as Comment, ...comments]);
      setNewComment('');
      setNewCommentGif('');
      if (!usersCache[user.uid] && profile) {
         setUsersCache(prev => ({...prev, [user.uid]: profile}));
      }
    } catch (e) {
      console.error("Error adding comment:", e);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      console.error("Error deleting comment:", e);
    }
  };

  const formatTime = (ms: number) => {
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ms).toLocaleDateString();
  };

  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'staff';

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 mt-4 border border-white/5">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <MessageSquare className="w-5 h-5 text-yoru-accent" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-widest">Comments <span className="text-yoru-text-muted text-sm ml-2">({comments.length})</span></h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-10 flex flex-col md:flex-row gap-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-yoru-surface-elevated overflow-hidden shrink-0 hidden md:block border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            {profile?.photoURL || user.photoURL ? (
              <img src={(profile?.photoURL || user.photoURL) as string} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-yoru-text-muted">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex-1 relative group flex flex-col gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a review or comment for this episode..."
              className="w-full bg-[#050608] border border-white/10 rounded-xl text-white placeholder-white/30 px-4 py-3 min-h-[90px] focus:outline-none focus:border-white/30 focus:bg-[#08090c] resize-none transition-all shadow-inner text-sm"
              disabled={isSubmitting}
            />
            {/* Bottom toolbar with GIF input on left and Post button anchored at bottom-right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-md">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Paste GIF URL (optional)..."
                  value={newCommentGif}
                  onChange={e => setNewCommentGif(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || (!newComment.trim() && !newCommentGif.trim())}
                className="self-end sm:self-auto px-5 py-2 rounded-lg bg-yoru-accent hover:bg-white disabled:opacity-40 text-[#030407] transition-all font-semibold text-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 rounded-xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center gap-3">
          <User className="w-6 h-6 text-white/30" />
          <p className="text-yoru-text-muted text-sm font-medium">Please log in to join the discussion.</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center text-white/30 animate-pulse">
            <MessageSquare className="w-8 h-8 mb-3" />
            <p className="text-sm font-medium text-yoru-text-muted">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-white/20">
            <MessageSquare className="w-8 h-8 mb-3 text-yoru-text-muted/40" />
            <p className="text-sm font-medium text-yoru-text-muted text-center">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment, i) => {
            const authorProfile = usersCache[comment.userId];
            return (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                className="flex gap-5 p-5 rounded-xl bg-[#030407]/50 border border-white/5 group hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/5">
                  {comment.userPhotoURL ? (
                    <img src={comment.userPhotoURL} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-yoru-text-muted">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">{comment.userDisplayName}</span>
                      <UserBadgeDisplay user={authorProfile} />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-yoru-text-muted ml-2">{formatTime(comment.createdAt)}</span>
                    </div>
                    {(user?.uid === comment.userId || isStaff) && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-white/20 hover:text-yoru-error opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full hover:bg-yoru-error/10"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {comment.text && <p className="text-sm text-yoru-text-muted leading-relaxed whitespace-pre-wrap">{comment.text}</p>}
                  {comment.gifUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 inline-block max-w-[300px]">
                      <img src={comment.gifUrl} alt="GIF" className="w-full h-auto object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
