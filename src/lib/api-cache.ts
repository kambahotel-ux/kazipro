interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function cacheKey(path: string): string {
  return path;
}

export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000,
  force = false,
): Promise<T> {
  const now = Date.now();

  if (!force) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.data as T;
    }
  }

  if (!force) {
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise as Promise<T>;
}

/** Invalide le cache pour une clé exacte ou un préfixe de chemin. */
export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}
