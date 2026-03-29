import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, Plus, ArrowRight, Loader2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Request {
  id: string;
  title: string;
  status: string;
  created_at: string;
  prestataire?: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "default" },
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchPendingActions = async (clientId: string) => {
    try {
      const actions: any[] = [];

      // 1. Devis en attente d'acceptation - vérifier dans les deux tables
      
      // Essayer d'abord devis_pro
      const { data: devisProData } = await supabase
        .from('devis_pro')
        .select(`
          id,
          numero,
          montant_ttc,
          statut,
          created_at,
          prestataires (full_name)
        `)
        .eq('client_id', clientId)
        .eq('statut', 'en_attente');

      // Puis devis (ancienne table)
      const { data: devisData } = await supabase
        .from('devis')
        .select(`
          id,
          numero,
          montant_ttc,
          statut,
          created_at,
          prestataire:prestataires (full_name)
        `)
        .eq('client_id', clientId)
        .in('statut', ['en_attente', 'envoye']);

      // Combiner les résultats
      const allDevis = [
        ...(devisProData || []),
        ...(devisData || []).map(d => ({
          ...d,
          prestataires: Array.isArray(d.prestataire) ? d.prestataire[0] : d.prestataire
        }))
      ];

      if (allDevis.length > 0) {
        allDevis.forEach((devis: any) => {
          const prestataireFullName = devis.prestataires?.full_name || 'N/A';
          actions.push({
            type: 'devis',
            id: devis.id,
            title: `Devis N° ${devis.numero || 'N/A'}`,
            description: `${devis.montant_ttc.toLocaleString()} FC - ${prestataireFullName}`,
            action: 'Accepter le devis',
            link: `/dashboard/client/devis/${devis.id}/accepter`,
            date: devis.created_at
          });
        });
      }

      // 2. Contrats à signer
      const { data: contratsData } = await supabase
        .from('contrats')
        .select(`
          id,
          numero,
          statut,
          created_at,
          devis_id
        `)
        .eq('client_id', clientId)
        .eq('statut', 'genere');

      if (contratsData) {
        contratsData.forEach((contrat) => {
          actions.push({
            type: 'contrat',
            id: contrat.id,
            title: `Contrat N° ${contrat.numero}`,
            description: 'Signature électronique requise',
            action: 'Signer le contrat',
            link: `/dashboard/client/contrat/${contrat.devis_id}`,
            date: contrat.created_at
          });
        });
      }

      // 3. Paiements en attente (contrats signés mais pas encore payés)
      const { data: contratsSignesData } = await supabase
        .from('contrats')
        .select(`
          id,
          numero,
          statut,
          statut_paiement,
          created_at
        `)
        .eq('client_id', clientId)
        .eq('statut', 'signe_client');

      if (contratsSignesData) {
        for (const contrat of contratsSignesData) {
          // Vérifier si le paiement d'acompte existe mais pas le solde
          if (contrat.statut_paiement === 'non_paye') {
            // Acompte pas encore payé
            actions.push({
              type: 'paiement',
              id: contrat.id,
              title: `Paiement acompte - Contrat N° ${contrat.numero}`,
              description: 'Paiement de l\'acompte requis',
              action: 'Payer l\'acompte',
              link: `/dashboard/client/paiement/${contrat.id}/acompte`,
              date: contrat.created_at
            });
          } else if (contrat.statut_paiement === 'acompte_paye') {
            // Acompte payé mais solde pas encore payé
            actions.push({
              type: 'paiement_solde',
              id: contrat.id,
              title: `Paiement solde - Contrat N° ${contrat.numero}`,
              description: 'Paiement du solde requis (travaux terminés)',
              action: 'Payer le solde',
              link: `/dashboard/client/paiement/${contrat.id}/solde`,
              date: contrat.created_at
            });
          }
        }
      }

      // Trier par date (plus récent en premier)
      actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPendingActions(actions.slice(0, 5)); // Limiter à 5 actions
    } catch (error: any) {
      console.error('Erreur pending actions:', error);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch client profile
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("user_id", user.id)
        .single();

      if (clientData) {
        setClientName(clientData.full_name);

        // Fetch user's demandes using client_id
        const { data: demandesData, error: demandesError } = await supabase
          .from("demandes")
          .select("*")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });

        if (demandesError) throw demandesError;

        // Map demandes to requests - use 'status' column (English values in DB)
        const requests = (demandesData || []).map((d: any) => ({
          id: d.id,
          title: d.title || "Sans titre",
          status: d.status || "active",
          created_at: d.created_at,
          prestataire: "Prestataire",
        }));

        setRecentRequests(requests.slice(0, 3));

        // Calculate stats based on database status values
        const activeCount = requests.filter((r) => r.status === "active").length;
        const inProgressCount = requests.filter((r) => r.status === "in_progress").length;
        const completedCount = requests.filter((r) => r.status === "completed").length;
        const totalActive = activeCount + inProgressCount; // Total active = active + in_progress

        setStats({
          active: totalActive,
          pending: activeCount,
          inProgress: inProgressCount,
          completed: completedCount,
        });

        // Fetch pending actions (devis to accept, contracts to sign, payments to make)
        await fetchPendingActions(clientData.id);
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-4 md:space-y-6">
        {/* Header - Mobile Optimized */}
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

        {/* Stats Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Demandes actives"
            value={stats.active}
            icon={<FileText className="w-4 h-4 md:w-5 md:h-5" />}
          />
          <StatsCard
            title="En attente de devis"
            value={stats.pending}
            icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />}
          />
          <StatsCard
            title="En cours"
            value={stats.inProgress}
            icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />}
          />
          <StatsCard
            title="Terminées"
            value={stats.completed}
            subtitle="Ce mois"
            icon={<CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Actions en attente - Mobile Optimized */}
          {pendingActions.length > 0 && (
            <Card className="lg:col-span-2 border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Actions en attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {pendingActions.map((action, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg bg-white border border-orange-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
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
              </CardContent>
            </Card>
          )}

          {/* Demandes récentes - Mobile Optimized */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Demandes récentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/client/demandes">
                  <span className="hidden sm:inline">Voir tout</span>
                  <span className="sm:hidden">Tout</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-6 md:py-8">
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
                  Aucune demande pour le moment
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{request.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="hidden sm:inline">{request.prestataire || "En recherche de prestataire"} • </span>
                          {new Date(request.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant={statusLabels[request.status]?.variant || "outline"} className="shrink-0 text-xs">
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides - Mobile Optimized */}
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
    </DashboardLayout>
  );
}
