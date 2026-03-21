'use client';

import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { subDays, format } from 'date-fns';

export function useAutoRestDay(): { notification: string | null; dismiss: () => void } {
  const { sessions, restDays, autoRestDays, addAutoRestDay } = useHistoryStore();
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // Already handled for yesterday?
    if (restDays.includes(yesterdayStr) || autoRestDays.includes(yesterdayStr)) return;

    // Did user train yesterday?
    const trainedYesterday = sessions.some(s => s.date === yesterdayStr);
    if (trainedYesterday) return;

    // Check if 2+ days missed (day before yesterday)
    const dayBeforeStr = format(subDays(today, 2), 'yyyy-MM-dd');
    const hadActivityDayBefore = sessions.some(s => s.date === dayBeforeStr)
      || restDays.includes(dayBeforeStr);

    addAutoRestDay(yesterdayStr);

    if (!hadActivityDayBefore) {
      setNotification('Mehrere Tage ohne Training — Rest Day für gestern wurde automatisch eingetragen.');
    } else {
      setNotification('Du hattest gestern vermutlich einen Rest Day — wurde automatisch eingetragen.');
    }
  }, []); // intentionally run only once on mount

  return { notification, dismiss: () => setNotification(null) };
}
