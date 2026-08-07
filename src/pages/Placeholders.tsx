import React from 'react';
import { Download, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/firebase';
import { Button } from '../components/ui/Button';

export const DownloadsPage = () => (
  <div className="min-h-screen bg-yoru-bg pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
       <Download className="w-8 h-8 text-white/50" />
    </div>
    <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Downloads</h1>
    <p className="text-sm font-medium text-yoru-text-muted max-w-sm">Downloaded episodes will appear here for offline viewing. This feature is coming soon.</p>
  </div>
);

export const SettingsPage = () => (
  <div className="min-h-screen bg-yoru-bg pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
       <Settings className="w-8 h-8 text-white/50" />
    </div>
    <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Settings</h1>
    <p className="text-sm font-medium text-yoru-text-muted max-w-sm">Application preferences and playback settings will be available here soon.</p>
  </div>
);

export const ProfilePage = () => {
  const { user, profile } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen bg-yoru-bg pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Profile</h1>
        <p className="text-sm font-medium text-yoru-text-muted max-w-sm">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yoru-bg pt-32 pb-24 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-8 text-center mt-12 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yoru-accent/20 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden border-4 border-yoru-bg shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
              <User className="w-10 h-10 text-yoru-text-muted" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1 relative z-10">{user.displayName || 'Anime Fan'}</h2>
        <p className="text-sm font-medium text-yoru-text-muted mb-8 relative z-10">{user.email}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-white/5 p-6 rounded-xl border border-white/5">
             <div className="text-3xl font-black text-white">0</div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mt-2">Episodes Watched</div>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/5">
             <div className="text-3xl font-black text-white">0</div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted mt-2">Bookmarked</div>
          </div>
        </div>
        
        <Button onClick={logout} variant="danger" size="lg" className="w-full relative z-10">
          Sign Out
        </Button>
      </div>
    </div>
  );
};
