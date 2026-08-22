import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  getServerConfig, 
  saveServerConfig, 
  normalizeBaseDomain,
  ServerConfig 
} from '../../lib/serverSettings';
import { 
  Globe, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Zap, 
  Search, 
  Check, 
  ShieldCheck,
  Server,
  ArrowLeftRight,
  Database
} from 'lucide-react';
import { Episode, ServerLink } from '../../types';

interface DetectedDomain {
  domain: string;
  count: number;
  isAbyss: boolean;
}

interface MatchItem {
  animeId: string;
  animeTitle: string;
  episodeId: string;
  seasonId: string;
  episodeNumber: number;
  serverIndex: number;
  serverName: string;
  serverType: string;
  oldLink: string;
  newLink: string;
}

export const AbyssDomainManager: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [activeAbyssBase, setActiveAbyssBase] = useState('https://animesalt.link');
  const [dynamicOverrideEnabled, setDynamicOverrideEnabled] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);

  // DB Scan & Replacer state
  const [isScanning, setIsScanning] = useState(false);
  const [animeMap, setAnimeMap] = useState<Record<string, string>>({});
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [detectedDomains, setDetectedDomains] = useState<DetectedDomain[]>([]);

  // Replacement Form
  const [oldDomainInput, setOldDomainInput] = useState('https://animesalt.ac');
  const [newDomainInput, setNewDomainInput] = useState('https://animesalt.link');
  const [scope, setScope] = useState<'abyss_only' | 'all_servers'>('abyss_only');

  // Preview & Migration state
  const [previewMatches, setPreviewMatches] = useState<MatchItem[] | null>(null);
  const [previewFilter, setPreviewFilter] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number } | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ updatedCount: number; animeCount: number } | null>(null);

  // Load server config on mount
  useEffect(() => {
    async function loadConfig() {
      const conf = await getServerConfig(true);
      setConfig(conf);
      if (conf.abyssBaseDomain) {
        setActiveAbyssBase(conf.abyssBaseDomain);
        setNewDomainInput(conf.abyssBaseDomain);
      }
      setDynamicOverrideEnabled(conf.dynamicOverrideEnabled ?? true);
    }
    loadConfig();
    scanDatabase();
  }, []);

  // Save Dynamic Config
  const handleSaveDynamicConfig = async () => {
    try {
      setIsSavingConfig(true);
      const cleanBase = normalizeBaseDomain(activeAbyssBase);
      await saveServerConfig({
        abyssBaseDomain: cleanBase,
        dynamicOverrideEnabled: dynamicOverrideEnabled,
      });
      setActiveAbyssBase(cleanBase);
      setConfigSavedSuccess(true);
      setTimeout(() => setConfigSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save server config:', err);
      alert('Failed to save settings to Firestore.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Scan Database for all anime & episodes
  const scanDatabase = async () => {
    try {
      setIsScanning(true);
      setPreviewMatches(null);
      setMigrationResult(null);

      // 1. Fetch anime titles
      const animeSnap = await getDocs(collection(db, 'anime'));
      const aMap: Record<string, string> = {};
      animeSnap.forEach((d) => {
        const data = d.data();
        aMap[d.id] = data.title || d.id;
      });
      setAnimeMap(aMap);

      // 2. Fetch all episodes
      const epSnap = await getDocs(collection(db, 'episodes'));
      const rawEps: Episode[] = [];
      const domainCountMap = new Map<string, { count: number; isAbyss: boolean }>();

      epSnap.forEach((d) => {
        const data = d.data() as Episode;
        const ep: Episode = {
          ...data,
          id: d.id,
          servers: Array.isArray(data.servers) ? data.servers : []
        };
        rawEps.push(ep);

        // Analyze domains
        ep.servers.forEach((s: ServerLink) => {
          if (!s.embedLink) return;
          const link = s.embedLink.trim();
          try {
            const urlObj = new URL(link);
            const base = `${urlObj.protocol}//${urlObj.host}`;
            const isAbyss =
              s.serverName === 'Abyss' ||
              link.includes('animesalt') ||
              link.includes('multi-lang-plyr') ||
              link.includes('player.php?data=');

            const current = domainCountMap.get(base) || { count: 0, isAbyss: false };
            domainCountMap.set(base, {
              count: current.count + 1,
              isAbyss: current.isAbyss || isAbyss,
            });
          } catch {
            // Ignore non-URL strings
          }
        });
      });

      setEpisodesList(rawEps);

      const detected: DetectedDomain[] = Array.from(domainCountMap.entries())
        .map(([domain, info]) => ({
          domain,
          count: info.count,
          isAbyss: info.isAbyss,
        }))
        .sort((a, b) => b.count - a.count);

      setDetectedDomains(detected);

      // Auto-set Old Domain input if an old AnimeSalt domain is found
      const oldAnimeSalt = detected.find(
        (d) => d.domain.includes('animesalt') && d.domain !== activeAbyssBase
      );
      if (oldAnimeSalt) {
        setOldDomainInput(oldAnimeSalt.domain);
      }
    } catch (err) {
      console.error('Error scanning episodes in DB:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Helper to calculate replacement
  const computeNewLink = (currentLink: string, oldDomain: string, newDomain: string): string | null => {
    if (!currentLink || !oldDomain || !newDomain) return null;
    const cleanOld = normalizeBaseDomain(oldDomain);
    const cleanNew = normalizeBaseDomain(newDomain);
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return null;

    // Check if currentLink matches old domain
    if (!currentLink.includes(cleanOld) && !currentLink.includes(cleanOld.replace(/^https?:\/\//, ''))) {
      return null;
    }

    try {
      const urlObj = new URL(currentLink);
      const targetObj = new URL(cleanNew);

      urlObj.protocol = targetObj.protocol;
      urlObj.host = targetObj.host;
      urlObj.port = targetObj.port;
      return urlObj.toString();
    } catch {
      return currentLink.replace(cleanOld, cleanNew);
    }
  };

  // Step 1: Scan & Preview matches
  const handleGeneratePreview = () => {
    const cleanOld = normalizeBaseDomain(oldDomainInput);
    const cleanNew = normalizeBaseDomain(newDomainInput);

    if (!cleanOld || !cleanNew) {
      alert('Please provide both Old Domain and New Domain.');
      return;
    }

    if (cleanOld === cleanNew) {
      alert('Old Domain and New Domain cannot be identical.');
      return;
    }

    const matches: MatchItem[] = [];

    episodesList.forEach((ep) => {
      const animeTitle = animeMap[ep.animeId] || ep.animeId || 'Unknown Anime';

      ep.servers.forEach((s, idx) => {
        if (!s.embedLink) return;

        const isAbyssServer =
          s.serverName === 'Abyss' ||
          s.embedLink.includes('animesalt') ||
          s.embedLink.includes('multi-lang-plyr') ||
          s.embedLink.includes('player.php?data=');

        if (scope === 'abyss_only' && !isAbyssServer) {
          return;
        }

        const newLink = computeNewLink(s.embedLink, cleanOld, cleanNew);
        if (newLink && newLink !== s.embedLink) {
          matches.push({
            animeId: ep.animeId,
            animeTitle,
            episodeId: ep.id,
            seasonId: ep.seasonId || 's1',
            episodeNumber: ep.episodeNumber,
            serverIndex: idx,
            serverName: s.serverName || (isAbyssServer ? 'Abyss' : 'Server'),
            serverType: s.serverType || (isAbyssServer ? 'multi' : 'sub'),
            oldLink: s.embedLink,
            newLink,
          });
        }
      });
    });

    setPreviewMatches(matches);
    setMigrationResult(null);
  };

  // Step 2: Batch Replace in Firestore
  const handleExecuteBatchMigration = async () => {
    if (!previewMatches || previewMatches.length === 0) return;

    const cleanOld = normalizeBaseDomain(oldDomainInput);
    const cleanNew = normalizeBaseDomain(newDomainInput);

    const confirmMsg = `Are you sure you want to update ${previewMatches.length} server links across ${
      new Set(previewMatches.map((m) => m.animeId)).size
    } anime in the database?\n\nFrom: ${cleanOld}\nTo: ${cleanNew}`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsMigrating(true);
      setMigrationProgress({ current: 0, total: previewMatches.length });

      // Group changes by episode ID
      const episodeUpdatesMap = new Map<string, { ep: Episode; modifiedServers: ServerLink[] }>();

      previewMatches.forEach((match) => {
        const existing = episodeUpdatesMap.get(match.episodeId);
        if (existing) {
          if (existing.modifiedServers[match.serverIndex]) {
            existing.modifiedServers[match.serverIndex] = {
              ...existing.modifiedServers[match.serverIndex],
              embedLink: match.newLink,
              serverName: match.serverName || 'Abyss',
              serverType: (match.serverType as any) || 'multi',
            };
          }
        } else {
          const originalEp = episodesList.find((e) => e.id === match.episodeId);
          if (originalEp) {
            const updatedServers = [...originalEp.servers];
            if (updatedServers[match.serverIndex]) {
              updatedServers[match.serverIndex] = {
                ...updatedServers[match.serverIndex],
                embedLink: match.newLink,
                serverName: match.serverName || 'Abyss',
                serverType: (match.serverType as any) || 'multi',
              };
            }
            episodeUpdatesMap.set(match.episodeId, {
              ep: originalEp,
              modifiedServers: updatedServers,
            });
          }
        }
      });

      const updateEntries = Array.from(episodeUpdatesMap.entries());
      const BATCH_SIZE = 350; // Keep safely below 500 limit
      let updatedCount = 0;

      for (let i = 0; i < updateEntries.length; i += BATCH_SIZE) {
        const chunk = updateEntries.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        chunk.forEach(([epId, { modifiedServers }]) => {
          const docRef = doc(db, 'episodes', epId);
          batch.update(docRef, { servers: modifiedServers });
        });

        await batch.commit();
        updatedCount += chunk.length;
        setMigrationProgress({ current: updatedCount, total: updateEntries.length });
      }

      // Record migration in server config
      const uniqueAnimeCount = new Set(previewMatches.map((m) => m.animeId)).size;
      await saveServerConfig({
        abyssBaseDomain: cleanNew,
        lastMigratedFrom: cleanOld,
        lastMigratedTo: cleanNew,
        lastMigratedCount: previewMatches.length,
      });

      setMigrationResult({
        updatedCount: previewMatches.length,
        animeCount: uniqueAnimeCount,
      });

      // Clear preview and re-scan DB to refresh stats
      setPreviewMatches(null);
      await scanDatabase();
    } catch (err) {
      console.error('Error executing batch migration:', err);
      alert('Error occurred during database update. Check console for details.');
    } finally {
      setIsMigrating(false);
      setMigrationProgress(null);
    }
  };

  // Filtered Preview Matches
  const filteredMatches = useMemo(() => {
    if (!previewMatches) return [];
    if (!previewFilter.trim()) return previewMatches;
    const q = previewFilter.toLowerCase();
    return previewMatches.filter(
      (m) =>
        m.animeTitle.toLowerCase().includes(q) ||
        `ep ${m.episodeNumber}`.includes(q) ||
        m.oldLink.toLowerCase().includes(q)
    );
  }, [previewMatches, previewFilter]);

  const totalAbyssLinks = useMemo(() => {
    return detectedDomains
      .filter((d) => d.isAbyss || d.domain.includes('animesalt'))
      .reduce((acc, d) => acc + d.count, 0);
  }, [detectedDomains]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-yoru-surface to-[#0D0F17] border border-purple-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-bold text-purple-300 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Abyss / Multi-Server Domain Manager
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              গ্লোবাল ডোমেইন রিপ্লেসার ও লাইভ সিঙ্ক
            </h2>
            <p className="text-sm text-yoru-text-muted leading-relaxed">
              Abyss (AnimeSalt) সার্ভারের ডোমেইন পরিবর্তন হলে প্রতিটি অ্যানিমেতে আলাদা করে যাওয়ার প্রয়োজন নেই। এখান থেকে 
              <strong className="text-white"> ১-ক্লিকে পুরো ডেটাবেজের সব এপিসোডের লিংক</strong> নতুন ডোমেইনে আপডেট করুন অথবা লাইভ রিরাইট চালু রাখুন।
            </p>
          </div>

          <button
            type="button"
            onClick={scanDatabase}
            disabled={isScanning}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-yoru-accent ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning DB...' : 'Rescan Database'}
          </button>
        </div>
      </div>

      {/* Grid: 1. Live Dynamic Override Card | 2. Detected Domains & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Live Player Dynamic Domain Fallback */}
        <div className="bg-yoru-surface border border-yoru-border rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    লাইভ প্লেয়ার ডোমেইন রিরাইট
                  </h3>
                  <p className="text-[11px] text-yoru-text-muted">Zero-Downtime Instant Stream</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dynamicOverrideEnabled}
                  onChange={(e) => setDynamicOverrideEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <p className="text-xs text-yoru-text-muted leading-relaxed">
              চালু থাকলে ব্যবহারকারী যখন কোনো অ্যানিমে দেখবে, প্লেয়ার স্বয়ংক্রিয়ভাবে যেকোনো পুরনো AnimeSalt লিংককে 
              নিচের অ্যাক্টিভ ডোমেইনে কনভার্ট করে লোড করবে।
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-yoru-text-muted">
                অ্যাক্টিভ Abyss Base URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-yoru-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={activeAbyssBase}
                  onChange={(e) => setActiveAbyssBase(e.target.value)}
                  placeholder="https://animesalt.link"
                  className="w-full bg-yoru-bg border border-yoru-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-yoru-accent"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveDynamicConfig}
              disabled={isSavingConfig}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {configSavedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Saved to Firestore!
                </>
              ) : isSavingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'সেটিংস সেভ করুন'
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Detected Domains & Live Database Breakdown */}
        <div className="lg:col-span-2 bg-yoru-surface border border-yoru-border rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    ডেটাবেজে সনাক্তকৃত ডোমেইনসমূহ
                  </h3>
                  <p className="text-[11px] text-yoru-text-muted">
                    {episodesList.length} Episodes Scanned • {totalAbyssLinks} Abyss Links Found
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                {detectedDomains.length} Domains Active
              </span>
            </div>

            <p className="text-xs text-yoru-text-muted">
              নিচের যেকোনো ডোমেইনে ক্লিক করলে তা সরাসরি <strong className="text-white">Old Domain</strong> ফিল্ডে যুক্ত হয়ে যাবে:
            </p>

            {/* Domain Badges */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
              {detectedDomains.length === 0 ? (
                <div className="text-xs text-yoru-text-muted py-4">No episode server links found yet.</div>
              ) : (
                detectedDomains.map((d) => (
                  <button
                    key={d.domain}
                    type="button"
                    onClick={() => setOldDomainInput(d.domain)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                      oldDomainInput === d.domain
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                        : d.isAbyss
                        ? 'bg-purple-950/30 border-purple-500/30 text-purple-300 hover:border-purple-400'
                        : 'bg-white/5 border-white/10 text-yoru-text hover:border-white/20'
                    }`}
                  >
                    <span>{d.domain}</span>
                    <span className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-white/70 group-hover:text-white">
                      {d.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {config?.lastMigratedFrom && config?.lastMigratedTo && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-yoru-text-muted">
              <span>
                সর্বশেষ মাইগ্রেশন: <strong className="text-white">{config.lastMigratedFrom}</strong> ➔{' '}
                <strong className="text-white">{config.lastMigratedTo}</strong>
              </span>
              <span className="text-emerald-400 font-bold">{config.lastMigratedCount || 0} links updated</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Migration Action Box */}
      <div className="bg-yoru-surface border border-yoru-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-yoru-accent" />
            ব্যাচ ডোমেইন রিপ্লেসমেন্ট টুল (Batch URL Replacer)
          </h3>
          <p className="text-xs text-yoru-text-muted mt-1">
            পুরনো ডোমেইন ও নতুন ডোমেইন সিলেক্ট করে প্রথমে <strong>"Scan & Preview"</strong> করুন, এরপর নিশ্চিত হয়ে ১-ক্লিকে ডেটাবেজের সব রেকর্ড আপডেট করুন।
          </p>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Domain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Old Domain / Prefix (যেটি পরিবর্তন করতে চান)
              </label>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-yoru-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={oldDomainInput}
                onChange={(e) => setOldDomainInput(e.target.value)}
                placeholder="https://animesalt.ac"
                className="w-full bg-yoru-bg border border-yoru-border rounded-xl pl-10 pr-3 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <p className="text-[11px] text-yoru-text-muted">
              উদাহরণ: <code>https://animesalt.ac</code> অথবা <code>https://animesalt.link</code>
            </p>
          </div>

          {/* New Domain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                New Domain / Prefix (নতুন ডোমেইন)
              </label>
              <button
                type="button"
                onClick={() => {
                  const temp = oldDomainInput;
                  setOldDomainInput(newDomainInput);
                  setNewDomainInput(temp);
                }}
                className="text-[10px] text-yoru-text-muted hover:text-white flex items-center gap-1 cursor-pointer"
                title="Swap Domains"
              >
                <ArrowLeftRight className="w-3 h-3" /> Swap
              </button>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-yoru-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder="https://animesalt.link"
                className="w-full bg-yoru-bg border border-yoru-border rounded-xl pl-10 pr-3 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-yoru-text-muted">
              উদাহরণ: <code>https://animesalt.link</code> অথবা <code>https://animesalt.top</code>
            </p>
          </div>
        </div>

        {/* Quick Presets & Scope */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-yoru-text-muted uppercase tracking-wider">Scope:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScope('abyss_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  scope === 'abyss_only'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-yoru-text-muted hover:text-white border border-white/5'
                }`}
              >
                Abyss Servers Only (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setScope('all_servers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  scope === 'all_servers'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-white/5 text-yoru-text-muted hover:text-white border border-white/5'
                }`}
              >
                All Servers
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isScanning || isMigrating}
              className="bg-yoru-accent hover:bg-yoru-accent/90 text-yoru-bg px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102"
            >
              <Search className="w-4 h-4" />
              Scan & Preview Changes
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {migrationResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 text-emerald-300">
            <div className="p-3 bg-emerald-500/20 rounded-full shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Database Migration Successful!</h4>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                সফলভাবে <strong className="text-white">{migrationResult.updatedCount} টি এপিসোড লিংক</strong> (
                {migrationResult.animeCount} টি অ্যানিমে) নতুন ডোমেইনে আপডেট করা হয়েছে।
              </p>
            </div>
          </div>
        )}

        {/* Live Progress Bar during migration */}
        {isMigrating && migrationProgress && (
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-2 text-purple-300">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                Updating Firestore database in batches...
              </span>
              <span>
                {migrationProgress.current} / {migrationProgress.total} (
                {Math.round((migrationProgress.current / migrationProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-yoru-accent transition-all duration-300 rounded-full"
                style={{
                  width: `${(migrationProgress.current / migrationProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Preview Results Table */}
        {previewMatches !== null && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-yoru-accent" />
                  Preview Matches ({previewMatches.length})
                </span>
                <span className="text-xs text-yoru-text-muted">
                  Across {new Set(previewMatches.map((m) => m.animeId)).size} Anime
                </span>
              </div>

              {previewMatches.length > 0 && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-yoru-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={previewFilter}
                      onChange={(e) => setPreviewFilter(e.target.value)}
                      placeholder="Filter anime / episode..."
                      className="w-full bg-yoru-bg border border-yoru-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-yoru-accent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteBatchMigration}
                    disabled={isMigrating}
                    className="bg-emerald-500 hover:bg-emerald-600 text-[#030407] font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg hover:scale-102 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    এক ক্লিকে সব আপডেট করুন ({previewMatches.length})
                  </button>
                </div>
              )}
            </div>

            {previewMatches.length === 0 ? (
              <div className="p-8 text-center bg-yoru-bg border border-yoru-border rounded-xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-yoru-warning mx-auto" />
                <p className="text-sm font-bold text-white">কোনো লিংক পাওয়া যায়নি</p>
                <p className="text-xs text-yoru-text-muted">
                  আপনার দেওয়া Old Domain ({oldDomainInput}) এর সাথে ডেটাবেজের কোনো এপিসোড লিংকের মিল পাওয়া যায়নি।
                </p>
              </div>
            ) : (
              <div className="border border-yoru-border rounded-xl overflow-hidden bg-yoru-bg">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-yoru-surface border-b border-yoru-border sticky top-0 z-10 text-[11px] uppercase font-bold text-yoru-text-muted">
                      <tr>
                        <th className="p-3">Anime</th>
                        <th className="p-3">Episode</th>
                        <th className="p-3">Server</th>
                        <th className="p-3">Current Link ➔ New Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredMatches.map((m, idx) => (
                        <tr key={`${m.episodeId}_${m.serverIndex}_${idx}`} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-sans font-bold text-white max-w-[160px] truncate">
                            {m.animeTitle}
                          </td>
                          <td className="p-3 text-yoru-text whitespace-nowrap">
                            {m.seasonId.toUpperCase()} Ep {m.episodeNumber}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-[10px]">
                              {m.serverName} ({m.serverType})
                            </span>
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="text-[11px] text-rose-400 line-through opacity-80 break-all max-w-xl truncate">
                              {m.oldLink}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-bold break-all max-w-xl truncate flex items-center gap-1.5">
                              <ArrowRight className="w-3 h-3 shrink-0" />
                              {m.newLink}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
