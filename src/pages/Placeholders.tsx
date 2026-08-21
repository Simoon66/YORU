import React from 'react';
import { Download, Settings } from 'lucide-react';

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

