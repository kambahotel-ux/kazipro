import type { AppUser } from "@/types/auth";

export type AppRole = "admin" | "prestataire" | "client";

/** Compte superadmin */
export const SUPERADMIN_EMAIL = "admin@kazipro.com";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === SUPERADMIN_EMAIL;
}

const ROLE_CACHE_KEY = "kazipro:resolved-role";

interface CachedRole {
  userId: string;
  role: AppRole;
  cachedAt: number;
}

export function cacheUserRole(userId: string, role: AppRole) {
  try {
    const payload: CachedRole = { userId, role, cachedAt: Date.now() };
    sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Le cache est un confort UX, pas une source d'autorité.
  }
}

export function clearCachedUserRole() {
  try {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
    localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    // noop
  }
}

export function getCachedUserRole(userId: string): AppRole | null {
  try {
    const raw =
      sessionStorage.getItem(ROLE_CACHE_KEY) ??
      localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRole;
    if (parsed.userId !== userId) return null;
    if (!["admin", "prestataire", "client"].includes(parsed.role)) return null;
    return parsed.role;
  } catch {
    return null;
  }
}

function normalizeRole(role: string | null | undefined): AppRole | null {
  const value = String(role ?? "").toLowerCase();
  if (value === "admin" || value === "prestataire" || value === "client") {
    return value;
  }
  return null;
}

/**
 * Résout le rôle applicatif depuis l'utilisateur Laravel (/auth/me).
 */
export async function resolveUserRole(user: AppUser): Promise<AppRole | null> {
  const userId = String(user.id);

  if (isSuperAdminEmail(user.email)) {
    cacheUserRole(userId, "admin");
    return "admin";
  }

  const role = normalizeRole(user.role);
  if (role) {
    cacheUserRole(userId, role);
    return role;
  }

  return null;
}

export async function resolveUserRoleSafe(user: AppUser): Promise<AppRole | null> {
  const userId = String(user.id);
  const cachedRole = getCachedUserRole(userId);
  if (cachedRole) return cachedRole;

  return resolveUserRole(user);
}

export function defaultDashboardForRole(role: AppRole): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "prestataire") return "/dashboard/prestataire";
  return "/dashboard/client";
}
