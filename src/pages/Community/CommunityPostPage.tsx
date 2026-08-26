import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunityComments, createCommunityComment, deleteCommunityPost, toggleReaction, deleteCommunityComment } from '../../lib/community';
import { CommunityPost, CommunityComment, UserProfile } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, ArrowLeft, User as UserIcon, MessageCircle, Heart, Trash2, Image as ImageIcon, Pin } from 'lucide-react';
import { formatDistanceToNow } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { UserBadgeDisplay } from '../../components/UserBadgeDisplay';
import clsx from 'clsx';

export const CommunityPostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [postAuthor, setPostAuthor] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newCommentGif, setNewCommentGif] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersCache, setUsersCache] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!postId) return;
    loadPostData(postId);
  }, [postId]);

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteCommunityPost(post!.id, post!.userId);
        navigate('/community');
      } catch (err) {
        console.error(err);
        alert('Failed to delete post: ' + err.message);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommunityComment(commentId, post!.id);
        setComments(comments.filter(c => c.id !== commentId));
        setPost({...post!, commentCount: (post!.commentCount || 1) - 1});
      } catch (err) {
        console.error(err);
        alert('Failed to delete comment: ' + err.message);
      }
    }
  };

  const handleReact = async () => {
    if (!user) return alert('Please login to react');
    try {
      await toggleReaction(post!.id, user.uid);
      setPost({
        ...post!,
        reactions: {
          ...post!.reactions,
          ...(post!.reactions?.[user.uid] 
            ? Object.fromEntries(Object.entries(post!.reactions || {}).filter(([k]) => k !== user.uid))
            : { [user.uid]: Date.now() })
        }
      });
    } catch (err) {
      console.error(err);
      alert('Failed to react: ' + err.message);
    }
  };

  const isAuthor = user?.uid === post?.userId;
  const isAdminOrMod = profile?.role === 'admin' || profile?.role === 'moderator';
  const isStaff = profile?.role === 'staff' || isAdminOrMod;

  const loadPostData = async (id: string) => {
    try {
      setLoading(true);
      // Fetch Post
      const postSnap = await getDoc(doc(db, 'community_posts', id));
      if (!postSnap.exists()) {
        setPost(null);
        return;
      }
      const p = { id: postSnap.id, ...postSnap.data() } as CommunityPost;
      setPost(p);
      
      // Fetch Author
      const authorSnap = await getDoc(doc(db, 'users', p.userId));
      if (authorSnap.exists()) {
        const authorProf = authorSnap.data() as UserProfile;
        setPostAuthor(authorProf);
        setUsersCache(prev => ({...prev, [p.userId]: authorProf}));
      }

      // Fetch Comments
      const comms = await getCommunityComments(id);
      setComments(comms);
      
      const userIds = Array.from(new Set(comms.map(c => c.userId)));
      fetchUsers(userIds);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newComment.trim() && !newCommentGif.trim()) || !post) return;
    setIsSubmitting(true);
    try {
      const commentPayload: any = {
        postId: post.id,
        userId: user.uid,
        content: newComment.trim(),
        status: 'active'
      };
      if (newCommentGif.trim()) {
        commentPayload.gifUrl = newCommentGif.trim();
      }

      const comment = await createCommunityComment(commentPayload);
      setComments([...comments, comment]);
      setNewComment('');
      setNewCommentGif('');
      setPost(prev => prev ? {...prev, commentCount: (prev.commentCount || 0) + 1} : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#030407] flex justify-center pt-32"><Loader2 className="w-8 h-8 text-yoru-accent animate-spin" /></div>;
  }

  if (!post) {
    return <div className="min-h-screen bg-[#030407] text-white flex justify-center pt-32">Post not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#030407] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <Link to="/community" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>
        
        {/* Post Detail */}
        <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-6 shadow-xl relative group">
           {(isAdminOrMod || isAuthor) && (
             <button 
               onClick={handleDeletePost}
               className="absolute top-4 right-4 p-2 text-yoru-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
               title="Delete post"
             >
               <Trash2 className="w-4 h-4" />
             </button>
           )}
          <div className="flex items-start gap-4 mb-4">
            <Link to={`/user/${postAuthor?.username || post.userId}`} className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/50">
               {postAuthor?.photoURL ? <img src={postAuthor.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-3 text-white/30" />}
            </Link>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <Link to={`/user/${postAuthor?.username || post.userId}`} className="font-bold text-white hover:text-yoru-accent transition-colors">
                  {postAuthor?.username || postAuthor?.displayName || 'Unknown'}
                </Link>
                <UserBadgeDisplay user={postAuthor || undefined} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-yoru-text-muted">
                  {formatDistanceToNow(post.createdAt)} ago
                </span>
                {post.isPinned && (
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-yoru-accent bg-yoru-accent/10 px-1.5 py-0.5 rounded">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                {post.hashtags?.map(tag => (
                  <span key={tag} className="text-[9px] font-bold text-yoru-text-muted hover:text-white transition-colors bg-white/5 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-base text-white/90 whitespace-pre-wrap leading-relaxed mb-4">
            {post.content}
          </div>

          {post.gifUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
              <img src={post.gifUrl} alt="GIF" className="w-full max-h-[400px] object-cover" />
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-yoru-text-muted">
              <MessageCircle className="w-4 h-4" /> {post.commentCount || 0}
            </div>
            
            <button 
              onClick={handleReact} 
              className={clsx("flex items-center gap-2 text-xs font-bold transition-colors", post.reactions?.[user?.uid || ''] ? "text-rose-400" : "text-yoru-text-muted hover:text-rose-400")}
            >
              <Heart className={clsx("w-4 h-4", post.reactions?.[user?.uid || ''] && "fill-current")} /> {Object.keys(post.reactions || {}).length}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="pt-6 border-t border-white/10 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-yoru-accent" /> Comments ({post.commentCount || 0})
          </h3>
          
          {post.commentsEnabled ? (
            user ? (
              <form onSubmit={handleCreateComment} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/50">
                  {profile?.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 m-2.5 text-white/30" />}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yoru-accent"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input 
                        type="text" 
                        placeholder="Paste GIF URL (optional)..."
                        value={newCommentGif}
                        onChange={e => setNewCommentGif(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-yoru-accent"
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting || (!newComment.trim() && !newCommentGif.trim())} className="px-6 font-bold text-xs">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center text-xs text-yoru-text-muted">
                Please sign in to comment.
              </div>
            )
          ) : (
             <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-center text-xs font-bold">
               Comments are disabled for this post.
             </div>
          )}

          <div className="space-y-4 pt-4">
            {comments.map(comment => {
              const cAuthor = usersCache[comment.userId];
              const isCommentAuthor = user?.uid === comment.userId;
              
              return (
                <div key={comment.id} className="flex gap-4 group">
                  <Link to={`/user/${cAuthor?.username || comment.userId}`} className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shrink-0 mt-1 bg-black/50">
                    {cAuthor?.photoURL ? <img src={cAuthor.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-2 text-white/30" />}
                  </Link>
                  <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-4 border border-white/10 relative">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Link to={`/user/${cAuthor?.username || comment.userId}`} className="text-xs font-bold text-white hover:text-yoru-accent transition-colors">
                        {cAuthor?.username || cAuthor?.displayName || 'Unknown'}
                      </Link>
                      <UserBadgeDisplay user={cAuthor} />
                      <span className="text-[9px] text-yoru-text-muted ml-auto">
                        {formatDistanceToNow(comment.createdAt)}
                      </span>
                    </div>
                    
                    {comment.content && (
                      <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </div>
                    )}
                    
                    {comment.gifUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-white/10 inline-block max-w-[200px]">
                        <img src={comment.gifUrl} alt="GIF" className="w-full h-auto" loading="lazy" />
                      </div>
                    )}
                    
                    {(isCommentAuthor || isStaff) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)} 
                        className="absolute -right-2 -top-2 p-1.5 bg-rose-500/10 text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-rose-500/20"
                        title="Delete comment"
                      >
                         <Trash2 className="w-3 h-3"/>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
};
