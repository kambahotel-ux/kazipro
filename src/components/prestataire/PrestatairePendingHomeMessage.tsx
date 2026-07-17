import { Link } from "react-router-dom";
import { Clock, Lock, Shield, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrestataireVerificationBadge } from "@/components/prestataire/PrestataireVerificationBadge";
import { PRESTATAIRE_PATHS } from "@/lib/prestataire-nav";
import type { PrestataireValidationStatus } from "@/lib/kazipro-profile";

type PrestatairePendingHomeMessageProps = {
  validationStatus: PrestataireValidationStatus;
  profileComplete: boolean;
  motifRejet?: string | null;
};

export function PrestatairePendingHomeMessage({
  validationStatus,
  profileComplete,
  motifRejet,
}: PrestatairePendingHomeMessageProps) {
  if (!profileComplete) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-5 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="font-display text-lg sm:text-xl font-bold">Complétez votre profil</h2>
              <p className="text-sm text-muted-foreground">
                Bienvenue sur KaziPro. Terminez votre profil pour le soumettre à notre équipe. Une fois validé,
                vous pourrez accéder au marché, aux chantiers et aux messages.
              </p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to={PRESTATAIRE_PATHS.compteProfil}>Compléter mon profil</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (validationStatus === "valide") return null;

  const isRejected = validationStatus === "rejete";

  return (
    <Card
      className={
        isRejected
          ? "border-destructive/40 bg-destructive/5"
          : "border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-500/5"
      }
    >
      <CardContent className="p-5 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className={
              isRejected
                ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive"
                : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
            }
          >
            {isRejected ? <Lock className="h-7 w-7" /> : <Shield className="h-7 w-7" />}
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-bold">
                {isRejected ? "Compte non validé" : "Bienvenue — validation en cours"}
              </h2>
              <PrestataireVerificationBadge status={validationStatus} size="md" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRejected ? (
                <>
                  Votre dossier n&apos;a pas été approuvé. Corrigez votre profil puis contactez le support si
                  besoin. Les menus <strong>Marché</strong>, <strong>Chantiers</strong> et <strong>Messages</strong>{" "}
                  restent verrouillés.
                </>
              ) : (
                <>
                  Votre compte est actif sur le <strong>tableau de bord</strong> et la page{" "}
                  <strong>Mon profil</strong>. Chaque prestataire doit être vérifié par KaziPro avant d&apos;accéder
                  au marché : opportunités, devis, chantiers et messagerie (délai habituel 24 à 48 h).
                </>
              )}
            </p>
            {isRejected && motifRejet ? (
              <p className="text-sm rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <span className="font-medium">Motif :</span> {motifRejet}
              </p>
            ) : null}
            {!isRejected ? (
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  Vérification de vos documents par un administrateur
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-primary" />
                  Badge « Compte vérifié » affiché après approbation
                </li>
              </ul>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant={isRejected ? "default" : "secondary"} className="w-full sm:w-auto">
            <Link to={PRESTATAIRE_PATHS.compteProfil}>
              <User className="mr-2 h-4 w-4" />
              Voir mon profil
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
