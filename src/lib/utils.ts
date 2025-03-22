import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  // generate a prefix sorted by time + a random suffix
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
