import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, FileText } from "lucide-react";
import { prestatairesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { mapPrestataireToUi } from "@/lib/client-helpers";
import { getCachedUserRole } from "@/lib/user-role";
import { messagesPath, partnerUserIdFromProfil } from "@/lib/messaging";
import PrestataireInfoCard from "@/components/providers/PrestataireInfoCard";
import type { Prestataire } from "@/types/prestataire";
import { toast } from "sonner";

export default function PrestatairePublicProfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = Boolean(user && getCachedUserRole(String(user.id)) === "client");
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void fetchPrestataire(id);
  }, [id]);

  const fetchPrestataire = async (prestataireId: string) => {
    try {
      setLoading(true);
      const data = await prestatairesApi.getById(prestataireId);
      if (!data) {
        toast.error("Prestataire non trouvé");
        setPrestataire(null);
        return;
      }
      setPrestataire(mapPrestataireToUi(data as Record<string, unknown>) as unknown as Prestataire);
    } catch {
      toast.error("Impossible de charger le profil");
      setPrestataire(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!isClient) {
      navigate("/connexion");
      return;
    }
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

  const handleDemandeDevis = () => {
    if (isClient) {
      navigate(`/dashboard/client/demandes/nouvelle?prestataire=${id}`);
      return;
    }
    navigate("/inscription/client");
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-3xl px-3 py-8 sm:px-4 lg:px-8">
          <Skeleton className="mb-6 h-8 w-40" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PublicLayout>
    );
  }

  if (!prestataire) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-3xl px-3 py-16 text-center sm:px-4">
          <p className="text-muted-foreground">Ce prestataire n&apos;est plus disponible.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/services">Retour aux services</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-3xl space-y-5 px-3 py-8 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={handleContact} className="w-full sm:w-auto">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contacter
            </Button>
            <Button size="sm" onClick={handleDemandeDevis} className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Demander un devis
            </Button>
          </div>
        </div>

        <PrestataireInfoCard
          prestataire={prestataire}
          showDetails={isClient}
          showPortfolio
          hideContact={!isClient}
        />

        {!isClient && (
          <Card className="border-dashed">
            <CardContent className="py-5 text-center text-sm text-muted-foreground">
              Créez un compte client pour contacter ce professionnel et demander un devis.
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/connexion">Se connecter</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/inscription/client">Créer un compte</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
