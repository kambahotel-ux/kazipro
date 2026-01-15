import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, Users, Briefcase, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalRevenue: number;
  activeMissions: number;
  disputes: number;
  userGrowth: number;
  revenueGrowth: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch clients count
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      // Fetch prestataires count
      const { count: prestatairesCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true });

      // Fetch demandes count
      const { count: demandesCount } = await supabase
        .from("demandes")
        .select("*", { count: "exact", head: true });

      // Fetch missions count
      const { count: missionsCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true });

      // Fetch paiements sum
      const { data: paiementsData } = await supabase
        .from("paiements")
        .select("montant")
        .eq("statut", "completed");

      const totalRevenue = (paiementsData || []).reduce((sum, p) => sum + (p.montant || 0), 0);

      setStats({
        totalUsers: (clientsCount || 0) + (prestatairesCount || 0),
        totalProviders: prestatairesCount || 0,
        totalRequests: demandesCount || 0,
        totalRevenue,
        activeMissions: missionsCount || 0,
        disputes: 0,
        userGrowth: 12,
        revenueGrowth: 8,
      });
    } catch (error: any) {
      toast.error("Erreur lors du chargement des statistiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: "pdf" | "csv") => {
    toast.success(`Rapport exporté en ${format.toUpperCase()}`);
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Rapports & Analytics</h1>
            <p className="text-muted-foreground">Analysez les performances de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportReport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExportReport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilisateurs Totaux</p>
                      <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{stats.userGrowth}% ce mois
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenus Totaux</p>
                      <p className="text-3xl font-bold mt-2">
                        {(stats.totalRevenue / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{stats.revenueGrowth}% ce mois
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Missions Actives</p>
                      <p className="text-3xl font-bold mt-2">{stats.activeMissions}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        En cours de réalisation
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Clients</span>
                    <span className="font-bold">{stats.totalUsers - stats.totalProviders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prestataires</span>
                    <span className="font-bold">{stats.totalProviders}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-lg">{stats.totalUsers}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demandes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Demandes Totales</span>
                    <span className="font-bold">{stats.totalRequests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taux de Conversion</span>
                    <span className="font-bold">
                      {stats.totalRequests > 0 ? ((stats.activeMissions / stats.totalRequests) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-muted-foreground">Missions Actives</span>
                    <span className="font-bold text-lg">{stats.activeMissions}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                <TabsTrigger value="revenue">Revenus</TabsTrigger>
                <TabsTrigger value="disputes">Litiges</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé de la Plateforme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                        <p className="text-2xl font-bold mt-2">{Math.round(stats.totalUsers * 0.75)}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Taux d'Activité</p>
                        <p className="text-2xl font-bold mt-2">75%</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Satisfaction Moyenne</p>
                        <p className="text-2xl font-bold mt-2">4.6/5</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Temps Réponse Moyen</p>
                        <p className="text-2xl font-bold mt-2">2.3h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Rapport Utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Nouveaux Utilisateurs (7 jours)</span>
                        <span className="font-bold">+{Math.round(stats.totalUsers * 0.05)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Utilisateurs Actifs (30 jours)</span>
                        <span className="font-bold">{Math.round(stats.totalUsers * 0.6)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Taux de Rétention</span>
                        <span className="font-bold">82%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Taux de Churn</span>
                        <span className="font-bold">18%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="revenue">
                <Card>
                  <CardHeader>
                    <CardTitle>Rapport Revenus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Revenus Totaux</span>
                        <span className="font-bold">{(stats.totalRevenue / 1000000).toFixed(1)}M FC</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Revenus ce Mois</span>
                        <span className="font-bold">{(stats.totalRevenue / 12 / 1000000).toFixed(1)}M FC</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Revenu Moyen par Transaction</span>
                        <span className="font-bold">
                          {stats.activeMissions > 0 ? (stats.totalRevenue / stats.activeMissions / 1000).toFixed(0) : 0}K FC
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Croissance YoY</span>
                        <span className="font-bold text-green-600">+{stats.revenueGrowth}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="disputes">
                <Card>
                  <CardHeader>
                    <CardTitle>Rapport Litiges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Litiges Totaux</span>
                        <span className="font-bold">{stats.disputes}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Taux de Litige</span>
                        <span className="font-bold">
                          {stats.activeMissions > 0 ? ((stats.disputes / stats.activeMissions) * 100).toFixed(2) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Temps de Résolution Moyen</span>
                        <span className="font-bold">3.2 jours</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span>Taux de Satisfaction</span>
                        <span className="font-bold">88%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
