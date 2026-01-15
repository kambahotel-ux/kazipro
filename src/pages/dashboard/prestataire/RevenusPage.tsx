import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Search, Download, Eye, TrendingUp, DollarSign, CheckCircle, Clock, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Paiement {
  id: string;
  mission_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

export default function RevenusPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchPaiements();
    }
  }, [user]);

  const fetchProviderName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.full_name) {
        setProviderName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching provider name:", error);
    }
  };

  const fetchPaiements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get prestataire ID
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prestataireData) {
        setPaiements([]);
        return;
      }

      // Get missions for this prestataire
      const { data: missionsData } = await supabase
        .from("missions")
        .select("id")
        .eq("prestataire_id", prestataireData.id);

      const missionIds = missionsData?.map(m => m.id) || [];

      if (missionIds.length === 0) {
        setPaiements([]);
        return;
      }

      // Fetch paiements for these missions
      const { data, error } = await supabase
        .from("paiements")
        .select("*")
        .in("mission_id", missionIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaiements(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des revenus");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const completed = paiements.filter(p => p.status === "completed").length;
    const pending = paiements.filter(p => p.status === "pending").length;
    const totalEarnings = paiements
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingEarnings = paiements
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return [
      { title: "Revenus générés", value: `${totalEarnings.toLocaleString()} FC`, subtitle: "Complétés", icon: <DollarSign className="w-5 h-5" /> },
      { title: "En attente", value: `${pendingEarnings.toLocaleString()} FC`, subtitle: "À recevoir", icon: <Clock className="w-5 h-5" /> },
      { title: "Transactions", value: completed.toString(), subtitle: "Complétées", icon: <CheckCircle className="w-5 h-5" /> },
    ];
  };

  const filteredPaiements = paiements.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const monthlyRevenue = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return paiements
      .filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               p.status === "completed";
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mes Revenus</h1>
            <p className="text-muted-foreground">Suivi de vos revenus et paiements</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Monthly Revenue Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenus ce mois</p>
                <p className="text-3xl font-bold text-primary">{monthlyRevenue().toLocaleString()} FC</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher une transaction..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="completed">Complétés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="failed">Échoués</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : paiements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
            </CardContent>
          </Card>
        ) : (
          /* Transactions Table */
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Méthode</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaiements.map((paiement) => (
                      <tr key={paiement.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-mono">{paiement.id}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-primary">{paiement.amount.toLocaleString()} FC</td>
                        <td className="py-3 px-4 text-sm capitalize">{paiement.method}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(paiement.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <Badge variant={paiement.status === "completed" ? "default" : paiement.status === "pending" ? "secondary" : "destructive"}>
                            {paiement.status === "completed" ? "Complété" : paiement.status === "pending" ? "En attente" : "Échoué"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedPaiement(paiement);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedPaiement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Détails du paiement</CardTitle>
                <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>✕</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Transaction</p>
                    <p className="font-mono text-sm">{selectedPaiement.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="text-2xl font-bold text-primary">{selectedPaiement.amount.toLocaleString()} FC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                    <p className="font-medium capitalize">{selectedPaiement.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedPaiement.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={selectedPaiement.status === "completed" ? "default" : "secondary"} className="mt-1">
                      {selectedPaiement.status === "completed" ? "Complété" : "En attente"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="text-muted-foreground">Votre paiement a été traité avec succès. Vous recevrez les fonds dans votre compte bancaire dans 1-2 jours ouvrables.</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetailsModal(false)}>
                    Fermer
                  </Button>
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Reçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
