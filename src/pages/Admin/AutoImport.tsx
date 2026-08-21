import React, { useState } from 'react';
import { Loader2, DownloadCloud, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { collection, doc, setDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Anime, Episode } from '../../types';
import axios from 'axios';

interface LogItem {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const AutoImport = () => {
  const [inputIds, setInputIds] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [groupAsSeasons, setGroupAsSeasons] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  };

  const verifyLink = async (url: string): Promise<boolean> => {
    try {
      const res = await axios.post('/api/verify-link', { url });
      return res.data.status === 'alive';
    } catch (e) {
      return false;
    }
  };

  const fetchAniListMetadata = async (id: number) => {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          episodes
          coverImage {
            extraLarge
            large
          }
          bannerImage
          genres
          description
          status
          startDate {
            year
          }
          duration
          studios(isMain: true) {
            nodes {
              name
            }
          }
          format
          averageScore
        }
      }
    `;

    const res = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { id }
    });

    return res.data.data.Media;
  };

  const fetchFillers = async (malId: number): Promise<Set<number>> => {
    const fillers = new Set<number>();
    try {
      let page = 1;
      let hasNextPage = true;
      while (hasNextPage) {
        const res = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${page}`);
        const data = res.data;
        if (data && data.data) {
          for (const ep of data.data) {
            if (ep.filler) fillers.add(ep.mal_id);
          }
        }
        hasNextPage = data?.pagination?.has_next_page || false;
        if (hasNextPage) await new Promise(r => setTimeout(r, 400));
      }
    } catch (err) {
      // silently fail if Jikan is unreachable or rate limited
    }
    return fillers;
  };

  const startImport = async () => {
    if (isProcessing) return;

    // Parse IDs
    const rawIds = inputIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    const ids = Array.from(new Set(rawIds.map(id => parseInt(id)))).filter(id => !Number.isNaN(id)) as number[];

    if (ids.length === 0) {
      addLog('No valid IDs found in input.', 'error');
      return;
    }

    if (ids.length > 10) {
      addLog('Maximum 10 IDs allowed at once to prevent rate-limiting.', 'error');
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setProgress({ current: 0, total: ids.length });
    addLog(`Starting bulk import for ${ids.length} anime...`, 'info');

    let sharedAnimeId = '';
    let sharedAnimeDocRef: any = null;
    let sharedSeasons: any[] = [];

    for (let i = 0; i < ids.length; i++) {
      const aniId = ids[i];
      setProgress({ current: i + 1, total: ids.length });
      addLog(`\n[${i + 1}/${ids.length}] Processing AniList ID: ${aniId}...`, 'info');

      try {
        // 1. Fetch Metadata
        addLog(`Fetching metadata from AniList...`, 'info');
        const meta = await fetchAniListMetadata(aniId);
        
        if (!meta) {
          addLog(`Could not find anime with ID ${aniId}`, 'error');
          continue;
        }

        const title = meta.title.english || meta.title.romaji || meta.title.native || `Anime ${aniId}`;
        const totalEpisodes = meta.episodes || 0;
        
        addLog(`Found: ${title} (${totalEpisodes} episodes)`, 'success');

        if (totalEpisodes === 0) {
          addLog(`Anime has 0 episodes in AniList. Skipping server generation.`, 'warning');
        }

        // Fetch fillers if MAL ID exists
        let fillerSet = new Set<number>();
        if (meta.idMal && totalEpisodes > 0) {
          addLog(`Fetching filler list from Jikan (MAL ID: ${meta.idMal})...`, 'info');
          fillerSet = await fetchFillers(meta.idMal);
        }

        // 2. Pre-check servers (Episode 1)
        addLog(`Pre-checking MegaPlay servers...`, 'info');
        
        const servers = {
          aniSub: false,
          aniDub: false,
          malSub: false,
          malDub: false
        };

        if (totalEpisodes > 0) {
          servers.aniSub = await verifyLink(`https://megaplay.buzz/stream/ani/${aniId}/1/sub`);
          if (servers.aniSub) addLog(`✓ HD-1 (Sub) server verified`, 'success');
          
          servers.aniDub = await verifyLink(`https://megaplay.buzz/stream/ani/${aniId}/1/dub`);
          if (servers.aniDub) addLog(`✓ HD-1 (Dub) server verified`, 'success');

          if (meta.idMal) {
            servers.malSub = await verifyLink(`https://megaplay.buzz/stream/mal/${meta.idMal}/1/sub`);
            if (servers.malSub) addLog(`✓ HD-2 (Sub) server verified`, 'success');

            servers.malDub = await verifyLink(`https://megaplay.buzz/stream/mal/${meta.idMal}/1/dub`);
            if (servers.malDub) addLog(`✓ HD-2 (Dub) server verified`, 'success');
          }
        }

        if (!servers.aniSub && !servers.aniDub && !servers.malSub && !servers.malDub && totalEpisodes > 0) {
          addLog(`No valid servers found for Episode 1. Anime will be added but without episodes.`, 'warning');
        }

        // 3. Save Anime to Firestore
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const q = query(collection(db, 'anime'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        let animeDocRef;
        let animeId;
        let currentSeasonId = 's1';

        if (groupAsSeasons && i > 0 && sharedAnimeId) {
          // We are appending this ID as a new season to the first Anime
          animeId = sharedAnimeId;
          animeDocRef = sharedAnimeDocRef;
          currentSeasonId = `s${i + 1}`;
          sharedSeasons.push({ id: currentSeasonId, name: title || `Season ${i + 1}`, order: i + 1 });
          addLog(`Appending as ${currentSeasonId} to existing anime...`, 'info');
        } else if (querySnapshot.empty) {
          addLog(`Creating new anime record...`, 'info');
          animeDocRef = doc(collection(db, 'anime'));
          animeId = animeDocRef.id;
          
          const newAnime: Anime = {
            id: animeId,
            title: title,
            nativeTitle: meta.title.native || meta.title.romaji || '',
            slug: slug,
            aniListId: String(aniId),
            poster: meta.coverImage?.extraLarge || meta.coverImage?.large || '',
            backdrop: meta.bannerImage || meta.coverImage?.extraLarge || '',
            synopsis: meta.description?.replace(/<[^>]*>?/gm, '') || 'No synopsis available.',
            genres: meta.genres || [],
            format: meta.format || 'TV',
            status: meta.status || 'FINISHED',
            startDate: meta.startDate?.year ? String(meta.startDate.year) : '',
            endDate: '',
            season: '',
            averageScore: meta.averageScore ? String(meta.averageScore) : '',
            studios: meta.studios?.nodes?.[0]?.name || '',
            episodeDuration: meta.duration ? `${meta.duration} mins` : '',
            totalEpisodes: totalEpisodes,
            seasons: [{ id: 's1', name: 'Season 1', order: 1 }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            published: true
          };

          if (groupAsSeasons && i === 0) {
            sharedAnimeId = animeId;
            sharedAnimeDocRef = animeDocRef;
            sharedSeasons = [...newAnime.seasons];
          }

          await setDoc(animeDocRef, newAnime);
        } else {
          animeDocRef = querySnapshot.docs[0].ref;
          animeId = animeDocRef.id;

          if (groupAsSeasons && i === 0) {
            sharedAnimeId = animeId;
            sharedAnimeDocRef = animeDocRef;
            sharedSeasons = querySnapshot.docs[0].data().seasons || [{ id: 's1', name: 'Season 1', order: 1 }];
          }

          addLog(`Updating existing anime record...`, 'info');
          await updateDoc(animeDocRef, {
            updatedAt: Date.now(),
            totalEpisodes: totalEpisodes,
            status: meta.status || 'FINISHED'
          });
        }

        // If grouping as seasons, update the seasons array in the shared Anime doc
        if (groupAsSeasons && sharedAnimeDocRef) {
          await updateDoc(sharedAnimeDocRef, { seasons: sharedSeasons, updatedAt: Date.now() });
        }

        // 4. Populate Episodes
        if (totalEpisodes > 0) {
          let addedEps = 0;
          addLog(`Generating episodes...`, 'info');
          
          // Get existing episodes to prevent duplicates
          const epQuery = query(collection(db, 'episodes'), where('animeId', '==', animeId), where('seasonId', '==', currentSeasonId));
          const existingEpsSnap = await getDocs(epQuery);
          
          const existingEpsMap = new Map();
          existingEpsSnap.docs.forEach(d => {
             existingEpsMap.set(d.data().episodeNumber, { ...d.data(), id: d.id });
          });

          for (let epNum = 1; epNum <= totalEpisodes; epNum++) {
            const availableServers = [];
            
            if (servers.aniSub) availableServers.push({ serverName: 'HD-1', serverType: 'sub', embedLink: `https://megaplay.buzz/stream/ani/${aniId}/${epNum}/sub` });
            if (servers.aniDub) availableServers.push({ serverName: 'HD-1', serverType: 'dub', embedLink: `https://megaplay.buzz/stream/ani/${aniId}/${epNum}/dub` });
            if (servers.malSub) availableServers.push({ serverName: 'HD-2', serverType: 'sub', embedLink: `https://megaplay.buzz/stream/mal/${meta.idMal}/${epNum}/sub` });
            if (servers.malDub) availableServers.push({ serverName: 'HD-2', serverType: 'dub', embedLink: `https://megaplay.buzz/stream/mal/${meta.idMal}/${epNum}/dub` });

            if (availableServers.length === 0) continue;

            const existingEp = existingEpsMap.get(epNum);
            const epDocId = existingEp ? existingEp.id : `${animeId}_${currentSeasonId}_${epNum}`;
            const epDocRef = doc(db, 'episodes', epDocId);
            
            const isFiller = fillerSet.has(epNum);
            
            if (existingEp) {
               let updated = false;
               const currentServers = Array.isArray(existingEp.servers) ? [...existingEp.servers] : [];
               
               for (const newSrv of availableServers) {
                  const exists = currentServers.some(s => s.serverName === newSrv.serverName && s.serverType === newSrv.serverType);
                  if (!exists) {
                     currentServers.push(newSrv);
                     updated = true;
                  }
               }
               
               if (updated) {
                  // We can't easily import updateDoc here without making sure it's at the top. Let's use setDoc with merge: true
                  await setDoc(epDocRef, { servers: currentServers }, { merge: true });
                  addedEps++;
               }
            } else {
               const newEp = {
                  id: epDocId,
                  animeId: animeId,
                  seasonId: currentSeasonId,
                  episodeNumber: epNum,
                  title: `Episode ${epNum}`,
                  servers: availableServers,
                  thumbnailUrl: meta.coverImage?.large || '',
                  isFiller: isFiller,
                  createdAt: Date.now(),
                  published: true
               };
               await setDoc(epDocRef, newEp);
               addedEps++;
            }
          }
          
          if (addedEps > 0) {
            addLog(`Successfully added ${addedEps} new episodes.`, 'success');
          } else {
            addLog(`No new episodes to add (all existing or no valid servers).`, 'info');
          }
        }

        addLog(`Finished processing ${title}!`, 'success');

      } catch (err: any) {
        addLog(`Error processing ID ${aniId}: ${err.message}`, 'error');
      }
    }

    addLog('\nBulk import completed!', 'success');
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Auto Anime Fetcher</h1>
          <p className="text-yoru-text-muted text-sm mt-1">Bulk import anime and auto-verify MegaPlay servers using AniList IDs.</p>
        </div>
      </div>
      
      <div className="bg-yoru-surface border border-yoru-border p-6 rounded-xl space-y-6">
         <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted flex items-center justify-between">
              <span>AniList IDs</span>
              <span className="text-yoru-accent">Max 10 IDs</span>
            </label>
            <textarea
              value={inputIds}
              onChange={(e) => setInputIds(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g. 113415, 21, 16498..."
              className="w-full h-32 bg-[#1a1c23] border border-yoru-border rounded-lg p-4 text-white focus:outline-none focus:border-yoru-accent resize-none font-mono text-sm disabled:opacity-50"
            />
            <p className="text-xs text-yoru-text-muted">Separate multiple IDs with commas or newlines.</p>
         </div>
         
         <div className="flex items-center gap-3 bg-yoru-bg border border-yoru-border p-4 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={groupAsSeasons} 
                onChange={(e) => setGroupAsSeasons(e.target.checked)}
                disabled={isProcessing}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yoru-accent"></div>
            </label>
            <span className="text-sm font-bold text-white tracking-wide">Merge IDs as Seasons into one Anime</span>
         </div>

         {isProcessing && (
           <div className="space-y-2">
             <div className="flex justify-between text-xs font-bold text-yoru-text-muted uppercase tracking-widest">
               <span>Progress</span>
               <span>{progress.current} / {progress.total}</span>
             </div>
             <div className="w-full bg-yoru-bg h-2 rounded-full overflow-hidden border border-yoru-border">
               <div 
                 className="bg-yoru-accent h-full transition-all duration-300"
                 style={{ width: `${(progress.current / progress.total) * 100}%` }}
               />
             </div>
           </div>
         )}
         
         <button
           onClick={startImport}
           disabled={isProcessing || !inputIds.trim()}
           className="bg-yoru-accent hover:bg-yoru-accent/90 disabled:opacity-50 text-yoru-bg px-6 py-3 rounded text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors w-full shadow-lg shadow-yoru-accent/20"
         >
           {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
           {isProcessing ? 'Processing...' : 'Start Bulk Import'}
         </button>
      </div>
      
      {logs.length > 0 && (
         <div className="bg-[#1a1c23] border border-yoru-border rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs shadow-inner">
           <h4 className="text-white/50 mb-4 font-bold uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
             Console Logs
             {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
           </h4>
           <div className="space-y-2 pb-4">
             {logs.map((log, idx) => {
               let color = 'text-white/70';
               let Icon = null;
               
               if (log.type === 'error') {
                 color = 'text-red-400';
                 Icon = XCircle;
               } else if (log.type === 'success') {
                 color = 'text-green-400';
                 Icon = CheckCircle;
               } else if (log.type === 'warning') {
                 color = 'text-yellow-400';
                 Icon = AlertTriangle;
               }

               return (
                 <div key={idx} className={`flex items-start gap-2 ${color} ${log.message.startsWith('\n') ? 'mt-4' : ''}`}>
                   {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                   <span className="whitespace-pre-wrap leading-relaxed">{log.message.trim()}</span>
                 </div>
               );
             })}
           </div>
         </div>
      )}
    </div>
  )
}
