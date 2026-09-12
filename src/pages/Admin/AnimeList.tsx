import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../../types';
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, ArrowUpDown, Filter, ShieldAlert } from 'lucide-react';
import { is18PlusAnime } from '../../lib/utils';
import { cn } from '../../lib/utils';

export const AnimeList = () => {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'banned'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Custom Delete Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAnime = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'anime'));
      setAnimes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Anime)));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnime();
  }, []);

  const togglePublish = async (anime: Anime) => {
    try {
      await updateDoc(doc(db, 'anime', anime.id), { published: !anime.published });
      setAnimes(animes.map(a => a.id === anime.id ? { ...a, published: !anime.published } : a));
    } catch (e) {
      console.error(e);
    }
  };
  
  const toggleBan = async (anime: Anime) => {
    try {
      await updateDoc(doc(db, 'anime', anime.id), { isBanned: !anime.isBanned });
      setAnimes(animes.map(a => a.id === anime.id ? { ...a, isBanned: !anime.isBanned } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'anime', deleteConfirmId));
      setAnimes(animes.filter(a => a.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteConfirmId);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
    setIsDeleting(false);
  };

  const handleBulkAction = async (action: 'publish' | 'draft' | 'ban' | 'unban' | 'delete') => {
    if (selectedIds.size === 0) return;
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} anime?`)) return;
    }
    
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      Array.from(selectedIds).forEach((id: string) => {
        const ref = doc(db, 'anime', id);
        if (action === 'delete') {
          batch.delete(ref);
        } else if (action === 'publish') {
          batch.update(ref, { published: true });
        } else if (action === 'draft') {
          batch.update(ref, { published: false });
        } else if (action === 'ban') {
          batch.update(ref, { isBanned: true });
        } else if (action === 'unban') {
          batch.update(ref, { isBanned: false });
        }
      });
      
      await batch.commit();
      
      setAnimes(prev => {
        if (action === 'delete') {
          return prev.filter(a => !selectedIds.has(a.id));
        }
        return prev.map(a => {
          if (selectedIds.has(a.id)) {
            if (action === 'publish') return { ...a, published: true };
            if (action === 'draft') return { ...a, published: false };
            if (action === 'ban') return { ...a, isBanned: true };
            if (action === 'unban') return { ...a, isBanned: false };
          }
          return a;
        });
      });
      
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const filteredAndSorted = useMemo(() => {
    let result = animes;
    
    // Tab filter
    if (activeTab === 'published') result = result.filter(a => a.published && !a.isBanned);
    if (activeTab === 'drafts') result = result.filter(a => !a.published && !a.isBanned);
    if (activeTab === 'banned') result = result.filter(a => a.isBanned);

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.title?.toLowerCase().includes(q) || a.slug?.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'az': return (a.title || '').localeCompare(b.title || '');
        case 'za': return (b.title || '').localeCompare(a.title || '');
        default: return 0;
      }
    });

    return result;
  }, [animes, activeTab, search, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Anime Library <span className="bg-yoru-surface border border-yoru-border text-xs px-2 py-0.5 rounded-full text-yoru-text-muted">{filteredAndSorted.length}</span>
          </h1>
          <p className="text-sm text-yoru-text-muted mt-1">Manage and organize your anime collection.</p>
        </div>
        <Link 
          to="/admin/anime/new" 
          className="flex items-center gap-2 bg-yoru-accent hover:bg-yoru-accent/90 text-yoru-bg px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors rounded-lg shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Anime
        </Link>
      </div>

      <div className="bg-yoru-surface border border-yoru-border rounded-xl shadow-lg relative">
        <div className="p-4 border-b border-yoru-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-yoru-surface-elevated/30 sticky top-0 z-20 rounded-t-xl backdrop-blur-sm">
          
          {/* Tabs */}
          <div className="flex bg-yoru-bg/50 p-1 rounded-lg border border-yoru-border/50 self-start md:self-auto overflow-x-auto w-full md:w-auto">
            {(['all', 'published', 'drafts', 'banned'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-yoru-surface-elevated text-white shadow-sm border border-white/5" 
                    : "text-yoru-text-muted hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <ArrowUpDown className="w-4 h-4 text-yoru-text-muted hidden sm:block" />
              <select 
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="w-full sm:w-auto bg-yoru-bg border border-yoru-border px-3 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-yoru-accent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yoru-text-muted" />
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-yoru-bg border border-yoru-border pl-9 pr-4 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-yoru-accent placeholder-zinc-600"
              />
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-yoru-accent/10 border-b border-yoru-accent/20 px-4 py-3 flex items-center justify-between sticky top-[69px] md:top-[73px] z-20 backdrop-blur-sm">
            <span className="text-sm font-bold text-yoru-accent">{selectedIds.size} Selected</span>
            <div className="flex items-center gap-2 overflow-x-auto">
              <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors whitespace-nowrap">
                Publish
              </button>
              <button onClick={() => handleBulkAction('draft')} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white rounded transition-colors whitespace-nowrap">
                Draft
              </button>
              <button onClick={() => handleBulkAction('ban')} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded transition-colors whitespace-nowrap">
                Ban
              </button>
              <button onClick={() => handleBulkAction('unban')} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors whitespace-nowrap">
                Unban
              </button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors whitespace-nowrap ml-2">
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px] rounded-b-xl">
          <table className="w-full text-left text-sm text-yoru-text">
            <thead className={cn("bg-yoru-surface/90 backdrop-blur-sm text-xs uppercase tracking-widest text-yoru-text-muted border-b border-yoru-border sticky z-10", selectedIds.size > 0 ? "top-[118px] md:top-[122px]" : "top-[69px] md:top-[73px]")}>
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input type="checkbox" checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded bg-yoru-bg border-yoru-border text-yoru-accent focus:ring-yoru-accent" />
                </th>
                <th className="px-4 py-4 font-bold">Anime</th>
                <th className="px-4 py-4 font-bold hidden sm:table-cell">Status</th>
                <th className="px-4 py-4 font-bold hidden md:table-cell">Eps</th>
                <th className="px-4 py-4 font-bold">State</th>
                <th className="px-4 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yoru-border/50 relative z-0">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-yoru-accent animate-pulse">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading library...
                    </div>
                  </td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-yoru-text-muted">
                      <Filter className="w-8 h-8 mb-3 opacity-20" />
                      <p>No anime found matching your criteria.</p>
                      <button onClick={() => { setSearch(''); setActiveTab('all'); }} className="mt-2 text-xs text-yoru-accent hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSorted.map(anime => (
                <tr key={anime.id} className={cn("hover:bg-yoru-surface-elevated/30 transition-colors group", selectedIds.has(anime.id) && "bg-yoru-surface-elevated/20")}>
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" checked={selectedIds.has(anime.id)} onChange={() => toggleSelect(anime.id)} className="w-4 h-4 rounded bg-yoru-bg border-yoru-border text-yoru-accent focus:ring-yoru-accent" />
                  </td>
                  <td className="px-4 sm:px-4 py-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative shrink-0 hidden sm:block">
                        <img src={anime.poster} alt="" className="w-10 h-14 object-cover border border-yoru-border rounded bg-yoru-bg" loading="lazy" />
                        {is18PlusAnime(anime) && (
                          <span className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-red-600 text-white text-[8px] font-black rounded shadow">
                            18+
                          </span>
                        )}
                        {anime.isBanned && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                            <ShieldAlert className="w-4 h-4 text-orange-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 truncate">
                          <span className={cn("truncate", anime.isBanned && "text-yoru-text-muted line-through")}>{anime.title}</span>
                          {is18PlusAnime(anime) && (
                            <span className="px-1.5 py-0.2 rounded bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider shrink-0 sm:hidden">
                              18+
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-yoru-text-muted mt-0.5 truncate">{anime.format} • {anime.season || 'Unknown Season'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                      {anime.status || 'Finished'}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-zinc-400 font-mono text-xs">{anime.totalEpisodes || '-'}</td>
                  <td className="px-4 py-4">
                    {anime.isBanned ? (
                       <button 
                         onClick={() => toggleBan(anime)}
                         className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                       >
                         <ShieldAlert className="w-3.5 h-3.5" />
                         <span className="hidden sm:inline">Banned</span>
                       </button>
                    ) : (
                      <button 
                        onClick={() => togglePublish(anime)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all",
                          anime.published 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20" 
                            : "bg-white/5 text-yoru-text-muted border border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {anime.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{anime.published ? 'Published' : 'Draft'}</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap space-x-1 sm:space-x-2">
                    <Link to={`/admin/anime/${anime.id}/episodes`} className="inline-flex p-2 text-yoru-text-muted hover:text-white hover:bg-white/10 rounded transition-colors" title="Manage Episodes">
                      <Plus className="w-4 h-4" />
                    </Link>
                    <Link to={`/admin/anime/${anime.id}/edit`} className="inline-flex p-2 text-yoru-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Edit Anime">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setDeleteConfirmId(anime.id)} className="inline-flex p-2 text-yoru-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Delete Anime">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-yoru-surface border border-yoru-border rounded-xl overflow-hidden max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Anime</h3>
            <p className="text-sm text-yoru-text-muted mb-6">
              Are you sure you want to delete this anime? This action cannot be undone and will not automatically delete its episodes.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-yoru-error hover:bg-yoru-error/90 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors rounded flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
