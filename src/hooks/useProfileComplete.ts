import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";

export const useProfileComplete = () => {
  const { loading, isProfileComplete, isPrestataire } = usePrestataireAccess();

  return {
    isProfileComplete: isPrestataire ? isProfileComplete : null,
    loading,
  };
};
