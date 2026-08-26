import React from 'react';
import { UserProfile } from '../types';
import { Shield, ShieldCheck, Crown, Star } from 'lucide-react';
import clsx from 'clsx';

export const UserBadgeDisplay = ({ user }: { user?: UserProfile }) => {
  if (!user) return null;
  
  // Custom Badge logic - based on activeBadgeId or role
  const activeBadge = user.badges?.find(b => b.id === user.activeBadgeId) || user.badges?.[0];
  
  return (
    <div className="flex items-center gap-1.5">
      {/* Role Badge */}
      {user.role === 'admin' && <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Crown className="w-3 h-3"/> Admin</span>}
      {user.role === 'moderator' && <span className="bg-sky-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Mod</span>}
      {user.role === 'staff' && <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Shield className="w-3 h-3"/> Staff</span>}
      {user.role === 'special' && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Special</span>}
      
      {/* Visual Badge */}
      {activeBadge && (
        <span 
          className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/20 shadow-sm"
          style={{ backgroundColor: activeBadge.color || '#3b82f6', color: '#fff' }}
          title={activeBadge.title}
        >
          {activeBadge.icon && <span className="text-[10px] leading-none">{activeBadge.icon}</span>}
          {activeBadge.title}
        </span>
      )}
    </div>
  );
};
