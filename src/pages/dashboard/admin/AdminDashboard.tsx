import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, AlertCircle, DollarSign, TrendingUp, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalRevenue: number;
  activeMissions: number;
  pendingVerifications: number;
}

interface UserGrowthData {
  month: string;
  clients: number;
  prestataires: number;
  total: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface MissionStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProfessionStats {
  profession: string;
  total_prestataires: number;
  prestataires_verifies: number;
  total_demandes: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [missionStatusData, setMissionStatusData] = useState<MissionStatusData[]>([]);
  const [professionStats, setProfessionStats] = useState<ProfessionStats[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchChartData();
      fetchProfessionStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch counts
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      const { count: prestatairesCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true });

      const { count: demandesCount } = await supabase
        .from("demandes")
        .select("*", { count: "exact", head: true });

      const { count: missionsCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true });

      const { count: pendingCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", false);

      // Fetch revenue
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
        pendingVerifications: pendingCount || 0,
      });
    } catch (error: any) {
      toast.error("Erreur lors du chargement des statistiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      // Fetch user growth data
      const { data: clientsData } = await supabase
        .from("clients")
        .select("created_at");

      const { data: prestatairesData } = await supabase
        .from("prestataires")
        .select("created_at");

      // Group by month
      const monthlyData: { [key: string]: { clients: number; prestataires: number } } = {};
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      
      // Initialize last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = { clients: 0, prestataires: 0 };
      }

      // Count clients by month
      (clientsData || []).forEach((client) => {
        const date = new Date(client.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].clients++;
        }
      });

      // Count prestataires by month
      (prestatairesData || []).forEach((prestataire) => {
        const date = new Date(prestataire.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].prestataires++;
        }
      });

      const growthData: UserGrowthData[] = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        clients: data.clients,
        prestataires: data.prestataires,
        total: data.clients + data.prestataires,
      }));

      setUserGrowthData(growthData);

      // Fetch revenue data by month
      const { data: paiementsData } = await supabase
        .from("paiements")
        .select("montant, created_at")
        .eq("statut", "completed");

      const revenueByMonth: { [key: string]: number } = {};
      Object.keys(monthlyData).forEach((month) => {
        revenueByMonth[month] = 0;
      });

      (paiementsData || []).forEach((paiement) => {
        const date = new Date(paiement.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (revenueByMonth[monthKey] !== undefined) {
          revenueByMonth[monthKey] += paiement.montant || 0;
        }
      });

      const revData: RevenueData[] = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue: Math.round(revenue / 1000), // Convert to thousands
      }));

      setRevenueData(revData);

      // Fetch mission status distribution
      const { data: missionsData } = await supabase
        .from("missions")
        .select("status");

      const statusCounts: { [key: string]: number } = {
        "in_progress": 0,
        "completed": 0,
        "cancelled": 0,
      };

      (missionsData || []).forEach((mission) => {
        if (statusCounts[mission.status] !== undefined) {
          statusCounts[mission.status]++;
        }
      });

      const statusData: MissionStatusData[] = [
        { name: "En cours", value: statusCounts["in_progress"], color: "#3b82f6" },
        { name: "Terminée", value: statusCounts["completed"], color: "#10b981" },
        { name: "Annulée", value: statusCounts["cancelled"], color: "#ef4444" },
      ];

      setMissionStatusData(statusData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const fetchProfessionStats = async () => {
    try {
      // Récupérer les stats des prestataires par profession
      const { data: prestatairesData, error: prestataireError } = await supabase
        .from("prestataires")
        .select("profession, verified");

      if (prestataireError) throw prestataireError;

      // Récupérer les stats des demandes par profession
      const { data: demandesData } = await supabase
        .from("demandes")
        .select("profession");

      // Calculer les statistiques
      const statsMap = new Map<string, ProfessionStats>();

      // Compter les prestataires
      prestatairesData?.forEach((p) => {
        if (!statsMap.has(p.profession)) {
          statsMap.set(p.profession, {
            profession: p.profession,
            total_prestataires: 0,
            prestataires_verifies: 0,
            total_demandes: 0,
          });
        }
        const stat = statsMap.get(p.profession)!;
        stat.total_prestataires++;
        if (p.verified) {
          stat.prestataires_verifies++;
        }
      });

      // Compter les demandes
      demandesData?.forEach((d) => {
        if (statsMap.has(d.profession)) {
          statsMap.get(d.profession)!.total_demandes++;
        }
      });

      // Trier par nombre de prestataires
      const sortedStats = Array.from(statsMap.values())
        .sort((a, b) => b.total_prestataires - a.total_prestataires)
        .slice(0, 10); // Top 10

      setProfessionStats(sortedStats);
    } catch (error: any) {
      console.error("Erreur stats professions:", error);
    }
  };

  const quickActions = [
    { label: "Utilisateurs", icon: Users, path: "/dashboard/admin/utilisateurs", color: "bg-blue-500" },
    { label: "Prestataires", icon: Briefcase, path: "/dashboard/admin/prestataires", color: "bg-purple-500" },
    { label: "Demandes", icon: AlertCircle, path: "/dashboard/admin/demandes", color: "bg-yellow-500" },
    { label: "Transactions", icon: DollarSign, path: "/dashboard/admin/transactions", color: "bg-green-500" },
    { label: "Config Paiement", icon: DollarSign, path: "/dashboard/admin/config-paiement", color: "bg-emerald-500" },
    { label: "Litiges", icon: AlertCircle, path: "/dashboard/admin/litiges", color: "bg-red-500" },
    { label: "Rapports", icon: TrendingUp, path: "/dashboard/admin/rapports", color: "bg-indigo-500" },
    { label: "Configuration", icon: Settings, path: "/dashboard/admin/configuration", color: "bg-gray-500" },
  ];

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Tableau de Bord Admin</h1>
          <p className="text-muted-foreground">Bienvenue dans l'espace d'administration KaziPro</p>
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
                      <p className="text-xs text-muted-foreground mt-2">
                        {stats.totalProviders} prestataires
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
                      <p className="text-xs text-muted-foreground mt-2">FC</p>
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
                        {stats.totalRequests} demandes
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {stats.pendingVerifications > 0 && (
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{stats.pendingVerifications} prestataires en attente de vérification</p>
                      <p className="text-sm text-muted-foreground">Veuillez vérifier les nouveaux prestataires</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/dashboard/admin/prestataires")}
                  >
                    Vérifier
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
         

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Croissance des Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="clients" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Clients"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="prestataires" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Prestataires"
                        dot={{ fill: '#8b5cf6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenus Mensuels (en milliers FC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#10b981" 
                        name="Revenus"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Mission Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des Missions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={missionStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {missionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Platform Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Activité de la Plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#6366f1" 
                        fill="#6366f1" 
                        fillOpacity={0.6}
                        name="Total Utilisateurs"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Statistiques par Profession */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Statistiques par Profession (Top 10)</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/admin/professions")}
                >
                  Gérer les professions
                </Button>
              </CardHeader>
              <CardContent>
                {professionStats.length > 0 ? (
                  <div className="space-y-4">
                    {/* Graphique à barres */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={professionStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis 
                          dataKey="profession" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="total_prestataires" 
                          fill="#8b5cf6" 
                          name="Prestataires"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                          dataKey="total_demandes" 
                          fill="#3b82f6" 
                          name="Demandes"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Tableau détaillé */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Profession</th>
                            <th className="text-center p-3 font-medium">Prestataires</th>
                            <th className="text-center p-3 font-medium">Vérifiés</th>
                            <th className="text-center p-3 font-medium">Demandes</th>
                            <th className="text-center p-3 font-medium">Ratio D/P</th>
                          </tr>
                        </thead>
                        <tbody>
                          {professionStats.map((stat, index) => {
                            const ratio = stat.total_prestataires > 0 
                              ? (stat.total_demandes / stat.total_prestataires).toFixed(1)
                              : '0';
                            const ratioValue = parseFloat(ratio);
                            const ratioColor = ratioValue > 3 ? 'text-red-600' : ratioValue > 1.5 ? 'text-yellow-600' : 'text-green-600';
                            
                            return (
                              <tr key={index} className="border-t border-border hover:bg-muted/50">
                                <td className="p-3 font-medium">{stat.profession}</td>
                                <td className="text-center p-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-medium">
                                    {stat.total_prestataires}
                                  </span>
                                </td>
                                <td className="text-center p-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-medium">
                                    {stat.prestataires_verifies}
                                  </span>
                                </td>
                                <td className="text-center p-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium">
                                    {stat.total_demandes}
                                  </span>
                                </td>
                                <td className="text-center p-3">
                                  <span className={`font-bold ${ratioColor}`}>
                                    {ratio}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Légende */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">💡 Ratio Demandes/Prestataires:</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-600"></span>
                          <span className="text-muted-foreground">≤ 1.5: Équilibré</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-600"></span>
                          <span className="text-muted-foreground">1.5-3: Attention</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-600"></span>
                          <span className="text-muted-foreground">&gt; 3: Recruter</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune donnée disponible</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate("/dashboard/admin/professions")}
                    >
                      Créer des professions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Nouvel utilisateur inscrit</span>
                    <span className="text-xs text-muted-foreground">Il y a 2h</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Nouvelle demande créée</span>
                    <span className="text-xs text-muted-foreground">Il y a 4h</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Paiement complété</span>
                    <span className="text-xs text-muted-foreground">Il y a 6h</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Prestataire vérifié</span>
                    <span className="text-xs text-muted-foreground">Il y a 8h</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques Clés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux de Conversion</span>
                    <span className="font-bold">
                      {stats.totalRequests > 0 ? ((stats.activeMissions / stats.totalRequests) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utilisateurs Actifs</span>
                    <span className="font-bold">{Math.round(stats.totalUsers * 0.75)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Satisfaction Moyenne</span>
                    <span className="font-bold">4.6/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Temps Réponse Moyen</span>
                    <span className="font-bold">2.3h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
