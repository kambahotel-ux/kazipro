import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les appels API
 * Gère automatiquement le loading et les erreurs
 */
export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Exemple d'utilisation :
 * 
 * const { data, loading, error, execute } = useApi<Prestataire[]>();
 * 
 * useEffect(() => {
 *   execute(() => prestatairesApi.getAll());
 * }, []);
 * 
 * if (loading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error}</div>;
 * if (!data) return null;
 * 
 * return <div>{data.map(p => ...)}</div>;
 */
