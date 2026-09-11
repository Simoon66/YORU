import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Anime, Season, LinkedSeason } from '../../types';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Save, Search, DownloadCloud, Loader2, Link2, Unlink, Plus, Layers } from 'lucide-react';
import { syncSeasonGroup, unlinkAnimeFromGroup, linkAnimeToGroup } from '../../lib/seasonGroupService';

const ANILIST_QUERY = `
query ($id: Int, $search: String) {
  Media (id: $id, search: $search, type: ANIME) {
    id
    isAdult
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
  
  const [aniListSuggestions, setAniListSuggestions] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!fetchQuery.trim() || /^\d+$/.test(fetchQuery) || fetchQuery.length < 3) {
        setAniListSuggestions([]);
        return;
      }
      setIsSuggesting(true);
      try {
        const query = `
        query ($search: String) {
          Page(page: 1, perPage: 5) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
              id
              title { english romaji native }
              coverImage { medium }
              startDate { year }
            }
          }
        }`;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ query, variables: { search: fetchQuery } })
        });
        const json = await res.json();
        setAniListSuggestions(json.data.Page.media || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSuggesting(false);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchQuery]);

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
    isAdult: false,
    published: false,
  });

  const [allAnimeList, setAllAnimeList] = useState<Anime[]>([]);
  const [selectedAnimeToLink, setSelectedAnimeToLink] = useState('');
  const [linkSeasonNumber, setLinkSeasonNumber] = useState(2);
  const [isLinkingGroup, setIsLinkingGroup] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'anime')).then(snap => {
      const list = snap.docs.map(d => ({ ...(d.data() as Anime), id: d.id }));
      setAllAnimeList(list);
    });
  }, [id]);

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'anime', id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as Anime;
          setFormData(data);
          if (data.linkedSeasons && data.linkedSeasons.length > 0) {
            setLinkSeasonNumber(data.linkedSeasons.length + 1);
          }
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleLinkAnime = async () => {
    if (!id || !selectedAnimeToLink) return;
    setIsLinkingGroup(true);
    try {
      const currentGroupId = formData.seasonGroupId || `sg_${Date.now()}`;
      
      // If current anime wasn't assigned groupId yet
      if (!formData.seasonGroupId) {
        await updateDoc(doc(db, 'anime', id), {
          seasonGroupId: currentGroupId,
          seasonNumber: formData.seasonNumber || 1,
          updatedAt: Date.now()
        });
      }

      await linkAnimeToGroup(selectedAnimeToLink, currentGroupId, linkSeasonNumber);
      const updatedLinked = await syncSeasonGroup(currentGroupId);
      
      setFormData(prev => ({
        ...prev,
        seasonGroupId: currentGroupId,
        seasonNumber: prev.seasonNumber || 1,
        linkedSeasons: updatedLinked
      }));
      setSelectedAnimeToLink('');
      setLinkSeasonNumber(updatedLinked.length + 1);
    } catch (e: any) {
      alert(`Error linking anime: ${e.message}`);
    } finally {
      setIsLinkingGroup(false);
    }
  };

  const handleUnlink = async (animeIdToUnlink: string) => {
    if (!formData.seasonGroupId) return;
    setIsLinkingGroup(true);
    try {
      await unlinkAnimeFromGroup(animeIdToUnlink);
      if (animeIdToUnlink === id) {
        setFormData(prev => ({
          ...prev,
          seasonGroupId: undefined,
          seasonNumber: undefined,
          linkedSeasons: []
        }));
      } else {
        const updated = await syncSeasonGroup(formData.seasonGroupId);
        setFormData(prev => ({
          ...prev,
          linkedSeasons: updated
        }));
      }
    } catch (e: any) {
      alert(`Error unlinking anime: ${e.message}`);
    } finally {
      setIsLinkingGroup(false);
    }
  };

  const handleSeasonNumberChange = async (targetAnimeId: string, newNumber: number) => {
    if (!formData.seasonGroupId || Number.isNaN(newNumber) || newNumber < 1) return;
    setIsLinkingGroup(true);
    try {
      await updateDoc(doc(db, 'anime', targetAnimeId), {
        seasonNumber: newNumber,
        updatedAt: Date.now()
      });
      const updated = await syncSeasonGroup(formData.seasonGroupId);
      setFormData(prev => ({
        ...prev,
        seasonNumber: targetAnimeId === id ? newNumber : prev.seasonNumber,
        linkedSeasons: updated
      }));
    } catch (e: any) {
      alert(`Error updating season number: ${e.message}`);
    } finally {
      setIsLinkingGroup(false);
    }
  };

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
        isAdult: Boolean(media.isAdult || media.genres?.some((g: string) => ['Hentai', 'Adult', '18+'].includes(g))),
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
      const rawData = {
        ...formData,
        id: animeRef.id,
        updatedAt: now,
        createdAt: formData.createdAt || now
      };
      
      const finalData: any = {};
      Object.entries(rawData).forEach(([k, v]) => {
        if (v !== undefined) {
          finalData[k] = v;
        }
      });
      
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
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Enter AniList ID or Exact Title..." 
                value={fetchQuery}
                onChange={e => setFetchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFetchAniList()}
                className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
              />
              
              {/* AniList Live Suggestions Dropdown */}
              {(aniListSuggestions.length > 0 || isSuggesting) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-yoru-surface-elevated border border-white/10 rounded shadow-2xl z-50 overflow-hidden">
                  {isSuggesting ? (
                    <div className="p-4 flex items-center justify-center text-yoru-text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {aniListSuggestions.map(media => (
                        <button
                          key={media.id}
                          onClick={() => {
                            setFetchQuery(media.id.toString());
                            setAniListSuggestions([]);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                        >
                          <img src={media.coverImage.medium} alt="Cover" className="w-8 h-12 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{media.title.english || media.title.romaji || media.title.native}</h4>
                            <p className="text-[10px] text-yoru-text-muted truncate">ID: {media.id} {media.startDate?.year ? `• ${media.startDate.year}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleFetchAniList}
              disabled={isFetching}
              className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-yoru-bg px-6 py-2 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shrink-0"
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
              required type="url" value={formData.poster} onChange={e => {
                let url = e.target.value;
                if (url.includes('image.tmdb.org/t/p/')) {
                  url = url.replace(/\/p\/(w\d+|w\d+_and_h\d+_bestv2|w\d+_and_h\d+_face)\//, '/p/original/');
                }
                if (url.includes('s4.anilist.co/file/anilistcdn/media/anime/cover/')) {
                  url = url.replace('/medium/', '/large/').replace('/small/', '/large/');
                }
                setFormData({...formData, poster: url});
              }}
              className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Backdrop URL</label>
            <input 
              type="url" value={formData.backdrop} onChange={e => {
                let url = e.target.value;
                if (url.includes('image.tmdb.org/t/p/')) {
                  url = url.replace(/\/p\/(w\d+|w\d+_and_h\d+_bestv2|w\d+_and_h\d+_face)\//, '/p/original/');
                }
                if (url.includes('s4.anilist.co/file/anilistcdn/media/anime/cover/')) {
                  url = url.replace('/medium/', '/large/').replace('/small/', '/large/');
                }
                setFormData({...formData, backdrop: url});
              }}
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

        {/* Franchise / Linked Seasons Group Manager */}
        {id && (
          <div className="bg-yoru-surface border border-yoru-border p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-yoru-accent" />
                <h3 className="text-base font-bold text-white tracking-tight">Franchise & Linked Seasons</h3>
              </div>
              {isLinkingGroup && <Loader2 className="w-4 h-4 text-yoru-accent animate-spin" />}
            </div>

            <p className="text-xs text-yoru-text-muted leading-relaxed">
              Link distinct anime together (e.g. Naruto & Naruto Shippuden) so viewers can switch between seasons on the watch and detail pages, while maintaining separate catalog and search entries.
            </p>

            {/* Current anime season number */}
            <div className="flex items-center gap-3 p-3 bg-yoru-bg rounded-lg border border-yoru-border/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider">This Anime's Season Number:</span>
              <input
                type="number"
                min={1}
                value={formData.seasonNumber || 1}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val) && val >= 1) {
                    setFormData(prev => ({ ...prev, seasonNumber: val }));
                    if (formData.seasonGroupId) {
                      handleSeasonNumberChange(id, val);
                    }
                  }
                }}
                className="w-16 bg-yoru-surface border border-yoru-border px-2 py-1 text-sm text-white rounded text-center focus:outline-none focus:border-yoru-accent"
              />
            </div>

            {/* List of currently linked seasons */}
            {formData.linkedSeasons && formData.linkedSeasons.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-yoru-text-muted uppercase tracking-widest">
                  Linked Seasons in this Group ({formData.linkedSeasons.length})
                </div>
                <div className="divide-y divide-white/5 border border-white/10 rounded-lg overflow-hidden bg-yoru-bg">
                  {formData.linkedSeasons
                    .sort((a, b) => (a.seasonNumber || 1) - (b.seasonNumber || 1))
                    .map((item) => {
                      const isSelf = item.animeId === id;
                      return (
                        <div key={item.animeId} className="flex items-center justify-between p-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-yoru-accent/10 border border-yoru-accent/30 text-yoru-accent text-xs font-bold font-mono">
                              Season {item.seasonNumber}
                            </span>
                            <div className="truncate">
                              <span className="text-sm font-bold text-white">
                                {item.title}
                              </span>
                              {isSelf && (
                                <span className="ml-2 text-[10px] uppercase font-bold text-yoru-accent bg-white/10 px-1.5 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                              <span className="text-xs text-yoru-text-muted ml-2 font-mono hidden sm:inline">
                                ({item.slug})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUnlink(item.animeId)}
                              disabled={isLinkingGroup}
                              className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded border border-red-400/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Unlink from franchise"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                              <span>Unlink</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yoru-bg border border-dashed border-white/10 rounded-lg text-xs text-yoru-text-muted text-center">
                This anime is not linked to any other seasons yet. Use the tool below to link another anime into this franchise group.
              </div>
            )}

            {/* Add another anime to this group */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">
                + Link Another Anime into Franchise
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedAnimeToLink}
                  onChange={e => setSelectedAnimeToLink(e.target.value)}
                  className="flex-1 bg-yoru-bg border border-yoru-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
                >
                  <option value="">-- Select an anime from library --</option>
                  {allAnimeList
                    .filter(a => a.id !== id && !formData.linkedSeasons?.some(ls => ls.animeId === a.id))
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.format || 'TV'})
                      </option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-yoru-text-muted whitespace-nowrap">As Season:</span>
                  <input
                    type="number"
                    min={1}
                    value={linkSeasonNumber}
                    onChange={e => setLinkSeasonNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-16 bg-yoru-bg border border-yoru-border rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-yoru-accent"
                  />
                  <button
                    type="button"
                    onClick={handleLinkAnime}
                    disabled={!selectedAnimeToLink || isLinkingGroup}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Season</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-yoru-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.published} 
                onChange={e => setFormData({...formData, published: e.target.checked})}
                className="w-4 h-4 bg-yoru-bg border-yoru-border text-yoru-accent focus:ring-yoru-accent focus:ring-offset-yoru-surface"
              />
              <span className="text-sm font-bold uppercase tracking-widest text-yoru-text-muted">Publish Immediately</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 transition-colors">
              <input 
                type="checkbox" 
                checked={Boolean(formData.isAdult)} 
                onChange={e => setFormData({...formData, isAdult: e.target.checked})}
                className="w-4 h-4 bg-yoru-bg border-red-500/50 text-red-600 focus:ring-red-500 rounded"
              />
              <span className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px] font-black">18+</span>
                Adult / 18+ Content
              </span>
            </label>
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-yoru-bg px-8 py-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Anime
          </button>
        </div>
      </form>
    </div>
  );
};
