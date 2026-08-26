import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { Users, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export const MembersDirectory = () => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        setMembers(snap.docs.map(d => d.data() as UserProfile));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => {
    const term = search.toLowerCase();
    return m.username?.toLowerCase().includes(term) || m.displayName?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-[#030407] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-yoru-accent" /> Members
            </h1>
            <p className="text-sm text-yoru-text-muted mt-1">Discover other community members</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yoru-accent transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-yoru-accent animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMembers.map(member => (
              <Link 
                key={member.uid} 
                to={`/user/${member.username || member.uid}`}
                className="bg-[#0A0B0E] border border-white/10 rounded-2xl p-4 hover:border-white/30 transition-colors flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-yoru-accent/50 transition-colors bg-black/50 shrink-0">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 m-3 text-white/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate group-hover:text-yoru-accent transition-colors">
                    {member.username || member.displayName || 'Unknown'}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-yoru-text-muted mt-0.5">
                    {member.role === 'admin' ? <span className="text-amber-500">Admin</span> : 
                     member.role === 'moderator' ? <span className="text-sky-500">Mod</span> : 
                     member.role === 'staff' ? <span className="text-yellow-500">Staff</span> :
                     member.role === 'special' ? <span className="text-rose-500">Special</span> : 'Member'}
                  </div>
                </div>
              </Link>
            ))}
            
            {filteredMembers.length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-yoru-text-muted">
                No members found matching your search.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
