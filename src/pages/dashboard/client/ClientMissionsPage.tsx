import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MissionProgressCard } from "@/components/mission/MissionProgressCard";
import { useAuth } from "@/contexts/AuthContext";
import { missionsApi } from "@/lib/api";
import { dedupeMissionsByContrat } from "@/lib/missions";
import { getClientDisplayName, mapMissionToUi, unwrapPaginated } from "@/lib/client-helpers";
import { ArrowLeft, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";

export default function ClientMissionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const clientName = getClientDisplayName(user);

  useEffect(() => {
    if (user) void loadMissions();
  }, [user]);

  const loadMissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await missionsApi.getAll({ per_page: 100 });
      const rows = unwrapPaginated(res)
        .map((m) => mapMissionToUi(m as Record<string, unknown>))
        .filter((m) => !["annulee", "cancelled"].includes(String(m.statut ?? m.status)));
      setMissions(dedupeMissionsByContrat(rows));
    } catch (e: unknown) {
      console.error(e);
      toast.error("Impossible de charger vos missions");
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const title = String(m.demandes?.titre || m.demandes?.title || "Mission");
      const status = String(m.statut ?? m.status ?? "");

      if (filters.search && !title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status !== "all" && status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [filters.search, filters.status, missions]);

  const hasActiveFilters = filters.search || filters.status !== "all";

  const resetFilters = () => setFilters({ search: "", status: "all" });

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link to="/dashboard/client/demandes">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Mes demandes
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold">Suivi missions</h1>
          <p className="text-sm text-muted-foreground">
            Évolution des travaux après acceptation du devis et paiement de l&apos;acompte
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
          {hasActiveFilters && !showFilters ? (
            <span className="text-xs text-muted-foreground">
              {filteredMissions.length} mission(s)
            </span>
          ) : null}
        </div>

        {showFilters ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une mission..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="pending">En attente (EN)</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="in_progress">En cours (EN)</SelectItem>
                    <SelectItem value="terminee_prestataire">Terminée prestataire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <AdminListSkeleton items={3} />
        ) : filteredMissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Aucune mission trouvée.</p>
              <p className="mt-2 text-sm">
                Essayez de modifier vos filtres ou revenez plus tard.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/dashboard/client/demandes">Voir mes demandes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMissions.map((m) => (
              <div key={m.id} className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {m.demandes?.titre || m.demandes?.title || "Mission"}
                </h2>
                <MissionProgressCard mission={m} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
