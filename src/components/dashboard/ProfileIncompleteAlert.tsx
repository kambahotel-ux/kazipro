import { AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const ProfileIncompleteAlert = () => {
  const navigate = useNavigate();

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
        Votre profil est incomplet
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2">
        <p className="mb-3">
          Complétez votre profil pour accéder à toutes les fonctionnalités :
        </p>
        <ul className="space-y-1 mb-4 ml-4">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            <span>Répondre aux demandes des clients</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            <span>Créer et envoyer des devis</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            <span>Être visible dans les recherches</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            <span>Recevoir des opportunités</span>
          </li>
        </ul>
        <Button
          onClick={() => navigate("/dashboard/prestataire/profil")}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Compléter mon profil maintenant
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileIncompleteAlert;
