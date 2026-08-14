import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, logout } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Button } from '../components/ui/Button';
import { User, LogOut, Settings, Trash2, Camera, Shield, Award } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();
  const [totalWatched, setTotalWatched] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhotoUrl(user.photoURL || '');
      
      const fetchStats = async () => {
        try {
          const q = query(collection(db, 'watchProgress'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          let count = 0;
          snap.forEach(d => {
            const data = d.data();
            if (data.watchedEpisodeIds) count += data.watchedEpisodeIds.length;
          });
          setTotalWatched(count);
        } catch (e) {
          console.error("Failed to fetch stats", e);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-yoru-bg pt-24 flex justify-center text-white">
        Please login to view your profile.
      </div>
    );
  }

  const getRank = (eps: number) => {
    if (eps >= 500) return { title: 'Anime God', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' };
    if (eps >= 100) return { title: 'Veteran Otaku', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' };
    if (eps >= 50) return { title: 'Experienced Weeb', color: 'text-yoru-accent', bg: 'bg-yoru-accent/20', border: 'border-yoru-accent/50' };
    if (eps >= 10) return { title: 'Casual Watcher', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' };
    return { title: 'Novice', color: 'text-white/70', bg: 'bg-white/10', border: 'border-white/20' };
  };

  const rank = getRank(totalWatched);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName: name,
        photoURL: photoUrl
      });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: photoUrl
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire watch history? This cannot be undone.")) return;
    try {
      const q = query(collection(db, 'watchProgress'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      localStorage.removeItem('yoru_watch_history');
      setTotalWatched(0);
      alert("Watch history cleared successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to clear history.");
    }
  };

  return (
    <div className="min-h-screen bg-yoru-bg pt-[80px] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-8">
        
        {/* Profile Header */}
        <div className="glass-panel rounded-2xl p-6 md:p-10 border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yoru-accent/10 to-transparent -z-10" />
          
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-yoru-surface-elevated shadow-2xl relative z-10 bg-black">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
                  <User className="w-12 h-12 text-yoru-text-muted" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black tracking-widest uppercase text-white mb-2">{user.displayName || 'Anonymous'}</h1>
            <p className="text-sm font-medium text-yoru-text-muted mb-4">{user.email}</p>
            
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${rank.bg} ${rank.border} ${rank.color} text-xs font-bold uppercase tracking-widest shadow-lg`}>
              <Award className="w-4 h-4" />
              {rank.title}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} className="gap-2">
               <Settings className="w-4 h-4" /> Edit Profile
             </Button>
             <Button variant="secondary" onClick={logout} className="gap-2 bg-white/5 hover:bg-yoru-warning/20 hover:text-yoru-warning border-transparent hover:border-yoru-warning/30 transition-colors">
               <LogOut className="w-4 h-4" /> Logout
             </Button>
          </div>
        </div>

        {isEditing && (
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-yoru-accent mb-6">Update Profile</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-[#030407] border border-white/5 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-yoru-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Avatar Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={photoUrl} 
                    onChange={e => setPhotoUrl(e.target.value)} 
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-[#030407] border border-white/5 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-yoru-accent/50"
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted mb-2">Total Episodes Watched</span>
            <div className="text-5xl font-black text-white">{loading ? '-' : totalWatched}</div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-start gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-warning mb-2 block">Danger Zone</span>
              <p className="text-xs text-yoru-text-muted font-medium">Clear all watch history including the "Continue Watching" list. This action is irreversible.</p>
            </div>
            <Button onClick={handleClearHistory} variant="secondary" className="gap-2 bg-yoru-warning/10 text-yoru-warning border-yoru-warning/30 hover:bg-yoru-warning hover:text-[#030407]">
              <Trash2 className="w-4 h-4" /> Clear History
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
