'use client';
import { useMemo } from 'react';
import { eachDayOfInterval, subWeeks, startOfWeek, format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface StreakCalendarProps {
  trainingDates: string[];
  restDays: string[];
  weeks?: number;
}

type DayType = 'training' | 'rest' | 'none' | 'future';

const DAY_COLORS: Record<DayType, string> = {
  training: '#4DFFED',
  rest:     '#2a2a2a',
  none:     '#161616',
  future:   'transparent',
};

export function StreakCalendar({ trainingDates, restDays, weeks = 14 }: StreakCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 }), [today, weeks]);

  const columns = useMemo(() => {
    const days = eachDayOfInterval({ start, end: today }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const type: DayType = date > today ? 'future'
        : trainingDates.includes(dateStr) ? 'training'
        : restDays.includes(dateStr) ? 'rest'
        : 'none';
      return { date, dateStr, type };
    });
    const cols: (typeof days)[] = [];
    let col: typeof days = [];
    days.forEach((d, i) => {
      col.push(d);
      if (col.length === 7 || i === days.length - 1) { cols.push(col); col = []; }
    });
    return cols;
  }, [trainingDates, restDays, start, today]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '4px' }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {col.map(day => (
              <div
                key={day.dateStr}
                title={`${format(day.date, 'EEE dd.MM', { locale: de })} — ${day.type === 'training' ? 'Training ✓' : day.type === 'rest' ? 'Rest Day' : '—'}`}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: DAY_COLORS[day.type],
                  border: day.type === 'training' ? '1px solid rgba(77,255,237,0.3)' : '1px solid rgba(255,255,255,0.04)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        {(['training', 'rest', 'none'] as DayType[]).map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: DAY_COLORS[t], border: '1px solid rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
              {t === 'training' ? 'Training' : t === 'rest' ? 'Rest' : 'Kein Eintrag'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
