import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ProviderPending() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [providerData, setProviderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProviderInfo();
    }
  }, [user]);

  const fetchProviderInfo = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Utilise maybeSingle() au lieu de single()

      if (error) throw error;

      if (!data) {
        // Pas de profil prestataire trouvé
        toast.error("Profil prestataire introuvable. Veuillez vous réinscrire.");
        navigate("/inscription/prestataire");
        return;
      }

      setProviderData(data);
      // Si le prestataire est vérifié, rediriger vers le dashboard
      if (data.verified) {
        toast.success("Votre compte a été approuvé!");
        navigate("/dashboard/prestataire");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la récupération des informations");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      await fetchProviderInfo();
      
      if (providerData && !providerData.verified) {
        toast.info("Votre compte est toujours en attente d'approbation");
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/connexion");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Compte en attente d'approbation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {providerData && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Nom du prestataire</p>
              <p className="font-semibold text-lg">{providerData.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Profession: {providerData.profession}</p>
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Votre inscription a été reçue avec succès</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>Votre compte est en attente d'approbation par notre équipe</span>
            </div>
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Vous recevrez un email de confirmation une fois approuvé</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-600">
              <strong>Délai d'approbation:</strong> Généralement 24-48 heures. Nous vérifions vos documents et vos qualifications.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier le statut"
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Des questions? Contactez notre support à support@kazipro.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
