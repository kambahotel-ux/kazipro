import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Package,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  Search,
  CreditCard,
  Loader2,
  Activity,
  Coins,
  AlertTriangle,
  ArrowRight,
  Users,
  CheckCircle2,
  FileText,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, paiementsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { materielMediaSrc } from "@/lib/media-url";
import { downloadContratPdfFromApi } from "@/lib/contrat-pdf";
import { toast } from "sonner";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface AdminMaterielMedia {
  id: number;
  type: string;
  url_resolue?: string;
  url?: string;
  path?: string;
}

interface AdminMateriel {
  id: string;
  titre: string;
  statut: string;
  description?: string;
  ville?: string;
  quartier?: string;
  prix_jour?: number;
  prix_semaine?: number;
  valeur_remplacement?: number;
  caution_calculee?: number;
  frais_livraison?: number;
  marque?: string;
  modele?: string;
  etat?: string;
  quantite_stock?: number;
  conditions?: string;
  modes_remise?: string[];
  loueur_name?: string;
  loueur_email?: string;
  categorie?: string;
  medias: AdminMaterielMedia[];
  created_at?: string;
}

interface AdminReservation {
  id: string;
  numero: string;
  statut: string;
  materiel_titre?: string;
  loueur_name?: string;
  locataire_name?: string;
  date_debut?: string;
  date_fin?: string;
  montant_total?: number;
  montant_loyer?: number;
  montant_caution?: number;
  montant_livraison?: number;
  mode_remise?: string;
  contrat_numero?: string;
  contrat_statut?: string;
  contrat_id?: string;
  paiement_id?: string;
  paiement_statut?: string;
  paiement_methode?: string;
  paiement_montant?: number;
  updated_at?: string;
}

interface AdminContratLocation {
  id: string;
  numero: string;
  statut: string;
  montant_ttc?: number;
  date_debut?: string;
  date_fin_prevue?: string;
  signe_client_at?: string;
  signe_loueur_at?: string;
  reservation_id?: string;
  reservation_numero?: string;
  reservation_statut?: string;
  materiel_titre?: string;
  loueur_name?: string;
  locataire_name?: string;
  created_at?: string;
}

interface LocationStats {
  annonces: { total: number; publie: number; en_attente_moderation: number; brouillon: number };
  reservations: {
    total: number;
    en_cours: number;
    terminee: number;
    litige: number;
    en_attente_paiement: number;
    demande_envoyee: number;
  };
  paiements: { en_attente: number };
  finances: { volume_valide_fc: number; commissions_location_fc: number };
  contrats?: { total: number; actif: number };
  recent_reservations: AdminReservation[];
  pending_materiels: AdminMateriel[];
}

function mapMateriel(row: Record<string, unknown>): AdminMateriel {
  const loueur = row.loueur as Record<string, unknown> | undefined;
  const user = loueur?.user as Record<string, unknown> | undefined;
  const categorie = row.categorie as Record<string, unknown> | undefined;
  const mediasRaw = row.medias ?? row.medias_publics;
  const modes = row.modes_remise;

  return {
    id: String(row.id),
    titre: String(row.titre ?? "Sans titre"),
    statut: String(row.statut ?? ""),
    description: row.description != null ? String(row.description) : undefined,
    ville: row.ville != null ? String(row.ville) : undefined,
    quartier: row.quartier != null ? String(row.quartier) : undefined,
    prix_jour: row.prix_jour != null ? Number(row.prix_jour) : undefined,
    prix_semaine: row.prix_semaine != null ? Number(row.prix_semaine) : undefined,
    valeur_remplacement: row.valeur_remplacement != null ? Number(row.valeur_remplacement) : undefined,
    caution_calculee: row.caution_calculee != null ? Number(row.caution_calculee) : undefined,
    frais_livraison: row.frais_livraison != null ? Number(row.frais_livraison) : undefined,
    marque: row.marque != null ? String(row.marque) : undefined,
    modele: row.modele != null ? String(row.modele) : undefined,
    etat: row.etat != null ? String(row.etat) : undefined,
    quantite_stock: row.quantite_stock != null ? Number(row.quantite_stock) : undefined,
    conditions: row.conditions != null ? String(row.conditions) : undefined,
    modes_remise: Array.isArray(modes) ? modes.map(String) : undefined,
    loueur_name: user?.name != null ? String(user.name) : undefined,
    loueur_email: user?.email != null ? String(user.email) : undefined,
    categorie: categorie?.nom != null ? String(categorie.nom) : undefined,
    medias: Array.isArray(mediasRaw) ? (mediasRaw as AdminMaterielMedia[]) : [],
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  };
}

function mapReservation(row: Record<string, unknown>): AdminReservation {
  const materiel = row.materiel as Record<string, unknown> | undefined;
  const loueur = row.loueur as Record<string, unknown> | undefined;
  const loueurUser = loueur?.user as Record<string, unknown> | undefined;
  const locataire = row.locataire_client as Record<string, unknown> | undefined;
  const locataireName = [locataire?.prenom, locataire?.nom].filter(Boolean).join(" ").trim();
  const contrat = row.contrat as Record<string, unknown> | undefined;
  const paiements = row.paiements as Record<string, unknown>[] | undefined;
  const paiement = Array.isArray(paiements) ? paiements[0] : undefined;

  return {
    id: String(row.id),
    numero: String(row.numero ?? row.id),
    statut: String(row.statut ?? ""),
    materiel_titre: materiel?.titre != null ? String(materiel.titre) : undefined,
    loueur_name: loueurUser?.name != null ? String(loueurUser.name) : undefined,
    locataire_name: locataireName || undefined,
    date_debut: row.date_debut != null ? String(row.date_debut) : undefined,
    date_fin: row.date_fin != null ? String(row.date_fin) : undefined,
    montant_total: row.montant_total != null ? Number(row.montant_total) : undefined,
    montant_loyer: row.montant_loyer != null ? Number(row.montant_loyer) : undefined,
    montant_caution: row.montant_caution != null ? Number(row.montant_caution) : undefined,
    montant_livraison: row.montant_livraison != null ? Number(row.montant_livraison) : undefined,
    mode_remise: row.mode_remise != null ? String(row.mode_remise) : undefined,
    contrat_numero: contrat?.numero != null ? String(contrat.numero) : undefined,
    contrat_statut: contrat?.statut != null ? String(contrat.statut) : undefined,
    contrat_id: contrat?.id != null ? String(contrat.id) : undefined,
    paiement_id: paiement?.id != null ? String(paiement.id) : undefined,
    paiement_statut: paiement?.statut != null ? String(paiement.statut) : undefined,
    paiement_methode: paiement?.methode != null ? String(paiement.methode) : undefined,
    paiement_montant: paiement?.montant != null ? Number(paiement.montant) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

function mapContratLocation(row: Record<string, unknown>): AdminContratLocation {
  const reservation =
    (row.reservation_location as Record<string, unknown> | undefined) ??
    (row.reservationLocation as Record<string, unknown> | undefined);
  const materiel = reservation?.materiel as Record<string, unknown> | undefined;
  const loueur = (row.loueur as Record<string, unknown> | undefined) ??
    (reservation?.loueur as Record<string, unknown> | undefined);
  const loueurUser = loueur?.user as Record<string, unknown> | undefined;
  const client = row.client as Record<string, unknown> | undefined;
  const locataireUser = row.locataire_user as Record<string, unknown> | undefined;
  const clientName = [client?.prenom, client?.nom].filter(Boolean).join(" ").trim();

  return {
    id: String(row.id),
    numero: String(row.numero ?? row.id),
    statut: String(row.statut ?? ""),
    montant_ttc: row.montant_ttc != null ? Number(row.montant_ttc) : undefined,
    date_debut: row.date_debut != null ? String(row.date_debut) : undefined,
    date_fin_prevue: row.date_fin_prevue != null ? String(row.date_fin_prevue) : undefined,
    signe_client_at: row.signe_client_at != null ? String(row.signe_client_at) : undefined,
    signe_loueur_at:
      row.signe_loueur_at != null
        ? String(row.signe_loueur_at)
        : row.signe_prestataire_at != null
          ? String(row.signe_prestataire_at)
          : undefined,
    reservation_id: reservation?.id != null ? String(reservation.id) : undefined,
    reservation_numero: reservation?.numero != null ? String(reservation.numero) : undefined,
    reservation_statut: reservation?.statut != null ? String(reservation.statut) : undefined,
    materiel_titre: materiel?.titre != null ? String(materiel.titre) : undefined,
    loueur_name: loueurUser?.name != null ? String(loueurUser.name) : undefined,
    locataire_name:
      clientName ||
      (locataireUser?.name != null ? String(locataireUser.name) : undefined),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  };
}

function statutLabel(statut: string): string {
  return statut.replace(/_/g, " ");
}

function statutVariant(statut: string): "default" | "secondary" | "destructive" | "outline" {
  if (statut === "publie" || statut === "terminee" || statut === "payee") return "default";
  if (statut === "litige" || statut === "refusee") return "destructive";
  if (statut === "en_attente_moderation" || statut === "en_attente_paiement") return "secondary";
  return "outline";
}

function formatFc(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("fr-FR")} FC`;
}

function etatLabel(etat?: string): string {
  return (
    {
      neuf: "Neuf",
      tres_bon: "Très bon",
      bon: "Bon",
      usage: "Usagé",
    }[etat ?? ""] ?? etat ?? "—"
  );
}

function modeRemiseLabel(mode?: string): string {
  return (
    {
      retrait_loueur: "Retrait chez le loueur",
      livraison_loueur: "Livraison par le loueur",
    }[mode ?? ""] ?? mode ?? "—"
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border/60 last:border-0 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "warning" | "success" | "money";
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
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${accentClass}`}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground pt-1">{hint}</p>}
          </div>
          <div className="rounded-xl bg-muted/60 p-2.5 shrink-0">
            <Icon className={`w-5 h-5 ${accentClass} opacity-80`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LocationAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("activite");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locationStartDate, setLocationStartDate] = useState("");
  const [locationEndDate, setLocationEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [materiels, setMateriels] = useState<AdminMateriel[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [contrats, setContrats] = useState<AdminContratLocation[]>([]);
  const [selectedMateriel, setSelectedMateriel] = useState<AdminMateriel | null>(null);
  const [materielLoading, setMaterielLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [validatingPayment, setValidatingPayment] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [reservationFilter, setReservationFilter] = useState<"all" | "en_attente_paiement">("all");
  const [contratFilter, setContratFilter] = useState<"all" | "actif" | "en_attente">("all");
  const [selectedContrat, setSelectedContrat] = useState<AdminContratLocation | null>(null);
  const [contratLoading, setContratLoading] = useState(false);
  const [downloadingContratPdf, setDownloadingContratPdf] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const raw = await adminApi.getLocationStats();
      setStats({
        annonces: raw.annonces ?? { total: 0, publie: 0, en_attente_moderation: 0, brouillon: 0 },
        reservations: raw.reservations ?? {
          total: 0,
          en_cours: 0,
          terminee: 0,
          litige: 0,
          en_attente_paiement: 0,
          demande_envoyee: 0,
        },
        paiements: raw.paiements ?? { en_attente: 0 },
        finances: raw.finances ?? { volume_valide_fc: 0, commissions_location_fc: 0 },
        recent_reservations: (raw.recent_reservations ?? []).map((r: Record<string, unknown>) =>
          mapReservation(r),
        ),
        pending_materiels: (raw.pending_materiels ?? []).map((m: Record<string, unknown>) =>
          mapMateriel(m),
        ),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const dateParams = useMemo(
    () => ({
      date_from: startDate || undefined,
      date_to: endDate || undefined,
    }),
    [startDate, endDate],
  );

  const locationDateParams = useMemo(
    () => ({
      location_date_from: locationStartDate || undefined,
      location_date_to: locationEndDate || undefined,
    }),
    [locationStartDate, locationEndDate],
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(locationStartDate) ||
    Boolean(locationEndDate);

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setLocationStartDate("");
    setLocationEndDate("");
  };

  const loadMateriels = useCallback(async () => {
    const res = await adminApi.getMateriels({
      statut: tab === "moderation" ? "en_attente_moderation" : undefined,
      q: search.trim() || undefined,
      ...dateParams,
    });
    setMateriels(unwrapPaginated<Record<string, unknown>>(res).map(mapMateriel));
  }, [search, tab, dateParams]);

  const loadReservations = useCallback(async () => {
    const res = await adminApi.getReservationsLocation({
      statut: reservationFilter === "en_attente_paiement" ? "en_attente_paiement" : undefined,
      q: search.trim() || undefined,
      ...dateParams,
      ...locationDateParams,
    });
    setReservations(unwrapPaginated<Record<string, unknown>>(res).map(mapReservation));
  }, [search, reservationFilter, dateParams, locationDateParams]);

  const loadContrats = useCallback(async () => {
    const res = await adminApi.getLocationContrats({
      statut:
        contratFilter === "actif"
          ? "actif"
          : contratFilter === "en_attente"
            ? "en_attente"
            : undefined,
      q: search.trim() || undefined,
      ...dateParams,
      ...locationDateParams,
    });
    setContrats(unwrapPaginated<Record<string, unknown>>(res).map(mapContratLocation));
  }, [search, contratFilter, dateParams, locationDateParams]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      await loadStats();
      if (tab === "reservations" || tab === "activite") {
        await loadReservations();
      } else if (tab === "contrats") {
        await loadContrats();
      } else {
        await loadMateriels();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user, tab, loadMateriels, loadReservations, loadContrats, loadStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openMateriel = async (m: AdminMateriel) => {
    setSelectedMateriel(m);
    setMaterielLoading(true);
    try {
      const raw = await adminApi.getMateriel(m.id);
      setSelectedMateriel(mapMateriel(raw as Record<string, unknown>));
    } catch {
      toast.error("Impossible de charger le détail de l'annonce");
    } finally {
      setMaterielLoading(false);
    }
  };

  const openReservation = async (r: AdminReservation) => {
    setSelectedReservation(r);
    setReservationLoading(true);
    try {
      const raw = await adminApi.getReservationLocation(r.id);
      setSelectedReservation(mapReservation(raw as Record<string, unknown>));
    } catch {
      toast.error("Impossible de charger le détail de la réservation");
    } finally {
      setReservationLoading(false);
    }
  };

  const openContrat = async (c: AdminContratLocation) => {
    setSelectedContrat(c);
    setContratLoading(true);
    try {
      const raw = await adminApi.getLocationContrat(c.id);
      setSelectedContrat(mapContratLocation(raw as Record<string, unknown>));
    } catch {
      toast.error("Impossible de charger le contrat");
    } finally {
      setContratLoading(false);
    }
  };

  const handleDownloadContratPdf = async (contrat: AdminContratLocation) => {
    setDownloadingContratPdf(true);
    try {
      await downloadContratPdfFromApi(contrat.id, `contrat-${contrat.numero}.pdf`);
      toast.success("Contrat PDF téléchargé");
    } catch {
      toast.error("Impossible de télécharger le PDF");
    } finally {
      setDownloadingContratPdf(false);
    }
  };

  const openContratFromReservation = async (reservation: AdminReservation) => {
    if (!reservation.contrat_id) {
      toast.error("Aucun contrat lié à cette réservation");
      return;
    }
    setSelectedReservation(null);
    await openContrat({
      id: reservation.contrat_id,
      numero: reservation.contrat_numero ?? reservation.contrat_id,
      statut: reservation.contrat_statut ?? "",
      reservation_id: reservation.id,
      reservation_numero: reservation.numero,
      materiel_titre: reservation.materiel_titre,
    });
  };

  const handleModerer = async (id: string, action: "approuver" | "rejeter") => {
    try {
      await adminApi.modererMateriel(id, {
        action,
        motif: action === "rejeter" ? rejectMotif.trim() || "Rejetée par l'administrateur" : undefined,
      });
      toast.success(action === "approuver" ? "Annonce publiée" : "Annonce rejetée");
      setSelectedMateriel(null);
      setRejectMotif("");
      await Promise.all([loadMateriels(), loadStats()]);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur modération");
    }
  };

  const handleValiderPaiement = async (paiementId: string) => {
    setValidatingPayment(true);
    try {
      await paiementsApi.valider(paiementId);
      toast.success("Paiement location validé — réservation passée en « payée »");
      setSelectedReservation(null);
      await Promise.all([loadReservations(), loadStats()]);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Validation impossible");
    } finally {
      setValidatingPayment(false);
    }
  };

  const pendingPaymentsCount = useMemo(
    () => stats?.paiements.en_attente ?? 0,
    [stats],
  );

  const imageMedias =
    selectedMateriel?.medias.filter((m) => m.type === "image" && materielMediaSrc(m)) ?? [];

  const activityReservations = tab === "activite" ? reservations.slice(0, 15) : reservations;

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <Package className="h-7 w-7 text-primary" />
              Location matériel
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Vue d&apos;ensemble de l&apos;activité location : annonces, réservations, escrow et commissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/admin/litiges">Litiges location</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/admin/transactions">Transactions</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/admin/categories-materiel">Catégories</Link>
            </Button>
          </div>
        </div>

        {/* Stats activité */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-[120px] animate-pulse bg-muted/40" />
            ))
          ) : stats ? (
            <>
              <StatCard
                label="Annonces publiées"
                value={stats.annonces.publie}
                hint={`${stats.annonces.en_attente_moderation} en modération`}
                icon={Package}
              />
              <StatCard
                label="Réservations actives"
                value={stats.reservations.en_cours}
                hint={`${stats.reservations.total} au total · ${stats.reservations.terminee} terminées`}
                icon={Activity}
                accent="success"
              />
              <StatCard
                label="Paiements à valider"
                value={stats.paiements.en_attente}
                hint={
                  stats.reservations.en_attente_paiement > 0
                    ? `${stats.reservations.en_attente_paiement} réservation(s) en attente`
                    : "Aucun en attente"
                }
                icon={CreditCard}
                accent={stats.paiements.en_attente > 0 ? "warning" : "default"}
              />
              <StatCard
                label="Commissions location"
                value={formatFc(stats.finances.commissions_location_fc)}
                hint={`Volume validé ${formatFc(stats.finances.volume_valide_fc)}`}
                icon={Coins}
                accent="money"
              />
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder={
                  tab === "contrats"
                    ? "Rechercher un contrat, une réservation…"
                    : tab === "reservations" || tab === "activite"
                      ? "Rechercher une réservation…"
                      : "Rechercher une annonce…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refresh()}
              />
            </div>
            <Button variant="outline" className="h-11 shrink-0" onClick={refresh}>
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
                Filtres actifs
              </Badge>
            )}
          </div>

          {showFilters && (
            <Card>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <DateRangeFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    label="Période de création"
                  />
                  {(tab === "reservations" || tab === "contrats" || tab === "activite") && (
                    <DateRangeFilter
                      startDate={locationStartDate}
                      endDate={locationEndDate}
                      onStartDateChange={setLocationStartDate}
                      onEndDateChange={setLocationEndDate}
                      label="Période de location"
                    />
                  )}
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="activite" className="px-4 py-2">
              Activité
            </TabsTrigger>
            <TabsTrigger value="moderation" className="px-4 py-2">
              Modération
              {(stats?.annonces.en_attente_moderation ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {stats?.annonces.en_attente_moderation}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="annonces" className="px-4 py-2">
              Annonces
            </TabsTrigger>
            <TabsTrigger value="reservations" className="px-4 py-2">
              Réservations
              {pendingPaymentsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingPaymentsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contrats" className="px-4 py-2">
              Contrats
              {(stats?.contrats?.total ?? 0) > 0 && (
                <Badge variant="outline" className="ml-2">
                  {stats?.contrats?.total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activite" className="mt-6 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Dernières réservations</h2>
                  <p className="text-sm text-muted-foreground">Toute l&apos;activité location récente</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setTab("reservations")}>
                  Tout voir
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              {loading ? (
                <AdminListSkeleton items={3} />
              ) : activityReservations.length === 0 ? (
                <EmptyPanel message="Aucune réservation pour le moment" />
              ) : (
                <div className="space-y-4">
                  {activityReservations.map((r) => (
                    <ReservationCard key={r.id} reservation={r} onOpen={() => openReservation(r)} />
                  ))}
                </div>
              )}
            </section>

            {(stats?.pending_materiels.length ?? 0) > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Modération en attente</h2>
                    <p className="text-sm text-muted-foreground">Annonces à examiner en priorité</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTab("moderation")}>
                    File modération
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {stats!.pending_materiels.map((m) => (
                    <MaterielCard key={m.id} materiel={m} onReview={() => openMateriel(m)} />
                  ))}
                </div>
              </section>
            )}

            {(stats?.reservations.litige ?? 0) > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium">{stats?.reservations.litige} litige(s) location ouvert(s)</p>
                      <p className="text-sm text-muted-foreground">Les fonds escrow sont gelés jusqu&apos;à résolution.</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/admin/litiges">Gérer les litiges</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="moderation" className="mt-6 space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : materiels.length === 0 ? (
              <EmptyPanel message="Aucune annonce en attente de modération" icon={CheckCircle2} />
            ) : (
              <div className="space-y-4">
                {materiels.map((m) => (
                  <MaterielCard key={m.id} materiel={m} onReview={() => openMateriel(m)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="annonces" className="mt-6 space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : materiels.length === 0 ? (
              <EmptyPanel message="Aucune annonce trouvée" />
            ) : (
              <div className="space-y-4">
                {materiels.map((m) => (
                  <MaterielCard key={m.id} materiel={m} onReview={() => openMateriel(m)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservations" className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={reservationFilter === "all" ? "default" : "outline"}
                onClick={() => setReservationFilter("all")}
              >
                Toutes
              </Button>
              <Button
                size="sm"
                variant={reservationFilter === "en_attente_paiement" ? "default" : "outline"}
                onClick={() => setReservationFilter("en_attente_paiement")}
              >
                Paiements en attente
                {pendingPaymentsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingPaymentsCount}
                  </Badge>
                )}
              </Button>
            </div>

            {loading ? (
              <AdminListSkeleton items={3} />
            ) : reservations.length === 0 ? (
              <EmptyPanel message="Aucune réservation" />
            ) : (
              <div className="space-y-4">
                {reservations.map((r) => (
                  <ReservationCard key={r.id} reservation={r} onOpen={() => openReservation(r)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contrats" className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={contratFilter === "all" ? "default" : "outline"}
                onClick={() => setContratFilter("all")}
              >
                Tous
              </Button>
              <Button
                size="sm"
                variant={contratFilter === "actif" ? "default" : "outline"}
                onClick={() => setContratFilter("actif")}
              >
                Actifs
                {(stats?.contrats?.actif ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats?.contrats?.actif}
                  </Badge>
                )}
              </Button>
              <Button
                size="sm"
                variant={contratFilter === "en_attente" ? "default" : "outline"}
                onClick={() => setContratFilter("en_attente")}
              >
                En attente signature
              </Button>
            </div>

            {loading ? (
              <AdminListSkeleton items={3} />
            ) : contrats.length === 0 ? (
              <EmptyPanel message="Aucun contrat de location" icon={FileText} />
            ) : (
              <div className="space-y-4">
                {contrats.map((c) => (
                  <ContratCard
                    key={c.id}
                    contrat={c}
                    onOpen={() => openContrat(c)}
                    onDownload={() => handleDownloadContratPdf(c)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <FormDrawer
          open={!!selectedContrat}
          onOpenChange={(open) => !open && setSelectedContrat(null)}
          title={`Contrat ${selectedContrat?.numero ?? ""}`}
          description={selectedContrat?.materiel_titre}
        >
          {selectedContrat && (
            <div className="space-y-5">
              {contratLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statutVariant(selectedContrat.statut)}>
                      {statutLabel(selectedContrat.statut)}
                    </Badge>
                    {selectedContrat.reservation_statut && (
                      <Badge variant="outline">
                        Réservation : {statutLabel(selectedContrat.reservation_statut)}
                      </Badge>
                    )}
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Parties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Loueur" value={selectedContrat.loueur_name} />
                      <InfoRow label="Locataire" value={selectedContrat.locataire_name} />
                      <InfoRow label="Matériel" value={selectedContrat.materiel_titre} />
                      <InfoRow label="Réservation" value={selectedContrat.reservation_numero} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Montant TTC" value={formatFc(selectedContrat.montant_ttc)} />
                      {selectedContrat.date_debut && selectedContrat.date_fin_prevue && (
                        <InfoRow
                          label="Période"
                          value={`${formatDate(selectedContrat.date_debut)} → ${formatDate(selectedContrat.date_fin_prevue)}`}
                        />
                      )}
                      <InfoRow
                        label="Signé locataire"
                        value={selectedContrat.signe_client_at ? formatDate(selectedContrat.signe_client_at) : "Non"}
                      />
                      <InfoRow
                        label="Signé loueur"
                        value={selectedContrat.signe_loueur_at ? formatDate(selectedContrat.signe_loueur_at) : "Non"}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1"
                      disabled={downloadingContratPdf}
                      onClick={() => handleDownloadContratPdf(selectedContrat)}
                    >
                      {downloadingContratPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Télécharger le PDF
                    </Button>
                    {selectedContrat.reservation_id && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedContrat(null);
                          void openReservation({
                            id: selectedContrat.reservation_id!,
                            numero: selectedContrat.reservation_numero ?? selectedContrat.reservation_id!,
                            statut: selectedContrat.reservation_statut ?? "",
                            materiel_titre: selectedContrat.materiel_titre,
                            contrat_id: selectedContrat.id,
                            contrat_numero: selectedContrat.numero,
                            contrat_statut: selectedContrat.statut,
                          });
                        }}
                      >
                        Voir la réservation
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={!!selectedMateriel}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMateriel(null);
              setRejectMotif("");
            }
          }}
          title={selectedMateriel?.titre ?? "Annonce"}
        >
          {selectedMateriel && (
            <div className="space-y-5">
              {materielLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statutVariant(selectedMateriel.statut)}>
                      {statutLabel(selectedMateriel.statut)}
                    </Badge>
                    {selectedMateriel.categorie && (
                      <Badge variant="outline">{selectedMateriel.categorie}</Badge>
                    )}
                  </div>

                  {imageMedias.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {imageMedias.slice(0, 6).map((media) => (
                        <img
                          key={media.id}
                          src={materielMediaSrc(media)}
                          alt=""
                          className="aspect-video w-full rounded-lg border bg-muted object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Aucune photo</p>
                  )}

                  {selectedMateriel.description && (
                    <p className="text-sm leading-relaxed">{selectedMateriel.description}</p>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Informations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Loueur" value={selectedMateriel.loueur_name} />
                      <InfoRow label="Email" value={selectedMateriel.loueur_email} />
                      <InfoRow
                        label="Localisation"
                        value={[selectedMateriel.ville, selectedMateriel.quartier].filter(Boolean).join(", ")}
                      />
                      <InfoRow label="Marque" value={selectedMateriel.marque} />
                      <InfoRow label="Modèle" value={selectedMateriel.modele} />
                      <InfoRow label="État" value={etatLabel(selectedMateriel.etat)} />
                      <InfoRow label="Stock" value={selectedMateriel.quantite_stock} />
                      <InfoRow label="Prix / jour" value={formatFc(selectedMateriel.prix_jour)} />
                      <InfoRow label="Prix / semaine" value={formatFc(selectedMateriel.prix_semaine)} />
                      <InfoRow label="Caution estimée" value={formatFc(selectedMateriel.caution_calculee)} />
                      <InfoRow label="Frais livraison" value={formatFc(selectedMateriel.frais_livraison)} />
                    </CardContent>
                  </Card>

                  {selectedMateriel.statut === "en_attente_moderation" && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Motif de rejet (optionnel)</Label>
                        <Textarea
                          value={rejectMotif}
                          onChange={(e) => setRejectMotif(e.target.value)}
                          placeholder="Contenu inapproprié, photos floues…"
                          rows={3}
                        />
                      </div>
                      <SlideToConfirm
                        label="Approuver et publier l'annonce"
                        hint="Glisser pour publier"
                        variant="success"
                        successMessage="Annonce publiée"
                        onConfirm={() => handleModerer(selectedMateriel.id, "approuver")}
                      />
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleModerer(selectedMateriel.id, "rejeter")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeter l&apos;annonce
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={!!selectedReservation}
          onOpenChange={(open) => !open && setSelectedReservation(null)}
          title={selectedReservation?.materiel_titre ?? "Réservation"}
          description={selectedReservation ? `N° ${selectedReservation.numero}` : undefined}
        >
          {selectedReservation && (
            <div className="space-y-5">
              {reservationLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statutVariant(selectedReservation.statut)}>
                      {statutLabel(selectedReservation.statut)}
                    </Badge>
                    {selectedReservation.contrat_statut && (
                      <Badge variant="outline">Contrat : {selectedReservation.contrat_statut}</Badge>
                    )}
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Parties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Loueur" value={selectedReservation.loueur_name} />
                      <InfoRow label="Locataire" value={selectedReservation.locataire_name} />
                      <InfoRow label="Mode remise" value={modeRemiseLabel(selectedReservation.mode_remise)} />
                      {selectedReservation.date_debut && selectedReservation.date_fin && (
                        <InfoRow
                          label="Période"
                          value={`${formatDate(selectedReservation.date_debut)} → ${formatDate(selectedReservation.date_fin)}`}
                        />
                      )}
                      <InfoRow label="Contrat" value={selectedReservation.contrat_numero} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        Escrow
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Loyer" value={formatFc(selectedReservation.montant_loyer)} />
                      <InfoRow label="Caution" value={formatFc(selectedReservation.montant_caution)} />
                      <InfoRow label="Livraison" value={formatFc(selectedReservation.montant_livraison)} />
                      <InfoRow label="Total séquestré" value={formatFc(selectedReservation.montant_total)} />
                      {selectedReservation.paiement_id && (
                        <>
                          <InfoRow label="Paiement n°" value={selectedReservation.paiement_id} />
                          <InfoRow label="Statut paiement" value={selectedReservation.paiement_statut} />
                          <InfoRow label="Méthode" value={selectedReservation.paiement_methode} />
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {selectedReservation.contrat_id && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openContratFromReservation(selectedReservation)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Voir le contrat
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={downloadingContratPdf}
                        onClick={() =>
                          handleDownloadContratPdf({
                            id: selectedReservation.contrat_id!,
                            numero: selectedReservation.contrat_numero ?? selectedReservation.contrat_id!,
                            statut: selectedReservation.contrat_statut ?? "",
                          })
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF contrat
                      </Button>
                    </div>
                  )}

                  {selectedReservation.statut === "en_attente_paiement" &&
                    selectedReservation.paiement_statut === "en_attente" &&
                    selectedReservation.paiement_id && (
                      <div className="space-y-3 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          Le locataire a initié le paiement mobile money. Validez-le pour passer la réservation en
                          « payée ».
                        </p>
                        <SlideToConfirm
                          label={`Valider le paiement ${formatFc(selectedReservation.paiement_montant ?? selectedReservation.montant_total)}`}
                          hint="Glisser pour confirmer le paiement"
                          variant="success"
                          successMessage="Paiement validé"
                          loading={validatingPayment}
                          onConfirm={() => handleValiderPaiement(selectedReservation.paiement_id!)}
                        />
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}

function EmptyPanel({
  message,
  icon: Icon = Package,
}: {
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function MaterielCard({
  materiel,
  onReview,
}: {
  materiel: AdminMateriel;
  onReview: () => void;
}) {
  const thumb = materiel.medias.find((m) => m.type === "image");
  const thumbSrc = thumb ? materielMediaSrc(thumb) : "";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-stretch">
        <div className="border-b bg-muted/30 p-4 md:w-44 md:shrink-0 md:border-b-0 md:border-r lg:w-52">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              className="aspect-[4/3] w-full rounded-lg border bg-muted object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
              Pas d&apos;image
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-snug sm:text-lg">{materiel.titre}</h3>
              <Badge variant={statutVariant(materiel.statut)}>{statutLabel(materiel.statut)}</Badge>
              {materiel.categorie && <Badge variant="outline">{materiel.categorie}</Badge>}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {materiel.loueur_name ?? "Loueur"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {materiel.ville ?? "Ville non renseignée"}
              </span>
            </div>

            {(materiel.marque || materiel.prix_jour != null) && (
              <div className="flex flex-wrap items-baseline gap-3">
                {materiel.marque && (
                  <span className="text-sm text-muted-foreground">
                    {materiel.marque} {materiel.modele ?? ""}
                  </span>
                )}
                {materiel.prix_jour != null && (
                  <span className="text-base font-semibold text-foreground">
                    {formatFc(materiel.prix_jour)}
                    <span className="text-sm font-normal text-muted-foreground"> / jour</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center border-t p-4 md:w-36 md:shrink-0 md:border-l md:border-t-0 md:p-5">
          <Button variant="outline" className="w-full" onClick={onReview}>
            <Eye className="mr-2 h-4 w-4" />
            Examiner
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ReservationCard({
  reservation,
  onOpen,
}: {
  reservation: AdminReservation;
  onOpen: () => void;
}) {
  const needsPayment =
    reservation.statut === "en_attente_paiement" && reservation.paiement_statut === "en_attente";

  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-md ${needsPayment ? "border-amber-500/40 ring-1 ring-amber-500/20" : ""}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold sm:text-lg">
              {reservation.materiel_titre ?? "Matériel"}
            </h3>
            <Badge variant={statutVariant(reservation.statut)}>{statutLabel(reservation.statut)}</Badge>
            {needsPayment && <Badge variant="destructive">Paiement à valider</Badge>}
          </div>

          <p className="font-mono text-xs text-muted-foreground">N° {reservation.numero}</p>
          {reservation.contrat_numero && (
            <p className="font-mono text-xs text-muted-foreground">
              Contrat {reservation.contrat_numero}
            </p>
          )}

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Loueur · </span>
              {reservation.loueur_name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Locataire · </span>
              {reservation.locataire_name ?? "—"}
            </p>
            {reservation.date_debut && reservation.date_fin && (
              <p className="flex items-center gap-1.5 sm:col-span-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(reservation.date_debut)} → {formatDate(reservation.date_fin)}
              </p>
            )}
          </div>

          {reservation.montant_total != null && (
            <p className="text-lg font-bold text-primary">{formatFc(reservation.montant_total)}</p>
          )}
        </div>

        <div className="flex items-center border-t p-4 lg:w-36 lg:shrink-0 lg:border-l lg:border-t-0 lg:p-5">
          <Button variant="outline" className="w-full" onClick={onOpen}>
            <Eye className="mr-2 h-4 w-4" />
            Détail
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ContratCard({
  contrat,
  onOpen,
  onDownload,
}: {
  contrat: AdminContratLocation;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const signed =
    Boolean(contrat.signe_client_at) && Boolean(contrat.signe_loueur_at);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4 border-b bg-muted/20 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-mono text-base font-semibold sm:text-lg">{contrat.numero}</h3>
            <Badge variant={statutVariant(contrat.statut)}>{statutLabel(contrat.statut)}</Badge>
            {signed ? (
              <Badge variant="default" className="bg-emerald-600">Signé</Badge>
            ) : (
              <Badge variant="secondary">Signatures incomplètes</Badge>
            )}
          </div>

          <p className="text-base font-medium">{contrat.materiel_titre ?? "Matériel"}</p>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Loueur · </span>
              {contrat.loueur_name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Locataire · </span>
              {contrat.locataire_name ?? "—"}
            </p>
            {contrat.reservation_numero && (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Réservation · </span>
                {contrat.reservation_numero}
                {contrat.reservation_statut && (
                  <span className="text-muted-foreground"> ({statutLabel(contrat.reservation_statut)})</span>
                )}
              </p>
            )}
            {contrat.date_debut && contrat.date_fin_prevue && (
              <p className="flex items-center gap-1.5 sm:col-span-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(contrat.date_debut)} → {formatDate(contrat.date_fin_prevue)}
              </p>
            )}
          </div>

          {contrat.montant_ttc != null && (
            <p className="text-lg font-bold text-primary">{formatFc(contrat.montant_ttc)}</p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2 p-4 lg:w-44 lg:shrink-0 lg:p-5">
          <Button variant="outline" className="w-full" onClick={onOpen}>
            <Eye className="mr-2 h-4 w-4" />
            Détail
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
