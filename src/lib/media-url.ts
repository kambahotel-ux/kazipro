import { API_BASE_URL } from '@/lib/api';

/** Résout une URL média (aligné mobile `resolveMediaUrl`). */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const storageMarker = '/storage/';
    const idx = trimmed.indexOf(storageMarker);
    if (idx >= 0) {
      const path = trimmed.substring(idx + storageMarker.length);
      const origin = API_BASE_URL.replace(/\/api\/?$/, '');
      return `${origin}/api/fichiers/${path}`;
    }
    return trimmed;
  }

  const origin = API_BASE_URL.replace(/\/api\/?$/, '');

  if (trimmed.startsWith('/storage/')) {
    return `${origin}/api/fichiers/${trimmed.slice('/storage/'.length)}`;
  }

  if (trimmed.startsWith('/api/fichiers/')) {
    return `${origin}${trimmed}`;
  }

  if (trimmed.startsWith('storage/')) {
    return `${origin}/api/fichiers/${trimmed.slice('storage/'.length)}`;
  }

  if (trimmed.startsWith('api/fichiers/')) {
    return `${origin}/${trimmed}`;
  }

  // Chemin relatif disque public (ex. materiels/4/4/photo.png)
  if (!trimmed.includes('://') && !trimmed.startsWith('/')) {
    return `${origin}/api/fichiers/${trimmed}`;
  }

  return trimmed.startsWith('/') ? `${origin}${trimmed}` : trimmed;
}

export function materielMediaSrc(media: {
  url_resolue?: string;
  url?: string;
  path?: string;
}): string {
  const path = media.path?.trim();
  if (path) {
    const fromPath = resolveMediaUrl(path);
    if (fromPath) return fromPath;
  }
  const candidates = [media.url_resolue, media.url];
  for (const c of candidates) {
    const resolved = resolveMediaUrl(c);
    if (resolved) return resolved;
  }
  return '';
}
