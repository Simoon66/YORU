import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Anime, Season } from '../../types';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Save, Search, DownloadCloud, Loader2 } from 'lucide-react';

const ANILIST_QUERY = `
query ($id: Int, $search: String) {
  Media (id: $id, search: $search, type: ANIME) {
    id
    title { english romaji native }
    format
    episodes
    duration
    status
    startDate { year month day }
    endDate { year month day }
    season
    seasonYear
    averageScore
    studios(isMain: true) { nodes { name } }
    genres
    coverImage { extraLarge }
    bannerImage
    description
  }
}
`;

export const AnimeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  
  // AniList fetch state
  const [fetchQuery, setFetchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [formData, setFormData] = useState<Partial<Anime>>({
    title: '',
    nativeTitle: '',
    aniListId: '',
    slug: '',
    format: 'TV',
    totalEpisodes: 0,
    episodeDuration: '',
    status: 'FINISHED',
    startDate: '',
    endDate: '',
    season: '',
    averageScore: '',
    studios: '',
    genres: [],
    poster: '',
    backdrop: '',
    synopsis: '',
    seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
    published: false,
  });

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'anime', id)).then(snap => {
        if (snap.exists()) {
          setFormData(snap.data() as Anime);
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleFetchAniList = async () => {
    if (!fetchQuery.trim()) return;
    setIsFetching(true);
    setFetchError('');
    
    try {
      const variables = /^\d+$/.test(fetchQuery) ? { id: parseInt(fetchQuery) } : { search: fetchQuery };
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: ANILIST_QUERY, variables })
      });
      
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      
      const media = json.data.Media;
      const title = media.title.english || media.title.romaji || '';
      
      const formatMonth = (m?: number) => m ? m.toString().padStart(2, '0') : '';
      const formatDay = (d?: number) => d ? d.toString().padStart(2, '0') : '';
      const start = media.startDate.year ? `${media.startDate.year}-${formatMonth(media.startDate.month)}-${formatDay(media.startDate.day)}` : '';
      const end = media.endDate.year ? `${media.endDate.year}-${formatMonth(media.endDate.month)}-${formatDay(media.endDate.day)}` : '';

      setFormData(prev => ({
        ...prev,
        title,
        nativeTitle: media.title.native || '',
        aniListId: media.id.toString(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        format: media.format || 'TV',
        totalEpisodes: media.episodes || 0,
        episodeDuration: media.duration ? `${media.duration} mins` : '',
        status: media.status || 'FINISHED',
        startDate: start,
        endDate: end,
        season: media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : '',
        averageScore: media.averageScore ? `${media.averageScore}%` : '',
        studios: media.studios?.nodes?.[0]?.name || '',
        genres: media.genres || [],
        poster: media.coverImage?.extraLarge || '',
        backdrop: media.bannerImage || '',
        synopsis: media.description?.replace(/<br><br>/g, '\n').replace(/<[^>]*>?/gm, '') || ''
      }));
    } catch (e: any) {
      setFetchError(e.message || 'Failed to fetch');
    }
    setIsFetching(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const animeRef = id ? doc(db, 'anime', id) : doc(collection(db, 'anime'));
      const now = Date.now();
      const finalData = {
        ...formData,
        id: animeRef.id,
        updatedAt: now,
        createdAt: formData.createdAt || now
      };
      
      if (id) {
        await updateDoc(animeRef, finalData);
      } else {
        await setDoc(animeRef, finalData);
      }
      navigate('/admin/anime');
    } catch (e) {
      console.error(e);
      alert('Error saving anime');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-yoru-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">{id ? 'Edit Anime' : 'Add Anime'}</h1>
      </div>

      {!id && (
        <div className="bg-yoru-surface border border-yoru-border p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-yoru-accent" /> Auto-Import from AniList
          </h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter AniList ID or Exact Title..." 
              value={fetchQuery}
              onChange={e => setFetchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetchAniList()}
              className="flex-1 bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
            <button 
              onClick={handleFetchAniList}
              disabled={isFetching}
              className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-white px-6 py-2 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Fetch
            </button>
          </div>
          {fetchError && <p className="text-red-400 text-xs">{fetchError}</p>}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-yoru-surface border border-yoru-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Title</label>
            <input 
              required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Native Title</label>
            <input 
              type="text" value={formData.nativeTitle} onChange={e => setFormData({...formData, nativeTitle: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">URL Slug</label>
            <input 
              required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">AniList ID</label>
            <input 
              type="text" value={formData.aniListId} onChange={e => setFormData({...formData, aniListId: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Format</label>
            <input 
              type="text" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Status</label>
            <input 
              type="text" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Total Episodes</label>
            <input 
              type="number" value={formData.totalEpisodes} onChange={e => setFormData({...formData, totalEpisodes: parseInt(e.target.value) || 0})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Episode Duration</label>
            <input 
              type="text" value={formData.episodeDuration} onChange={e => setFormData({...formData, episodeDuration: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Season</label>
            <input 
              type="text" value={formData.season} onChange={e => setFormData({...formData, season: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Studios</label>
            <input 
              type="text" value={formData.studios} onChange={e => setFormData({...formData, studios: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Genres (comma separated)</label>
            <input 
              type="text" value={formData.genres?.join(', ')} onChange={e => setFormData({...formData, genres: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Poster URL</label>
            <input 
              required type="url" value={formData.poster} onChange={e => setFormData({...formData, poster: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Backdrop URL</label>
            <input 
              type="url" value={formData.backdrop} onChange={e => setFormData({...formData, backdrop: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Synopsis</label>
            <textarea 
              rows={5} required value={formData.synopsis} onChange={e => setFormData({...formData, synopsis: e.target.value})}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent resize-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-yoru-border flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.published} 
              onChange={e => setFormData({...formData, published: e.target.checked})}
              className="w-4 h-4 bg-yoru-bg border-yoru-border text-yoru-accent focus:ring-yoru-accent focus:ring-offset-yoru-surface"
            />
            <span className="text-sm font-bold uppercase tracking-widest text-yoru-text-muted">Publish Immediately</span>
          </label>
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Anime
          </button>
        </div>
      </form>
    </div>
  );
};
