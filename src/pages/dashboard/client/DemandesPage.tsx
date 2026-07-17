import { useState, useMemo } from "react";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, CheckCircle, Clock, FileText, X, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { ClientDemandeCard } from "@/components/client/ClientDemandeCard";
import { ClientDevisAccepteCard } from "@/components/client/ClientDevisAccepteCard";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { demandesApi, devisApi } from "@/lib/api";
import {
  getClientDisplayName,
  mapDemandeToUi,
  mapDevisToUi,
  unwrapPaginated,
} from "@/lib/client-helpers";
import { parsePaginatedMeta } from "@/lib/api-utils";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FormDrawer } from "@/components/ui/FormDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Demande {
  id: string;
  title: string;
  description: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
  service?: string;
  created_at: string;
  devis_count?: number;
  urgence?: string;
}

interface DevisAccepte {
  id: string;
  numero: string;
  titre: string;
  montant_ttc: number;
  devise: string;
  date_acceptation: string;
  created_at: string;
  demande_id: string;
  prestataire?: {
    full_name: string;
    profession: string;
  };
  demande?: {
    title: string;
    titre: string;
  };
}

export default function DemandesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [devisAcceptes, setDevisAcceptes] = useState<DevisAccepte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalDemandes, setTotalDemandes] = useState(0);
  const [acceptedPage, setAcceptedPage] = useState(1);
  const [acceptedLastPage, setAcceptedLastPage] = useState(1);
  const [totalAccepted, setTotalAccepted] = useState(0);
  const PAGE_SIZE = 20;

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    service: "all",
    startDate: "",
    endDate: "",
  });

  const showingDevisAcceptes = filters.status === "devis-acceptes";

  const resolveStatutUi = (): string | undefined => {
    if (filters.status === "all" || filters.status === "devis-acceptes") return undefined;
    return filters.status;
  };

  const listQueryKey = JSON.stringify({
    page,
    acceptedPage,
    search: filters.search,
    status: filters.status,
    service: filters.service,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  useAbortableFetch(Boolean(user), [user, listQueryKey], async (signal) => {
    if (!user || signal.aborted) return;
    if (showingDevisAcceptes) {
      await fetchDevisAcceptes(acceptedPage, signal);
    } else {
      await fetchDemandes(page, signal);
    }
  });

  const updateFilters = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setAcceptedPage(1);
  };

  const fetchDemandes = async (targetPage = 1, signal?: AbortSignal) => {
    if (!user) return;

    try {
      setLoading(true);

      const demandesRes = await demandesApi.getAll({
        page: targetPage,
        per_page: PAGE_SIZE,
        search: filters.search.trim() || undefined,
        statut_ui: resolveStatutUi(),
      });
      const meta = parsePaginatedMeta(demandesRes);
      const rawDemandes = unwrapPaginated(demandesRes);

      setDemandes(
        rawDemandes.map((row) => {
          const mapped = mapDemandeToUi(row as Record<string, unknown>);
          return {
            ...mapped,
            urgence: String(
              (row as Record<string, unknown>).urgence ??
                (row as Record<string, unknown>).urgency ??
                "",
            ) || undefined,
          };
        }) as Demande[],
      );
      setPage(meta.current_page || targetPage);
      setLastPage(Math.max(1, meta.last_page || 1));
      setTotalDemandes(meta.total ?? rawDemandes.length);
    } catch (error: unknown) {
      if (signal?.aborted) return;
      const message =
        error instanceof Error ? error.message : "Erreur lors du chargement des demandes";
      toast.error(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const fetchDevisAcceptes = async (targetPage = 1, signal?: AbortSignal) => {
    if (!user) return;

    try {
      setLoading(true);

      const devisRes = await devisApi.getAll({
        statut: "accepte",
        page: targetPage,
        per_page: PAGE_SIZE,
      });
      const meta = parsePaginatedMeta(devisRes);
      const rows = unwrapPaginated(devisRes).map((d) =>
        mapDevisToUi(d as Record<string, unknown>),
      );

      const accepted = rows.map((d) => {
        const raw = d as Record<string, unknown>;
        const demandeRaw = raw.demande as Record<string, unknown> | undefined;
        return {
          ...d,
          id: String(d.id),
          demande_id: String(d.demande_id ?? ""),
          prestataire: d.prestataires ?? d.prestataire,
          demande: demandeRaw
            ? {
                title: String(demandeRaw.titre ?? demandeRaw.title ?? ""),
                titre: String(demandeRaw.titre ?? demandeRaw.title ?? ""),
              }
            : undefined,
        };
      });

      setDevisAcceptes(accepted as DevisAccepte[]);
      setAcceptedPage(meta.current_page || targetPage);
      setAcceptedLastPage(Math.max(1, meta.last_page || 1));
      setTotalAccepted(meta.total ?? rows.length);
    } catch (error: unknown) {
      if (signal?.aborted) return;
      const message =
        error instanceof Error ? error.message : "Erreur lors du chargement des devis acceptés";
      toast.error(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const filteredDemandes = useMemo(() => {
    return demandes.filter((d) => {
      if (filters.service !== "all" && d.service !== filters.service) {
        return false;
      }

      if (filters.startDate) {
        const demandeDate = new Date(d.created_at);
        const startDate = new Date(filters.startDate);
        if (demandeDate < startDate) return false;
      }

      if (filters.endDate) {
        const demandeDate = new Date(d.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (demandeDate > endDate) return false;
      }

      return true;
    });
  }, [demandes, filters]);

  const services = useMemo(() => {
    const uniqueServices = [...new Set(demandes.map((d) => d.service).filter(Boolean))];
    return uniqueServices.sort();
  }, [demandes]);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.service !== "all" ||
    filters.startDate ||
    filters.endDate;

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      service: "all",
      startDate: "",
      endDate: "",
    });
    setPage(1);
    setAcceptedPage(1);
  };

  const DemandeActionsMenu = ({ demande, showMissionLink = false }: { demande: Demande; showMissionLink?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate(`/dashboard/client/demandes/${demande.id}`)} className="gap-2">
          <Eye className="w-4 h-4" />
          Voir détails
        </DropdownMenuItem>
        {showMissionLink ? (
          <DropdownMenuItem onClick={() => navigate("/dashboard/client/missions")} className="gap-2">
            <Clock className="w-4 h-4" />
            Suivi mission
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const DevisAccepteActionsMenu = ({ devis }: { devis: DevisAccepte }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate(`/dashboard/client/demandes/${devis.demande_id}`)} className="gap-2">
          <Eye className="w-4 h-4" />
          Voir détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/dashboard/client/contrat/${devis.id}`)} className="gap-2">
          <FileText className="w-4 h-4" />
          Voir le contrat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const isEmpty = showingDevisAcceptes ? devisAcceptes.length === 0 : filteredDemandes.length === 0;

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Mes Demandes</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gérez vos demandes de service</p>
          </div>
          <Link to="/dashboard/client/demandes/nouvelle">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nouvelle demande</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 w-full sm:w-auto ${showFilters ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">{showFilters ? "Masquer les filtres" : "Afficher les filtres"}</span>
          </Button>

          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/30">
              Filtres actifs
            </Badge>
          )}
        </div>

        {showFilters && (
          <Card className="mt-4 border-2 border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Search className="w-4 h-4" />
                Filtres de recherche
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher une demande..."
                    className="pl-10 text-sm h-10"
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <Select value={filters.service} onValueChange={(v) => updateFilters({ service: v })}>
                    <SelectTrigger className="text-sm h-10">
                      <SelectValue placeholder="Tous les services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les services</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <Select value={filters.status} onValueChange={(v) => updateFilters({ status: v })}>
                    <SelectTrigger className="text-sm h-10">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="devis-acceptes">Devis acceptés</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Période de création</label>
                <DateRangeFilter
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onStartDateChange={(d) => updateFilters({ startDate: d })}
                  onEndDateChange={(d) => updateFilters({ endDate: d })}
                  label=""
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-primary/20">
                <Badge variant="secondary" className="text-xs w-fit bg-primary/10 text-primary border-primary/30">
                  {showingDevisAcceptes
                    ? `${devisAcceptes.length} devis`
                    : `${filteredDemandes.length} demande(s)`}
                </Badge>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="w-full sm:w-auto text-primary hover:bg-primary/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    <span className="text-sm">Réinitialiser les filtres</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <AdminListSkeleton items={4} />
        ) : isEmpty ? (
          <Card>
            <CardContent className="p-6 md:p-12 text-center">
              {showingDevisAcceptes ? (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm md:text-base text-muted-foreground mb-2">Aucun devis accepté</p>
                  <p className="text-sm text-muted-foreground">
                    Les devis que vous acceptez apparaîtront ici
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">Aucune demande trouvée</p>
                  <Link to="/dashboard/client/demandes/nouvelle">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une demande
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {showFilters && (
              <div className="border-t border-border/50 pt-2">
                <p className="text-sm text-muted-foreground text-center">Résultats</p>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              {showingDevisAcceptes
                ? devisAcceptes.map((devis) => (
                    <ClientDevisAccepteCard
                      key={devis.id}
                      devis={devis}
                      onView={() => navigate(`/dashboard/client/demandes/${devis.demande_id}`)}
                      actionsMenu={<DevisAccepteActionsMenu devis={devis} />}
                    />
                  ))
                : filteredDemandes.map((demande) => (
                    <ClientDemandeCard
                      key={demande.id}
                      demande={demande}
                      onView={() => navigate(`/dashboard/client/demandes/${demande.id}`)}
                      actionsMenu={
                        <DemandeActionsMenu
                          demande={demande}
                          showMissionLink={demande.status === "in_progress"}
                        />
                      }
                    />
                  ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {showingDevisAcceptes
                  ? `Page ${acceptedPage} sur ${acceptedLastPage} (${totalAccepted} devis)`
                  : `Page ${page} sur ${lastPage} (${totalDemandes} demande(s))`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={showingDevisAcceptes ? acceptedPage <= 1 : page <= 1}
                  onClick={() => {
                    if (showingDevisAcceptes) {
                      setAcceptedPage((p) => Math.max(1, p - 1));
                    } else {
                      setPage((p) => Math.max(1, p - 1));
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    showingDevisAcceptes ? acceptedPage >= acceptedLastPage : page >= lastPage
                  }
                  onClick={() => {
                    if (showingDevisAcceptes) {
                      setAcceptedPage((p) => Math.min(acceptedLastPage, p + 1));
                    } else {
                      setPage((p) => Math.min(lastPage, p + 1));
                    }
                  }}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <FormDrawer
          open={showDetailsModal && !!selectedDemande}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailsModal(false);
              setSelectedDemande(null);
            }
          }}
          title={selectedDemande?.title ?? "Demande"}
          footer={<Button className="w-full">Voir tous les devis</Button>}
        >
          {selectedDemande && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Localisation</p>
                  <p className="font-medium">{selectedDemande.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium text-lg text-primary">
                    {selectedDemande.budget_min.toLocaleString()} - {selectedDemande.budget_max.toLocaleString()} FC
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium">{new Date(selectedDemande.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Réponses reçues</p>
                  <p className="font-medium">{selectedDemande.devis_count || 0} devis</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedDemande.description}</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Devis reçus</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDemande.devis_count === 0
                    ? "Aucun devis reçu pour le moment"
                    : `${selectedDemande.devis_count} devis en attente de votre examen`}
                </p>
              </div>
            </div>
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
