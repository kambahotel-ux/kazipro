import { useState, useEffect, useMemo, type ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye,
  Calendar,
  User,
  DollarSign,
  Search,
  X,
  Inbox,
  MapPin,
  Phone,
  Hash,
  AlertTriangle,
  Star,
  Award,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { demandesApi, adminApi } from "@/lib/api";
import { parsePaginatedMeta, unwrapPaginated } from "@/lib/api-utils";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";

const PAGE_SIZE = 10;

interface PrestataireCibleInfo {
  name: string;
  telephone?: string;
  ville?: string;
  note_moyenne?: number;
  nb_avis?: number;
  nb_missions?: number;
  certifie?: boolean;
  statut_certification?: string;
  tarif_horaire?: number;
  zones_intervention?: string[];
  bio?: string;
}

interface Request {
  id: string;
  numero: string;
  title: string;
  description: string;
  client_name: string;
  client_phone?: string;
  client_location?: string;
  budget_min?: number;
  budget_max?: number;
  status: "pending" | "approved" | "rejected";
  raw_statut: string;
  statut_moderation: string;
  motif_rejet_moderation?: string;
  service?: string;
  profession_categorie?: string;
  urgence?: string;
  type?: string;
  location?: string;
  prestataire_cible?: PrestataireCibleInfo;
  photos?: string[];
  date_souhaitee?: string;
  created_at: string;
  updated_at?: string;
}

const normalizeRequestStatus = (statutModeration: unknown): Request["status"] => {
  const value = String(statutModeration ?? "approuvee").toLowerCase();
  if (value === "en_attente") return "pending";
  if (value === "rejetee") return "rejected";
  if (value === "approuvee") return "approved";
  return "pending";
};

const statusMeta: Record<Request["status"], { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  approved: {
    label: "Approuvée",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  rejected: {
    label: "Rejetée",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

function formatBudget(min?: number, max?: number): string {
  const hasMin = min != null && min > 0;
  const hasMax = max != null && max > 0;
  if (hasMin && hasMax) return `${min.toLocaleString("fr-FR")} - ${max.toLocaleString("fr-FR")} FC`;
  if (hasMax) return `Jusqu'à ${max.toLocaleString("fr-FR")} FC`;
  if (hasMin) return `À partir de ${min.toLocaleString("fr-FR")} FC`;
  return "Non précisé";
}

function personName(raw?: Record<string, unknown> | null): string {
  if (!raw) return "";
  return [raw.prenom, raw.nom].filter(Boolean).join(" ").trim();
}

function strOrUndef(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function mapPrestataireCible(raw?: Record<string, unknown> | null): PrestataireCibleInfo | undefined {
  if (!raw) return undefined;
  const name = personName(raw);
  if (!name) return undefined;
  return {
    name,
    telephone: strOrUndef(raw.telephone),
    ville: strOrUndef(raw.ville),
    note_moyenne: raw.note_moyenne != null ? Number(raw.note_moyenne) : undefined,
    nb_avis: raw.nb_avis != null ? Number(raw.nb_avis) : undefined,
    nb_missions: raw.nb_missions != null ? Number(raw.nb_missions) : undefined,
    certifie: raw.certifie === true,
    statut_certification: strOrUndef(raw.statut_certification),
    tarif_horaire: raw.tarif_horaire != null ? Number(raw.tarif_horaire) : undefined,
    zones_intervention: Array.isArray(raw.zones_intervention) ? (raw.zones_intervention as string[]) : undefined,
    bio: strOrUndef(raw.bio),
  };
}

function mapDemande(r: Record<string, unknown>): Request {
  const profession = r.profession as Record<string, unknown> | undefined;
  const client = r.client as Record<string, unknown> | undefined;
  const prestataireCible = r.prestataire_cible as Record<string, unknown> | undefined;
  const ville = String(r.ville ?? "");
  const quartier = String(r.quartier ?? "");
  const clientVille = strOrUndef(client?.ville);
  const clientQuartier = strOrUndef(client?.quartier);
  const budgetMin = r.budget_min != null ? Number(r.budget_min) : undefined;
  const budgetMax = r.budget_max != null ? Number(r.budget_max) : undefined;
  const photosRaw = r.photos;
  const photos = Array.isArray(photosRaw)
    ? (photosRaw as unknown[]).map(String).filter(Boolean)
    : photosRaw
      ? [String(photosRaw)]
      : undefined;

  return {
    id: String(r.id),
    numero: String(r.numero ?? `DEM-${r.id}`),
    title: String(r.titre ?? r.title ?? "Sans titre"),
    description: String(r.description ?? ""),
    client_name: personName(client) || "Client",
    client_phone: client?.telephone ? String(client.telephone) : undefined,
    client_location: [clientVille, clientQuartier].filter(Boolean).join(" — ") || undefined,
    budget_min: budgetMin,
    budget_max: budgetMax,
    status: normalizeRequestStatus(r.statut_moderation),
    raw_statut: String(r.statut ?? r.status ?? ""),
    statut_moderation: String(r.statut_moderation ?? "approuvee"),
    motif_rejet_moderation: strOrUndef(r.motif_rejet_moderation),
    service: String(profession?.nom ?? r.service ?? ""),
    profession_categorie: strOrUndef(profession?.categorie),
    urgence: String(r.urgence ?? "normal"),
    type: String(r.type ?? "publique"),
    location: [ville, quartier].filter(Boolean).join(" — ") || undefined,
    prestataire_cible: mapPrestataireCible(prestataireCible),
    photos: photos?.length ? photos : undefined,
    date_souhaitee: r.date_souhaitee ? String(r.date_souhaitee) : undefined,
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: r.updated_at ? String(r.updated_at) : undefined,
  };
}

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [listPage, setListPage] = useState(1);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    service: "all",
    urgence: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (user) void fetchRequests();
  }, [user]);

  useEffect(() => {
    setListPage(1);
  }, [filters, activeTab]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const allRows: Record<string, unknown>[] = [];
      let page = 1;
      let lastPage = 1;
      let total = 0;

      do {
        const res = await demandesApi.getAll({ page, per_page: 50 });
        const meta = parsePaginatedMeta(res);
        lastPage = meta.last_page;
        total = meta.total;
        allRows.push(...unwrapPaginated<Record<string, unknown>>(res));
        page++;
      } while (page <= lastPage);

      setTotalFromApi(total);
      setRequests(allRows.map(mapDemande));
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement des demandes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [
          request.title,
          request.description,
          request.numero,
          request.client_name,
          request.service,
          request.location,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.status !== "all" && request.status !== filters.status) return false;
      if (filters.service !== "all" && request.service !== filters.service) return false;
      if (filters.urgence !== "all" && request.urgence !== filters.urgence) return false;
      if (filters.startDate && new Date(request.created_at) < new Date(filters.startDate)) return false;
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(request.created_at) > end) return false;
      }
      return true;
    });
  }, [requests, filters]);

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const approvedRequests = filteredRequests.filter((r) => r.status === "approved");
  const rejectedRequests = filteredRequests.filter((r) => r.status === "rejected");

  const tabItems = useMemo(() => {
    if (activeTab === "approved") return approvedRequests;
    if (activeTab === "rejected") return rejectedRequests;
    return pendingRequests;
  }, [activeTab, pendingRequests, approvedRequests, rejectedRequests]);

  const totalListPages = Math.max(1, Math.ceil(tabItems.length / PAGE_SIZE));
  const paginatedTabItems = tabItems.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);
  const listFrom = tabItems.length === 0 ? 0 : (listPage - 1) * PAGE_SIZE + 1;
  const listTo = Math.min(listPage * PAGE_SIZE, tabItems.length);

  const services = useMemo(() => {
    return [...new Set(requests.map((r) => r.service).filter(Boolean))].sort();
  }, [requests]);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.service !== "all" ||
    filters.urgence !== "all" ||
    filters.startDate ||
    filters.endDate;

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      service: "all",
      urgence: "all",
      startDate: "",
      endDate: "",
    });
  };

  const handleApprove = async (requestId: string) => {
    try {
      await adminApi.approuverDemande(requestId);
      toast.success("Demande approuvée");
      setShowDetailsDrawer(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      throw error;
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await adminApi.rejeterDemande(requestId);
      toast.success("Demande rejetée");
      setShowDetailsDrawer(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du rejet");
      throw error;
    }
  };

  const openDetails = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailsDrawer(true);
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="py-10 sm:py-12">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="rounded-full bg-muted p-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );

  const DetailField = ({
    label,
    value,
    children,
  }: {
    label: string;
    value?: string;
    children?: ReactNode;
  }) => (
    <div>
      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
      {children ?? <p className="font-medium text-sm sm:text-base">{value || "—"}</p>}
    </div>
  );

  const RequestCard = ({ request }: { request: Request }) => (
    <Card className="transition-shadow hover:shadow-card">
      <CardContent className="px-4 pt-6 pb-4 sm:px-5 sm:pt-6 sm:pb-5">
        <div className="flex flex-col gap-4 sm:min-h-[112px] sm:flex-row sm:items-start sm:justify-between sm:gap-5">
          <div className="flex w-full flex-1 flex-col justify-center">
            <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold sm:text-base">{request.title}</h3>
              <Badge variant="outline" className={`w-fit text-xs ${statusMeta[request.status].className}`}>
                {statusMeta[request.status].label}
              </Badge>
              {request.type === "directe" && (
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs">
                  Directe
                </Badge>
              )}
              {request.type === "publique" && (
                <Badge variant="outline" className="text-xs">
                  Publique
                </Badge>
              )}
              {request.urgence === "urgent" && (
                <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-600 text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{request.description}</p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:grid-cols-2 sm:text-sm lg:grid-cols-3">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {request.numero}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {request.client_name}
              </span>
              {request.prestataire_cible && (
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  → {request.prestataire_cible.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatBudget(request.budget_min, request.budget_max)}
              </span>
              {request.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {request.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(request.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => openDetails(request)} className="w-full sm:mt-0.5 sm:w-auto sm:self-start">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="ml-1 sm:ml-2">Examiner</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PaginationBar = () => {
    if (tabItems.length === 0) return null;
    return (
      <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {listFrom}–{listTo} sur {tabItems.length} demande(s)
          {!hasActiveFilters && totalFromApi > 0 ? ` · ${totalFromApi} en base` : ""}
        </p>
        {tabItems.length > PAGE_SIZE && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listPage <= 1}
              onClick={() => setListPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-xs text-muted-foreground sm:text-sm">
              Page {listPage} / {totalListPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={listPage >= totalListPages}
              onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTab = (emptyMessage: string) => {
    if (loading) {
      return <AdminListSkeleton items={3} />;
    }
    if (tabItems.length === 0) return <EmptyState message={emptyMessage} />;
    return (
      <div className="space-y-3 sm:space-y-4">
        {paginatedTabItems.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
        <PaginationBar />
      </div>
    );
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Modération des Demandes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Approuvez ou rejetez les demandes de service</p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="h-10 pl-10 text-sm sm:h-11 sm:text-base"
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full gap-2 sm:w-auto">
            <Search className="h-4 w-4" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtres actifs: {filteredRequests.length} résultat(s)
            </Badge>
          )}
        </div>

        {showFilters && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3">
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                <Select value={filters.service} onValueChange={(v) => setFilters({ ...filters, service: v })}>
                  <SelectTrigger className="h-10 text-sm sm:h-11 sm:text-base">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service} value={service!}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.urgence} onValueChange={(v) => setFilters({ ...filters, urgence: v })}>
                  <SelectTrigger className="h-10 text-sm sm:h-11 sm:text-base">
                    <SelectValue placeholder="Urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="h-10 text-sm sm:h-11 sm:text-base">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvées</SelectItem>
                    <SelectItem value="rejected">Rejetées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <DateRangeFilter
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onStartDateChange={(d) => setFilters({ ...filters, startDate: d })}
                  onEndDateChange={(d) => setFilters({ ...filters, endDate: d })}
                  label="Période de création"
                />
              </div>
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {filteredRequests.length} résultat(s)
                </Badge>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full sm:w-auto">
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-1 text-xs sm:flex-none sm:text-sm">
              En attente ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 text-xs sm:flex-none sm:text-sm">
              Approuvées ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 text-xs sm:flex-none sm:text-sm">
              Rejetées ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">{renderTab("Aucune demande en attente")}</TabsContent>
          <TabsContent value="approved">{renderTab("Aucune demande approuvée")}</TabsContent>
          <TabsContent value="rejected">{renderTab("Aucune demande rejetée")}</TabsContent>
        </Tabs>

        <FormDrawer
          open={showDetailsDrawer && !!selectedRequest}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailsDrawer(false);
              setSelectedRequest(null);
            }
          }}
          title={selectedRequest?.title ?? "Demande"}
          description={selectedRequest?.numero}
          footer={
            selectedRequest?.status === "pending" ? (
              <div className="space-y-3">
                <SlideToConfirm
                  label="Approuver cette demande et la rendre visible aux prestataires"
                  hint="Glisser pour approuver"
                  variant="success"
                  successMessage="Demande approuvée"
                  onConfirm={() => handleApprove(selectedRequest.id)}
                />
                <SlideToConfirm
                  label="Rejeter définitivement cette demande"
                  hint="Glisser pour rejeter"
                  variant="destructive"
                  successMessage="Demande rejetée"
                  onConfirm={() => handleReject(selectedRequest.id)}
                />
              </div>
            ) : undefined
          }
        >
          {selectedRequest && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Description</p>
                <p className="rounded-lg bg-muted p-3 text-sm">{selectedRequest.description}</p>
              </div>

              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Photos ({selectedRequest.photos.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {selectedRequest.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border"
                      >
                        <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Client" value={selectedRequest.client_name} />
                {selectedRequest.client_phone && (
                  <DetailField label="Téléphone client">
                    <p className="flex items-center gap-1 font-medium text-sm sm:text-base">
                      <Phone className="h-4 w-4" />
                      {selectedRequest.client_phone}
                    </p>
                  </DetailField>
                )}
                {selectedRequest.client_location && (
                  <DetailField label="Localisation client" value={selectedRequest.client_location} />
                )}
                <DetailField label="Service" value={selectedRequest.service} />
                {selectedRequest.profession_categorie && (
                  <DetailField label="Catégorie" value={selectedRequest.profession_categorie} />
                )}
                <DetailField label="Budget" value={formatBudget(selectedRequest.budget_min, selectedRequest.budget_max)} />
                <DetailField label="Localisation demande" value={selectedRequest.location} />
                <DetailField label="Type">
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize ${selectedRequest.type === "directe" ? "bg-blue-500/10 text-blue-600" : ""}`}
                  >
                    {selectedRequest.type}
                  </Badge>
                </DetailField>
                <DetailField label="Urgence">
                  <Badge
                    variant="outline"
                    className={
                      selectedRequest.urgence === "urgent"
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-600 text-xs"
                        : "text-xs"
                    }
                  >
                    {selectedRequest.urgence === "urgent" ? "Urgent" : "Normal"}
                  </Badge>
                </DetailField>
                <DetailField label="Statut API" value={selectedRequest.raw_statut} />
                <DetailField label="Statut modération">
                  <Badge variant="outline" className={`text-xs ${statusMeta[selectedRequest.status].className}`}>
                    {statusMeta[selectedRequest.status].label}
                  </Badge>
                </DetailField>
                {selectedRequest.motif_rejet_moderation && (
                  <DetailField label="Motif de rejet" value={selectedRequest.motif_rejet_moderation} />
                )}
                {selectedRequest.date_souhaitee && (
                  <DetailField
                    label="Date souhaitée"
                    value={new Date(selectedRequest.date_souhaitee).toLocaleDateString("fr-FR")}
                  />
                )}
                <DetailField
                  label="Créée le"
                  value={new Date(selectedRequest.created_at).toLocaleString("fr-FR")}
                />
                {selectedRequest.updated_at && (
                  <DetailField
                    label="Modifiée le"
                    value={new Date(selectedRequest.updated_at).toLocaleString("fr-FR")}
                  />
                )}
              </div>

              {selectedRequest.prestataire_cible && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-3 flex items-center gap-1 text-sm font-medium">
                    <Award className="h-4 w-4" />
                    Prestataire ciblé
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailField label="Nom" value={selectedRequest.prestataire_cible.name} />
                    {selectedRequest.prestataire_cible.telephone && (
                      <DetailField label="Téléphone">
                        <p className="flex items-center gap-1 font-medium text-sm sm:text-base">
                          <Phone className="h-4 w-4" />
                          {selectedRequest.prestataire_cible.telephone}
                        </p>
                      </DetailField>
                    )}
                    {selectedRequest.prestataire_cible.ville && (
                      <DetailField label="Ville" value={selectedRequest.prestataire_cible.ville} />
                    )}
                    {selectedRequest.prestataire_cible.note_moyenne != null && (
                      <DetailField label="Note moyenne">
                        <p className="flex items-center gap-1 font-medium text-sm sm:text-base">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {selectedRequest.prestataire_cible.note_moyenne.toFixed(2)}
                          {selectedRequest.prestataire_cible.nb_avis != null && (
                            <span className="text-muted-foreground">
                              ({selectedRequest.prestataire_cible.nb_avis} avis)
                            </span>
                          )}
                        </p>
                      </DetailField>
                    )}
                    {selectedRequest.prestataire_cible.nb_missions != null && (
                      <DetailField label="Missions" value={String(selectedRequest.prestataire_cible.nb_missions)} />
                    )}
                    {selectedRequest.prestataire_cible.tarif_horaire != null && (
                      <DetailField
                        label="Tarif horaire"
                        value={`${selectedRequest.prestataire_cible.tarif_horaire.toLocaleString("fr-FR")} FC/h`}
                      />
                    )}
                    <DetailField label="Certification">
                      <Badge
                        variant="outline"
                        className={
                          selectedRequest.prestataire_cible.certifie
                            ? "border-green-500/30 bg-green-500/10 text-green-600 text-xs"
                            : "text-xs"
                        }
                      >
                        {selectedRequest.prestataire_cible.certifie
                          ? "Certifié"
                          : selectedRequest.prestataire_cible.statut_certification ?? "Non certifié"}
                      </Badge>
                    </DetailField>
                    {selectedRequest.prestataire_cible.zones_intervention &&
                      selectedRequest.prestataire_cible.zones_intervention.length > 0 && (
                        <div className="sm:col-span-2">
                          <DetailField label="Zones d'intervention">
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedRequest.prestataire_cible.zones_intervention.map((zone) => (
                                <Badge key={zone} variant="secondary" className="text-xs">
                                  {zone}
                                </Badge>
                              ))}
                            </div>
                          </DetailField>
                        </div>
                      )}
                    {selectedRequest.prestataire_cible.bio && (
                      <div className="sm:col-span-2">
                        <DetailField label="Bio" value={selectedRequest.prestataire_cible.bio} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Utilisez les actions en bas du drawer pour approuver ou rejeter cette demande.</span>
                </div>
              )}
            </div>
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
