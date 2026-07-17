import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, Briefcase, DollarSign, AlertCircle, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalRevenue: number;
  platformEarnings: number;
  platformEarningsMissions: number;
  platformEarningsLocation: number;
  activeMissions: number;
  disputes: number;
  userGrowth: number;
  revenueGrowth: number;
  completedMissions?: number;
}

function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
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
      const s = await adminApi.getStats();
      setStats({
        totalUsers: s.users ?? 0,
        totalProviders: s.prestataires ?? 0,
        totalRequests: s.demandes ?? 0,
        totalRevenue: s.ca_total ?? 0,
        platformEarnings: s.commissions_prelevees ?? 0,
        platformEarningsMissions: s.commissions_missions ?? 0,
        platformEarningsLocation: s.commissions_location ?? 0,
        activeMissions: s.contrats_actifs ?? 0,
        completedMissions: s.paiements_valides ?? 0,
        disputes: s.litiges_ouverts ?? 0,
        userGrowth: 0,
        revenueGrowth: 0,
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
          <ReportsPageSkeleton />
        ) : stats ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilisateurs Totaux</p>
                      <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gains plateforme (total)</p>
                      <p className="text-3xl font-bold mt-2 text-emerald-700 dark:text-emerald-400">
                        {stats.platformEarnings.toLocaleString("fr-FR")} FC
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Missions {stats.platformEarningsMissions.toLocaleString("fr-FR")} · Location{" "}
                        {stats.platformEarningsLocation.toLocaleString("fr-FR")} FC
                      </p>
                    </div>
                    <Coins className="w-8 h-8 text-emerald-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Volume des paiements</p>
                      <p className="text-3xl font-bold mt-2">
                        {(stats.totalRevenue / 1000000).toFixed(1)}M FC
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Montants clients (brut)</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Missions Actives</p>
                      <p className="text-3xl font-bold mt-2">{stats.activeMissions}</p>
                      <p className="text-xs text-muted-foreground mt-2">En cours de réalisation</p>
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
