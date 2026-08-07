import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../../types';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';

export const AnimeList = () => {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'anime', deleteConfirmId));
      setAnimes(animes.filter(a => a.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
    }
    setIsDeleting(false);
  };

  const filtered = animes.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Anime Library</h1>
        <Link 
          to="/admin/anime/new" 
          className="flex items-center gap-2 bg-yoru-accent hover:bg-yoru-accent/90 text-yoru-bg px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Anime
        </Link>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-yoru-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yoru-text-muted" />
            <input 
              type="text" 
              placeholder="Search anime..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-yoru-surface-elevated border border-yoru-border pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-yoru-text">
            <thead className="bg-yoru-surface-elevated text-xs uppercase tracking-widest text-yoru-text-muted">
              <tr>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Eps</th>
                <th className="px-6 py-4 font-bold">State</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yoru-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-yoru-text-muted">No anime found.</td></tr>
              ) : filtered.map(anime => (
                <tr key={anime.id} className="hover:bg-yoru-surface-elevated/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={anime.poster} alt="" className="w-10 h-14 object-cover border border-yoru-border" />
                      <div>
                        <div className="font-bold text-white">{anime.title}</div>
                        <div className="text-xs text-yoru-text-muted">{anime.format} • {anime.season}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{anime.status}</td>
                  <td className="px-6 py-4">{anime.totalEpisodes}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => togglePublish(anime)}
                      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${anime.published ? 'text-green-500' : 'text-yoru-text-muted hover:text-white'}`}
                    >
                      {anime.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {anime.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link to={`/admin/anime/${anime.id}/episodes`} className="inline-flex p-2 text-yoru-text-muted hover:text-white hover:bg-white/10 transition-colors" title="Manage Episodes">
                      <Plus className="w-4 h-4" />
                    </Link>
                    <Link to={`/admin/anime/${anime.id}/edit`} className="inline-flex p-2 text-yoru-text-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Edit Anime">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setDeleteConfirmId(anime.id)} className="inline-flex p-2 text-yoru-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete Anime">
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
          <div className="glass-panel rounded-xl overflow-hidden max-w-sm w-full p-6 shadow-2xl">
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
                className="bg-yoru-error hover:bg-yoru-error/90 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
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
