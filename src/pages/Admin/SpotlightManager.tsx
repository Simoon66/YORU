import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Anime, SpotlightSlide, Season } from '../../types';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Search, 
  ExternalLink, 
  Image as ImageIcon, 
  Check, 
  X, 
  Play, 
  Eye, 
  EyeOff, 
  Film, 
  Clock, 
  Calendar,
  Layers,
  Sparkle
} from 'lucide-react';

const DEFAULT_SLIDES_SEED: Omit<SpotlightSlide, 'id'>[] = [
  {
    order: 1,
    animeId: '',
    animeTitle: 'Dr. STONE: SCIENCE FUTURE Part 2',
    animeSlug: 'dr-stone-science-future-part-2',
    badge: '#1 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/aqLo1Xp8KrMq9zmGn89gOcTZZdw.jpg',
    logo: 'https://image.tmdb.org/t/p/original/hrqJ7LYIHWUNpCMOSCkYc9IYHIh.png',
    synopsis: 'Senku and his allies push the boundaries of science to face their greatest challenge yet — reshaping the future of humanity.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    order: 2,
    animeId: '',
    animeTitle: 'SAKAMOTO DAYS Part 2',
    animeSlug: 'sakamoto-days-part-2',
    badge: '#2 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/17W1t50gFAY9F5PqL5SjTOSc8yD.jpg',
    logo: 'https://image.tmdb.org/t/p/original/rmpCg2VWLrU1tZwG1jskEug7ytH.png',
    synopsis: 'The legendary hitman turned shopkeeper returns, blending comedy, action, and pure chaos in his everyday life.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    order: 3,
    animeId: '',
    animeTitle: 'DAN DA DAN Season 2',
    animeSlug: 'dan-da-dan-season-2',
    badge: '#3 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/10DSXrtycu2W9i0L7tHi7EBPVEX.jpg',
    logo: 'https://image.tmdb.org/t/p/original/A9jO4m2vVmvuEhTMf6E6sK16kMp.png',
    synopsis: 'Okarun and Momo dive back into bizarre supernatural battles with even crazier stakes.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    order: 4,
    animeId: '',
    animeTitle: 'Lord of Mysteries',
    animeSlug: 'lord-of-mysteries',
    badge: '#4 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/dQapyvANzx24FkVQ8P4WTu2lJNM.jpg',
    logo: 'https://image.tmdb.org/t/p/original/auG2vlnTaCzIEIYLl2zVGQH8muu.png',
    synopsis: 'A gripping journey into a world of secret societies, supernatural powers, and unraveling conspiracies.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  },
  {
    order: 5,
    animeId: '',
    animeTitle: 'Gachiakuta',
    animeSlug: 'gachiakuta',
    badge: '#5 Spotlight',
    backdrop: 'https://image.tmdb.org/t/p/original/mrapJp0qb6Fvo3IW9IrjCK9IgSo.jpg',
    logo: 'https://image.tmdb.org/t/p/original/ccEM7BBPoBky3bvtJuxkDYNVPae.png',
    synopsis: 'Thrown into a city of trash, Rudo must fight to survive and uncover the truth behind his exile.',
    format: 'TV',
    duration: '24m',
    year: '2025',
    isHd: true,
    active: true,
  }
];

export const SpotlightManager = () => {
  const [slides, setSlides] = useState<SpotlightSlide[]>([]);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SpotlightSlide | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Editing/Creating
  const [formAnimeSearch, setFormAnimeSearch] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [targetSeasonId, setTargetSeasonId] = useState<string>('');
  const [badge, setBadge] = useState('#1 Spotlight');
  const [order, setOrder] = useState<number>(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [format, setFormat] = useState('TV');
  const [duration, setDuration] = useState('24m');
  const [year, setYear] = useState('2025');
  const [isHd, setIsHd] = useState(true);
  const [active, setActive] = useState(true);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [slidesSnap, animeSnap] = await Promise.all([
        getDocs(collection(db, 'spotlights')),
        getDocs(collection(db, 'anime'))
      ]);

      const loadedSlides = slidesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SpotlightSlide));
      loadedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSlides(loadedSlides);

      const loadedAnime = animeSnap.docs.map(d => ({ id: d.id, ...d.data() } as Anime));
      setAllAnime(loadedAnime);
    } catch (e: any) {
      console.error("Failed to load spotlights:", e);
      setLoadError(e.message || "Failed to load spotlights. Please check permissions or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Anime for search in modal
  const filteredAnime = allAnime.filter(a => {
    if (!formAnimeSearch.trim()) return false;
    const query = formAnimeSearch.toLowerCase().trim();
    const titleMatch = a.title?.toLowerCase().includes(query);
    const nativeMatch = a.nativeTitle?.toLowerCase().includes(query);
    const aniListMatch = a.aniListId?.toString().includes(query);
    const slugMatch = a.slug?.toLowerCase().includes(query);
    return titleMatch || nativeMatch || aniListMatch || slugMatch;
  }).slice(0, 8);

  const handleOpenCreateModal = () => {
    setEditingSlide(null);
    setSelectedAnime(null);
    setFormAnimeSearch('');
    setTargetSeasonId('');
    setOrder(slides.length + 1);
    setBadge(`#${slides.length + 1} Spotlight`);
    setLogoUrl('');
    setBackdropUrl('');
    setSynopsis('');
    setFormat('TV');
    setDuration('24m');
    setYear(new Date().getFullYear().toString());
    setIsHd(true);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: SpotlightSlide) => {
    setEditingSlide(slide);
    const matchedAnime = allAnime.find(a => a.id === slide.animeId || a.slug === slide.animeSlug);
    setSelectedAnime(matchedAnime || null);
    setFormAnimeSearch(slide.animeTitle || matchedAnime?.title || '');
    setTargetSeasonId(slide.targetSeasonId || (matchedAnime?.seasons?.[0]?.id || ''));
    setOrder(slide.order || 1);
    setBadge(slide.badge || `#${slide.order || 1} Spotlight`);
    setLogoUrl(slide.logo || '');
    setBackdropUrl(slide.backdrop || '');
    setSynopsis(slide.synopsis || '');
    setFormat(slide.format || 'TV');
    setDuration(slide.duration || '24m');
    setYear(slide.year || '2025');
    setIsHd(slide.isHd ?? true);
    setActive(slide.active ?? true);
    setIsModalOpen(true);
  };

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
    setFormAnimeSearch(anime.title);
    if (!backdropUrl && anime.backdrop) setBackdropUrl(anime.backdrop);
    if (!synopsis && anime.synopsis) setSynopsis(anime.synopsis);
    if (anime.format) setFormat(anime.format);
    if (anime.episodeDuration) setDuration(anime.episodeDuration);
    if (anime.startDate) {
      const yr = anime.startDate.split('-')[0] || anime.startDate.split(' ')[2] || '2025';
      setYear(yr);
    }
    if (anime.seasons && anime.seasons.length > 0) {
      setTargetSeasonId(anime.seasons[0].id);
    } else {
      setTargetSeasonId('s1');
    }
  };

  // Drag and Drop URL extraction helper
  const handleDropUrl = (e: React.DragEvent<HTMLDivElement>, setter: (url: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check for URL in dataTransfer
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](.*?)["']/);
      if (match && match[1]) {
        setter(match[1]);
        return;
      }
    }
    
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      setter(uriList);
      return;
    }
    
    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText && (plainText.startsWith('http://') || plainText.startsWith('https://'))) {
      setter(plainText.trim());
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backdropUrl.trim()) {
      alert("Please provide a backdrop image URL (TMDB/Web link).");
      return;
    }

    setIsSaving(true);
    try {
      const slideId = editingSlide?.id || `slide_${Date.now()}`;
      
      const targetSeasonName = selectedAnime?.seasons?.find(s => s.id === targetSeasonId)?.name || 'Season 1';

      const slideData: SpotlightSlide = {
        id: slideId,
        order: Number(order) || 1,
        animeId: selectedAnime?.id || editingSlide?.animeId || '',
        animeTitle: selectedAnime?.title || formAnimeSearch || editingSlide?.animeTitle || 'Untitled Spotlight',
        animeSlug: selectedAnime?.slug || editingSlide?.animeSlug || '',
        targetSeasonId: targetSeasonId || 's1',
        targetSeasonName: targetSeasonName,
        badge: badge.trim() || `#${order} Spotlight`,
        logo: logoUrl.trim(),
        backdrop: backdropUrl.trim(),
        synopsis: synopsis.trim(),
        format: format || 'TV',
        duration: duration || '24m',
        year: year || '2025',
        isHd: isHd,
        active: active,
        updatedAt: Date.now(),
        createdAt: editingSlide?.createdAt || Date.now()
      };

      // Sanitize undefined fields to prevent Firestore errors
      Object.keys(slideData).forEach(key => slideData[key as keyof SpotlightSlide] === undefined && delete slideData[key as keyof SpotlightSlide]);

      await setDoc(doc(db, 'spotlights', slideId), slideData);
      await loadData();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving slide:", e);
      alert("Failed to save slide. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this spotlight slide?")) {
      try {
        await deleteDoc(doc(db, 'spotlights', id));
        setSlides(prev => prev.filter(s => s.id !== id));
      } catch (e) {
        console.error("Error deleting slide:", e);
        alert("Failed to delete slide.");
      }
    }
  };

  const handleToggleActive = async (slide: SpotlightSlide) => {
    try {
      const newActive = !slide.active;
      await updateDoc(doc(db, 'spotlights', slide.id), { active: newActive });
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, active: newActive } : s));
    } catch (e) {
      console.error("Error updating active status:", e);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    const currentOrder = currentSlide.order || (index + 1);
    const targetOrder = targetSlide.order || (targetIndex + 1);

    try {
      await Promise.all([
        updateDoc(doc(db, 'spotlights', currentSlide.id), { order: targetOrder, badge: `#${targetOrder} Spotlight` }),
        updateDoc(doc(db, 'spotlights', targetSlide.id), { order: currentOrder, badge: `#${currentOrder} Spotlight` })
      ]);
      await loadData();
    } catch (e) {
      console.error("Error moving order:", e);
    }
  };

  const handleSeedDefaults = async () => {
    if (window.confirm("This will initialize the 5 curated default spotlight slides into Firestore. Proceed?")) {
      setLoading(true);
      try {
        for (let i = 0; i < DEFAULT_SLIDES_SEED.length; i++) {
          const s = DEFAULT_SLIDES_SEED[i];
          const id = `slide_seed_${i + 1}`;
          await setDoc(doc(db, 'spotlights', id), {
            id,
            ...s,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
        await loadData();
      } catch (e) {
        console.error("Failed to seed spotlights:", e);
        alert("Failed to seed slides.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-yoru-surface border border-yoru-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-yoru-accent text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Hero Carousel System
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Spotlight Slider Manager</h1>
          <p className="text-sm text-yoru-text-muted mt-1">
            Total control over home-page hero slides, TMDB artwork, logos, targeted seasons, and smart resume links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {slides.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
            >
              <Sparkle className="w-4 h-4 text-yoru-accent" /> Populate Defaults
            </button>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-yoru-accent hover:bg-yoru-accent-hover text-[#030407] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-yoru-accent/20"
          >
            <Plus className="w-4 h-4" /> Add Spotlight Slide
          </button>
        </div>
      </div>

      {/* Slide List */}
      {loading ? (
        <div className="p-12 text-center text-yoru-text-muted">Loading spotlight slides...</div>
      ) : loadError ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 text-center rounded-2xl space-y-3">
          <p className="text-sm text-red-400 font-medium">{loadError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/30"
          >
            Retry Loading
          </button>
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-yoru-surface border border-yoru-border p-12 text-center rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 text-yoru-accent flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Spotlight Slides Configured</h3>
          <p className="text-sm text-yoru-text-muted max-w-md mx-auto">
            Create custom spotlight slides for the home page or click &quot;Populate Defaults&quot; to import the preset hero carousel.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleSeedDefaults}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Populate Defaults
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-yoru-accent text-[#030407] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Create First Slide
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`bg-yoru-surface border transition-all duration-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${slide.active ? 'border-yoru-border hover:border-white/20' : 'border-white/5 opacity-60'}`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === slides.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Order Badge */}
                <div className="w-9 h-9 rounded-lg bg-yoru-surface-elevated border border-white/5 flex items-center justify-center font-bold text-xs text-yoru-accent shrink-0">
                  #{slide.order || index + 1}
                </div>

                {/* Backdrop Thumbnail */}
                <div className="w-24 h-14 rounded-lg bg-black overflow-hidden relative shrink-0 border border-white/10">
                  <img 
                    src={slide.backdrop} 
                    alt={slide.animeTitle} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400'; }}
                  />
                  {slide.logo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                      <img src={slide.logo} alt="Logo" className="max-h-6 object-contain" />
                    </div>
                  )}
                </div>

                {/* Title & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yoru-accent px-2 py-0.5 bg-yoru-accent/10 rounded">
                      {slide.badge || `#${slide.order || index + 1} Spotlight`}
                    </span>
                    {slide.targetSeasonName && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                        {slide.targetSeasonName}
                      </span>
                    )}
                    <span className="text-[10px] text-yoru-text-muted">{slide.format || 'TV'} • {slide.duration || '24m'} • {slide.year || '2025'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate mt-1">
                    {slide.animeTitle || 'Untitled Anime'}
                  </h3>
                  <p className="text-xs text-yoru-text-muted line-clamp-1 mt-0.5">
                    {slide.synopsis || 'No synopsis provided.'}
                  </p>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {/* Active Toggle Button */}
                <button
                  onClick={() => handleToggleActive(slide)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${slide.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-white/5 text-yoru-text-muted border-white/5 hover:text-white'}`}
                >
                  {slide.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{slide.active ? 'Active' : 'Hidden'}</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEditModal(slide)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Edit Slide"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                  title="Delete Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / CREATE SLIDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D0F15] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-yoru-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yoru-accent/10 text-yoru-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingSlide ? 'Edit Spotlight Slide' : 'Add New Spotlight Slide'}
                  </h2>
                  <p className="text-xs text-yoru-text-muted">
                    Configure artwork, logo, synopsis, and target season with smart resume.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-yoru-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSlide} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* LIVE HERO BANNER PREVIEW */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-yoru-text-muted flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-yoru-accent" /> Live Banner Preview (How it looks on Home Hero)
                </label>
                <div className="relative h-48 md:h-60 rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center">
                  {backdropUrl ? (
                    <img 
                      src={backdropUrl} 
                      alt="Backdrop Preview" 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-yoru-surface-elevated flex items-center justify-center text-xs text-yoru-text-muted font-mono">
                      No backdrop image specified yet
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent pointer-events-none" />

                  {/* Slide details preview */}
                  <div className="relative z-10 px-6 max-w-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yoru-accent">
                        {badge || `#${order} Spotlight`}
                      </span>
                      {selectedAnime?.seasons?.find(s => s.id === targetSeasonId) && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                          {selectedAnime.seasons.find(s => s.id === targetSeasonId)?.name}
                        </span>
                      )}
                    </div>

                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo Preview" 
                        className="max-h-10 object-contain block drop-shadow-md"
                        onError={(e) => { (e.target as any).style.display = 'none'; }}
                      />
                    ) : (
                      <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                        {selectedAnime?.title || formAnimeSearch || 'Select Anime'}
                      </h3>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-white/80 font-medium">
                      <span>{format}</span>
                      <span>• {duration}</span>
                      <span>• {year}</span>
                      {isHd && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1a6fdb] text-white">HD</span>}
                    </div>

                    {/* Strict 2-line clamp */}
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {synopsis || 'Senku and his allies push the boundaries of science to face their greatest challenge yet — reshaping the future of humanity.'}
                    </p>

                    <div className="inline-flex items-center gap-2 bg-yoru-accent text-[#030407] px-4 py-1.5 rounded-full font-bold text-xs">
                      <Play className="w-3 h-3 fill-current" /> Watch Now
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. ANIME SEARCH & SELECTION */}
              <div className="bg-yoru-surface border border-yoru-border p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-yoru-accent" /> 1. Search Anime (By Name or AniList ID)
                  </label>
                  {selectedAnime && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected: {selectedAnime.title}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-yoru-text-muted" />
                  <input
                    type="text"
                    value={formAnimeSearch}
                    onChange={(e) => setFormAnimeSearch(e.target.value)}
                    placeholder="Search over 1,000+ anime (e.g. Solo Leveling, Demon Slayer, 101922)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-yoru-surface-elevated border border-yoru-border focus:border-yoru-accent rounded-xl text-white text-sm outline-none transition-colors"
                  />

                  {/* Search Results Dropdown */}
                  {filteredAnime.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#12151D] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 max-h-64 overflow-y-auto">
                      {filteredAnime.map(anime => (
                        <div
                          key={anime.id}
                          onClick={() => handleSelectAnime(anime)}
                          className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
                        >
                          <img 
                            src={anime.poster} 
                            alt={anime.title} 
                            className="w-10 h-14 object-cover rounded bg-black shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{anime.title}</h4>
                            <p className="text-[10px] text-yoru-text-muted">
                              AniList: {anime.aniListId || 'N/A'} • {anime.format || 'TV'} • {anime.seasons?.length || 1} Seasons
                            </p>
                          </div>
                          <button 
                            type="button" 
                            className="px-3 py-1 bg-yoru-accent/10 text-yoru-accent rounded-lg text-xs font-bold uppercase tracking-wider"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. TARGET SEASON SELECTOR */}
              <div className="bg-yoru-surface border border-yoru-border p-5 rounded-2xl space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-yoru-accent" /> 2. Target Season for &quot;Watch Now&quot; Action
                </label>
                <p className="text-xs text-yoru-text-muted">
                  When the user clicks &quot;Watch Now&quot; on this spotlight, it will start this season. If they already watched an episode from this season, it automatically resumes where they left off!
                </p>

                {selectedAnime?.seasons && selectedAnime.seasons.length > 0 ? (
                  <select
                    value={targetSeasonId}
                    onChange={(e) => setTargetSeasonId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-yoru-surface-elevated border border-yoru-border focus:border-yoru-accent rounded-xl text-white text-sm outline-none"
                  >
                    {selectedAnime.seasons.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#0D0F15]">
                        {s.name} (Order: {s.order})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-yoru-text-muted flex items-center justify-between">
                    <span>Default Season 1 (No multi-season configured)</span>
                    <input 
                      type="hidden" 
                      value="s1" 
                    />
                  </div>
                )}
              </div>

              {/* 3. TMDB CUSTOM LOGO & BACKDROP (DRAG & DROP READY) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Custom Logo URL & Dropzone */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropUrl(e, setLogoUrl)}
                  className="bg-yoru-surface border border-yoru-border p-5 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-yoru-accent" /> Custom Logo PNG
                    </label>
                    <span className="text-[10px] text-yoru-text-muted">TMDB Link / Drag & Drop</span>
                  </div>

                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://image.tmdb.org/t/p/original/...png"
                    className="w-full px-4 py-2 bg-yoru-surface-elevated border border-yoru-border focus:border-yoru-accent rounded-xl text-white text-xs outline-none"
                  />

                  {/* Dropzone hint */}
                  <div className="border border-dashed border-white/10 hover:border-yoru-accent/50 rounded-xl p-3 text-center text-[11px] text-yoru-text-muted transition-colors cursor-pointer">
                    Drag & Drop Logo Image from TMDB directly here
                  </div>

                  {logoUrl && (
                    <div className="h-14 bg-black/60 rounded-xl p-2 flex items-center justify-center border border-white/5">
                      <img src={logoUrl} alt="Logo" className="max-h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Custom Backdrop URL & Dropzone */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropUrl(e, setBackdropUrl)}
                  className="bg-yoru-surface border border-yoru-border p-5 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-yoru-accent" /> Custom Backdrop Artwork <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-yoru-text-muted">TMDB Link / Drag & Drop</span>
                  </div>

                  <input
                    type="url"
                    required
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://image.tmdb.org/t/p/original/...jpg"
                    className="w-full px-4 py-2 bg-yoru-surface-elevated border border-yoru-border focus:border-yoru-accent rounded-xl text-white text-xs outline-none"
                  />

                  {/* Dropzone hint */}
                  <div className="border border-dashed border-white/10 hover:border-yoru-accent/50 rounded-xl p-3 text-center text-[11px] text-yoru-text-muted transition-colors cursor-pointer">
                    Drag & Drop Backdrop Image from TMDB directly here
                  </div>

                  {backdropUrl && (
                    <div className="h-14 bg-black rounded-xl overflow-hidden border border-white/5">
                      <img src={backdropUrl} alt="Backdrop" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

              </div>

              {/* 4. SYNOPSIS & HOOK (STRICT 2-LINE CONSTRAINT) */}
              <div className="bg-yoru-surface border border-yoru-border p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-white">
                    Custom Synopsis / Hook Line (2-Line Clamp on Hero)
                  </label>
                  <span className="text-[10px] text-yoru-text-muted">Truncates to 2 lines with &apos;...&apos;</span>
                </div>

                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Enter an engaging short synopsis or hook for the hero slider..."
                  className="w-full p-4 bg-yoru-surface-elevated border border-yoru-border focus:border-yoru-accent rounded-xl text-white text-xs leading-relaxed outline-none"
                />
              </div>

              {/* 5. SPOTLIGHT BADGE, ORDER, FORMAT, YEAR, HD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-yoru-surface border border-yoru-border p-5 rounded-2xl">
                
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted block mb-1">
                    Spotlight Badge
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="#1 Spotlight"
                    className="w-full px-3 py-2 bg-yoru-surface-elevated border border-yoru-border rounded-lg text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted block mb-1">
                    Carousel Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-yoru-surface-elevated border border-yoru-border rounded-lg text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted block mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-yoru-surface-elevated border border-yoru-border rounded-lg text-white text-xs outline-none"
                  >
                    <option value="TV">TV</option>
                    <option value="Movie">Movie</option>
                    <option value="OVA">OVA</option>
                    <option value="ONA">ONA</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted block mb-1">
                    Release Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2025"
                    className="w-full px-3 py-2 bg-yoru-surface-elevated border border-yoru-border rounded-lg text-white text-xs outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-4 flex items-center justify-between pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHd}
                      onChange={(e) => setIsHd(e.target.checked)}
                      className="w-4 h-4 accent-yoru-accent"
                    />
                    <span className="text-xs font-bold text-white">Show &quot;HD&quot; Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 accent-yoru-accent"
                    />
                    <span className="text-xs font-bold text-white">Active in Carousel</span>
                  </label>
                </div>

              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-yoru-surface">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl hover:bg-white/10 text-yoru-text-muted hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlide}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-yoru-accent hover:bg-yoru-accent-hover text-[#030407] text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-yoru-accent/20 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
