/**
 * Service API pour communiquer avec le backend Laravel
 */

import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/auth-token';
import { setStoredUser } from '@/lib/auth-session';
import { unwrapPaginated } from '@/lib/api-utils';
import { cachedGet, cacheKey, invalidateApiCache } from '@/lib/api-cache';
import type { AppUser } from '@/types/auth';

export { invalidateApiCache };

const TTL = {
  demandes: 30_000,
  notifications: 60_000,
  professions: 300_000,
  adminStats: 30_000,
  adminList: 60_000,
  litiges: 30_000,
  devis: 60_000,
} as const;

function cachedRequest<T>(path: string, ttlMs: number, force = false): Promise<T> {
  return cachedGet(cacheKey(path), () => request<T>(path), ttlMs, force);
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';
const API_URL = API_BASE_URL;
const SANCTUM_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

function getXsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${SANCTUM_BASE_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
}

async function csrfHeadersForMutating(method: string, endpoint: string): Promise<HeadersInit> {
  const normalized = method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalized)) {
    return {};
  }

  // API Bearer token : pas de CSRF Sanctum (session cookie)
  if (getAuthToken()) {
    return {};
  }

  // Auth publique : le token est renvoyé dans le JSON, pas via cookie
  if (PUBLIC_AUTH_PATHS.some((p) => endpoint.includes(p))) {
    return {};
  }

  if (!getXsrfTokenFromCookie()) {
    await ensureCsrfCookie();
  }
  const token = getXsrfTokenFromCookie();
  return token ? { 'X-XSRF-TOKEN': token } : {};
}

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/otp/',
];

// Configuration des headers par défaut
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Fonction générique pour les requêtes
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';
  const csrfHeaders = await csrfHeadersForMutating(method, endpoint);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const config: RequestInit = {
    ...options,
    signal: options.signal ?? controller.signal,
    headers: {
      ...getHeaders(!PUBLIC_AUTH_PATHS.some((p) => endpoint.includes(p))),
      ...csrfHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Une erreur est survenue'
      }));
      throw new ApiError(
        error.message || `HTTP error! status: ${response.status}`,
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Délai de réponse API dépassé. Vérifiez que le serveur est démarré.', 0);
    }
    console.error('API Error:', error);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// ============================================
// HEALTH
// ============================================

export const healthApi = {
  check: async () => request<{ status: string; app?: string }>('/health'),
};

export const profilApi = {
  get: async () => request<AppUser>('/profil'),
  update: async (data: { name?: string; email?: string }) =>
    request<any>('/profil', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// AUTHENTIFICATION
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.user) {
      setStoredUser(response.user);
    }
    
    return response;
  },

  register: async (data: {
    email: string;
    password: string;
    password_confirmation?: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    ville?: string;
    role: 'client' | 'prestataire';
    type_personne?: 'physique' | 'morale';
    profession_id?: number;
    raison_sociale?: string;
  }) => {
    const response = await request<{ token?: string; user?: AppUser; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        password_confirmation: data.password_confirmation ?? data.password,
        ...data,
      }),
    });
    if (response.token) setAuthToken(response.token);
    if (response.user) setStoredUser(response.user);
    return response;
  },

  googleToken: async (idToken: string, role?: 'client' | 'prestataire') => {
    const response = await request<{ token?: string; user?: AppUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken, role }),
    });
    if (response.token) setAuthToken(response.token);
    if (response.user) setStoredUser(response.user);
    return response;
  },

  logout: async () => {
    const response = await request<any>('/auth/logout', {
      method: 'POST',
    });
    clearAuthToken();
    return response;
  },

  getMe: async (): Promise<AppUser> => {
    return request<AppUser>('/auth/me');
  },

  forgotPassword: async (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** @deprecated Utiliser profilApi.update */
  updateProfile: async (data: { name?: string; email?: string }) =>
    profilApi.update(data),
};

// ============================================
// PRESTATAIRES
// ============================================

export type PrestataireDashboardResponse = {
  marche: {
    opportunites_publiques: number;
    invitations_directes: number;
    invitations_en_attente: number;
    demandes_urgentes: number;
    total_opportunites: number;
  };
  chantiers: {
    missions_en_cours: number;
    missions_completees: number;
    missions_en_attente: number;
    revenus_generes_fc: number;
  };
  devis: {
    total: number;
    envoyes: number;
    acceptes: number;
    taux_acceptation: number;
    revenus_mois_fc: number;
  };
  profil: {
    note_moyenne: number;
    nb_avis: number;
    nb_missions: number;
    disponible: boolean;
    statut_validation: string;
    certifie: boolean;
  };
  litiges: {
    total: number;
    en_cours: number;
  };
  opportunites_recentes: Array<{
    id: number | string;
    titre: string;
    ville?: string | null;
    quartier?: string | null;
    urgence?: string;
    budget_max?: number | null;
    budget_min?: number | null;
    created_at?: string;
    nombre_devis?: number;
    type?: string;
  }>;
  missions_actives: Array<{
    id: number | string;
    statut: string;
    titre: string;
    client_nom?: string | null;
    montant_ttc?: number | string | null;
    created_at?: string;
  }>;
};

export const prestatairesApi = {
  getAll: async (
    params?: {
      type_prestataire?: string;
      profession_id?: number | string;
      ville?: string;
      disponible?: boolean;
      search?: string;
      page?: number;
      per_page?: number;
    },
    options?: { force?: boolean },
  ) => {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : "";

    return cachedRequest<any>(`/prestataires${queryString}`, 90_000, options?.force);
  },

  getById: async (id: string) => {
    return request<any>(`/prestataires/${id}`);
  },

  getDashboard: async (options?: { force?: boolean }) => {
    return cachedRequest<PrestataireDashboardResponse>(
      "/prestataires/dashboard",
      60_000,
      options?.force,
    );
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await request<any>(`/prestataires/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    invalidateApiCache("/prestataires");
    return res;
  },

  getPortfolio: async (id: string) => {
    return request<any>(`/prestataires/${id}/portfolio`);
  },

  certifier: async (
    id: string | number,
    data: {
      numero_rccm?: string;
      document_rccm?: File;
      document_rccm_url?: string;
      piece_identite?: File;
      piece_identite_url?: string;
    },
  ) => {
    const formData = new FormData();
    if (data.numero_rccm) formData.append('numero_rccm', data.numero_rccm);
    if (data.document_rccm) formData.append('document_rccm', data.document_rccm);
    if (data.document_rccm_url) formData.append('document_rccm_url', data.document_rccm_url);
    if (data.piece_identite) formData.append('piece_identite', data.piece_identite);
    if (data.piece_identite_url) formData.append('piece_identite_url', data.piece_identite_url);
    return uploadMultipart(`/prestataires/${id}/certifier`, formData);
  },

  getOnlineCount: async () => {
    const res = await cachedRequest<{ total?: number; data?: unknown[] }>(
      "/prestataires?disponible=1&per_page=1",
      90_000,
    );
    if (typeof res.total === "number") {
      return { count: res.total };
    }
    const data = res.data;
    return { count: Array.isArray(data) ? data.length : 0 };
  },
};

// ============================================
// DEVIS
// ============================================

export const devisApi = {
  getAll: async (
    params?: {
      page?: number;
      per_page?: number;
      search?: string;
      statut?: string;
      date_from?: string;
      date_to?: string;
    },
    options?: { force?: boolean },
  ) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return cachedRequest<any>(`/devis${queryString}`, TTL.devis, options?.force);
  },

  getById: async (id: string) => {
    return request<any>(`/devis/${id}`);
  },

  create: async (data: any) => {
    const res = await request<any>('/devis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/devis');
    return res;
  },

  update: async (id: string, data: any) => {
    const res = await request<any>(`/devis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/devis');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<any>(`/devis/${id}`, {
      method: 'DELETE',
    });
    invalidateApiCache('/devis');
    return res;
  },

  accepter: async (id: string) => {
    const res = await request<any>(`/devis/${id}/accepter`, {
      method: 'POST',
    });
    invalidateApiCache('/devis');
    invalidateApiCache('/contrats');
    return res;
  },

  refuser: async (id: string, data?: { motif_refus?: string }) => {
    const res = await request<any>(`/devis/${id}/refuser`, {
      method: 'POST',
      body: JSON.stringify(data ?? { motif_refus: 'Refusé par le client' }),
    });
    invalidateApiCache('/devis');
    return res;
  },
};

// ============================================
// CONTRATS
// ============================================

export const contratsApi = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    statut?: string;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return request<any>(`/contrats${queryString}`);
  },

  getById: async (id: string) => {
    return request<any>(`/contrats/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/contrats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/contrats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  signer: async (id: string, data: any) => {
    return request<any>(`/contrats/${id}/signer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generatePdf: async (id: string) => {
    return request<{ contrat_id?: number; pdf_path?: string; url?: string }>(
      `/contrats/${id}/pdf?format=json`,
    );
  },

  downloadPdfBlob: async (id: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/contrats/${id}/pdf`, {
      headers: {
        Accept: 'application/pdf',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Impossible de télécharger le PDF du contrat');
    }
    return response.blob();
  },
};

// ============================================
// PAIEMENTS
// ============================================

export const paiementsApi = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/paiements${qs}`);
  },

  payerAcompte: async (data: {
    contrat_id: string | number;
    methode?: string;
    reference_externe?: string;
  }) => {
    return request<any>('/paiements/acompte', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  payerSolde: async (data: {
    contrat_id: string | number;
    methode?: string;
    reference_externe?: string;
  }) => {
    return request<any>('/paiements/solde', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: async (id: string) => {
    return request<any>(`/paiements/${id}`);
  },

  getByContrat: async (contratId: string) => {
    const all = await paiementsApi.getAll({ per_page: 100 });
    const rows = Array.isArray(all) ? all : all.data ?? [];
    return rows.filter(
      (p: { contrat_id?: string | number }) => String(p.contrat_id) === String(contratId),
    );
  },

  valider: async (id: string | number) =>
    request<any>(`/paiements/${id}/valider`, { method: 'POST' }),
};

// ============================================
// AVIS
// ============================================

export const avisApi = {
  getByPrestataire: async (prestataireId: string) => {
    const prestataire = await prestatairesApi.getById(prestataireId);
    const avisList: unknown[] = [];

    try {
      const missionsRes = await missionsApi.getAll({ per_page: 100 });
      const missions = unwrapPaginated<{ id: string | number; prestataire_id?: string | number }>(
        missionsRes,
      );
      const relevant = missions.filter(
        (m) => String(m.prestataire_id) === String(prestataireId),
      );
      const details = await Promise.all(
        relevant.map((m) => missionsApi.getById(String(m.id)).catch(() => null)),
      );
      for (const detail of details) {
        const avis = (detail as { avis?: unknown } | null)?.avis;
        if (avis) avisList.push(avis);
      }
    } catch {
      // Profil public ou rôle sans accès missions
    }

    return {
      data: avisList,
      avis: avisList,
      note_moyenne: prestataire.note_moyenne,
      nb_avis: prestataire.nb_avis ?? avisList.length,
    };
  },

  getMine: async () => {
    const missionsRes = await missionsApi.getAll({ per_page: 100 });
    const missions = Array.isArray(missionsRes) ? missionsRes : missionsRes.data ?? [];
    const details = await Promise.all(
      missions.map((m: { id: string | number }) => missionsApi.getById(String(m.id)).catch(() => null)),
    );
    return details
      .map((m) => (m as { avis?: unknown } | null)?.avis)
      .filter(Boolean);
  },

  create: async (data: {
    mission_id: string | number;
    note: number;
    commentaire?: string;
  }) => {
    return request<any>('/avis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  repondre: async (id: string, reponse: string) => {
    return request<any>(`/avis/${id}/reponse`, {
      method: 'POST',
      body: JSON.stringify({ reponse_prestataire: reponse }),
    });
  },
};

// ============================================
// LITIGES
// ============================================

export const litigesApi = {
  getAll: async (params?: { page?: number; per_page?: number }, options?: { force?: boolean }) => {
    const queryString = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            },
            {} as Record<string, string>,
          ),
        ).toString()
      : '';
    return cachedRequest<any>(`/litiges${queryString}`, TTL.litiges, options?.force);
  },

  create: async (data: {
    mission_id: string | number;
    sujet: string;
    description: string;
    preuves?: unknown[];
  }) => {
    const res = await request<{ message: string; litige?: unknown }>('/litiges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/litiges');
    return res;
  },

  getById: async (id: string) => {
    return request<any>(`/litiges/${id}`);
  },

  update: async (
    id: string,
    data: Partial<{ sujet: string; description: string; preuves: unknown[]; statut: string }>,
  ) =>
    request<any>(`/litiges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: async (id: string) =>
    request<any>(`/litiges/${id}`, { method: 'DELETE' }),

  resoudre: async (
    id: string,
    data: {
      resolution: string;
      decision: 'remboursement_client' | 'paiement_prestataire' | 'partage' | 'reprise_mission';
      pct_client?: number;
      pct_prestataire?: number;
    },
  ) => adminApi.resoudreLitige(id, data),
};

/** @deprecated Utiliser litigesApi */
export const disputesApi = litigesApi;

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsApi = {
  getAll: async (options?: { force?: boolean }) => {
    return cachedRequest<any>('/notifications', TTL.notifications, options?.force);
  },

  marquerLu: async (id: string) => {
    const res = await request<any>(`/notifications/${id}/lire`, {
      method: 'POST',
    });
    invalidateApiCache('/notifications');
    return res;
  },

  marquerToutLu: async () => {
    const res = await request<any>('/notifications/lire-tout', {
      method: 'POST',
    });
    invalidateApiCache('/notifications');
    return res;
  },
};

// ============================================
// DEMANDES DE SERVICE
// ============================================

export const demandesApi = {
  getAll: async (params?: {
    statut?: string;
    statut_ui?: string;
    urgence?: string;
    search?: string;
    profession?: string;
    localisation?: string;
    page?: number;
    per_page?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return cachedRequest<any>(`/demandes${queryString}`, TTL.demandes);
  },

  getById: async (id: string) => {
    return request<any>(`/demandes/${id}`);
  },

  create: async (data: any) => {
    const res = await request<any>('/demandes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/demandes');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  update: async (id: string, data: any) => {
    const res = await request<any>(`/demandes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/demandes');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<any>(`/demandes/${id}`, {
      method: 'DELETE',
    });
    invalidateApiCache('/demandes');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  annuler: async (id: string) => {
    const res = await request<any>(`/demandes/${id}/annuler`, {
      method: 'POST',
    });
    invalidateApiCache('/demandes');
    return res;
  },

  inviter: async (id: string, data: { prestataire_id: string | number; message?: string }) => {
    const res = await request<any>(`/demandes/${id}/inviter`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/demandes');
    return res;
  },
};

// ============================================
// PROFESSIONS/SERVICES
// ============================================

export const professionsApi = {
  getAll: async () => cachedRequest<any>('/professions', TTL.professions),

  getById: async (id: string) => request<any>(`/professions/${id}`),
};

export const adminProfessionsApi = {
  create: async (data: { nom: string; description?: string | null; actif?: boolean }) =>
    request<any>('/admin/professions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: async (
    id: string,
    data: Partial<{ nom: string; description: string | null; actif: boolean }>,
  ) =>
    request<any>(`/admin/professions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: async (id: string) =>
    request<any>(`/admin/professions/${id}`, { method: 'DELETE' }),
};

// ============================================
// CATÉGORIES MATÉRIEL (LOCATION)
// ============================================

export type MaterielCategoriePayload = {
  nom: string;
  slug?: string;
  icone?: string;
  ordre?: number;
  caution_pct_min?: number;
  caution_pct_max?: number;
  caution_pct_defaut?: number;
};

export const materielCategoriesApi = {
  getAll: async () => {
    const res = await cachedRequest<{ categories?: unknown[] } | unknown[]>(
      '/materiel-categories',
      TTL.professions,
    );
    if (Array.isArray(res)) return res;
    return res.categories ?? [];
  },
};

export const materielsApi = {
  getAll: async (params?: {
    q?: string;
    categorie_id?: number;
    ville?: string;
    page?: number;
    per_page?: number;
    prix_jour_min?: number;
    prix_jour_max?: number;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/materiels${qs}`);
  },

  getById: async (id: string | number) => {
    const res = await request<{
      materiel: Record<string, unknown>;
      caution?: Record<string, unknown>;
    }>(`/materiels/${id}`);
    if (res.materiel) {
      return {
        ...res.materiel,
        caution_info: res.caution,
      };
    }
    return res;
  },
};

export const adminMaterielCategoriesApi = {
  create: async (data: MaterielCategoriePayload) => {
    const res = await request<any>('/admin/materiel-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/materiel-categories');
    return res;
  },

  update: async (id: string, data: Partial<MaterielCategoriePayload>) => {
    const res = await request<any>(`/admin/materiel-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/materiel-categories');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<any>(`/admin/materiel-categories/${id}`, {
      method: 'DELETE',
    });
    invalidateApiCache('/materiel-categories');
    return res;
  },
};

// ============================================
// FRAIS DE DÉPLACEMENT
// ============================================

export const fraisDeplacementApi = {
  get: async (prestataireId: string | number) => {
    return request<any>(`/prestataires/${prestataireId}/frais-deplacement`);
  },

  save: async (
    prestataireId: string | number,
    data: {
      ville_origine: string;
      ville_destination: string;
      montant: number;
      unite?: string;
    },
  ) => {
    return request<any>(`/prestataires/${prestataireId}/frais-deplacement`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string | number,
    data: Partial<{
      ville_origine: string;
      ville_destination: string;
      montant: number;
      unite: string;
      actif: boolean;
    }>,
  ) => {
    return request<any>(`/frais-deplacement/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string | number) => {
    return request<any>(`/frais-deplacement/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// MESSAGERIE
// ============================================

export const messagesApi = {
  getConversations: async () => {
    return request<any>('/conversations');
  },

  getMessages: async (userId: string | number) => {
    return request<any>(`/conversations/${userId}`);
  },

  send: async (userId: string | number, data: { contenu: string; demande_id?: string | number }) => {
    return request<any>(`/conversations/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// CONFIG PAIEMENT
// ============================================

export const configPaiementApi = {
  get: async () => request<any>('/config-paiement'),
  adminGet: async () => request<any>('/admin/config-paiement'),
  adminUpdate: async (data: Record<string, unknown>) =>
    request<any>('/admin/config-paiement', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// MISSIONS
// ============================================

export const missionsApi = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/missions${qs}`);
  },

  getById: async (id: string | number) => request<any>(`/missions/${id}`),

  terminer: async (id: string | number, rapport_prestataire: string) =>
    request<any>(`/missions/${id}/terminer`, {
      method: 'POST',
      body: JSON.stringify({ rapport_prestataire }),
    }),

  valider: async (id: string | number) =>
    request<any>(`/missions/${id}/valider`, { method: 'POST' }),
};

// ============================================
// WALLET
// ============================================

export const walletApi = {
  get: async () => request<any>('/wallet'),
  mouvements: async (params?: {
    statut_escrow?: string;
    statut?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/wallet/mouvements${qs}`);
  },
};

// ============================================
// CLIENTS
// ============================================

export const clientsApi = {
  getById: async (id: string) => request<any>(`/clients/${id}`),
  update: async (id: string, data: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    ville?: string;
    quartier?: string;
  }) =>
    request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// UPLOAD
// ============================================

async function uploadMultipart(path: string, formData: FormData, method = 'POST') {
  const token = getAuthToken();
  const csrfHeaders = await csrfHeadersForMutating(method, path);
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json',
      ...csrfHeaders,
    },
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur upload' }));
    throw new Error(error.message || 'Erreur upload');
  }
  return response.json();
}

export const uploadApi = {
  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return uploadMultipart('/upload/avatar', formData);
  },

  uploadPortfolioProject: async (
    prestataireId: string | number,
    data: { titre: string; description?: string; images: File[] },
  ) => {
    const formData = new FormData();
    formData.append('titre', data.titre);
    if (data.description) formData.append('description', data.description);
    data.images.forEach((file) => formData.append('images[]', file));
    return uploadMultipart(`/prestataires/${prestataireId}/portfolio`, formData);
  },

  uploadDemandeImages: async (files: File[], demandeId: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossier', `demandes/${demandeId}`);
      const uploaded = await uploadMultipart('/upload/document', formData);
      if (uploaded.url) urls.push(String(uploaded.url));
    }

    if (urls.length > 0) {
      await demandesApi.update(demandeId, { photos: urls });
    }

    return { urls };
  },

  uploadDocument: async (
    file: File,
    dossier: 'cni' | 'rccm' | 'id_nat' | 'autre' | 'certification' | string = 'documents',
    _legacyUserId?: string,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dossier', dossier);
    return uploadMultipart('/upload/document', formData);
  },
};

// ============================================
// PORTFOLIO
// ============================================

export const portfolioApi = {
  getById: async (id: string | number) => request<any>(`/portfolio/${id}`),

  create: async (
    prestataireId: string | number,
    data: { titre: string; description?: string; images: File[] },
  ) => uploadApi.uploadPortfolioProject(prestataireId, data),

  update: async (
    id: string | number,
    data: {
      titre?: string;
      description?: string;
      images?: File[];
      supprimer_images?: string[];
    },
  ) => {
    const formData = new FormData();
    if (data.titre) formData.append('titre', data.titre);
    if (data.description) formData.append('description', data.description);
    data.images?.forEach((file) => formData.append('images[]', file));
    data.supprimer_images?.forEach((url) => formData.append('supprimer_images[]', url));
    return uploadMultipart(`/portfolio/${id}`, formData, 'PUT');
  },

  delete: async (id: string | number) =>
    request<any>(`/portfolio/${id}`, { method: 'DELETE' }),
};

// ============================================
// ADMIN
// ============================================

export const adminApi = {
  getStats: async () => cachedRequest<any>('/admin/stats', TTL.adminStats),

  getDashboard: async (options?: { force?: boolean }) =>
    cachedRequest<any>('/admin/dashboard', TTL.adminStats, options?.force),

  getUsers: async (params?: {
    type?: 'all' | 'client' | 'prestataire';
    status?: 'all' | 'active' | 'inactive' | 'suspended';
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/users${qs}`);
  },

  getUser: (id: string | number) => request<any>(`/admin/users/${id}`),

  suspendUser: async (id: string | number, motif_rejet: string) => {
    const res = await request<any>(`/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ motif_rejet }),
    });
    invalidateApiCache('/admin/users');
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  reactivateUser: async (id: string | number) => {
    const res = await request<any>(`/admin/users/${id}/reactivate`, { method: 'POST' });
    invalidateApiCache('/admin/users');
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  deleteUser: async (id: string | number) => {
    const res = await request<any>(`/admin/users/${id}`, { method: 'DELETE' });
    invalidateApiCache('/admin/users');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  getPrestataires: async (params?: {
    statut_validation?: string;
    statut_certification?: string;
    page?: number;
    per_page?: number;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return cachedRequest<any>(`/admin/prestataires${qs}`, TTL.adminList);
  },

  validerPrestataire: async (id: string | number) => {
    const res = await request<any>(`/admin/prestataires/${id}/valider`, { method: 'POST' });
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  rejeterPrestataire: async (id: string | number, motif_rejet: string) => {
    const res = await request<any>(`/admin/prestataires/${id}/rejeter`, {
      method: 'POST',
      body: JSON.stringify({ motif_rejet }),
    });
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  approuverCertification: async (id: string | number) => {
    const res = await request<any>(`/admin/prestataires/${id}/certification/approuver`, { method: 'POST' });
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  rejeterCertification: async (id: string | number, motif_rejet_certification: string) => {
    const res = await request<any>(`/admin/prestataires/${id}/certification/rejeter`, {
      method: 'POST',
      body: JSON.stringify({ motif_rejet_certification }),
    });
    invalidateApiCache('/admin/prestataires');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  approuverDemande: async (id: string | number) => {
    const res = await request<any>(`/admin/demandes/${id}/approuver`, { method: 'POST' });
    invalidateApiCache('/demandes');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  rejeterDemande: async (id: string | number, motif_rejet_moderation?: string) => {
    const res = await request<any>(`/admin/demandes/${id}/rejeter`, {
      method: 'POST',
      body: JSON.stringify({ motif_rejet_moderation }),
    });
    invalidateApiCache('/demandes');
    invalidateApiCache('/admin/stats');
    invalidateApiCache('/admin/dashboard');
    return res;
  },

  getTransactions: async (params?: {
    page?: number;
    per_page?: number;
    q?: string;
    type?: string;
    statut?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/transactions${qs}`);
  },

  getLitiges: async (params?: {
    statut?: string;
    statut_group?: 'actifs' | 'clos';
    domain?: 'mission' | 'location';
    q?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    include_stats?: boolean;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '' && v !== false) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/litiges${qs}`);
  },

  resoudreLitige: async (
    id: string | number,
    data: {
      resolution: string;
      decision:
        | 'remboursement_client'
        | 'paiement_prestataire'
        | 'partage'
        | 'reprise_mission'
        | 'remboursement_locataire'
        | 'retenue_loueur'
        | 'partage_caution'
        | 'degeler';
      pct_client?: number;
      pct_prestataire?: number;
      pct_locataire?: number;
      pct_loueur?: number;
    },
  ) => {
    const res = await request<any>(`/admin/litiges/${id}/resoudre`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/admin/litiges');
    invalidateApiCache('/litiges');
    return res;
  },

  getConfigNotifications: async () => request<any>('/admin/config-notifications'),

  updateConfigNotifications: async (data: Record<string, unknown>) =>
    request<any>('/admin/config-notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getLocationStats: async () => request<any>('/admin/location/stats'),

  getLocationContrats: async (params?: {
    statut?: string;
    q?: string;
    page?: number;
    date_from?: string;
    date_to?: string;
    location_date_from?: string;
    location_date_to?: string;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/location/contrats${qs}`);
  },

  getLocationContrat: async (id: string | number) => {
    const res = await request<{ contrat: Record<string, unknown> }>(`/admin/location/contrats/${id}`);
    return res.contrat ?? res;
  },

  getMateriels: async (params?: {
    statut?: string;
    q?: string;
    page?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/materiels${qs}`);
  },

  getMateriel: async (id: string | number) => {
    const res = await request<{ materiel: Record<string, unknown> }>(`/admin/materiels/${id}`);
    return res.materiel ?? res;
  },

  modererMateriel: async (
    id: string | number,
    data: { action: 'approuver' | 'rejeter'; motif?: string },
  ) => {
    const res = await request<any>(`/admin/materiels/${id}/moderer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateApiCache('/admin/materiels');
    return res;
  },

  getReservationsLocation: async (params?: {
    statut?: string;
    q?: string;
    page?: number;
    date_from?: string;
    date_to?: string;
    location_date_from?: string;
    location_date_to?: string;
  }) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== '') acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        ).toString()
      : '';
    return request<any>(`/admin/reservations-location${qs}`);
  },

  getReservationLocation: async (id: string | number) => {
    const res = await request<{ reservation: Record<string, unknown> }>(`/admin/reservations-location/${id}`);
    return res.reservation ?? res;
  },

  testWhatsApp: async (data: {
    phone?: string;
    title?: string;
    body?: string;
    image_url?: string;
    image_caption?: string;
  }) =>
    request<any>('/admin/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// OTP
// ============================================

export const otpApi = {
  send: async (payload: {
    channel: 'email' | 'whatsapp';
    purpose: 'register' | 'login';
    email?: string;
    telephone?: string;
  }) =>
    request<any>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: async (payload: {
    channel: 'email' | 'whatsapp';
    code: string;
    email?: string;
    telephone?: string;
  }) => {
    const response = await request<{ token?: string; user?: AppUser }>('/auth/otp/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (response.token) setAuthToken(response.token);
    if (response.user) setStoredUser(response.user);
    return response;
  },

  register: async (payload: Record<string, unknown>) => {
    const response = await request<{ token?: string; user?: AppUser }>('/auth/otp/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (response.token) setAuthToken(response.token);
    if (response.user) setStoredUser(response.user);
    return response;
  },
};

// Export par défaut — toutes les APIs Laravel KaziPro
export default {
  health: healthApi,
  auth: authApi,
  profil: profilApi,
  prestataires: prestatairesApi,
  portfolio: portfolioApi,
  clients: clientsApi,
  devis: devisApi,
  contrats: contratsApi,
  paiements: paiementsApi,
  configPaiement: configPaiementApi,
  avis: avisApi,
  litiges: litigesApi,
  disputes: litigesApi,
  notifications: notificationsApi,
  demandes: demandesApi,
  professions: professionsApi,
  adminProfessions: adminProfessionsApi,
  materielCategories: materielCategoriesApi,
  materiels: materielsApi,
  adminMaterielCategories: adminMaterielCategoriesApi,
  fraisDeplacement: fraisDeplacementApi,
  messages: messagesApi,
  missions: missionsApi,
  wallet: walletApi,
  upload: uploadApi,
  admin: adminApi,
  otp: otpApi,
};
