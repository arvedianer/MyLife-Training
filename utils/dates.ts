import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns';
import { de } from 'date-fns/locale';

export function formatWorkoutDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Heute';
  if (isYesterday(date)) return 'Gestern';
  // differenceInCalendarDays respektiert Zeitzonen korrekt
  const daysAgo = differenceInCalendarDays(new Date(), date);
  if (daysAgo < 7) return `Vor ${daysAgo} Tagen`;
  return format(date, 'd. MMM yyyy', { locale: de });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTimeAgo(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: de });
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd. MMM', { locale: de });
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatWeight(weight: number): string {
  return weight % 1 === 0 ? `${weight}` : `${weight.toFixed(1)}`;
}

export function formatVolume(volume: number): string {
  if (volume === 0) return '—';
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
  return `${volume}kg`;
}
