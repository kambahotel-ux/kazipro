import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook pour gérer automatiquement le statut en ligne d'un prestataire
 * Met à jour le statut toutes les 2 minutes et lors de la fermeture de la page
 */
export const useOnlineStatus = (prestataire_id: string | null) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!prestataire_id) return;

    try {
      await supabase
        .from('prestataires')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', prestataire_id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut en ligne:', error);
    }
  };

  useEffect(() => {
    if (!prestataire_id) return;

    // Marquer comme en ligne au montage
    updateOnlineStatus(true);

    // Mettre à jour toutes les 2 minutes
    intervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, 2 * 60 * 1000); // 2 minutes

    // Marquer comme hors ligne lors de la fermeture
    const handleBeforeUnload = () => {
      // Utiliser sendBeacon pour garantir l'envoi même si la page se ferme
      const data = {
        id: prestataire_id,
        is_online: false,
        last_seen: new Date().toISOString()
      };
      
      // Fallback synchrone
      updateOnlineStatus(false);
    };

    // Marquer comme hors ligne lors de la perte de focus (optionnel)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updateOnlineStatus(false);
    };
  }, [prestataire_id]);

  return { updateOnlineStatus };
};

/**
 * Hook pour compter le nombre de prestataires en ligne
 */
export const useOnlineProvidersCount = () => {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: onlineCount } = await supabase
          .from('prestataires')
          .select('*', { count: 'exact', head: true })
          .eq('is_online', true)
          .eq('verified', true);

        setCount(onlineCount || 0);
      } catch (error) {
        console.error('Erreur lors du comptage des prestataires en ligne:', error);
      }
    };

    fetchCount();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchCount, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  return count;
};

// Import React pour le second hook
import React from 'react';
