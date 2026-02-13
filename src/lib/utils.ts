import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(endpoint: string): string {
  const apiBase = (import.meta.env.VITE_API_URL || '').trim();
  
  // Clean up endpoint to ensure it starts with / and doesn't have double /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (apiBase) {
    // If explicit API URL is set (e.g. production pointing to separate backend)
    return `${apiBase.replace(/\/$/, '')}${cleanEndpoint}`;
  }
  
  // Default to relative path (Vite proxy in dev, same-origin in prod)
  return cleanEndpoint;
}
