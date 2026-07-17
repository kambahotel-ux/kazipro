import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken } from "@/lib/auth-token";
import { useAuth } from "@/contexts/AuthContext";
import { defaultDashboardForRole, resolveUserRoleSafe } from "@/lib/user-role";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function parseHashParams(): URLSearchParams {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(raw);
}

function stripUrlHash() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const mode = searchParams.get("mode") || "signin";

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const hashParams = parseHashParams();
        const queryToken = searchParams.get("token");
        const oauthError = hashParams.get("error") || searchParams.get("error");
        const token = hashParams.get("token") || queryToken;

        if (oauthError) {
          const rawDesc = hashParams.get("error_description") || searchParams.get("message");
          let decodedDesc: string | null = null;
          if (rawDesc) {
            try {
              decodedDesc = decodeURIComponent(rawDesc.replace(/\+/g, " "));
            } catch {
              decodedDesc = rawDesc.replace(/\+/g, " ");
            }
          }
          const human =
            decodedDesc ||
            (oauthError === "access_denied"
              ? "Connexion annulée ou refusée."
              : `Erreur OAuth (${oauthError}).`);
          stripUrlHash();
          throw new Error(human);
        }

        if (!token) {
          throw new Error("Aucun jeton d'authentification reçu");
        }

        setAuthToken(token);
        stripUrlHash();

        const appUser = await refreshUser();
        if (!active) return;
        if (!appUser) {
          throw new Error("Impossible de charger le profil utilisateur");
        }

        const role = await resolveUserRoleSafe(appUser, { timeoutMs: 3000, retries: 1 });
        if (!active) return;

        if (role) {
          toast.success("Connexion réussie !");
          navigate(defaultDashboardForRole(role), { replace: true });
          return;
        }

        if (mode === "signup-provider") {
          toast.success("Compte créé ! Complétez votre profil pour commencer.");
          navigate("/dashboard/prestataire", { replace: true });
          return;
        }

        toast.warning("Session active mais rôle introuvable. Redirection vers l'accueil.");
        navigate("/", { replace: true });
      } catch (error: unknown) {
        if (!active) return;
        console.error("Erreur lors du callback OAuth:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue");
        toast.error("Erreur lors de l'authentification");
        setTimeout(() => navigate("/connexion"), 3000);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [navigate, mode, searchParams, refreshUser]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Erreur d'authentification</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
          <p className="text-sm text-muted-foreground">Redirection vers la page de connexion...</p>
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
