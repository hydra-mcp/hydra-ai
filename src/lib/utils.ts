import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from '@/hooks/use-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  // generate a prefix sorted by time + a random suffix
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function copyToClipboard(text: string, showToast = true) {
  if (!navigator.clipboard) {
    console.error('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);

    if (showToast) {
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
        duration: 2000,
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);

    if (showToast) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }

    return false;
  }
}
