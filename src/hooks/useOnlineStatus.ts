import { useEffect, useRef, useState } from 'react';
import { prestatairesApi } from '@/lib/api';
import { unwrapPaginated } from '@/lib/api-utils';

export const useOnlineStatus = (prestataire_id: string | null) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateOnlineStatus = async (disponible: boolean) => {
    if (!prestataire_id) return;

    try {
      await prestatairesApi.update(prestataire_id, {
        disponible,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut en ligne:', error);
    }
  };

  useEffect(() => {
    if (!prestataire_id) return;

    // Heartbeat discret (pas d'appel au montage — le toggle gère l'état initial)
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        void updateOnlineStatus(true);
      }
    }, 5 * 60 * 1000);

    const handleBeforeUnload = () => {
      void updateOnlineStatus(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void updateOnlineStatus(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [prestataire_id]);

  return { updateOnlineStatus };
};

export const useOnlineProvidersCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await prestatairesApi.getOnlineCount();
        setCount(res?.count ?? 0);
      } catch (error) {
        console.error('Erreur lors du comptage des prestataires en ligne:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return count;
};
