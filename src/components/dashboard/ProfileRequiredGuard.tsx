import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useProfileComplete } from "@/hooks/useProfileComplete";

interface ProfileRequiredGuardProps {
  children: ReactNode;
}

const ProfileRequiredGuard = ({ children }: ProfileRequiredGuardProps) => {
  const navigate = useNavigate();
  const { isProfileComplete, loading } = useProfileComplete();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (isProfileComplete === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold">Fonctionnalité verrouillée</h2>
            <p className="text-muted-foreground">
              Complétez votre profil pour accéder à cette fonctionnalité et commencer à recevoir des opportunités.
            </p>
            <Button
              onClick={() => navigate("/dashboard/prestataire/completer-profil")}
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

  return <>{children}</>;
};

export default ProfileRequiredGuard;
