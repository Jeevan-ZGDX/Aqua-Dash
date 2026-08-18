import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date, pattern = 'dd MMM yyyy, HH:mm'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [secs, unit] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function relativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}
