import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Anime, Episode, Season } from '../../types';
import { collection, doc, getDoc, getDocs, setDoc, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';

export const EpisodeManager = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<string>('');
  
  const [episodes, setEpisodes] = useState<Partial<Episode>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const snap = await getDoc(doc(db, 'anime', id!));
      if (snap.exists()) {
        const data = snap.data() as Anime;
        setAnime(data);
        setSeasons(data.seasons || [{ id: 's1', name: 'Season 1', order: 1 }]);
        setActiveSeason(data.seasons?.[0]?.id || 's1');
      }
      
      const epQ = query(collection(db, 'episodes'), where('animeId', '==', id));
      const epSnap = await getDocs(epQ);
      const eps = epSnap.docs.map(d => ({ ...d.data(), id: d.id } as Episode));
      setEpisodes(eps.sort((a,b) => a.episodeNumber - b.episodeNumber));
      setIsLoading(false);
    }
    load();
  }, [id]);

  const activeEpisodes = episodes.filter(e => e.seasonId === activeSeason);

  const addEpisodeRow = () => {
    const nextNum = activeEpisodes.length > 0 ? Math.max(...activeEpisodes.map(e => e.episodeNumber!)) + 1 : 1;
    setEpisodes([...episodes, {
      id: `temp_${Date.now()}`,
      animeId: id,
      seasonId: activeSeason,
      episodeNumber: nextNum,
      title: `Episode ${nextNum}`,
      embedLink: '',
      serverName: 'HD-1',
      thumbnailUrl: anime?.backdrop || '',
      isFiller: false,
      published: true
    }]);
  };

  const handleAddSeason = () => {
    const nextOrder = seasons.length > 0 ? Math.max(...seasons.map(s => s.order)) + 1 : 1;
    const newSeason: Season = {
      id: `s_${Date.now()}`,
      name: `Season ${nextOrder}`,
      order: nextOrder
    };
    setSeasons([...seasons, newSeason]);
    setActiveSeason(newSeason.id);
  };

  const handleUpdateSeasonName = (name: string) => {
    setSeasons(seasons.map(s => s.id === activeSeason ? { ...s, name } : s));
  };

  const confirmRemoveSeason = () => {
    if (!seasonToDelete) return;
    const updated = seasons.filter(s => s.id !== seasonToDelete);
    setSeasons(updated);
    if (activeSeason === seasonToDelete) {
      setActiveSeason(updated.length > 0 ? updated[0].id : '');
    }
    setSeasonToDelete(null);
  };

  const updateEpisode = (epId: string, field: keyof Episode, value: any) => {
    setEpisodes(episodes.map(e => e.id === epId ? { ...e, [field]: value } : e));
  };

  const removeEpisode = (epId: string) => {
    setEpisodes(episodes.filter(e => e.id !== epId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Save episodes
      episodes.forEach(ep => {
        const epRef = ep.id?.startsWith('temp_') ? doc(collection(db, 'episodes')) : doc(db, 'episodes', ep.id!);
        batch.set(epRef, {
          ...ep,
          id: epRef.id,
          createdAt: ep.createdAt || Date.now(),
          animeId: id
        }, { merge: true });
      });
      
      // Update anime's seasons
      batch.update(doc(db, 'anime', id!), {
        seasons: seasons
      });
      
      await batch.commit();
      alert('Saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Error saving episodes');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (!anime) return <div className="text-white">Anime not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/anime')} className="p-2 text-yoru-text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manage Episodes: {anime.title}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-yoru-bg px-8 py-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
        </button>
      </div>

      <div className="bg-yoru-surface border border-yoru-border p-4 flex gap-2 overflow-x-auto items-center">
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSeason(s.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border ${activeSeason === s.id ? 'bg-yoru-accent/10 text-yoru-accent border-yoru-accent/50' : 'bg-yoru-bg border-yoru-border text-yoru-text-muted hover:text-white'}`}
          >
            {s.name}
          </button>
        ))}
        <button 
          onClick={handleAddSeason}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border bg-yoru-bg border-yoru-border text-yoru-text-muted hover:text-yoru-accent hover:border-yoru-accent/50 flex items-center gap-1 ml-2"
        >
          <Plus className="w-3 h-3" /> Add Season
        </button>
      </div>

      <div className="bg-yoru-surface border border-yoru-border">
        {activeSeason && (
          <div className="p-4 border-b border-yoru-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-yoru-surface-elevated/30">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted whitespace-nowrap">Season Name</label>
              <input 
                type="text" 
                value={seasons.find(s => s.id === activeSeason)?.name || ''} 
                onChange={(e) => handleUpdateSeasonName(e.target.value)}
                className="bg-yoru-bg border border-yoru-border px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yoru-accent w-48 sm:w-64"
                placeholder="e.g. Season 1"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSeasonToDelete(activeSeason)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-error hover:text-yoru-error/80 transition-colors">
                <Trash2 className="w-4 h-4" /> Remove Season
              </button>
              <div className="w-px h-4 bg-yoru-border mx-1"></div>
              <button onClick={addEpisodeRow} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-accent hover:text-yoru-accent/80 transition-colors">
                <Plus className="w-4 h-4" /> Add Episode Row
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-yoru-text min-w-[800px]">
            <thead className="text-xs uppercase tracking-widest text-yoru-text-muted">
              <tr>
                <th className="pb-4 font-bold w-16">Ep #</th>
                <th className="pb-4 font-bold w-48">Title</th>
                <th className="pb-4 font-bold">Embed Link</th>
                <th className="pb-4 font-bold w-32">Server</th>
                <th className="pb-4 font-bold w-20 text-center">Filler</th>
                <th className="pb-4 font-bold w-16 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {activeEpisodes.map((ep, idx) => (
                <tr key={ep.id} className="group">
                  <td className="py-2 pr-2">
                    <input 
                      type="number" 
                      value={ep.episodeNumber}
                      onChange={e => updateEpisode(ep.id!, 'episodeNumber', parseInt(e.target.value) || 0)}
                      className="w-full bg-yoru-bg border border-yoru-border px-3 py-2 text-white focus:outline-none focus:border-yoru-accent text-center"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input 
                      type="text" 
                      value={ep.title}
                      onChange={e => updateEpisode(ep.id!, 'title', e.target.value)}
                      className="w-full bg-yoru-bg border border-yoru-border px-3 py-2 text-white focus:outline-none focus:border-yoru-accent"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input 
                      type="text" 
                      value={ep.embedLink}
                      placeholder="https://..."
                      onChange={e => updateEpisode(ep.id!, 'embedLink', e.target.value)}
                      className="w-full bg-yoru-bg border border-yoru-border px-3 py-2 text-white focus:outline-none focus:border-yoru-accent"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input 
                      type="text" 
                      value={ep.serverName}
                      onChange={e => updateEpisode(ep.id!, 'serverName', e.target.value)}
                      className="w-full bg-yoru-bg border border-yoru-border px-3 py-2 text-white focus:outline-none focus:border-yoru-accent"
                    />
                  </td>
                  <td className="py-2 pr-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={ep.isFiller}
                      onChange={e => updateEpisode(ep.id!, 'isFiller', e.target.checked)}
                      className="w-4 h-4 bg-yoru-bg border-yoru-border text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeEpisode(ep.id!)} className="p-2 text-yoru-text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeEpisodes.length === 0 && (
            <div className="text-center py-8 text-yoru-text-muted">No episodes in this season. Click "Add Episode Row" to start.</div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {seasonToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-yoru-surface border border-yoru-border max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Season</h3>
            <p className="text-sm text-yoru-text-muted mb-6">
              Are you sure you want to delete this season? Episodes inside it will be orphaned unless moved.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSeasonToDelete(null)}
                className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveSeason}
                className="bg-yoru-error hover:bg-yoru-error/90 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
