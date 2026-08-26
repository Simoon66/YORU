import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Film, ListVideo, Users, Activity, History } from 'lucide-react';
import { AbyssDomainManager } from '../../components/admin/AbyssDomainManager';
import { useAuth } from '../../contexts/AuthContext';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ anime: 0, episodes: 0, users: 0 });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const animeCount = await getCountFromServer(collection(db, 'anime'));
        const epsCount = await getCountFromServer(collection(db, 'episodes'));
        const usersCount = await getCountFromServer(collection(db, 'users'));
        setStats({
          anime: animeCount.data().count,
          episodes: epsCount.data().count,
          users: usersCount.data().count
        });
      } catch (e) {
        console.error(e);
      }
    }
    
    async function fetchAuditLogs() {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10));
        const snap = await getDocs(q);
        setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Error fetching audit logs:', e);
      }
    }

    fetchStats();
    if (profile?.role === 'admin' || profile?.role === 'moderator') {
      fetchAuditLogs();
    }
  }, [profile]);

  const cards = [
    { title: 'Total Anime', value: stats.anime, icon: Film, color: 'text-blue-500' },
    { title: 'Total Episodes', value: stats.episodes, icon: ListVideo, color: 'text-purple-500' },
    { title: 'Active Users', value: stats.users, icon: Users, color: 'text-green-500' },
    { title: 'System Status', value: 'Online', icon: Activity, color: 'text-yoru-accent' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-xs text-yoru-text-muted mt-1">Platform management and server configuration</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <div key={c.title} className="bg-yoru-surface border border-yoru-border p-6 flex items-center gap-4 rounded-2xl shadow-xl">
            <div className={`p-4 bg-yoru-surface-elevated rounded-full ${c.color}`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">{c.title}</div>
              <div className="text-2xl font-black text-white mt-0.5">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-yoru-accent" />
            <h2 className="text-lg font-bold">Recent Role Changes</h2>
          </div>
          <div className="bg-yoru-surface border border-yoru-border rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.length > 0 ? (
              auditLogs.map(log => (
                <div key={log.id} className="text-sm bg-yoru-surface-elevated p-3 rounded-lg border border-white/5">
                  <div className="text-white/80 font-medium">
                    <span className="text-white font-bold">{log.performedByEmail || 'Unknown'}</span> changed role for <span className="text-white font-bold">{log.targetUserEmail || 'Unknown'}</span>
                  </div>
                  <div className="text-xs text-yoru-text-muted mt-1 flex items-center gap-2">
                    <span className="line-through">{log.oldRole}</span> 
                    <span>→</span> 
                    <span className="text-yoru-accent font-bold uppercase tracking-wider">{log.newRole}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-yoru-text-muted text-center py-8">No recent role changes</div>
            )}
          </div>
        </div>

        {/* Global Abyss Domain Manager & Replacer - Admin Only */}
        {profile?.role === 'admin' && (
          <div>
            <AbyssDomainManager />
          </div>
        )}
      </div>
    </div>
  );
};
