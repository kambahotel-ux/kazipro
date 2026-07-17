import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { contratsApi, devisApi, demandesApi, paiementsApi } from "@/lib/api";
import {
  getClientDisplayName,
  mapDevisToUi,
  mapRecentDemandeForDashboard,
  type ClientRecentDemande,
  unwrapPaginated,
} from "@/lib/client-helpers";
import { ClientRecentDemandeCard } from "@/components/client/ClientRecentDemandeCard";
import { displayNameFromProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { DashboardHomeSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";

interface PendingAction {
  type: string;
  id: string;
  title: string;
  description: string;
  action: string;
  link: string;
  date: string;
}

const LIST_PAGE_SIZE = 20;

function prestataireLabel(devis: Record<string, unknown>): string {
  const prest =
    (devis.prestataire as Record<string, unknown> | undefined) ??
    (devis.prestataires as Record<string, unknown> | undefined);
  return displayNameFromProfil(prest ?? null, "Prestataire");
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [recentRequests, setRecentRequests] = useState<ClientRecentDemande[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState(false);

  useEffect(() => {
    if (user) {
      setClientName(getClientDisplayName(user));
      void loadDashboard();
    }
  }, [user]);

  const loadDemandes = async () => {
    const demandesRes = await demandesApi.getAll({ per_page: LIST_PAGE_SIZE });
    const demandesData = unwrapPaginated(demandesRes);

    const requests = demandesData.map((d) =>
      mapRecentDemandeForDashboard(d as Record<string, unknown>),
    );

    setRecentRequests(
      [...requests]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 2),
    );

  };

  const loadPendingActions = async () => {
    setPendingError(false);
    const [devisRes, contratsRes, paiementsRes] = await Promise.all([
      devisApi.getAll({ per_page: LIST_PAGE_SIZE }),
      contratsApi.getAll({ per_page: LIST_PAGE_SIZE }),
      paiementsApi.getAll({ per_page: LIST_PAGE_SIZE }),
    ]);

    const actions: PendingAction[] = [];
    const allDevis = unwrapPaginated(devisRes).map((d) =>
      mapDevisToUi(d as Record<string, unknown>),
    );

    allDevis
      .filter((d) => ["envoye", "en_attente"].includes(String(d.statut)))
      .forEach((devis) => {
        actions.push({
          type: "devis",
          id: String(devis.id),
          title: `Devis N° ${devis.numero || "N/A"}`,
          description: `${Number(devis.montant_ttc).toLocaleString("fr-FR")} FC — ${prestataireLabel(devis as Record<string, unknown>)}`,
          action: "Accepter le devis",
          link: `/dashboard/client/devis/${devis.id}/accepter`,
          date: String(devis.created_at ?? ""),
        });
      });

    const contrats = unwrapPaginated(contratsRes);

    contrats
      .filter((c) => ["en_attente", "signe_prestataire"].includes(String((c as { statut?: string }).statut)))
      .forEach((contrat) => {
        const c = contrat as Record<string, unknown>;
        actions.push({
          type: "contrat",
          id: String(c.id),
          title: `Contrat N° ${c.numero}`,
          description: "Signature électronique requise",
          action: "Signer le contrat",
          link: `/dashboard/client/contrat/${c.devis_id}`,
          date: String(c.created_at ?? ""),
        });
      });

    const paiements = unwrapPaginated(paiementsRes);

    for (const contrat of contrats.filter((c) =>
      ["actif", "signe_client"].includes(String((c as { statut?: string }).statut)),
    )) {
      const c = contrat as Record<string, unknown>;
      const mission = c.mission as { statut?: string } | undefined;
      const contratPaiements = paiements.filter(
        (p) => String((p as { contrat_id?: unknown }).contrat_id) === String(c.id),
      );
      const acompteValide = contratPaiements.some(
        (p) => (p as { type?: string }).type === "acompte" && (p as { statut?: string }).statut === "valide",
      );
      const soldeValide = contratPaiements.some(
        (p) => (p as { type?: string }).type === "solde" && (p as { statut?: string }).statut === "valide",
      );

      if (!acompteValide) {
        actions.push({
          type: "paiement",
          id: String(c.id),
          title: `Paiement acompte — Contrat N° ${c.numero}`,
          description: "Paiement de l'acompte requis",
          action: "Payer l'acompte",
          link: `/dashboard/client/paiement/${c.id}/acompte`,
          date: String(c.created_at ?? ""),
        });
      } else if (!soldeValide && mission?.statut === "terminee_prestataire") {
        actions.push({
          type: "paiement_solde",
          id: String(c.id),
          title: `Paiement solde — Contrat N° ${c.numero}`,
          description: "Paiement du solde requis (travaux terminés)",
          action: "Payer le solde",
          link: `/dashboard/client/paiement/${c.id}/solde`,
          date: String(c.created_at ?? ""),
        });
      }
    }

    actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setPendingActions(actions.slice(0, 5));
  };

  const loadDashboard = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await loadDemandes();
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement des demandes");
      console.error(error);
    } finally {
      setLoading(false);
    }

    try {
      setPendingLoading(true);
      await loadPendingActions();
    } catch (error: unknown) {
      setPendingError(true);
      console.error("Erreur actions en attente:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      {loading ? (
        <DashboardHomeSkeleton withStats={false} />
      ) : (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Bonjour, {clientName} 👋</h1>
            <p className="text-sm md:text-base text-muted-foreground">Voici un aperçu de vos demandes de service</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link to="/dashboard/client/recherche">
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Trouver un prestataire</span>
                <span className="sm:hidden">Trouver un pro</span>
              </Link>
            </Button>
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link to="/dashboard/client/demandes/nouvelle">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="lg:col-span-2 border-orange-200/80 bg-orange-50/40">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600 shrink-0" />
                Actions en attente
              </CardTitle>
              <CardDescription className="text-sm">
                Ce que vous devez faire maintenant : accepter un devis, signer un contrat ou
                effectuer un paiement (acompte ou solde).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="mb-3 text-sm text-muted-foreground">Chargement de vos actions…</p>
              ) : null}
              {pendingLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-orange-200/80 bg-white p-3">
                      <div className="h-10 flex-1 animate-pulse rounded-md bg-muted/80" />
                      <div className="h-9 w-28 shrink-0 animate-pulse rounded-md bg-muted/80" />
                    </div>
                  ))}
                </div>
              ) : pendingError ? (
                <div className="rounded-lg border border-destructive/25 bg-white p-4 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Impossible de charger vos actions (devis, contrats, paiements).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => void loadPendingActions()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </Button>
                </div>
              ) : pendingActions.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200/80 bg-white p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Tout est à jour</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Aucun devis à accepter, aucun contrat à signer et aucun paiement en attente.
                      Vos demandes récentes sont listées ci-dessous.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {pendingActions.map((action) => (
                    <div
                      key={`${action.type}-${action.id}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg bg-white border border-orange-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                      <Button asChild size="sm" className="w-full sm:w-auto shrink-0">
                        <Link to={action.link}>
                          <span className="truncate">{action.action}</span>
                          <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 md:pb-4">
              <div>
                <CardTitle className="text-base md:text-lg">Demandes récentes</CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Vos 2 dernières demandes — statut, budget, devis reçus et type.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" asChild>
                <Link to="/dashboard/client/demandes">
                  <span className="hidden sm:inline">Voir tout</span>
                  <span className="sm:hidden">Tout</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                  <p className="font-medium text-sm">Aucune demande pour le moment</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Publiez une demande pour recevoir des devis de prestataires.
                  </p>
                  <Button size="sm" className="mt-4 gap-2" asChild>
                    <Link to="/dashboard/client/demandes/nouvelle">
                      <Plus className="h-4 w-4" />
                      Créer une demande
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-1">
                  {recentRequests.map((request) => (
                    <ClientRecentDemandeCard key={request.id} demande={request} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 md:gap-3">
              <Button variant="outline" className="h-auto py-3 md:py-4 flex-col text-xs" asChild>
                <Link to="/dashboard/client/recherche">
                  <Search className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-2" />
                  <span className="text-center leading-tight">Trouver un prestataire</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 md:py-4 flex-col text-xs" asChild>
                <Link to="/dashboard/client/demandes/nouvelle">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-2" />
                  <span className="text-center leading-tight">Nouvelle demande</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 md:py-4 flex-col text-xs" asChild>
                <Link to="/dashboard/client/messages">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-2" />
                  <span className="text-center leading-tight">Mes messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 md:py-4 flex-col text-xs" asChild>
                <Link to="/dashboard/client/paiements">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-2" />
                  <span className="text-center leading-tight">Paiements</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 md:py-4 flex-col text-xs col-span-2" asChild>
                <Link to="/dashboard/client/avis">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-2" />
                  <span className="text-center leading-tight">Mes avis</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
