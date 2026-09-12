import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  Sparkles, 
  Layers, 
  Terminal, 
  ExternalLink,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  getAnikotoSyncSettings, 
  saveAnikotoSyncSettings, 
  runAnikotoRecentSync,
  cleanupEmptyAnime
} from '../../lib/anikotoSyncService';
import { fetchMultiServerDataset } from '../../lib/multiServerService';
import { AnikotoSyncSettings, AnikotoSyncStats } from '../../types';
import axios from 'axios';

interface LogItem {
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const RecentAnimeSync: React.FC = () => {
  const [settings, setSettings] = useState<AnikotoSyncSettings>({
    autoSyncEnabled: true,
    intervalMinutes: 60,
    lastSyncStatus: 'idle',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isTogglingSwitch, setIsTogglingSwitch] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [perPageCount, setPerPageCount] = useState<number>(20);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Load initial settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getAnikotoSyncSettings();
        setSettings(data);
      } catch (e) {
        console.error('Failed to load Anikoto settings', e);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  };

  // Toggle Auto-Sync Switch
  const handleToggleAutoSync = async () => {
    setIsTogglingSwitch(true);
    const newValue = !settings.autoSyncEnabled;
    try {
      // 1. Update Firestore with user credentials & localStorage
      await saveAnikotoSyncSettings({ autoSyncEnabled: newValue });

      // 2. Optionally sync with server memory state
      try {
        await axios.post('/api/anikoto/settings', {
          autoSyncEnabled: newValue,
        });
      } catch (err) {
        // Optional server notification
      }

      setSettings((prev) => ({ ...prev, autoSyncEnabled: newValue }));
      addLog(
        newValue
          ? '24x Daily Auto-Sync enabled (Checks every 60 minutes).'
          : '24x Daily Auto-Sync disabled.',
        newValue ? 'success' : 'warning'
      );
    } catch (e: any) {
      addLog(`Failed to update auto-sync setting: ${e.message}`, 'error');
    } finally {
      setIsTogglingSwitch(false);
    }
  };

  // Trigger Manual Sync
  const handleRunSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setProgress({ current: 0, total: perPageCount });
    addLog(`Initiating manual check for recent anime (fetching up to ${perPageCount} items)...`, 'info');

    try {
      const result = await runAnikotoRecentSync({
        page: 1,
        perPage: perPageCount,
        onLog: (msg, type) => addLog(msg, type),
        onProgress: (cur, tot) => setProgress({ current: cur, total: tot }),
      });

      if (result.success) {
        addLog(`Sync finished successfully: ${result.message}`, 'success');
      } else {
        addLog(`Sync failed: ${result.message}`, 'error');
      }

      // Reload fresh settings
      const updated = await getAnikotoSyncSettings();
      setSettings(updated);
    } catch (e: any) {
      addLog(`Manual sync failed: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunCleanup = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog('Initiating cleanup of empty anime (0 episodes)...', 'info');
    try {
      const result = await cleanupEmptyAnime((msg, type) => addLog(msg, type));
      if (result.success) {
        addLog(`Cleanup successful. Removed ${result.removedCount} anime.`, 'success');
      }
    } catch (e: any) {
      addLog(`Cleanup failed: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncMultiServer = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog('Initiating MultiServer dataset fetch & cache update...', 'info');
    try {
      const data = await fetchMultiServerDataset(true);
      addLog(`MultiServer sync successful. Loaded ${data.anime.length} franchise groups into cache.`, 'success');
    } catch (e: any) {
      addLog(`MultiServer sync failed: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = settings.lastSyncStats;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-yoru-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <RotateCw className="w-6 h-6 text-yoru-accent" />
              Recent Anime Auto-Sync
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              24x Daily (Hourly)
            </span>
          </div>
          <p className="text-sm text-yoru-text-muted mt-1.5 max-w-2xl">
            Automatically synchronizes latest anime releases and newly added Sub/Dub episodes from{' '}
            <a 
              href="https://anikotoapi.site/recent-anime" 
              target="_blank" 
              rel="noreferrer" 
              className="text-yoru-accent hover:underline inline-flex items-center gap-1"
            >
              anikotoapi.site/recent-anime <ExternalLink className="w-3 h-3" />
            </a>.
          </p>
        </div>

        {/* Sync Now Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSyncMultiServer}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 font-semibold"
            title="Fetches and caches the latest MultiServer dataset"
          >
            <Database className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>Sync MultiServer</span>
          </Button>
          <Button
            onClick={handleRunCleanup}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold"
            title="Removes any existing anime from the database that currently have 0 sub and dub episodes."
          >
            <ShieldCheck className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>Cleanup Empty Anime</span>
          </Button>
          <Button
            onClick={handleRunSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-yoru-accent text-black font-semibold hover:bg-yoru-accent/90"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking API...' : 'Check Recent Anime Now'}</span>
          </Button>
        </div>
      </div>

      {/* Main Switch Card */}
      <div className="bg-yoru-surface border border-yoru-border rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-yoru-accent" />
              <span className="text-base font-semibold text-white">
                24x Daily Automated Check
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  settings.autoSyncEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-700/40 text-zinc-400 border border-zinc-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.autoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                />
                {settings.autoSyncEnabled ? 'Active (Every 60m)' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-yoru-text-muted">
              Runs 24 times every 24 hours. Detects brand new shows, imports missing episodes, and checks existing shows to add new Dub tracks if previously Sub-only.
            </p>
          </div>

          {/* Switch Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoSyncEnabled}
              disabled={isTogglingSwitch || isLoadingSettings}
              onClick={handleToggleAutoSync}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-yoru-bg ${
                settings.autoSyncEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoSyncEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-white w-14">
              {settings.autoSyncEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Sync Rule Explanations */}
        <div className="mt-6 pt-6 border-t border-yoru-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-yoru-text-muted">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">New Anime Added</span>
              If the show does not exist in library, creates anime & episodes with available Sub & Dub links.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <RotateCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Dub/Sub Upgraded</span>
              If a show was Sub-only yesterday and Dub dropped today, it immediately adds the new Dub track without overwriting existing data.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Duplicate Safe & Skip</span>
              If all episodes and Sub/Dub streams already exist, the anime is skipped cleanly to conserve server resources.
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible during sync) */}
      {isSyncing && (
        <div className="bg-yoru-surface border border-yoru-accent/30 rounded-xl p-5 space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-yoru-accent" />
              Scanning and matching with anikoto recent anime...
            </span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-2 bg-yoru-bg rounded-full overflow-hidden border border-yoru-border">
            <div
              className="h-full bg-yoru-accent transition-all duration-300 rounded-full"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-yoru-surface border border-yoru-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-yoru-text-muted font-medium">Scanned Total</span>
          <div className="text-2xl font-bold text-white">
            {stats?.totalChecked ?? 0}
          </div>
          <span className="text-[11px] text-zinc-500">from recent-anime</span>
        </div>

        <div className="bg-yoru-surface border border-yoru-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-emerald-400 font-medium">New Anime Added</span>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.newAnimeAdded ?? 0}
          </div>
          <span className="text-[11px] text-zinc-500">added to library</span>
        </div>

        <div className="bg-yoru-surface border border-yoru-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-blue-400 font-medium">Episodes Updated</span>
          <div className="text-2xl font-bold text-blue-400">
            {(stats?.episodesAdded ?? 0) + (stats?.episodesUpdated ?? 0)}
          </div>
          <span className="text-[11px] text-zinc-500">new episodes & dubs</span>
        </div>

        <div className="bg-yoru-surface border border-yoru-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Skipped (Up to date)</span>
          <div className="text-2xl font-bold text-zinc-300">
            {stats?.skippedCount ?? 0}
          </div>
          <span className="text-[11px] text-zinc-500">already matching</span>
        </div>
      </div>

      {/* Last Sync Info & Per Page Option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-yoru-text-muted bg-yoru-surface/50 border border-yoru-border px-5 py-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-yoru-accent" />
          <span>
            Last Checked:{' '}
            <strong className="text-white font-medium">
              {settings.lastSyncTimestamp
                ? new Date(settings.lastSyncTimestamp).toLocaleString()
                : 'Never'}
            </strong>
          </span>
          {settings.lastSyncStatus && (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                settings.lastSyncStatus === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : settings.lastSyncStatus === 'error'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-zinc-700/50 text-zinc-400'
              }`}
            >
              {settings.lastSyncStatus.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="perPageSelect" className="text-zinc-400">
            Items per scan:
          </label>
          <select
            id="perPageSelect"
            value={perPageCount}
            disabled={isSyncing}
            onChange={(e) => setPerPageCount(Number(e.target.value))}
            className="bg-yoru-bg border border-yoru-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-yoru-accent"
          >
            <option value={10}>10 items</option>
            <option value={20}>20 items</option>
            <option value={30}>30 items</option>
          </select>
        </div>
      </div>

      {/* Real-time Activity Log Terminal */}
      <div className="bg-yoru-surface border border-yoru-border rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-yoru-surface-elevated border-b border-yoru-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-yoru-accent" />
            <span className="text-xs font-mono font-semibold text-white tracking-wider uppercase">
              Live Sync Terminal
            </span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[11px] text-yoru-text-muted hover:text-white transition-colors"
          >
            Clear Console
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-1.5 bg-[#08090D]"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-500 italic py-6 text-center">
              No recent logs. Click "Check Recent Anime Now" or wait for scheduled 24x daily check.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-zinc-600 shrink-0 text-[10px] select-none">
                  [{log.time}]
                </span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'error'
                      ? 'text-red-400 font-semibold'
                      : log.type === 'warning'
                      ? 'text-amber-300'
                      : 'text-zinc-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
