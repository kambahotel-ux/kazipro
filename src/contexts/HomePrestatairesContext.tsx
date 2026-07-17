import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { professionsApi, prestatairesApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";

export interface LaravelPrestataire {
  id: number;
  nom?: string;
  prenom?: string;
  raison_sociale?: string;
  profession_id?: number;
  profession?: { id?: number; nom?: string };
  note_moyenne?: number | string;
  nb_missions?: number;
  disponible?: boolean;
}

interface PaginatedPrestataires {
  data: LaravelPrestataire[];
  total: number;
}

export interface HomePrestatairesStats {
  totalProviders: number;
  onlineProviders: number;
  completedProjects: number;
  averageRating: number;
  providers: LaravelPrestataire[];
  professions: Array<{ id: number; nom: string; description?: string }>;
  loading: boolean;
  refreshOnline: () => Promise<void>;
}

const HomePrestatairesContext = createContext<HomePrestatairesStats | null>(null);

function prestataireDisplayName(p: LaravelPrestataire): string {
  if (p.raison_sociale) return p.raison_sociale;
  return [p.prenom, p.nom].filter(Boolean).join(" ") || "Prestataire";
}

export function HomePrestatairesProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [totalProviders, setTotalProviders] = useState(500);
  const [onlineProviders, setOnlineProviders] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(1200);
  const [averageRating, setAverageRating] = useState(4.8);
  const [providers, setProviders] = useState<LaravelPrestataire[]>([]);
  const [professions, setProfessions] = useState<
    Array<{ id: number; nom: string; description?: string }>
  >([]);

  const applyList = useCallback((list: LaravelPrestataire[]) => {
    setProviders(list);
    const sum = list.reduce((acc, p) => acc + (p.nb_missions || 0), 0);
    if (sum > 0) setCompletedProjects(sum);
    if (list.length > 0) {
      const avg =
        list.reduce((s, p) => s + (Number(p.note_moyenne) || 0), 0) / list.length;
      setAverageRating(Math.round(avg * 10) / 10);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [totalRes, onlineRes, listRes, professionsRes] = await Promise.all([
        prestatairesApi.getAll({ per_page: 1 }),
        prestatairesApi.getAll({ per_page: 1, disponible: true }),
        prestatairesApi.getAll({ per_page: 100 }),
        professionsApi.getAll(),
      ]);

      const total = (totalRes as PaginatedPrestataires).total;
      if (total != null && total > 0) setTotalProviders(total);

      const online = (onlineRes as PaginatedPrestataires).total;
      setOnlineProviders(online ?? 0);

      const list = unwrapPaginated<LaravelPrestataire>(listRes);
      applyList(list);

      const profs = Array.isArray(professionsRes)
        ? professionsRes
        : unwrapPaginated<{ id: number; nom: string; description?: string }>(professionsRes);
      setProfessions(profs);
    } catch {
      /* page publique : valeurs par défaut */
    } finally {
      setLoading(false);
    }
  }, [applyList]);

  const refreshOnline = useCallback(async () => {
    try {
      const onlineRes = (await prestatairesApi.getAll(
        { per_page: 1, disponible: true },
        { force: true },
      )) as PaginatedPrestataires;
      setOnlineProviders(onlineRes.total ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshOnline();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshOnline]);

  const value = useMemo<HomePrestatairesStats>(
    () => ({
      totalProviders,
      onlineProviders,
      completedProjects,
      averageRating,
      providers,
      professions,
      loading,
      refreshOnline,
    }),
    [
      totalProviders,
      onlineProviders,
      completedProjects,
      averageRating,
      providers,
      professions,
      loading,
      refreshOnline,
    ],
  );

  return (
    <HomePrestatairesContext.Provider value={value}>{children}</HomePrestatairesContext.Provider>
  );
}

export function useHomePrestataires(): HomePrestatairesStats | null {
  return useContext(HomePrestatairesContext);
}

export { prestataireDisplayName };
