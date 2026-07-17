import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProfil,
  getPrestataireValidationStatus,
  isPrestataireProfileComplete,
  isPrestataireValidated,
  type PrestataireValidationStatus,
} from '@/lib/kazipro-profile';

/** Droits prestataire dérivés du profil `/me` (sidebar + gardes de page). */
export function usePrestataireAccess() {
  const { user, loading } = useAuth();

  return useMemo(() => {
    if (!user || user.role !== 'prestataire') {
      return {
        loading,
        isPrestataire: false,
        isVerified: true,
        isProfileComplete: true,
        hasFullAccess: true,
        validationStatus: 'valide' as PrestataireValidationStatus,
        motifRejet: null as string | null,
      };
    }

    const profil = getProfil(user);
    const isVerified = isPrestataireValidated(profil);
    const isProfileComplete = isPrestataireProfileComplete(profil);
    const validationStatus = getPrestataireValidationStatus(profil);
    const motifRejet =
      typeof profil?.motif_rejet === 'string' && profil.motif_rejet.trim()
        ? profil.motif_rejet.trim()
        : null;

    return {
      loading,
      isPrestataire: true,
      isVerified,
      isProfileComplete,
      hasFullAccess: isVerified && isProfileComplete,
      validationStatus,
      motifRejet,
    };
  }, [user, loading]);
}
