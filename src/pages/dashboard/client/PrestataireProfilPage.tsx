import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PrestataireInfoCard from "@/components/providers/PrestataireInfoCard";
import { Prestataire } from "@/types/prestataire";

export default function PrestataireProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("Client");

  useEffect(() => {
    if (user && id) {
      fetchClientName();
      fetchPrestataire();
    }
  }, [user, id]);

  const fetchClientName = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setClientName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  };

  const fetchPrestataire = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Prestataire non trouvé");
        navigate("/dashboard/client");
        return;
      }

      setPrestataire(data as Prestataire);
    } catch (error: any) {
      console.error("Error fetching prestataire:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleContactPrestataire = () => {
    // Rediriger vers la page de création de demande avec le prestataire pré-sélectionné
    navigate(`/dashboard/client/demandes/nouvelle?prestataire=${id}`);
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <div className="flex items-center justify-center h-48 md:h-64 px-4">
          <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!prestataire) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <div className="p-3 md:p-6">
          <Card>
            <CardContent className="p-6 md:p-12 text-center">
              <p className="text-sm md:text-base text-muted-foreground">Prestataire non trouvé</p>
              <Button
                variant="outline"
                className="mt-3 md:mt-4"
                onClick={() => navigate("/dashboard/client")}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        {/* Header avec bouton retour - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            size="sm"
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button onClick={handleContactPrestataire} size="sm" className="w-full sm:w-auto">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Contacter ce prestataire</span>
            <span className="sm:hidden">Contacter</span>
          </Button>
        </div>

        {/* Profil complet avec portfolio - Mobile Optimized */}
        <PrestataireInfoCard
          prestataire={prestataire}
          showDetails={true}
          showPortfolio={true}
        />
      </div>
    </DashboardLayout>
  );
}
