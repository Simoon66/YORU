import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(date: number | Date) {
  const now = Date.now();
  const time = new Date(date).getTime();
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function normalizeTitle(title: string): string {
  if (!title) return '';
  const lettersOnly = title.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
    return title
      .toLowerCase()
      .split(' ')
      .map(word => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ');
  }
  return title;
}

export function is18PlusAnime(anime?: {
  isAdult?: boolean;
  is18Plus?: boolean;
  genres?: string[];
  title?: string;
  rating?: string;
} | null): boolean {
  if (!anime) return false;
  if (anime.is18Plus || anime.isAdult) return true;

  if (Array.isArray(anime.genres)) {
    const adultKeywords = ['hentai', 'ecchi', '18+', 'adult', 'erotica', 'r18', 'mature'];
    if (anime.genres.some(g => typeof g === 'string' && adultKeywords.includes(g.trim().toLowerCase()))) {
      return true;
    }
  }

  if (typeof anime.rating === 'string') {
    const ratingLower = anime.rating.toLowerCase();
    if (ratingLower.includes('18+') || ratingLower.includes('rx') || ratingLower.includes('r18') || ratingLower.includes('hentai')) {
      return true;
    }
  }

  if (typeof anime.title === 'string') {
    if (/\b18\+\b/i.test(anime.title) || /\bR-?18\b/i.test(anime.title)) {
      return true;
    }
  }

  return false;
}
