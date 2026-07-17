import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Eye,
  FileText,
  MapPin,
  MessageSquare,
} from "lucide-react";
import {
  demandeStatusAccentClass,
  ListCardBudgetPanel,
  ListCardMeta,
  urgencyAccentClass,
} from "@/components/prestataire/list-card-primitives";
import type { ReactNode } from "react";

export type ClientDemandeCardData = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  status: string;
  service?: string;
  created_at?: string;
  devis_count?: number;
  urgence?: string;
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "En attente",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  in_progress: {
    label: "En cours",
    className: "bg-info/15 text-info border-info/30",
  },
  completed: {
    label: "Terminée",
    className: "bg-success/15 text-success border-success/30",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function formatBudget(min = 0, max = 0) {
  if (min > 0 && max > 0 && min !== max) {
    return `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} FC`;
  }
  if (max > 0) return `Jusqu'à ${max.toLocaleString("fr-FR")} FC`;
  if (min > 0) return `À partir de ${min.toLocaleString("fr-FR")} FC`;
  return "Budget non précisé";
}

function truncateText(text: string, max = 140): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function UrgenceBadge({ urgence }: { urgence?: string }) {
  if (urgence === "urgent" || urgence === "tres_urgent") {
    return (
      <Badge variant="destructive" className="text-xs">
        {urgence === "tres_urgent" ? "Très urgent" : "Urgent"}
      </Badge>
    );
  }
  return null;
}

type ClientDemandeCardProps = {
  demande: ClientDemandeCardData;
  onView: () => void;
  actionsMenu?: ReactNode;
};

export function ClientDemandeCard({ demande, onView, actionsMenu }: ClientDemandeCardProps) {
  const description = demande.description ? truncateText(demande.description) : "";
  const showDescription =
    description && description.toLowerCase() !== demande.title.toLowerCase();
  const budget = formatBudget(demande.budget_min, demande.budget_max);
  const devisCount = demande.devis_count ?? 0;
  const accent =
    demande.urgence && demande.urgence !== "normal"
      ? urgencyAccentClass(demande.urgence)
      : demandeStatusAccentClass(demande.status);
  const dateLabel = demande.created_at
    ? new Date(demande.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Card
      className={cn(
        "group overflow-hidden border-l-4 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        accent,
      )}
    >
      <CardContent className="p-0">
        <div className="space-y-3 p-4 md:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={demande.status} />
            <UrgenceBadge urgence={demande.urgence} />
          </div>
          <h3 className="font-display text-base font-semibold leading-snug line-clamp-2">
            {demande.title}
          </h3>
          {showDescription ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {demande.location ? (
              <ListCardMeta icon={MapPin}>{demande.location}</ListCardMeta>
            ) : null}
            {demande.service ? (
              <ListCardMeta icon={Briefcase}>{demande.service}</ListCardMeta>
            ) : null}
            <ListCardMeta icon={MessageSquare}>
              {devisCount} réponse{devisCount > 1 ? "s" : ""}
            </ListCardMeta>
            <ListCardMeta icon={Calendar}>{dateLabel}</ListCardMeta>
          </div>
          <ListCardBudgetPanel label="Budget indicatif" value={budget} />
          <div className="flex gap-2">
            <Button className="h-10 flex-1 gap-2" onClick={onView}>
              <Eye className="h-4 w-4" />
              Voir la demande
            </Button>
            {actionsMenu}
          </div>
        </div>

        <div className="hidden gap-5 p-5 md:grid md:grid-cols-[1fr_minmax(180px,220px)_auto] md:items-center lg:p-6">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={demande.status} />
              <UrgenceBadge urgence={demande.urgence} />
            </div>
            <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">
              {demande.title}
            </h3>
            {showDescription ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {demande.location ? (
                <ListCardMeta icon={MapPin}>{demande.location}</ListCardMeta>
              ) : null}
              {demande.service ? (
                <ListCardMeta icon={Briefcase}>{demande.service}</ListCardMeta>
              ) : null}
              <ListCardMeta icon={MessageSquare}>
                {devisCount} devis reçu{devisCount > 1 ? "s" : ""}
              </ListCardMeta>
              <ListCardMeta icon={Calendar}>Créée le {dateLabel}</ListCardMeta>
            </div>
          </div>
          <ListCardBudgetPanel label="Budget" value={budget} className="h-fit" />
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button variant="default" className="min-w-[150px] gap-2" onClick={onView}>
              <Eye className="h-4 w-4" />
              Détail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            {actionsMenu}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
