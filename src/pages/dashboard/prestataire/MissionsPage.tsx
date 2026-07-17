import { useState, useEffect, useMemo, useCallback } from "react";
import { PrestatairePageShell } from "@/components/prestataire/PrestatairePageShell";
import { MissionListCard } from "@/components/prestataire/MissionListCard";
import { PrestataireEmptyState } from "@/components/prestataire/PrestataireEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import {
  Search,
  MapPin,
  Loader,
  User,
  FileText,
  Image as ImageIcon,
  Filter,
  Sparkles,
  X,
} from "lucide-react";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { missionsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil, getProfil, prestataireIdFromUser } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  dedupeMissionsByContrat,
  getMissionStatus,
  MISSION_STATUS_LABELS,
  prestataireCompleteMissionStatus,
  syncDemandeWithMissionStatus,
} from "@/lib/missions";

type MissionStatusFilter = "all" | "pending" | "in_progress" | "completed" | "cancelled";

const MISSION_STATUS_STYLES: Record<
  string,
  { label: string; badge: string; accent: string }
> = {
  pending: {
    label: "En attente",
    badge: "bg-warning/15 text-warning border-warning/30",
    accent: "border-l-warning",
  },
  in_progress: {
    label: "En cours",
    badge: "bg-info/15 text-info border-info/30",
    accent: "border-l-info",
  },
  completed: {
    label: "Complétée",
    badge: "bg-success/15 text-success border-success/30",
    accent: "border-l-success",
  },
  cancelled: {
    label: "Annulée",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    accent: "border-l-destructive",
  },
};

function missionTitle(m: Mission): string {
  return m.demandes?.titre || m.demandes?.title || "Mission";
}


interface Mission {
  id: string;
  devis_id: string;
  demande_id: string;
  client_id: string;
  prestataire_id: string;
  status: string;
  statut?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  devis?: {
    montant_ttc?: number;
    amount?: number;
    titre?: string;
    description?: string;
    delai_execution?: string;
    conditions_paiement?: string;
    devise?: string;
  };
  demandes?: {
    titre?: string;
    title?: string;
    description?: string;
    localisation?: string;
    location?: string;
    budget?: number;
    budget_min?: number;
    budget_max?: number;
    urgence?: string;
    urgency?: string;
    images?: string[];
    client_id?: string;
    clients?: {
      full_name?: string;
    };
  };
}

export default function MissionsPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MissionStatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchMissions();
    }
  }, [user]);

  const fetchProviderName = async () => {
    if (!user) return;
    const profil = getProfil(user);
    if (profil) setProviderName(displayNameFromProfil(profil, user.name || "Prestataire"));
  };

  const fetchMissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (!prestataireIdFromUser(user)) {
        setMissions([]);
        return;
      }
      const res = await missionsApi.getAll({ per_page: 100 });
      const data = unwrapPaginated<Mission>(res);
      setMissions(dedupeMissionsByContrat(data));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const statusChips: { key: MissionStatusFilter; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "pending", label: "En attente" },
    { key: "in_progress", label: "En cours" },
    { key: "completed", label: "Complétées" },
    { key: "cancelled", label: "Annulées" },
  ];

  const getUrgencyBadge = (urgency?: string) => {
    if (urgency === "urgent") {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Normal</Badge>;
  };

  const handleUpdateStatus = async () => {
    if (!selectedMission || !newStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }

    try {
      setUpdatingStatus(true);

      const statusToSave =
        newStatus === "completed"
          ? prestataireCompleteMissionStatus()
          : newStatus;

      if (newStatus === "completed") {
        await missionsApi.terminer(selectedMission.id, "Travaux terminés par le prestataire");
      }

      if (selectedMission.demande_id) {
        await syncDemandeWithMissionStatus(
          selectedMission.demande_id,
          statusToSave,
        );
      }

      toast.success(
        newStatus === "completed"
          ? "Mission terminée — le client peut valider les travaux"
          : "Statut mis à jour avec succès",
      );
      setShowDetailsModal(false);
      fetchMissions(); // Reload missions
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      throw error;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openMissionDetails = (mission: Mission) => {
    setSelectedMission(mission);
    setNewStatus(getMissionStatus(mission));
    setShowDetailsModal(true);
  };

  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const title = missionTitle(m).toLowerCase();
      if (searchTerm && !title.includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== "all" && getMissionStatus(m) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [missions, searchTerm, statusFilter]);

  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== "all";

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, []);

  const getStatusBadge = (rawStatus: string) => {
    const status = getMissionStatus({ status: rawStatus });
    const cfg = MISSION_STATUS_STYLES[status];
    if (!cfg) {
      return (
        <Badge variant="outline" className="text-xs font-medium">
          {MISSION_STATUS_LABELS[status] ?? rawStatus}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className={cn("text-xs font-medium border", cfg.badge)}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <PrestatairePageShell embedded={embedded} userName={providerName} userRole="Prestataire">
      <div className="space-y-4 pb-6 sm:space-y-6 sm:pb-8">
        {!embedded && (
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/8 via-card to-card p-4 sm:rounded-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative space-y-0.5">
            <div className="hidden items-center gap-2 text-primary sm:flex">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Espace prestataire
              </span>
            </div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">Mes Missions</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Gérez vos missions et suivez votre progression
            </p>
          </div>
        </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
            </Button>
            {hasActiveFilters ? (
              <Badge variant="secondary" className="text-xs">
                Filtres actifs
              </Badge>
            ) : null}
          </div>

          {showFilters ? (
            <Card className="border-border/80 shadow-sm">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une mission…"
                    className="h-10 pl-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStatusFilter(chip.key)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        statusFilter === chip.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={resetFilters}>
                    <X className="h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {loading ? (
          <AdminListSkeleton items={4} />
        ) : filteredMissions.length === 0 ? (
          <PrestataireEmptyState
            context="missions"
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredMissions.map((mission) => (
              <MissionListCard
                key={mission.id}
                mission={mission}
                onView={() => openMissionDetails(mission)}
              />
            ))}
          </div>
        )}

        <FormDrawer
          open={showDetailsModal && !!selectedMission}
          onOpenChange={(open) => {
            if (!open) setShowDetailsModal(false);
          }}
          title={selectedMission ? missionTitle(selectedMission) : "Mission"}
        >
          {selectedMission && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(getMissionStatus(selectedMission))}
                {getUrgencyBadge(
                  selectedMission.demandes?.urgence ||
                    selectedMission.demandes?.urgency,
                )}
              </div>
                {selectedMission.demandes?.description && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <FileText className="h-4 w-4" />
                      Description
                    </h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {selectedMission.demandes.description}
                    </p>
                  </div>
                )}

                {selectedMission.demandes?.clients && (
                  <div className="mb-4 rounded-xl border border-border/80 bg-muted/30 p-3">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Client
                    </h4>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {selectedMission.demandes.clients.full_name ||
                          "Non spécifié"}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedMission.demandes.localisation ||
                          selectedMission.demandes.location ||
                          "—"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  {selectedMission.demandes?.budget_min != null &&
                    selectedMission.demandes?.budget_max != null && (
                      <div className="rounded-lg border bg-background p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Budget client
                        </p>
                        <p className="font-medium tabular-nums">
                          {selectedMission.demandes.budget_min.toLocaleString(
                            "fr-FR",
                          )}{" "}
                          -{" "}
                          {selectedMission.demandes.budget_max.toLocaleString(
                            "fr-FR",
                          )}{" "}
                          FC
                        </p>
                      </div>
                    )}
                  <div className="rounded-lg border bg-background p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Devis accepté
                    </p>
                    <p className="font-display font-bold tabular-nums text-primary">
                      {(
                        selectedMission.devis?.montant_ttc ||
                        selectedMission.devis?.amount ||
                        0
                      ).toLocaleString("fr-FR")}{" "}
                      {selectedMission.devis?.devise || "FC"}
                    </p>
                  </div>
                  {selectedMission.start_date && (
                    <div className="col-span-2 rounded-lg border bg-background p-2.5">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Période
                      </p>
                      <p className="font-medium">
                        Début :{" "}
                        {new Date(
                          selectedMission.start_date,
                        ).toLocaleDateString("fr-FR")}
                        {selectedMission.end_date &&
                          ` · Fin : ${new Date(selectedMission.end_date).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                  )}
                </div>

                {selectedMission.demandes?.images &&
                  selectedMission.demandes.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <ImageIcon className="h-4 w-4" />
                        Photos ({selectedMission.demandes.images.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {selectedMission.demandes.images.map(
                          (imageUrl, index) => (
                            <button
                              key={index}
                              type="button"
                              className="relative aspect-square overflow-hidden rounded-lg border"
                              onClick={() => window.open(imageUrl, "_blank")}
                            >
                              <img
                                src={imageUrl}
                                alt={`Photo ${index + 1}`}
                                className="h-full w-full object-cover transition-transform hover:scale-105"
                              />
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                <div className="rounded-xl border p-4">
                  <h4 className="mb-3 text-sm font-semibold">
                    Changer le statut
                  </h4>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">
                          Terminer (attente validation client)
                        </SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                    <SlideToConfirm
                      label={
                        newStatus === "completed"
                          ? "Marquer la mission comme terminée — le client devra valider"
                          : "Mettre à jour le statut de la mission"
                      }
                      hint="Glisser pour confirmer"
                      variant={newStatus === "completed" ? "success" : "default"}
                      disabled={!newStatus}
                      loading={updatingStatus}
                      successMessage="Statut mis à jour"
                      onConfirm={handleUpdateStatus}
                    />
                  </div>
                </div>
            </div>
          )}
        </FormDrawer>
      </div>
    </PrestatairePageShell>
  );
}
