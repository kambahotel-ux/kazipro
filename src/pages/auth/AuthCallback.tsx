import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Récupérer le mode depuis les paramètres URL
      const mode = searchParams.get("mode") || "signin";

      // Vérifier la session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error("Aucune session trouvée");
      }

      const user = session.user;

      // Vérifier si c'est un admin
      if (user.email === "admin@kazipro.com") {
        toast.success("Connexion réussie !");
        navigate("/dashboard/admin");
        return;
      }

      // Vérifier si l'utilisateur a déjà un profil
      const { data: existingProvider } = await supabase
        .from("prestataires")
        .select("id, verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProvider) {
        // Rediriger vers le dashboard, l'alerte s'affichera si nécessaire
        toast.success("Connexion réussie !");
        navigate("/dashboard/prestataire");
        return;
      }

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingClient) {
        toast.success("Connexion réussie !");
        navigate("/dashboard/client");
        return;
      }

      // Si pas de profil existant, créer selon le mode
      if (mode === "signup-provider") {
        // Créer un profil prestataire incomplet
        const providerData: any = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Prestataire",
          profession: "À définir",
          verified: false,
          profile_completed: false, // Profil incomplet
        };

        // Ajouter l'email si disponible
        if (user.email) {
          providerData.email = user.email;
        }

        const { error: providerError } = await supabase
          .from("prestataires")
          .insert(providerData);

        if (providerError) throw providerError;

        toast.success("Compte créé ! Complétez votre profil pour commencer.");
        navigate("/dashboard/prestataire");
      } else {
        // Créer un profil client (par défaut)
        const clientData: any = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
        };

        // Ajouter l'email si la colonne existe
        if (user.email) {
          clientData.email = user.email;
        }

        const { error: clientError } = await supabase
          .from("clients")
          .insert(clientData);

        if (clientError) throw clientError;

        toast.success("Connexion réussie !");
        navigate("/dashboard/client");
      }
    } catch (error: any) {
      console.error("Erreur lors du callback OAuth:", error);
      setStatus("error");
      setErrorMessage(error.message || "Une erreur est survenue");
      toast.error("Erreur lors de l'authentification");
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate("/connexion");
      }, 3000);
    }
  };

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Erreur d'authentification</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
          <p className="text-sm text-muted-foreground">
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto" />
        <h2 className="text-xl font-semibold">Authentification en cours...</h2>
        <p className="text-muted-foreground">Veuillez patienter</p>
      </div>
    </div>
  );
};

export default AuthCallback;
