import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { prestatairesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getClientDisplayName, mapPrestataireToUi } from "@/lib/client-helpers";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { messagesPath, partnerUserIdFromProfil } from "@/lib/messaging";
import PrestataireInfoCard from "@/components/providers/PrestataireInfoCard";
import { Prestataire } from "@/types/prestataire";

export default function PrestataireProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [loading, setLoading] = useState(true);
  const clientName = getClientDisplayName(user);

  useEffect(() => {
    if (user && id) fetchPrestataire();
  }, [user, id]);

  const fetchPrestataire = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await prestatairesApi.getById(id);
      if (!data) {
        toast.error("Prestataire non trouvé");
        navigate("/dashboard/client");
        return;
      }
      setPrestataire(mapPrestataireToUi(data as Record<string, unknown>) as unknown as Prestataire);
    } catch (error: unknown) {
      console.error("Error fetching prestataire:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleContactPrestataire = () => {
    const partnerUserId = partnerUserIdFromProfil(
      prestataire as unknown as Record<string, unknown>,
    );
    if (partnerUserId) {
      navigate(
        messagesPath("client", {
          partnerUserId,
          name: prestataire?.full_name ?? prestataire?.name,
        }),
      );
      return;
    }
    navigate(`/dashboard/client/demandes/nouvelle?prestataire=${id}`);
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
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
              <Button variant="outline" className="mt-3 md:mt-4" onClick={() => navigate("/dashboard/client")} size="sm">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button onClick={handleContactPrestataire} size="sm" className="w-full sm:w-auto">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Contacter ce prestataire</span>
            <span className="sm:hidden">Contacter</span>
          </Button>
        </div>
        <PrestataireInfoCard prestataire={prestataire} showDetails={true} showPortfolio={true} />
      </div>
    </DashboardLayout>
  );
}
