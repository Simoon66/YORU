import React from 'react';
import { Download, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/firebase';
import { Button } from '../components/ui/Button';

export const DownloadsPage = () => (
  <div className="min-h-screen bg-yoru-bg pt-24 pb-32 px-4 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 rounded-full bg-yoru-surface-elevated flex items-center justify-center mb-6 border border-yoru-border">
       <Download className="w-10 h-10 text-yoru-text-muted" />
    </div>
    <h1 className="text-2xl font-bold text-white tracking-tight uppercase mb-2">Downloads</h1>
    <p className="text-yoru-text-muted max-w-sm">Downloaded episodes will appear here for offline viewing. This feature is coming soon.</p>
  </div>
);

export const SettingsPage = () => (
  <div className="min-h-screen bg-yoru-bg pt-24 pb-32 px-4 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 rounded-full bg-yoru-surface-elevated flex items-center justify-center mb-6 border border-yoru-border">
       <Settings className="w-10 h-10 text-yoru-text-muted" />
    </div>
    <h1 className="text-2xl font-bold text-white tracking-tight uppercase mb-2">Settings</h1>
    <p className="text-yoru-text-muted max-w-sm">Application preferences and playback settings will be available here soon.</p>
  </div>
);

export const ProfilePage = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-yoru-bg pt-24 pb-32 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase mb-2">Profile</h1>
        <p className="text-yoru-text-muted max-w-sm">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yoru-bg pt-24 pb-32 px-4 max-w-md mx-auto flex flex-col">
      <h1 className="text-2xl font-bold text-white tracking-tight uppercase mb-8">Profile</h1>
      
      <div className="bg-yoru-surface border border-yoru-border p-6 text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 border-yoru-accent">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
              <User className="w-10 h-10 text-yoru-text-muted" />
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{user.displayName || 'Anime Fan'}</h2>
        <p className="text-sm text-yoru-text-muted mb-6">{user.email}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-yoru-bg p-4 border border-yoru-border">
             <div className="text-xl font-bold text-yoru-accent">0</div>
             <div className="text-xs uppercase tracking-widest text-yoru-text-muted mt-1">Episodes Watched</div>
          </div>
          <div className="bg-yoru-bg p-4 border border-yoru-border">
             <div className="text-xl font-bold text-yoru-accent">0</div>
             <div className="text-xs uppercase tracking-widest text-yoru-text-muted mt-1">Bookmarked</div>
          </div>
        </div>

        <Button onClick={logout} variant="secondary" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
};
