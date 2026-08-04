import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Comment } from '../types';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CommentSectionProps {
  animeId: string;
  episodeId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ animeId, episodeId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [animeId, episodeId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'comments'),
        where('animeId', '==', animeId),
        where('episodeId', '==', episodeId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const loadedComments = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Comment[];
      setComments(loadedComments);
    } catch (e) {
      console.error("Error loading comments:", e);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        animeId,
        episodeId,
        userId: user.uid,
        userDisplayName: profile?.displayName || user.displayName || 'Anonymous',
        userPhotoURL: profile?.photoURL || user.photoURL || null,
        text: newComment.trim(),
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([{ ...commentData, id: docRef.id } as Comment, ...comments]);
      setNewComment('');
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

  return (
    <div className="bg-yoru-surface border border-yoru-border p-4 md:p-6 mt-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-yoru-border">
        <MessageSquare className="w-5 h-5 text-yoru-accent" />
        <h3 className="text-lg font-bold text-white uppercase tracking-widest">Comments ({comments.length})</h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="w-10 h-10 rounded-full bg-yoru-surface-elevated overflow-hidden shrink-0 hidden md:block">
            {profile?.photoURL || user.photoURL ? (
              <img src={(profile?.photoURL || user.photoURL) as string} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-yoru-text-muted">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a review or comment for this episode..."
              className="w-full bg-yoru-bg border border-yoru-border text-white placeholder-yoru-text-muted px-4 py-3 min-h-[100px] md:min-h-[60px] focus:outline-none focus:border-yoru-accent resize-none transition-colors"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute bottom-2 right-2 p-2 bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-yoru-surface-elevated border border-yoru-border text-center">
          <p className="text-yoru-text-muted text-sm">Please log in to leave a comment.</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-yoru-text-muted animate-pulse">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-yoru-text-muted">No comments yet. Be the first to share your thoughts!</div>
        ) : (
          comments.map((comment, i) => (
            <motion.div 
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="flex gap-4 p-4 bg-yoru-bg border border-yoru-border/50 group"
            >
              <div className="w-10 h-10 rounded-full bg-yoru-surface overflow-hidden shrink-0">
                {comment.userPhotoURL ? (
                  <img src={comment.userPhotoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-yoru-text-muted">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{comment.userDisplayName}</span>
                    <span className="text-xs text-yoru-text-muted">{formatTime(comment.createdAt)}</span>
                  </div>
                  {(user?.uid === comment.userId || profile?.role === 'admin') && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-yoru-text-muted hover:text-yoru-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-yoru-text leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
