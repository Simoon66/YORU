import React, { useEffect, useState } from 'react';
import { getTopWatchers, getTopCommentators } from '../../lib/community';
import { UserProfile } from '../../types';
import { Crown, Trophy, PlayCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { UserBadgeDisplay } from '../../components/UserBadgeDisplay';

export const Leaderboard = () => {
  const [topWatchers, setTopWatchers] = useState<UserProfile[]>([]);
  const [topCommenters, setTopCommenters] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const watchers = await getTopWatchers(10);
        const commenters = await getTopCommentators(10);
        setTopWatchers(watchers);
        setTopCommenters(commenters);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboards();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#030407] flex justify-center pt-32"><Loader2 className="w-8 h-8 text-yoru-accent animate-spin" /></div>;
  }

  const renderList = (users: UserProfile[], type: 'watch' | 'comment') => {
    if (users.length === 0) {
      return <div className="text-center py-8 text-xs text-yoru-text-muted">No data available yet.</div>;
    }

    return (
      <div className="space-y-2.5">
        {users.map((user, idx) => {
          let rankClass = "bg-white/5 border-white/10 text-white/50";
          let icon = <span className="font-black text-sm">{idx + 1}</span>;
          
          if (idx === 0) {
            rankClass = "bg-amber-500/10 border-amber-500/30 text-amber-400";
            icon = <Trophy className="w-4 h-4 text-amber-400" />;
          } else if (idx === 1) {
            rankClass = "bg-slate-300/10 border-slate-300/30 text-slate-300";
            icon = <Trophy className="w-4 h-4 text-slate-300" />;
          } else if (idx === 2) {
            rankClass = "bg-amber-700/10 border-amber-700/30 text-amber-600";
            icon = <Trophy className="w-4 h-4 text-amber-600" />;
          }

          return (
            <Link 
              key={user.uid} 
              to={`/user/${user.username || user.uid}`}
              className={clsx(
                "flex items-center gap-4 p-3 rounded-xl border transition-colors hover:bg-white/10",
                rankClass
              )}
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black/50 shrink-0">
                {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                <div className="font-bold text-white truncate text-sm w-full">
                  {user.username || user.displayName || 'Unknown'}
                </div>
                <UserBadgeDisplay user={user} />
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-black text-white">
                  {type === 'watch' ? user.watchCount : user.commentCount}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-white/50">
                  {type === 'watch' ? 'Episodes' : 'Comments'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030407] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-widest text-white flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" /> Leaderboard
          </h1>
          <p className="text-sm text-yoru-text-muted">Top members of the community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          <div className="bg-[#0A0B0E] rounded-3xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yoru-accent/5 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none" />
            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <PlayCircle className="w-5 h-5 text-yoru-accent" /> Top Watchers
            </h2>
            {renderList(topWatchers, 'watch')}
          </div>

          <div className="bg-[#0A0B0E] rounded-3xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] -ml-10 -mt-10 pointer-events-none" />
            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <MessageCircle className="w-5 h-5 text-rose-400" /> Top Commentators
            </h2>
            {renderList(topCommenters, 'comment')}
          </div>

        </div>

      </div>
    </div>
  );
};
