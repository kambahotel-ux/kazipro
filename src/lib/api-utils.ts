/**
 * Helpers pour réponses API Laravel (pagination, listes).
 */

export function unwrapPaginated<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const r = response as { data?: T[] };
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

/** Réponse portfolio Laravel : `{ projets: [...] }` ou pagination. */
export function unwrapPortfolio<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const r = response as { projets?: T[]; data?: T[] };
    if (Array.isArray(r.projets)) return r.projets;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

export function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export function parsePaginatedMeta(response: unknown): PaginationMeta {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    const count = unwrapPaginated(response).length;
    return { current_page: 1, last_page: 1, per_page: count || 15, total: count, from: count ? 1 : null, to: count || null };
  }
  const r = response as Record<string, unknown>;
  const total = Number(r.total ?? unwrapPaginated(response).length);
  return {
    current_page: Number(r.current_page ?? 1),
    last_page: Number(r.last_page ?? 1),
    per_page: Number(r.per_page ?? 15),
    total,
    from: r.from != null ? Number(r.from) : null,
    to: r.to != null ? Number(r.to) : null,
  };
}
