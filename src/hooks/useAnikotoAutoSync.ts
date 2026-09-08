import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSuperAdmin } from '../lib/admin';
import { getAnikotoSyncSettings, runAnikotoRecentSync } from '../lib/anikotoSyncService';

const HOURLY_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes (24 times every 24 hours)

export function useAnikotoAutoSync() {
  const { user, profile } = useAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Only run if user is an authenticated Admin
    const isAdminUser = 
      isSuperAdmin(user?.email || profile?.email) || 
      profile?.role === 'admin';

    if (!isAdminUser) return;

    let timer: NodeJS.Timeout | null = null;

    async function checkAndSync() {
      if (isSyncingRef.current) return;

      try {
        const settings = await getAnikotoSyncSettings();
        if (!settings.autoSyncEnabled) return;

        const lastRun = settings.lastSyncTimestamp || 0;
        const elapsed = Date.now() - lastRun;

        // If at least 60 minutes have passed since last sync
        if (elapsed >= HOURLY_INTERVAL_MS) {
          isSyncingRef.current = true;
          console.log('[Anikoto Auto-Sync] Hourly scheduled check starting...');
          await runAnikotoRecentSync({
            page: 1,
            perPage: 20,
            onLog: (msg, type) => console.log(`[Auto-Sync ${type}] ${msg}`),
          });
          console.log('[Anikoto Auto-Sync] Scheduled check complete.');
        }
      } catch (err) {
        console.warn('[Anikoto Auto-Sync] Auto check failed:', err);
      } finally {
        isSyncingRef.current = false;
      }
    }

    // Check shortly after admin enters (3 seconds)
    const initialTimer = setTimeout(() => {
      checkAndSync();
    }, 3000);

    // Set recurring 60-minute interval
    timer = setInterval(checkAndSync, HOURLY_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      if (timer) clearInterval(timer);
    };
  }, [user, profile]);
}
