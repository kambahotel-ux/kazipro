import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, Star, TrendingUp, ArrowRight, MapPin, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import ProfileIncompleteAlert from "@/components/dashboard/ProfileIncompleteAlert";
import ProfilePendingAlert from "@/components/dashboard/ProfilePendingAlert";
import { useProfileComplete } from "@/hooks/useProfileComplete";

interface Demande {
  id: string;
  titre: string;
  description: string;
  budget: number;
  localisation: string;
  urgence: string;
  created_at: string;
  client_id: string;
  clients?: {
    full_name: string;
  } | null;
}

interface Mission {
  id: string;
  demande_id: string;
  status: string;
  start_date: string;
  end_date: string;
  demandes?: {
    titre: string;
    client_id: string;
    clients?: {
      full_name: string;
    } | null;
  } | null;
}

interface Devis {
  id: string;
  montant_ttc: number;
  amount: number;
  statut: string;
  status: string;
  created_at: string;
}

export default function PrestataireDashboard() {
  const { user } = useAuth();
  const { isProfileComplete } = useProfileComplete(); // Déplacé ici
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerProfession, setProviderProfession] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerVerified, setProviderVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  
  // Hook pour gérer le statut en ligne automatiquement
  useOnlineStatus(providerId);
  
  // Stats
  const [missionsCount, setMissionsCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [acceptanceRate, setAcceptanceRate] = useState(0);
  
  // Data
  const [availableDemandes, setAvailableDemandes] = useState<Demande[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  const fetchProviderData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Récupérer les infos du prestataire
      const { data: providerData, error: providerError } = await supabase
        .from("prestataires")
        .select("id, full_name, profession, verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (providerError) throw providerError;
      
      if (!providerData) {
        toast.error("Profil prestataire non trouvé");
        setLoading(false);
        return;
      }

      if (providerData) {
        setProviderName(providerData.full_name);
        setProviderProfession(providerData.profession || "Prestataire");
        setProviderId(providerData.id);
        setProviderVerified(providerData.verified || false);

        // 2. Récupérer les stats
        await fetchStats(providerData.id);

        // 3. Récupérer les demandes disponibles
        await fetchAvailableDemandes(providerData.profession);

        // 4. Récupérer les missions actives
        await fetchActiveMissions(providerData.id);
      }
    } catch (error: any) {
      console.error("Error fetching provider data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (providerId: string) => {
    try {
      // Missions ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: missionsData, error: missionsError } = await supabase
        .from("missions")
        .select("id")
        .eq("prestataire_id", providerId)
        .gte("created_at", startOfMonth.toISOString());

      if (!missionsError && missionsData) {
        setMissionsCount(missionsData.length);
      }

      // Revenus du mois (depuis les devis acceptés)
      const { data: devisData, error: devisError } = await supabase
        .from("devis")
        .select("montant_ttc, amount, statut, status")
        .eq("prestataire_id", providerId)
        .gte("created_at", startOfMonth.toISOString());

      if (!devisError && devisData) {
        const revenue = devisData
          .filter((d: Devis) => d.statut === 'accepte' || d.status === 'accepted')
          .reduce((sum: number, d: Devis) => sum + (d.montant_ttc || d.amount || 0), 0);
        setMonthlyRevenue(revenue);
      }

      // Note moyenne et nombre d'avis
      const { data: avisData, error: avisError } = await supabase
        .from("avis")
        .select("rating")
        .eq("prestataire_id", providerId);

      if (!avisError && avisData && avisData.length > 0) {
        const avgRating = avisData.reduce((sum, a) => sum + a.rating, 0) / avisData.length;
        setAverageRating(Math.round(avgRating * 10) / 10);
        setReviewsCount(avisData.length);
      }

      // Taux d'acceptation (devis acceptés / devis envoyés)
      const { data: allDevisData } = await supabase
        .from("devis")
        .select("statut, status")
        .eq("prestataire_id", providerId);

      if (allDevisData && allDevisData.length > 0) {
        const accepted = allDevisData.filter((d: Devis) => 
          d.statut === 'accepte' || d.status === 'accepted'
        ).length;
        const sent = allDevisData.filter((d: Devis) => 
          d.statut === 'envoye' || d.statut === 'accepte' || 
          d.status === 'pending' || d.status === 'accepted'
        ).length;
        
        if (sent > 0) {
          setAcceptanceRate(Math.round((accepted / sent) * 100));
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAvailableDemandes = async (profession: string) => {
    try {
      // Récupérer les demandes qui correspondent à la profession du prestataire
      // et qui n'ont pas encore de mission assignée
      const { data, error } = await supabase
        .from("demandes")
        .select(`
          id,
          titre,
          description,
          budget,
          localisation,
          urgence,
          created_at,
          client_id,
          clients (
            full_name
          )
        `)
        .eq("profession", profession)
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      setAvailableDemandes(data as any || []);
    } catch (error) {
      console.error("Error fetching available demandes:", error);
    }
  };

  const fetchActiveMissions = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          id,
          demande_id,
          status,
          start_date,
          end_date,
          demandes (
            titre,
            client_id,
            clients (
              full_name
            )
          )
        `)
        .eq("prestataire_id", providerId)
        .in("status", ["in_progress", "pending"])
        .order("start_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      setActiveMissions(data as any || []);
    } catch (error) {
      console.error("Error fetching active missions:", error);
    }
  };

  const formatBudget = (budget: number) => {
    return `${budget.toLocaleString()} FC`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={providerName} userRole={providerProfession}>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      role="prestataire" 
      userName={providerName} 
      userRole={providerProfession}
      isVerified={providerVerified}
      isProfileComplete={isProfileComplete}
    >
      <div className="space-y-6">
        {/* Profile Status Alerts */}
        {isProfileComplete === false && <ProfileIncompleteAlert />}
        {isProfileComplete === true && !providerVerified && <ProfilePendingAlert />}

        <div>
          <h1 className="text-2xl font-bold">Bonjour, {providerName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground">Voici vos opportunités et missions du jour</p>
        </div>

        {/* Availability Toggle */}
        <AvailabilityToggle providerId={providerId} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Missions ce mois"
            value={missionsCount.toString()}
            subtitle={missionsCount > 0 ? "Actives" : "Aucune mission"}
            icon={<Briefcase className="w-5 h-5" />}
          />
          <StatsCard
            title="Revenus du mois"
            value={formatBudget(monthlyRevenue)}
            subtitle="Devis acceptés"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatsCard
            title="Note moyenne"
            value={averageRating > 0 ? averageRating.toString() : "-"}
            subtitle={reviewsCount > 0 ? `Sur ${reviewsCount} avis` : "Aucun avis"}
            icon={<Star className="w-5 h-5" />}
          />
          <StatsCard
            title="Taux acceptation"
            value={acceptanceRate > 0 ? `${acceptanceRate}%` : "-"}
            subtitle="Devis acceptés"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nouvelles opportunités</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/prestataire/opportunites">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {availableDemandes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune nouvelle opportunité pour le moment</p>
                  <p className="text-sm mt-1">Revenez plus tard pour voir les nouvelles demandes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDemandes.map((demande) => (
                    <div key={demande.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{demande.titre}</p>
                            {demande.urgence === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {demande.localisation}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">{formatBudget(demande.budget)}</p>
                      </div>
                      <Button size="sm" className="w-full mt-2" asChild>
                        <Link to={`/dashboard/prestataire/demandes/${demande.id}`}>Voir les détails</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Missions en cours</CardTitle>
              <Badge variant="secondary">{activeMissions.length} actives</Badge>
            </CardHeader>
            <CardContent>
              {activeMissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune mission en cours</p>
                  <p className="text-sm mt-1">Vos missions actives apparaîtront ici</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {activeMissions.map((mission) => (
                      <div key={mission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{mission.demandes?.titre || "Mission"}</p>
                          <p className="text-xs text-muted-foreground">
                            {mission.demandes?.clients?.full_name || "Client"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">En cours</Badge>
                          {mission.end_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Échéance: {formatDate(mission.end_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/dashboard/prestataire/calendrier">
                      Voir mon calendrier
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
