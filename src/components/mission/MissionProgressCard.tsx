import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getClientMissionLabel,
  getMissionStatus,
  type MissionRow,
} from "@/lib/missions";
import { Briefcase, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  mission: MissionRow & {
    start_date?: string | null;
    end_date?: string | null;
    progress?: number | null;
    prestataires?: { full_name?: string; profession?: string } | null;
  };
  compact?: boolean;
};

const STEPS = [
  { key: "pending", label: "Planifiée" },
  { key: "in_progress", label: "En cours" },
  { key: "review", label: "À valider" },
  { key: "completed", label: "Terminée" },
] as const;

function stepIndex(status: string): number {
  const s = getMissionStatus({ status });
  const raw = status.toLowerCase();
  if (raw === "terminee_attente_validation_client") return 2;
  if (s === "completed" || raw === "terminee_validee_client") return 3;
  if (s === "in_progress") return 1;
  if (s === "pending") return 0;
  return 1;
}

export function MissionProgressCard({ mission, compact = false }: Props) {
  const rawStatus = String(mission.status ?? mission.statut ?? "");
  const canonical = getMissionStatus(mission);
  const label = getClientMissionLabel(mission);
  const currentStep = stepIndex(rawStatus);
  const progress =
    mission.progress ??
    (rawStatus === "terminee_attente_validation_client"
      ? 100
      : canonical === "completed"
        ? 100
        : canonical === "in_progress"
          ? 50
          : 25);

  const needsValidation =
    rawStatus === "terminee_attente_validation_client" ||
    (canonical === "completed" && rawStatus !== "terminee_validee_client");

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className={cn("pb-2", compact && "py-3")}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-5 w-5 text-primary" />
            Suivi de la mission
          </CardTitle>
          <Badge variant="outline" className="shrink-0 font-medium">
            {label}
          </Badge>
        </div>
        {mission.prestataires?.full_name && (
          <p className="text-sm text-muted-foreground">
            Prestataire : {mission.prestataires.full_name}
            {mission.prestataires.profession
              ? ` · ${mission.prestataires.profession}`
              : ""}
          </p>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "pt-0")}>
        <div className="flex justify-between gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          {STEPS.map((step, i) => (
            <span
              key={step.key}
              className={cn(
                "flex-1 text-center",
                i <= currentStep && "text-primary",
              )}
            >
              {step.label}
            </span>
          ))}
        </div>
        <Progress value={Math.min(100, progress)} className="h-2" />

        {needsValidation && (
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription>
              Le prestataire a indiqué avoir terminé les travaux. Validez la
              mission pour débloquer le paiement du solde.
            </AlertDescription>
          </Alert>
        )}

        {canonical === "in_progress" && !needsValidation && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Les travaux sont en cours chez votre prestataire.
          </p>
        )}

        <Button asChild className="w-full sm:w-auto">
          <Link to={`/dashboard/client/missions/${mission.id}`}>
            Voir le détail de la mission
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
