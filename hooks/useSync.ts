import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { useExerciseStore } from '@/store/exerciseStore';

export function useSync() {
  const [synced, setSynced] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (synced) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const loads = [
        useHistoryStore.getState().loadFromSupabase(user.id),
        usePlanStore.getState().loadFromSupabase(user.id),
        useExerciseStore.getState().loadFromSupabase(),
      ];

      Promise.all(loads)
        .then(() => {
          setSynced(true);
          setSyncError(false);
        })
        .catch((err) => {
          console.warn('[useSync] Sync failed — running in offline mode:', err);
          setSyncError(true);
          setSynced(true); // stop retrying, use local data
        });
    }).catch((err) => {
      console.warn('[useSync] Could not reach Supabase:', err);
      setSyncError(true);
    });
  }, [synced]);

  return { synced, syncError };
}
