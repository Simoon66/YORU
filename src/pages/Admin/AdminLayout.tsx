import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Film, Plus, LogOut, DownloadCloud, Sparkles, Shield, Radio, RotateCw, Flag, Menu, X } from 'lucide-react';
import { Logo } from '../../components/Navigation';
import { isSuperAdmin } from '../../lib/admin';
import { useAnikotoAutoSync } from '../../hooks/useAnikotoAutoSync';

export const AdminLayout = () => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: 'User Reports', path: '/admin/reports', icon: Flag },
    { name: 'Spotlight Sliders', path: '/admin/spotlights', icon: Sparkles },
    { name: 'Anime Library', path: '/admin/anime', icon: Film },
    { name: 'Add Anime', path: '/admin/anime/new', icon: Plus },
    { name: 'Auto Import', path: '/admin/auto-import', icon: DownloadCloud },
    { name: 'Community', path: '/admin/community', icon: Shield },
  ];

  const navItems = (profile.role === 'admin' || isSuper)
    ? allNavItems 
    : allNavItems.filter(item => ['Dashboard', 'Community', 'User Reports'].includes(item.name));

  return (
    <div className="min-h-screen bg-yoru-bg flex flex-col md:flex-row font-sans text-yoru-text">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-yoru-surface border-b border-yoru-border sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Link to="/home">
            <Logo />
          </Link>
          <span className="text-xs font-semibold text-yoru-accent tracking-widest uppercase">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-yoru-text-muted hover:text-white p-1"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        w-64 bg-yoru-surface border-r border-yoru-border flex flex-col fixed md:sticky top-0 h-[100dvh] z-10 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:block">
          <Link to="/home">
            <Logo />
          </Link>
          <div className="mt-2 text-xs font-semibold text-yoru-accent tracking-widest uppercase">Admin Panel</div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
            return (
              <Link 
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full md:w-auto">
         <Outlet />
      </main>

    </div>
  );
};
