import type { AppUser } from '@/types/auth';

export type ProfilRecord = Record<string, unknown>;

export function getProfil(user: AppUser | null): ProfilRecord | null {
  return (user?.profil as ProfilRecord | null) ?? null;
}

export function prestataireIdFromUser(user: AppUser | null): string | null {
  if (!user || user.role !== 'prestataire') return null;
  const id = getProfil(user)?.id;
  return id != null ? String(id) : null;
}

export function clientIdFromUser(user: AppUser | null): string | null {
  if (!user || user.role !== 'client') return null;
  const id = getProfil(user)?.id;
  return id != null ? String(id) : null;
}

export function displayNameFromProfil(p: ProfilRecord | null, fallback = ''): string {
  if (!p) return fallback;
  const name = [p.prenom, p.nom].filter(Boolean).join(' ').trim();
  if (name) return name;
  return String(p.raison_sociale ?? p.full_name ?? fallback);
}

export function professionLabelFromProfil(p: ProfilRecord | null): string {
  if (!p) return '';
  const prof = p.profession as { nom?: string; name?: string } | string | undefined;
  if (prof && typeof prof === 'object') return String(prof.nom ?? prof.name ?? '');
  return String(p.profession ?? '');
}

/** Libellé sûr pour l’UI (évite de passer l’objet relation API à React). */
export function professionLabel(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const o = value as { nom?: string; name?: string };
    return String(o.nom ?? o.name ?? '');
  }
  return String(value);
}

export type PrestataireValidationStatus = 'en_attente' | 'valide' | 'rejete' | 'unknown';

export function getPrestataireValidationStatus(p: ProfilRecord | null): PrestataireValidationStatus {
  const s = String(p?.statut_validation ?? '').toLowerCase();
  if (s === 'valide' || s === 'en_attente' || s === 'rejete') return s;
  return 'unknown';
}

/** Ancien champ Supabase `verified` → `statut_validation === valide`. */
export function isPrestataireValidated(p: ProfilRecord | null): boolean {
  return getPrestataireValidationStatus(p) === 'valide';
}

export function isPrestataireProfileComplete(p: ProfilRecord | null): boolean {
  if (!p) return false;
  if (p.profile_completed === true) return true;
  return !!(p.profession_id && p.bio && p.ville);
}

/** Ancien `is_online` → `disponible`. */
export function isPrestataireDisponible(p: ProfilRecord | null): boolean {
  return !!p?.disponible;
}
