import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PICOType } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined, format: 'short' | 'long' | 'year' = 'short'): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    if (format === 'year') return date.getFullYear().toString();
    if (format === 'long') {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function truncate(text: string, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPercentage(n: number): string {
  return `${n.toFixed(1)}%`;
}

const PICO_COLORS: Record<PICOType, string> = {
  P: 'bg-pico-p-bg text-pico-p',
  I: 'bg-pico-i-bg text-pico-i',
  C: 'bg-pico-c-bg text-pico-c',
  O: 'bg-pico-o-bg text-pico-o',
};

export function getPICOColor(type: PICOType): string {
  return PICO_COLORS[type] || '';
}

export function getPICOBorderColor(type: PICOType): string {
  const map: Record<PICOType, string> = {
    P: 'border-pico-p/30',
    I: 'border-pico-i/30',
    C: 'border-pico-c/30',
    O: 'border-pico-o/30',
  };
  return map[type] || '';
}

export function getPICOLabel(type: PICOType): string {
  const labels: Record<PICOType, string> = {
    P: 'Population',
    I: 'Intervention',
    C: 'Comparator',
    O: 'Outcome',
  };
  return labels[type] || type;
}

/**
 * Highlights PICO terms in abstract text, returning an array of text segments
 * with optional PICO type tags for coloring.
 */
export function highlightPICOKeywords(
  text: string,
  terms: { text: string; type: PICOType }[]
): Array<{ text: string; type: PICOType | null }> {
  if (!text || terms.length === 0) {
    return [{ text, type: null }];
  }

  // Sort terms by length descending to match longer terms first
  const sortedTerms = [...terms].sort((a, b) => b.text.length - a.text.length);

  // Build a regex that matches any term (case-insensitive)
  const escaped = sortedTerms.map((t) => t.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);
  const result: Array<{ text: string; type: PICOType | null }> = [];

  for (const part of parts) {
    if (!part) continue;
    const matchedTerm = sortedTerms.find((t) => t.text.toLowerCase() === part.toLowerCase());
    result.push({ text: part, type: matchedTerm ? matchedTerm.type : null });
  }

  return result;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
