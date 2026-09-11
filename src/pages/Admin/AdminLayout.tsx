import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Film, Plus, LogOut, DownloadCloud, Sparkles, Shield, Radio, RotateCw } from 'lucide-react';
import { Logo } from '../../components/Navigation';
import { isSuperAdmin } from '../../lib/admin';
import { useAnikotoAutoSync } from '../../hooks/useAnikotoAutoSync';

export const AdminLayout = () => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // Run 24x daily auto-sync silently in the background while authenticated admin is active
  useAnikotoAutoSync();

  if (loading) return <div className="min-h-screen bg-yoru-bg" />;
  
  // Note: Only users with profile role 'admin' or 'moderator' or super admin can access this
  const isSuper = isSuperAdmin(profile?.email);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator' && !isSuper)) {
    return <Navigate to="/" replace />;
  }

  const allNavItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Recent Anime Sync', path: '/admin/recent-sync', icon: RotateCw },
    { name: 'Spotlight Sliders', path: '/admin/spotlights', icon: Sparkles },
    { name: 'Anime Library', path: '/admin/anime', icon: Film },
    { name: 'Add Anime', path: '/admin/anime/new', icon: Plus },
    { name: 'Auto Import', path: '/admin/auto-import', icon: DownloadCloud },
    { name: 'Community', path: '/admin/community', icon: Shield },
  ];

  const navItems = (profile.role === 'admin' || isSuper)
    ? allNavItems 
    : allNavItems.filter(item => ['Dashboard', 'Community'].includes(item.name));

  return (
    <div className="min-h-screen bg-yoru-bg flex font-sans text-yoru-text">
      
      {/* Sidebar */}
      <aside className="w-64 bg-yoru-surface border-r border-yoru-border flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6">
          <Link to="/home">
            <Logo />
          </Link>
          <div className="mt-2 text-xs font-semibold text-yoru-accent tracking-widest uppercase">Admin Panel</div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
            return (
              <Link 
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${isActive ? 'bg-yoru-accent/10 text-yoru-accent' : 'text-yoru-text-muted hover:bg-yoru-surface-elevated hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-yoru-border">
          <Link to="/home" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-yoru-text-muted hover:bg-yoru-surface-elevated hover:text-white transition-colors text-sm font-medium">
             <LogOut className="w-5 h-5" /> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 overflow-y-auto">
         <Outlet />
      </main>

    </div>
  );
};
