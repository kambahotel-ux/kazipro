import { Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProfilePendingAlert = () => {
  return (
    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20 mb-6">
      <Clock className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
        Profil en attente de validation
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2">
        <p className="mb-3">
          Votre profil a été soumis avec succès et est en cours de vérification par notre équipe.
        </p>
        <ul className="space-y-1 mb-4 ml-4">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Profil complété</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>En attente de validation par un administrateur</span>
          </li>
        </ul>
        <p className="text-sm">
          Vous recevrez une notification par email une fois votre compte validé. 
          La validation prend généralement 24 à 48 heures.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default ProfilePendingAlert;
