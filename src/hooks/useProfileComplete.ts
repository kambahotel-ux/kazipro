import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const useProfileComplete = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileComplete = async () => {
      if (!user) {
        setIsProfileComplete(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("prestataires")
          .select("profile_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        setIsProfileComplete(data?.profile_completed ?? null);
      } catch (error) {
        console.error("Erreur lors de la vérification du profil:", error);
        setIsProfileComplete(null);
      } finally {
        setLoading(false);
      }
    };

    checkProfileComplete();
  }, [user]);

  return { isProfileComplete, loading };
};
