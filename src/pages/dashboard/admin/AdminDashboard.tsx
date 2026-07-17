import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, AlertCircle, DollarSign, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
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
  platformEarnings: number;
  platformEarningsMissions: number;
  platformEarningsLocation: number;
  activeMissions: number;
  pendingVerifications: number;
}

interface CommissionData {
  month: string;
  missions: number;
  location: number;
  commission: number;
  commission_raw: number;
}

function formatFcAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return value.toLocaleString("fr-FR");
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

interface RecentActivity {
  label: string;
  detail?: string;
  type: string;
  occurred_at: string;
}

interface KeyMetrics {
  conversion_rate: number;
  active_users: number;
  avg_satisfaction: number | null;
  open_disputes: number;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);
  const [missionStatusData, setMissionStatusData] = useState<MissionStatusData[]>([]);
  const [professionStats, setProfessionStats] = useState<ProfessionStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  useEffect(() => {
    if (user) void fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await adminApi.getDashboard();
      const s = data.summary ?? {};

      setStats({
        totalUsers: s.users ?? 0,
        totalProviders: s.prestataires ?? 0,
        totalRequests: s.demandes ?? 0,
        totalRevenue: Number(s.ca_total ?? 0),
        platformEarnings: Number(s.commissions_prelevees ?? 0),
        platformEarningsMissions: Number(s.commissions_missions ?? 0),
        platformEarningsLocation: Number(s.commissions_location ?? 0),
        activeMissions: s.contrats_actifs ?? 0,
        pendingVerifications: (s.prestataires_en_attente ?? 0) + (s.certifications_en_attente ?? 0),
      });

      setUserGrowthData(data.user_growth ?? []);
      setRevenueData(
        (data.revenue_by_month ?? []).map((item: RevenueData) => ({
          month: item.month,
          revenue: Number(item.revenue ?? 0),
        })),
      );
      setCommissionData(
        (data.commissions_by_month ?? []).map((item: CommissionData) => ({
          month: item.month,
          missions: Number(item.missions ?? 0),
          location: Number(item.location ?? 0),
          commission: Number(item.commission ?? 0),
          commission_raw: Number(item.commission_raw ?? 0),
        })),
      );
      setMissionStatusData(data.mission_status ?? []);
      setProfessionStats(data.profession_stats ?? []);
      setRecentActivity(data.recent_activity ?? []);
      setKeyMetrics(data.key_metrics ?? null);
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement du tableau de bord");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const hasChartData =
    userGrowthData.some((d) => d.total > 0) ||
    revenueData.some((d) => d.revenue > 0) ||
    commissionData.some((d) => d.commission_raw > 0);

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Tableau de Bord Admin</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Bienvenue dans l'espace d'administration KaziPro</p>
        </div>

        {loading ? (
          <AdminDashboardSkeleton />
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Utilisateurs Totaux</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                        {stats.totalProviders} prestataires
                      </p>
                    </div>
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Gains plateforme</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-emerald-700 dark:text-emerald-400">
                        {formatFcAmount(stats.platformEarnings)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                        Missions {formatFcAmount(stats.platformEarningsMissions)} · Location{" "}
                        {formatFcAmount(stats.platformEarningsLocation)} FC
                      </p>
                    </div>
                    <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 opacity-30" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Volume des paiements</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                        {formatFcAmount(stats.totalRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Montants clients (brut)</p>
                    </div>
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Missions Actives</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.activeMissions}</p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                        {stats.totalRequests} demandes
                      </p>
                    </div>
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats.pendingVerifications > 0 && (
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {stats.pendingVerifications} prestataire(s) en attente de vérification
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Veuillez vérifier les nouveaux prestataires</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate("/dashboard/admin/prestataires")} className="w-full sm:w-auto">
                    Vérifier
                  </Button>
                </CardContent>
              </Card>
            )}

            {!hasChartData && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Les graphiques se rempliront au fur et à mesure de l'activité sur la plateforme.
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Croissance des Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6b7280" interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Line type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} name="Clients" dot={{ fill: "#3b82f6", r: 3 }} />
                      <Line type="monotone" dataKey="prestataires" stroke="#8b5cf6" strokeWidth={2} name="Prestataires" dot={{ fill: "#8b5cf6", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Commissions plateforme (k FC / mois)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={commissionData.map((item) => ({
                        month: item.month,
                        missions: item.missions / 1000,
                        location: item.location / 1000,
                        missions_raw: item.missions,
                        location_raw: item.location,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6b7280" interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: number, name: string, item: { payload?: { missions_raw?: number; location_raw?: number } }) => {
                          const raw = name === "missions" ? item.payload?.missions_raw : item.payload?.location_raw;
                          return [`${Number(raw ?? 0).toLocaleString("fr-FR")} FC`, name === "missions" ? "Missions" : "Location"];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="missions" stackId="c" fill="#059669" name="Missions" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="location" stackId="c" fill="#34d399" name="Location" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Volume paiements (k FC / mois)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6b7280" interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenus (k FC)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Distribution des Missions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={missionStatusData.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {missionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Activité de la Plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6b7280" interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Area type="monotone" dataKey="total" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Total Utilisateurs" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
                <CardTitle className="text-base sm:text-lg">Statistiques par Profession (Top 10)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/admin/professions")} className="w-full sm:w-auto">
                  Gérer les professions
                </Button>
              </CardHeader>
              <CardContent>
                {professionStats.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={professionStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#6b7280" allowDecimals={false} />
                        <YAxis dataKey="profession" type="category" width={100} tick={{ fontSize: 10 }} stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="total_prestataires" fill="#8b5cf6" name="Prestataires" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="total_demandes" fill="#3b82f6" name="Demandes" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
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
                              const ratio = stat.total_prestataires > 0 ? (stat.total_demandes / stat.total_prestataires).toFixed(1) : "0";
                              const ratioValue = parseFloat(ratio);
                              const ratioColor = ratioValue > 3 ? "text-red-600" : ratioValue > 1.5 ? "text-yellow-600" : "text-green-600";
                              return (
                                <tr key={index} className="border-t border-border hover:bg-muted/50">
                                  <td className="p-3 font-medium">{stat.profession}</td>
                                  <td className="text-center p-3">{stat.total_prestataires}</td>
                                  <td className="text-center p-3">{stat.prestataires_verifies}</td>
                                  <td className="text-center p-3">{stat.total_demandes}</td>
                                  <td className={`text-center p-3 font-bold ${ratioColor}`}>{ratio}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <p className="text-sm sm:text-base">Aucune donnée par profession</p>
                    <Button variant="outline" size="sm" className="mt-3 sm:mt-4" onClick={() => navigate("/dashboard/admin/professions")}>
                      Gérer les professions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Activité Récente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, index) => (
                      <div key={`${item.type}-${index}`} className={`flex items-center justify-between py-2 ${index < recentActivity.length - 1 ? "border-b border-border" : ""}`}>
                        <div className="min-w-0 pr-3">
                          <p className="text-xs sm:text-sm truncate">{item.label}</p>
                          {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(item.occurred_at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Statistiques Clés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Taux de Conversion</span>
                    <span className="font-bold text-sm sm:text-base">{keyMetrics?.conversion_rate ?? 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Utilisateurs Actifs (30j)</span>
                    <span className="font-bold text-sm sm:text-base">{keyMetrics?.active_users ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Satisfaction Moyenne</span>
                    <span className="font-bold text-sm sm:text-base">
                      {keyMetrics?.avg_satisfaction != null ? `${keyMetrics.avg_satisfaction}/5` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Litiges ouverts</span>
                    <span className="font-bold text-sm sm:text-base">{keyMetrics?.open_disputes ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Impossible de charger le tableau de bord.
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchDashboard()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
