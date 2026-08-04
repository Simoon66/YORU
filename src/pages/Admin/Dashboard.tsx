import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Film, ListVideo, Users, Activity } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({ anime: 0, episodes: 0, users: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const animeCount = await getCountFromServer(collection(db, 'anime'));
        const epsCount = await getCountFromServer(collection(db, 'episodes'));
        setStats({
          anime: animeCount.data().count,
          episodes: epsCount.data().count,
          users: 1 // mock
        });
      } catch (e) {
        console.error(e);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Anime', value: stats.anime, icon: Film, color: 'text-blue-500' },
    { title: 'Total Episodes', value: stats.episodes, icon: ListVideo, color: 'text-purple-500' },
    { title: 'Active Users', value: stats.users, icon: Users, color: 'text-green-500' },
    { title: 'System Status', value: 'Online', icon: Activity, color: 'text-yoru-accent' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <div key={c.title} className="bg-yoru-surface border border-yoru-border p-6 flex items-center gap-4">
            <div className={`p-4 bg-yoru-surface-elevated rounded-full ${c.color}`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-yoru-text-muted">{c.title}</div>
              <div className="text-2xl font-bold text-white">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
