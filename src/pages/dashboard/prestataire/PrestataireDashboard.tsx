import { useCallback, useState, type ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  DollarSign,
  Star,
  TrendingUp,
  ArrowRight,
  MapPin,
  Target,
  Users,
  Clock,
  CheckCircle,
  Scale,
  FileText,
  AlertTriangle,
  MessageSquare,
  LayoutGrid,
  HardHat,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { prestatairesApi, type PrestataireDashboardResponse } from "@/lib/api";
import {
  displayNameFromProfil,
  getProfil,
  getPrestataireValidationStatus,
  isPrestataireValidated,
  prestataireIdFromUser,
  professionLabelFromProfil,
} from "@/lib/kazipro-profile";
import { PrestataireVerificationBadge } from "@/components/prestataire/PrestataireVerificationBadge";
import { PRESTATAIRE_PATHS } from "@/lib/prestataire-nav";
import { toast } from "sonner";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { PrestatairePendingHomeMessage } from "@/components/prestataire/PrestatairePendingHomeMessage";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { DashboardHomeSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { cn } from "@/lib/utils";
import {
  DashboardPreviewLink,
  ListCardBudgetPanel,
  ListCardMeta,
  urgencyAccentClass,
} from "@/components/prestataire/list-card-primitives";

function formatFc(amount: number) {
  return `${Math.round(amount).toLocaleString("fr-FR")} FC`;
}

function formatBudget(d: PrestataireDashboardResponse["opportunites_recentes"][0]) {
  const max = Number(d.budget_max ?? 0);
  const min = Number(d.budget_min ?? 0);
  if (max > 0) return `Jusqu'à ${max.toLocaleString("fr-FR")} FC`;
  if (min > 0) return `${min.toLocaleString("fr-FR")} FC`;
  return "—";
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function DashboardHubPanel({
  title,
  description,
  href,
  accentClass,
  children,
}: {
  title: string;
  description: string;
  href: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className={cn("h-1 w-full", accentClass)} />
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs" asChild>
          <Link to={href}>
            Ouvrir
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

const QUICK_LINKS = [
  {
    label: "Marché",
    href: PRESTATAIRE_PATHS.marcheOpportunites,
    icon: LayoutGrid,
    color: "bg-primary/10 text-primary hover:bg-primary/15",
  },
  {
    label: "Mes devis",
    href: PRESTATAIRE_PATHS.marcheDevis,
    icon: FileText,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
  },
  {
    label: "Chantiers",
    href: PRESTATAIRE_PATHS.chantiersMissions,
    icon: HardHat,
    color: "bg-info/10 text-info hover:bg-info/15",
  },
  {
    label: "Messages",
    href: PRESTATAIRE_PATHS.messages,
    icon: MessageSquare,
    color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-500/15",
  },
] as const;

export default function PrestataireDashboard() {
  const { user } = useAuth();
  const { isProfileComplete, hasFullAccess, validationStatus, motifRejet } = usePrestataireAccess();
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerProfession, setProviderProfession] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerVerified, setProviderVerified] = useState(false);
  const [initialDisponible, setInitialDisponible] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [dashboard, setDashboard] = useState<PrestataireDashboardResponse | null>(null);

  const userId = user?.id;

  const loadDashboard = useCallback(
    async (signal?: AbortSignal, options?: { force?: boolean; silent?: boolean }) => {
      if (!user) return;

      const profil = getProfil(user);
      const pid = prestataireIdFromUser(user);

      if (!profil || !pid) {
        toast.error("Profil prestataire non trouvé");
        return;
      }

      setProviderName(displayNameFromProfil(profil, user.name || "Prestataire"));
      setProviderProfession(professionLabelFromProfil(profil) || "Prestataire");
      setProviderId(pid);
      setProviderVerified(isPrestataireValidated(profil));
      setInitialDisponible(!!profil.disponible);

      if (!hasFullAccess) {
        setDashboard(null);
        setLoadError(false);
        return;
      }

      if (!options?.silent) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await prestatairesApi.getDashboard({ force: options?.force });
        if (signal?.aborted) return;
        setDashboard(data);
        setLoadError(false);
      } catch (error: unknown) {
        if (signal?.aborted) return;
        console.error("Error fetching dashboard:", error);
        setLoadError(true);
        toast.error("Erreur lors du chargement du tableau de bord");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user, hasFullAccess],
  );

  useAbortableFetch(!!userId, [userId, hasFullAccess, loadDashboard], (signal) =>
    loadDashboard(signal),
  );

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={providerName} userRole={providerProfession}>
        <DashboardHomeSkeleton />
      </DashboardLayout>
    );
  }

  const marche = dashboard?.marche;
  const chantiers = dashboard?.chantiers;
  const devis = dashboard?.devis;
  const profilStats = dashboard?.profil;
  const litiges = dashboard?.litiges;
  const opportunites = dashboard?.opportunites_recentes ?? [];
  const missionsActives = dashboard?.missions_actives ?? [];
  const firstName = providerName.split(" ")[0];
  const note = profilStats?.note_moyenne ?? 0;

  return (
    <DashboardLayout
      role="prestataire"
      userName={providerName}
      userRole={providerProfession}
      isVerified={providerVerified}
      isProfileComplete={isProfileComplete}
    >
      <div className="space-y-5 md:space-y-7">
        <PrestatairePendingHomeMessage
          validationStatus={validationStatus}
          profileComplete={isProfileComplete}
          motifRejet={motifRejet}
        />
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:h-14 sm:w-14">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tableau de bord · {todayLabel}
                  </p>
                  <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Bonjour, {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{providerProfession}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PrestataireVerificationBadge status={validationStatus} size="md" />
                    {note > 0 ? (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        {note} · {profilStats?.nb_avis ?? 0} avis
                      </Badge>
                    ) : null}
                    {(marche?.demandes_urgentes ?? 0) > 0 ? (
                      <Badge variant="destructive" className="font-normal">
                        {marche?.demandes_urgentes} urgente
                        {(marche?.demandes_urgentes ?? 0) > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                    {(chantiers?.missions_en_cours ?? 0) > 0 ? (
                      <Badge className="bg-info/15 text-info hover:bg-info/20 font-normal">
                        {chantiers?.missions_en_cours} mission
                        {(chantiers?.missions_en_cours ?? 0) > 1 ? "s" : ""} en cours
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:max-w-sm lg:flex-col">
                <AvailabilityToggle providerId={providerId} initialDisponible={initialDisponible} />
                {hasFullAccess ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={refreshing}
                    onClick={() => void loadDashboard(undefined, { force: true, silent: true })}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Actualiser
                  </Button>
                ) : null}
              </div>
            </div>

            {hasFullAccess ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:mt-5">
                {QUICK_LINKS.map(({ label, href, icon: Icon, color }) => (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!hasFullAccess ? null : loadError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Impossible de charger vos indicateurs pour le moment.
              </p>
              <Button onClick={() => void loadDashboard(undefined, { force: true })}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : dashboard ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
            <div className="space-y-5 xl:col-span-2">
              <DashboardHubPanel
                title="Performance"
                description="Réputation et résultats commerciaux"
                href={PRESTATAIRE_PATHS.compteProfil}
                accentClass="bg-gradient-to-r from-amber-500 to-orange-400"
              >
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                  <StatsCard
                    compact
                    title="Note moyenne"
                    shortTitle="Note"
                    value={note > 0 ? String(note) : "—"}
                    subtitle={(profilStats?.nb_avis ?? 0) > 0 ? `${profilStats?.nb_avis} avis` : "—"}
                    icon={<Star className="h-4 w-4" />}
                    iconClassName="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  />
                  <StatsCard
                    compact
                    title="Missions"
                    shortTitle="Missions"
                    value={String(profilStats?.nb_missions ?? 0)}
                    subtitle="Carrière"
                    icon={<Briefcase className="h-4 w-4" />}
                    iconClassName="bg-primary/10 text-primary"
                  />
                  <StatsCard
                    compact
                    title="Revenus du mois"
                    shortTitle="Mois"
                    value={formatFc(devis?.revenus_mois_fc ?? 0)}
                    subtitle="Devis acceptés"
                    icon={<DollarSign className="h-4 w-4" />}
                    iconClassName="bg-success/15 text-success"
                  />
                  <StatsCard
                    compact
                    title="Taux acceptation"
                    shortTitle="Taux"
                    value={(devis?.taux_acceptation ?? 0) > 0 ? `${devis?.taux_acceptation}%` : "—"}
                    subtitle={`${devis?.acceptes ?? 0}/${devis?.envoyes ?? 0}`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    iconClassName="bg-info/15 text-info"
                  />
                </div>
              </DashboardHubPanel>

              <DashboardHubPanel
                title="Marché & devis"
                description="Opportunités et propositions commerciales"
                href={PRESTATAIRE_PATHS.marcheOpportunites}
                accentClass="bg-gradient-to-r from-primary to-emerald-500"
              >
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                  <StatsCard
                    compact
                    href={PRESTATAIRE_PATHS.marcheOpportunites}
                    title="Opportunités publiques"
                    shortTitle="Public"
                    value={String(marche?.opportunites_publiques ?? 0)}
                    subtitle="Votre métier"
                    icon={<Target className="h-4 w-4" />}
                    iconClassName="bg-primary/10 text-primary"
                  />
                  <StatsCard
                    compact
                    href={PRESTATAIRE_PATHS.marcheOpportunites}
                    title="Invitations"
                    shortTitle="Invit."
                    value={String(marche?.invitations_directes ?? 0)}
                    subtitle={
                      (marche?.invitations_en_attente ?? 0) > 0
                        ? `${marche?.invitations_en_attente} en attente`
                        : "Reçues"
                    }
                    icon={<Users className="h-4 w-4" />}
                    iconClassName="bg-orange-500/15 text-orange-600 dark:text-orange-400"
                  />
                  <StatsCard
                    compact
                    href={PRESTATAIRE_PATHS.marcheOpportunites}
                    title="Urgentes"
                    shortTitle="Urgent"
                    value={String(marche?.demandes_urgentes ?? 0)}
                    subtitle="À traiter vite"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    iconClassName="bg-destructive/15 text-destructive"
                  />
                  <StatsCard
                    compact
                    href={PRESTATAIRE_PATHS.marcheDevis}
                    title="Devis envoyés"
                    shortTitle="Devis"
                    value={String(devis?.envoyes ?? 0)}
                    subtitle={`${devis?.acceptes ?? 0} acceptés`}
                    icon={<FileText className="h-4 w-4" />}
                    iconClassName="bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  />
                </div>
              </DashboardHubPanel>

              <div className="grid gap-5 md:grid-cols-2">
                <DashboardHubPanel
                  title="Chantiers"
                  description="Missions et revenus terrain"
                  href={PRESTATAIRE_PATHS.chantiersMissions}
                  accentClass="bg-gradient-to-r from-sky-500 to-blue-600"
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    <StatsCard
                      compact
                      href={PRESTATAIRE_PATHS.chantiersMissions}
                      title="En cours"
                      value={String(chantiers?.missions_en_cours ?? 0)}
                      subtitle="Actives"
                      icon={<Clock className="h-4 w-4" />}
                      iconClassName="bg-info/15 text-info"
                    />
                    <StatsCard
                      compact
                      title="Complétées"
                      value={String(chantiers?.missions_completees ?? 0)}
                      subtitle="Validées"
                      icon={<CheckCircle className="h-4 w-4" />}
                      iconClassName="bg-success/15 text-success"
                    />
                    <StatsCard
                      compact
                      title="Revenus"
                      value={formatFc(chantiers?.revenus_generes_fc ?? 0)}
                      subtitle="Total"
                      icon={<DollarSign className="h-4 w-4" />}
                      iconClassName="bg-primary/10 text-primary"
                    />
                  </div>
                </DashboardHubPanel>

                <DashboardHubPanel
                  title="Litiges"
                  description="Suivi des dossiers ouverts"
                  href={PRESTATAIRE_PATHS.compteLitiges}
                  accentClass="bg-gradient-to-r from-slate-500 to-slate-700"
                >
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <StatsCard
                      compact
                      title="Total dossiers"
                      shortTitle="Total"
                      value={String(litiges?.total ?? 0)}
                      subtitle="Historique"
                      icon={<Scale className="h-4 w-4" />}
                      iconClassName="bg-muted text-muted-foreground"
                    />
                    <StatsCard
                      compact
                      title="En cours"
                      shortTitle="Ouverts"
                      value={String(litiges?.en_cours ?? 0)}
                      subtitle="À traiter"
                      icon={<Scale className="h-4 w-4" />}
                      iconClassName="bg-warning/15 text-warning"
                    />
                  </div>
                </DashboardHubPanel>
              </div>
            </div>

            <div className="space-y-5">
              <Card className="border-border/80 shadow-sm xl:sticky xl:top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">À traiter en priorité</CardTitle>
                  <CardDescription className="text-xs">
                    Dernières opportunités et missions actives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Opportunités
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <Link to={PRESTATAIRE_PATHS.marcheOpportunites}>Tout voir</Link>
                      </Button>
                    </div>
                    {opportunites.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center">
                        <p className="text-xs text-muted-foreground">Aucune opportunité pour le moment</p>
                        <Button size="sm" variant="link" className="mt-2 h-auto p-0" asChild>
                          <Link to={PRESTATAIRE_PATHS.marcheOpportunites}>Parcourir le marché</Link>
                        </Button>
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {opportunites.slice(0, 3).map((demande) => (
                          <li key={demande.id}>
                            <DashboardPreviewLink
                              to={PRESTATAIRE_PATHS.demandeDetail(demande.id)}
                              accentClass={urgencyAccentClass(demande.urgence ?? "normal")}
                              title={demande.titre}
                              badge={
                                demande.urgence === "urgent" || demande.urgence === "tres_urgent" ? (
                                  <Badge variant="destructive" className="shrink-0 text-[10px]">
                                    Urgent
                                  </Badge>
                                ) : null
                              }
                              meta={
                                <ListCardMeta icon={MapPin}>
                                  {[demande.quartier, demande.ville].filter(Boolean).join(", ") ||
                                    "—"}
                                </ListCardMeta>
                              }
                              footer={
                                <ListCardBudgetPanel
                                  label="Budget"
                                  value={formatBudget(demande)}
                                  className="!py-2.5 [&_p:nth-child(2)]:text-base"
                                />
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Missions actives
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {missionsActives.length}
                      </Badge>
                    </div>
                    {missionsActives.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center">
                        <p className="text-xs text-muted-foreground">Aucune mission en cours</p>
                        <Button size="sm" variant="link" className="mt-2 h-auto p-0" asChild>
                          <Link to={PRESTATAIRE_PATHS.chantiersMissions}>Voir mes chantiers</Link>
                        </Button>
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {missionsActives.slice(0, 3).map((mission) => (
                          <li key={mission.id}>
                            <DashboardPreviewLink
                              to={PRESTATAIRE_PATHS.chantiersMissions}
                              accentClass="border-l-info"
                              title={mission.titre}
                              meta={
                                <ListCardMeta icon={Users}>
                                  {mission.client_nom || "Client"}
                                </ListCardMeta>
                              }
                              footer={
                                mission.montant_ttc != null ? (
                                  <ListCardBudgetPanel
                                    label="Montant"
                                    value={formatFc(Number(mission.montant_ttc))}
                                    className="!py-2.5 [&_p:nth-child(2)]:text-base"
                                  />
                                ) : null
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <Link to={PRESTATAIRE_PATHS.chantiersMissions}>
                        Voir toutes les missions
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
