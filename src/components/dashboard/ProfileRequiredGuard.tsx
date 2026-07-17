import { ReactNode } from "react";
import { Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";

interface ProfileRequiredGuardProps {
  children: ReactNode;
}

const ProfileRequiredGuard = ({ children }: ProfileRequiredGuardProps) => {
  const navigate = useNavigate();
  const { loading, isProfileComplete, isVerified, hasFullAccess } = usePrestataireAccess();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (isProfileComplete === false) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold">Profil incomplet</h2>
            <p className="text-muted-foreground">
              Complétez votre profil pour accéder à cette fonctionnalité et commencer à recevoir des
              opportunités.
            </p>
            <Button
              onClick={() => navigate("/dashboard/prestataire/compte/profil")}
              className="w-full"
              variant="secondary"
            >
              Compléter mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified || !hasFullAccess) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">Validation en cours</h2>
            <p className="text-muted-foreground">
              Votre compte est en attente de validation par l&apos;équipe KaziPro. En attendant, vous
              pouvez utiliser le <strong>tableau de bord</strong> et <strong>Mon profil</strong>. Le
              marché, les chantiers et les messages seront débloqués après approbation.
            </p>
            <Button
              onClick={() => navigate("/dashboard/prestataire/compte/profil")}
              className="w-full"
              variant="secondary"
            >
              Mon profil
            </Button>
            <Button
              onClick={() => navigate("/dashboard/prestataire")}
              className="w-full"
              variant="outline"
            >
              Tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileRequiredGuard;
