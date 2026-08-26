import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunityPosts, getPinnedPosts, createCommunityPost, deleteCommunityPost, toggleReaction } from '../../lib/community';
import { CommunityPost, UserProfile } from '../../types';
import { MessageSquare, Pin, Search, AlertCircle, Loader2, Heart, MessageCircle, Trash2, Image as ImageIcon, Hash } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNow } from '../../lib/utils';
import clsx from 'clsx';
import { UserBadgeDisplay } from '../../components/UserBadgeDisplay';
import { User as UserIcon } from 'lucide-react';

const HASHTAGS = ['All', 'Updates', 'General', 'Suggestion', 'Question', 'Discussion', 'Feedback', 'Poll', 'TierList', 'Matchup', 'Seasonal', 'Recommend'];

export const CommunityHome = () => {
  const { user, profile } = useAuth();
  const [pinnedPosts, setPinnedPosts] = useState<CommunityPost[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostGif, setNewPostGif] = useState('');
  const [newPostHashtags, setNewPostHashtags] = useState<string[]>(['General']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  
  const [usersCache, setUsersCache] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const pinned = await getPinnedPosts();
      const { posts: recent } = await getCommunityPosts();
      setPinnedPosts(pinned);
      setPosts(recent.filter(p => !p.isPinned));
      
      const allUserIds = Array.from(new Set([...pinned, ...recent].map(p => p.userId)));
      fetchUsers(allUserIds);
    } catch (err) {
      console.error(err);
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
      setUsersCache(newCache);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const postPayload: any = {
        userId: user.uid,
        content: newPostContent.trim(),
        hashtags: newPostHashtags.length > 0 ? newPostHashtags : ['General'],
        status: 'active',
        commentsEnabled: true,
        isPinned: false,
        isAnnouncement: false
      };
      if (newPostGif.trim()) {
        postPayload.gifUrl = newPostGif.trim();
      }

      const newPost = await createCommunityPost(postPayload);
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostGif('');
      setNewPostHashtags(['General']);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = (deletedId: string) => {
    setPinnedPosts(prev => prev.filter(p => p.id !== deletedId));
    setPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPinnedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const canPost = profile && ['admin', 'moderator', 'staff', 'special'].includes(profile.role);
  const isAdminOrMod = profile && ['admin', 'moderator'].includes(profile.role);

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'All') return true;
    return post.hashtags?.includes(activeTab);
  });
  
  const filteredPinned = pinnedPosts.filter(post => {
    if (activeTab === 'All') return true;
    return post.hashtags?.includes(activeTab);
  });

  return (
    <div className="min-h-screen bg-[#030407] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">Anikoto Connect</h1>
            <p className="text-sm text-yoru-text-muted mt-1">Discuss anime, share recommendations, and connect with fans.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/leaderboard">
              <Button variant="secondary" size="sm" className="font-bold text-xs">Leaderboard</Button>
            </Link>
            <Link to="/members">
              <Button variant="secondary" size="sm" className="font-bold text-xs">Members</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {HASHTAGS.map(tag => {
              const isActive = activeTab === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTab(tag)}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                    isActive 
                      ? "bg-yoru-accent text-white border-yoru-accent/50 shadow-[0_0_15px_rgba(var(--color-yoru-accent),0.3)]" 
                      : "bg-[#0A0B0E] text-yoru-text-muted border-white/5 hover:border-white/10 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2"><Hash className="w-4 h-4 opacity-50" /> {tag}</span>
                </button>
              );
            })}
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            {/* Post Composer */}
            {canPost ? (
              <form onSubmit={handleCreatePost} className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-5 shadow-lg mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-5 h-5 text-white/50" /></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind?..."
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/30 resize-none min-h-[80px] text-sm"
                    />
                    
                    <div className="flex gap-2 pb-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input 
                          type="text" 
                          placeholder="Paste GIF URL (optional)..."
                          value={newPostGif}
                          onChange={e => setNewPostGif(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-yoru-accent"
                        />
                      </div>
                      <select 
                        value={newPostHashtags[0] || "General"}
                        onChange={e => setNewPostHashtags([e.target.value])}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yoru-accent"
                      >
                        {HASHTAGS.filter(t => t !== 'All').map(tag => (
                          <option key={tag} value={tag} className="bg-black text-white">#{tag}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <div className="text-xs text-yoru-text-muted">
                        Posting as <span className="font-bold text-white">{profile?.username || profile?.displayName || 'User'}</span>
                      </div>
                      <Button type="submit" disabled={isSubmitting || !newPostContent.trim()} className="h-8 px-5 text-xs font-bold rounded-lg shadow-lg">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center text-xs text-yoru-text-muted mb-8">
                {user ? "You don't have permission to post. Only Staff and Special members can post." : "Please sign in to participate in the community."}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-yoru-accent animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Pinned Posts */}
                {filteredPinned.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    userProfile={usersCache[post.userId]} 
                    currentUser={user} 
                    isAdminOrMod={isAdminOrMod} 
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                  />
                ))}
                
                {/* Recent Posts */}
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    userProfile={usersCache[post.userId]} 
                    currentUser={user} 
                    isAdminOrMod={isAdminOrMod} 
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                  />
                ))}
                
                {filteredPosts.length === 0 && filteredPinned.length === 0 && (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm font-medium">No community posts yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const PostCard: React.FC<{ 
  post: CommunityPost, 
  userProfile?: UserProfile, 
  currentUser: any, 
  isAdminOrMod: boolean,
  onDeleted: (id: string) => void,
  onUpdated: (post: CommunityPost) => void
}> = ({ post, userProfile, currentUser, isAdminOrMod, onDeleted, onUpdated }) => {
  const isAuthor = currentUser?.uid === post.userId;
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteCommunityPost(post.id, post.userId);
        onDeleted(post.id);
      } catch (err) {
        console.error(err);
        alert('Failed to delete post: ' + err.message);
      }
    }
  };

  const handleReact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return alert('Please login to react');
    try {
      await toggleReaction(post.id, currentUser.uid);
      
      const newReactions = { ...post.reactions };
      if (newReactions[currentUser.uid]) {
        delete newReactions[currentUser.uid];
      } else {
        newReactions[currentUser.uid] = Date.now();
      }
      onUpdated({ ...post, reactions: newReactions });
    } catch (err) {
      console.error(err);
      alert('Failed to react: ' + err.message);
    }
  };

  return (
    <div onClick={() => navigate(`/community/post/${post.id}`)} className={clsx(
      "block bg-[#0A0B0E] cursor-pointer border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all group",
      post.isPinned && "border-yoru-accent/30 bg-yoru-accent/[0.02] shadow-[0_4px_20px_rgba(var(--color-yoru-accent),0.05)]"
    )}>
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="relative shrink-0 block" onClick={e => e.stopPropagation()}>
          <Link to={`/user/${userProfile?.username || post.userId}`} className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-black/50 block">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 m-2.5 text-white/30" />
            )}
          </Link>
        </div>
        
        {/* Header Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5" onClick={e => e.stopPropagation()}>
            <Link to={`/user/${userProfile?.username || post.userId}`} className="font-bold text-sm text-white hover:text-yoru-accent transition-colors truncate max-w-[150px]">
              {userProfile?.username || userProfile?.displayName || 'Unknown User'}
            </Link>
            <UserBadgeDisplay user={userProfile} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
        
        {(isAdminOrMod || isAuthor) && (
          <button 
            onClick={handleDelete} 
            className="p-2 text-yoru-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed mb-4 line-clamp-4">
        {post.content}
      </div>

      {post.gifUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
          <img src={post.gifUrl} alt="GIF" className="w-full max-h-[300px] object-cover" loading="lazy" />
        </div>
      )}
      
      <div className="flex items-center gap-6 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold text-yoru-text-muted hover:text-white transition-colors">
          <MessageCircle className="w-4 h-4" /> {post.commentCount || 0}
        </div>
        
        <button 
          onClick={handleReact} 
          className={clsx("flex items-center gap-2 text-xs font-bold transition-colors", post.reactions?.[currentUser?.uid] ? "text-rose-400" : "text-yoru-text-muted hover:text-rose-400")}
        >
          <Heart className={clsx("w-4 h-4", post.reactions?.[currentUser?.uid] && "fill-current")} /> {Object.keys(post.reactions || {}).length}
        </button>
      </div>
    </div>
  );
};
