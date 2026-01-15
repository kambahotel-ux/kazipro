import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, Plus, ArrowRight, Loader2 } from "lucide-react";
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
  const [stats, setStats] = useState({ active: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {clientName} 👋</h1>
            <p className="text-muted-foreground">Voici un aperçu de vos demandes de service</p>
          </div>
          <Button asChild>
            <Link to="/services">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Demandes actives"
            value={stats.active}
            icon={<FileText className="w-5 h-5" />}
          />
          <StatsCard
            title="En attente de devis"
            value={stats.pending}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatsCard
            title="En cours"
            value={stats.inProgress}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatsCard
            title="Terminées"
            value={stats.completed}
            subtitle="Ce mois"
            icon={<CheckCircle className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Demandes récentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/client/demandes">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande pour le moment
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{request.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.prestataire || "En recherche de prestataire"} • {new Date(request.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant={statusLabels[request.status]?.variant || "outline"}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/services">
                  <Plus className="w-5 h-5 mb-2" />
                  <span className="text-sm">Nouvelle demande</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/dashboard/client/messages">
                  <FileText className="w-5 h-5 mb-2" />
                  <span className="text-sm">Mes messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/dashboard/client/paiements">
                  <Clock className="w-5 h-5 mb-2" />
                  <span className="text-sm">Paiements</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/dashboard/client/avis">
                  <CheckCircle className="w-5 h-5 mb-2" />
                  <span className="text-sm">Mes avis</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
