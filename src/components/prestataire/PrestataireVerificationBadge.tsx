import { Link } from "react-router-dom";
import { Shield, ShieldCheck, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrestataireValidationStatus } from "@/lib/kazipro-profile";
import { PRESTATAIRE_PATHS } from "@/lib/prestataire-nav";

const STATUS_CONFIG: Record<
  PrestataireValidationStatus,
  {
    label: string;
    shortLabel: string;
    icon: typeof Shield;
    className: string;
  } | null
> = {
  valide: {
    label: "Compte vérifié KaziPro",
    shortLabel: "Vérifié",
    icon: ShieldCheck,
    className:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-[0_0_20px_-6px_hsl(152_69%_40%/0.55)]",
  },
  en_attente: {
    label: "Vérification en cours",
    shortLabel: "En vérification",
    icon: Shield,
    className:
      "border-amber-500/60 bg-amber-500/15 text-amber-900 dark:text-amber-100 shadow-[0_0_22px_-6px_hsl(38_92%_50%/0.5)] ring-2 ring-amber-400/30",
  },
  rejete: {
    label: "Compte non validé",
    shortLabel: "Refusé",
    icon: ShieldX,
    className: "border-destructive/50 bg-destructive/10 text-destructive",
  },
  unknown: null,
};

type PrestataireVerificationBadgeProps = {
  status: PrestataireValidationStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  linkToProfil?: boolean;
  className?: string;
};

export function PrestataireVerificationBadge({
  status,
  size = "md",
  showLabel = true,
  linkToProfil = false,
  className,
}: PrestataireVerificationBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-full",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-full",
    lg: "px-4 py-2 text-sm gap-2 rounded-xl",
  };
  const iconSizes = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-5 w-5" };

  const content = (
    <span
      className={cn(
        "inline-flex items-center font-semibold border",
        sizeClasses[size],
        config.className,
        status === "en_attente" && "animate-pulse",
        className,
      )}
      title={config.label}
    >
      <Icon className={cn(iconSizes[size], "shrink-0")} aria-hidden />
      {showLabel ? (
        <span className="truncate">{size === "sm" ? config.shortLabel : config.label}</span>
      ) : null}
    </span>
  );

  if (linkToProfil && status !== "valide") {
    return (
      <Link to={PRESTATAIRE_PATHS.compteProfil} className="inline-flex hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function PrestataireVerificationBanner({
  status,
  motifRejet,
}: {
  status: PrestataireValidationStatus;
  motifRejet?: string | null;
}) {
  if (status === "valide" || status === "unknown") return null;

  const isRejected = status === "rejete";

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4",
        isRejected
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/8 to-transparent",
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            isRejected ? "bg-destructive/15 text-destructive" : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
          )}
        >
          {isRejected ? <ShieldX className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold text-base sm:text-lg">
              {isRejected ? "Validation refusée" : "Badge vérification KaziPro"}
            </p>
            <PrestataireVerificationBadge status={status} size="md" showLabel linkToProfil={false} />
          </div>
          <p className="text-sm text-muted-foreground">
            {isRejected
              ? "Votre dossier n'a pas été approuvé. Consultez le motif et mettez à jour votre profil."
              : "Chaque prestataire est validé par notre équipe avant d'accéder au marché. Vous serez notifié dès approbation (24–48 h en général)."}
          </p>
          {isRejected && motifRejet ? (
            <p className="text-sm text-destructive/90">
              <span className="font-medium">Motif :</span> {motifRejet}
            </p>
          ) : null}
        </div>
      </div>
      {!isRejected ? (
        <Link
          to={PRESTATAIRE_PATHS.compteProfil}
          className="text-sm font-medium text-amber-800 dark:text-amber-200 underline-offset-4 hover:underline shrink-0"
        >
          Voir mon profil
        </Link>
      ) : null}
    </div>
  );
}
