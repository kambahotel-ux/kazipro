import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Eye,
  AlertCircle,
  Clock,
  Search,
  Scale,
  Package,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface Dispute {
  id: string;
  titre: string;
  description: string;
  domain: "mission" | "location";
  type?: string;
  motif?: string;
  statut: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  priorite?: string;
  montant_litige?: number;
  mission_id?: string;
  reservation_id?: string;
  reservation_numero?: string;
  materiel_titre?: string;
  resolution?: string;
  preuves?: string[];
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolu_par_name?: string;
  client_name?: string;
  client_email?: string;
  prestataire_name?: string;
  loueur_name?: string;
  prestataire_phone?: string;
  mission_title?: string;
  mission_statut?: string;
  contrat_numero?: string;
  contrat_montant?: number;
  demande_titre?: string;
  notes_admin?: string;
}

interface LitigeAggregates {
  total: number;
  actifs: number;
  clos: number;
  mission: number;
  location: number;
}

function strOrUndef(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function personName(raw?: Record<string, unknown> | null): string {
  if (!raw) return "";
  const fromParts = [raw.prenom, raw.nom].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  return String(raw.name ?? raw.full_name ?? "").trim();
}

function mapLitige(litige: Record<string, unknown>): Dispute {
  const rawStatut = String(litige.statut ?? "ouvert");
  const statutMap: Record<string, Dispute["statut"]> = {
    ouvert: "open",
    en_cours: "in_progress",
    resolu: "resolved",
    ferme: "closed",
  };

  const isLocation = litige.reservation_location_id != null;
  const reservation =
    (litige.reservation_location as Record<string, unknown> | undefined) ??
    (litige.reservationLocation as Record<string, unknown> | undefined);

  const demandeur = litige.demandeur as Record<string, unknown> | undefined;
  const mission = litige.mission as Record<string, unknown> | undefined;
  const contrat = mission?.contrat as Record<string, unknown> | undefined;
  const devis = contrat?.devis as Record<string, unknown> | undefined;
  const demande = devis?.demande as Record<string, unknown> | undefined;
  const missionClient = mission?.client as Record<string, unknown> | undefined;
  const missionPrestataire = mission?.prestataire as Record<string, unknown> | undefined;
  const resoluPar = litige.resolu_par as Record<string, unknown> | undefined;
  const preuvesRaw = litige.preuves;

  const materiel = reservation?.materiel as Record<string, unknown> | undefined;
  const loueur = reservation?.loueur as Record<string, unknown> | undefined;
  const loueurUser = loueur?.user as Record<string, unknown> | undefined;
  const locataire =
    (reservation?.locataire_client as Record<string, unknown> | undefined) ??
    (reservation?.locataireClient as Record<string, unknown> | undefined);
  const locataireName = [locataire?.prenom, locataire?.nom].filter(Boolean).join(" ").trim();

  const clientName = isLocation
    ? locataireName || personName(demandeur) || displayNameFromProfil(demandeur ?? {}, "Locataire")
    : personName(missionClient) ||
      String(demandeur?.name ?? "").trim() ||
      displayNameFromProfil(demandeur ?? {}, "Client inconnu");

  const prestataireName = isLocation
    ? String(loueurUser?.name ?? "Loueur")
    : personName(missionPrestataire) ||
      displayNameFromProfil(missionPrestataire ?? {}, "Prestataire inconnu");

  const demandeTitre = strOrUndef(demande?.titre);
  const contratNumero = strOrUndef(contrat?.numero);
  const materielTitre = strOrUndef(materiel?.titre);
  const missionTitle = isLocation
    ? materielTitre ?? (reservation?.numero ? `Réservation ${reservation.numero}` : "Location matériel")
    : demandeTitre ||
      (contratNumero ? `Contrat ${contratNumero}` : undefined) ||
      (mission?.id != null ? `Mission #${mission.id}` : "Mission");

  const montantContrat = contrat?.montant_ttc != null ? Number(contrat.montant_ttc) : undefined;
  const montantReservation =
    reservation?.montant_total != null ? Number(reservation.montant_total) : undefined;

  return {
    id: String(litige.id),
    titre: String(litige.sujet ?? litige.titre ?? "Litige"),
    description: String(litige.description ?? ""),
    domain: isLocation ? "location" : "mission",
    statut: statutMap[rawStatut] ?? "open",
    type: strOrUndef(litige.type),
    motif: strOrUndef(litige.motif),
    priorite: strOrUndef(litige.priorite),
    montant_litige: litige.montant_litige != null
      ? Number(litige.montant_litige)
      : isLocation
        ? montantReservation
        : montantContrat,
    mission_id: !isLocation && mission?.id != null ? String(mission.id) : undefined,
    reservation_id: isLocation && reservation?.id != null ? String(reservation.id) : undefined,
    reservation_numero: isLocation ? strOrUndef(reservation?.numero) : undefined,
    materiel_titre: materielTitre,
    resolution: strOrUndef(litige.resolution),
    preuves: Array.isArray(preuvesRaw) ? preuvesRaw.map(String) : undefined,
    created_at: String(litige.created_at ?? new Date().toISOString()),
    updated_at: strOrUndef(litige.updated_at),
    resolved_at: strOrUndef(litige.resolu_at ?? litige.resolved_at),
    resolu_par_name: personName(resoluPar) || strOrUndef(resoluPar?.name),
    client_name: clientName,
    client_email: strOrUndef(demandeur?.email),
    prestataire_name: prestataireName,
    loueur_name: isLocation ? prestataireName : undefined,
    prestataire_phone: strOrUndef(missionPrestataire?.telephone),
    mission_title: missionTitle,
    mission_statut: isLocation ? strOrUndef(reservation?.statut) : strOrUndef(mission?.statut),
    contrat_numero: contratNumero,
    contrat_montant: montantContrat,
    demande_titre: demandeTitre,
  };
}

function formatFc(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("fr-FR")} FC`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(statut: Dispute["statut"]): string {
  switch (statut) {
    case "open":
      return "Ouvert";
    case "in_progress":
      return "En cours";
    case "resolved":
      return "Résolu";
    case "closed":
      return "Fermé";
    default:
      return statut;
  }
}

function getStatusVariant(
  statut: Dispute["statut"],
): "default" | "secondary" | "destructive" | "outline" {
  if (statut === "open") return "destructive";
  if (statut === "in_progress") return "secondary";
  if (statut === "resolved" || statut === "closed") return "default";
  return "outline";
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "qualite":
      return "Qualité";
    case "delai":
      return "Délai";
    case "paiement":
      return "Paiement";
    case "autre":
      return "Autre";
    default:
      return type;
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "warning" | "success" | "money";
  hint?: string;
}) {
  const accentClass = {
    default: "text-primary",
    warning: "text-amber-600",
    success: "text-emerald-600",
    money: "text-emerald-700",
  }[accent];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
            <p className={`text-2xl font-bold tracking-tight sm:text-3xl ${accentClass}`}>{value}</p>
            {hint && <p className="pt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="shrink-0 rounded-xl bg-muted/60 p-2.5">
            <Icon className={`h-5 w-5 ${accentClass} opacity-80`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ message, icon: Icon = AlertCircle }: { message: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function DisputeCard({ dispute, onOpen }: { dispute: Dispute; onOpen: () => void }) {
  const isActive = dispute.statut === "open" || dispute.statut === "in_progress";
  const counterparty =
    dispute.domain === "location" ? dispute.loueur_name : dispute.prestataire_name;

  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-md ${isActive ? "border-red-500/30 ring-1 ring-red-500/10" : ""}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <h3 className="text-base font-semibold sm:text-lg">{dispute.titre}</h3>
            <Badge variant={dispute.domain === "location" ? "secondary" : "outline"}>
              {dispute.domain === "location" ? "Location" : "Mission"}
            </Badge>
            <Badge variant={getStatusVariant(dispute.statut)}>{getStatusLabel(dispute.statut)}</Badge>
            {dispute.type && <Badge variant="outline">{getTypeLabel(dispute.type)}</Badge>}
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">{dispute.description}</p>

          <p className="text-sm font-medium">{dispute.mission_title}</p>
          {dispute.reservation_numero && (
            <p className="font-mono text-xs text-muted-foreground">Réservation {dispute.reservation_numero}</p>
          )}

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Demandeur · </span>
              {dispute.client_name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">
                {dispute.domain === "location" ? "Loueur" : "Prestataire"} ·{" "}
              </span>
              {counterparty ?? "—"}
            </p>
            <p className="flex items-center gap-1.5 sm:col-span-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Ouvert le {formatDate(dispute.created_at)}
            </p>
          </div>

          {dispute.montant_litige != null && (
            <p className="text-lg font-bold text-primary">{formatFc(dispute.montant_litige)}</p>
          )}
        </div>

        <div className="flex items-center border-t p-4 lg:w-36 lg:shrink-0 lg:border-l lg:border-t-0 lg:p-5">
          <Button variant="outline" className="w-full" onClick={onOpen}>
            <Eye className="mr-2 h-4 w-4" />
            Examiner
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function DisputesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"actifs" | "clos">("actifs");
  const [domainFilter, setDomainFilter] = useState<"all" | "mission" | "location">("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [aggregates, setAggregates] = useState<LitigeAggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const dateParams = useMemo(
    () => ({
      date_from: startDate || undefined,
      date_to: endDate || undefined,
    }),
    [startDate, endDate],
  );

  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(startDate) || Boolean(endDate) || domainFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setDomainFilter("all");
  };

  const loadDisputes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await adminApi.getLitiges({
        statut_group: tab,
        domain: domainFilter === "all" ? undefined : domainFilter,
        q: search.trim() || undefined,
        include_stats: true,
        ...dateParams,
      });
      const rows = unwrapPaginated<Record<string, unknown>>(res);
      setDisputes(rows.map(mapLitige));
      const agg = (res as { aggregates?: LitigeAggregates }).aggregates;
      if (agg) setAggregates(agg);
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement des litiges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, tab, domainFilter, search, dateParams]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleResolve = async (
    disputeId: string,
    kind: "refund_client" | "pay_prestataire",
  ) => {
    const resolution =
      kind === "refund_client"
        ? "Remboursement intégral au client"
        : "Paiement intégral au prestataire";
    const decision = kind === "refund_client" ? "remboursement_client" : "paiement_prestataire";
    try {
      await adminApi.resoudreLitige(disputeId, { resolution, decision });
      toast.success("Litige résolu avec succès");
      setSelectedDispute(null);
      await loadDisputes();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la résolution");
    }
  };

  const handleResolveLocation = async (
    disputeId: string,
    decision: "remboursement_locataire" | "retenue_loueur" | "degeler",
  ) => {
    const labels = {
      remboursement_locataire: "Remboursement intégral au locataire",
      retenue_loueur: "Retenue intégrale au loueur",
      degeler: "Dégel des fonds escrow sans dispatch",
    };
    try {
      await adminApi.resoudreLitige(disputeId, {
        resolution: labels[decision],
        decision,
      });
      toast.success("Litige location résolu");
      setSelectedDispute(null);
      await loadDisputes();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la résolution");
    }
  };

  const handleEscalate = async (disputeId: string) => {
    try {
      await adminApi.resoudreLitige(disputeId, {
        resolution: "Mission reprise — examen complémentaire",
        decision: "reprise_mission",
      });
      toast.success("Litige clos — mission reprise");
      setSelectedDispute(null);
      await loadDisputes();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'escalade");
    }
  };

  const openDispute = (dispute: Dispute) => setSelectedDispute(dispute);

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <Scale className="h-7 w-7 text-primary" />
              Registre des litiges
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Suivi et résolution des litiges missions et location matériel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/admin/location">Location</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/admin/transactions">Transactions</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading && !aggregates ? (
            <>
              <AdminListSkeleton items={1} />
              <AdminListSkeleton items={1} />
              <AdminListSkeleton items={1} />
              <AdminListSkeleton items={1} />
            </>
          ) : (
            <>
              <StatCard
                label="Litiges actifs"
                value={aggregates?.actifs ?? 0}
                icon={AlertCircle}
                accent="warning"
                hint="Ouverts ou en cours"
              />
              <StatCard
                label="Litiges clos"
                value={aggregates?.clos ?? 0}
                icon={CheckCircle2}
                accent="success"
              />
              <StatCard
                label="Missions"
                value={aggregates?.mission ?? 0}
                icon={Briefcase}
              />
              <StatCard
                label="Location"
                value={aggregates?.location ?? 0}
                icon={Package}
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="Rechercher sujet, référence, matériel, partie…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDisputes()}
              />
            </div>
            <Button variant="outline" className="h-11 shrink-0" onClick={loadDisputes}>
              Actualiser
            </Button>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
            </Button>
            {hasActiveFilters && !showFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtres actifs — {aggregates?.total ?? disputes.length} résultat(s)
              </Badge>
            )}
          </div>

          {showFilters && (
            <Card>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  label="Période de création"
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Domaine</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={domainFilter === "all" ? "default" : "outline"}
                      onClick={() => setDomainFilter("all")}
                    >
                      Tous
                    </Button>
                    <Button
                      size="sm"
                      variant={domainFilter === "mission" ? "default" : "outline"}
                      onClick={() => setDomainFilter("mission")}
                    >
                      <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                      Missions
                    </Button>
                    <Button
                      size="sm"
                      variant={domainFilter === "location" ? "default" : "outline"}
                      onClick={() => setDomainFilter("location")}
                    >
                      <Package className="mr-1.5 h-3.5 w-3.5" />
                      Location
                      {(aggregates?.location ?? 0) > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {aggregates?.location}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "actifs" | "clos")}>
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="actifs" className="px-4 py-2">
              Actifs
              {(aggregates?.actifs ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {aggregates?.actifs}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clos" className="px-4 py-2">
              Résolus / fermés
              {(aggregates?.clos ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {aggregates?.clos}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actifs" className="mt-6 space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : disputes.length === 0 ? (
              <EmptyPanel message="Aucun litige actif pour ces critères" />
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <DisputeCard key={dispute.id} dispute={dispute} onOpen={() => openDispute(dispute)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clos" className="mt-6 space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : disputes.length === 0 ? (
              <EmptyPanel message="Aucun litige résolu pour ces critères" icon={CheckCircle2} />
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <DisputeCard key={dispute.id} dispute={dispute} onOpen={() => openDispute(dispute)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <FormDrawer
          open={!!selectedDispute}
          onOpenChange={(open) => !open && setSelectedDispute(null)}
          title={selectedDispute?.titre ?? "Litige"}
          description={selectedDispute?.mission_title}
        >
          {selectedDispute && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedDispute.domain === "location" ? "secondary" : "outline"}>
                  {selectedDispute.domain === "location" ? "Location" : "Mission"}
                </Badge>
                <Badge variant={getStatusVariant(selectedDispute.statut)}>
                  {getStatusLabel(selectedDispute.statut)}
                </Badge>
                {selectedDispute.type && (
                  <Badge variant="outline">{getTypeLabel(selectedDispute.type)}</Badge>
                )}
              </div>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed">{selectedDispute.description}</p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDispute.domain === "location" ? "Locataire" : "Client"}
                  </p>
                  <p className="font-medium">{selectedDispute.client_name}</p>
                  {selectedDispute.client_email && (
                    <p className="text-xs text-muted-foreground">{selectedDispute.client_email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDispute.domain === "location" ? "Loueur" : "Prestataire"}
                  </p>
                  <p className="font-medium">
                    {selectedDispute.domain === "location"
                      ? selectedDispute.loueur_name
                      : selectedDispute.prestataire_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDispute.domain === "location" ? "Réservation" : "Mission"}
                  </p>
                  <p className="font-medium">{selectedDispute.mission_title}</p>
                  {selectedDispute.reservation_numero && (
                    <p className="text-xs text-muted-foreground">{selectedDispute.reservation_numero}</p>
                  )}
                </div>
                {selectedDispute.contrat_numero && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contrat</p>
                    <p className="font-medium">{selectedDispute.contrat_numero}</p>
                  </div>
                )}
                {selectedDispute.montant_litige != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Montant en jeu</p>
                    <p className="font-bold text-primary">{formatFc(selectedDispute.montant_litige)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Ouvert le</p>
                  <p className="font-medium">{formatDate(selectedDispute.created_at)}</p>
                </div>
                {selectedDispute.resolved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Résolu le</p>
                    <p className="font-medium">{formatDate(selectedDispute.resolved_at)}</p>
                  </div>
                )}
                {selectedDispute.resolu_par_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Résolu par</p>
                    <p className="font-medium">{selectedDispute.resolu_par_name}</p>
                  </div>
                )}
              </div>

              {selectedDispute.preuves && selectedDispute.preuves.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-medium text-muted-foreground">Preuves</p>
                    <ul className="space-y-1 text-sm">
                      {selectedDispute.preuves.map((preuve) => (
                        <li key={preuve} className="truncate">
                          {preuve}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {selectedDispute.resolution && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <p className="mb-1 text-sm font-medium text-emerald-800">Résolution</p>
                    <p className="text-sm text-emerald-900">{selectedDispute.resolution}</p>
                  </CardContent>
                </Card>
              )}

              {(selectedDispute.statut === "open" || selectedDispute.statut === "in_progress") &&
                selectedDispute.domain === "mission" && (
                  <div className="space-y-3 border-t pt-4">
                    <Button variant="secondary" className="w-full" onClick={() => handleEscalate(selectedDispute.id)}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Reprendre la mission (escalade)
                    </Button>
                    <SlideToConfirm
                      label="Rembourser le client"
                      hint="Glisser pour rembourser"
                      variant="success"
                      successMessage="Client remboursé"
                      onConfirm={() => handleResolve(selectedDispute.id, "refund_client")}
                    />
                    <SlideToConfirm
                      label="Payer le prestataire"
                      hint="Glisser pour payer"
                      variant="default"
                      successMessage="Prestataire payé"
                      onConfirm={() => handleResolve(selectedDispute.id, "pay_prestataire")}
                    />
                  </div>
                )}

              {(selectedDispute.statut === "open" || selectedDispute.statut === "in_progress") &&
                selectedDispute.domain === "location" && (
                  <div className="space-y-3 border-t pt-4">
                    <SlideToConfirm
                      label="Rembourser le locataire"
                      hint="Glisser pour rembourser"
                      variant="success"
                      successMessage="Locataire remboursé"
                      onConfirm={() =>
                        handleResolveLocation(selectedDispute.id, "remboursement_locataire")
                      }
                    />
                    <SlideToConfirm
                      label="Retenir les fonds au loueur"
                      hint="Glisser pour retenir"
                      variant="default"
                      successMessage="Fonds retenus au loueur"
                      onConfirm={() => handleResolveLocation(selectedDispute.id, "retenue_loueur")}
                    />
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleResolveLocation(selectedDispute.id, "degeler")}
                    >
                      Dégeler l&apos;escrow sans dispatch
                    </Button>
                  </div>
                )}
            </div>
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
