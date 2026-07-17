import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMissionStatus, MISSION_STATUS_LABELS } from "@/lib/missions";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  Eye,
  ImageIcon,
  MapPin,
  User,
} from "lucide-react";
import { ListCardBudgetPanel, ListCardMeta } from "@/components/prestataire/list-card-primitives";

const MISSION_STATUS_STYLES: Record<
  string,
  { label: string; badge: string; accent: string }
> = {
  pending: {
    label: "En attente",
    badge: "bg-warning/15 text-warning border-warning/30",
    accent: "border-l-warning",
  },
  in_progress: {
    label: "En cours",
    badge: "bg-info/15 text-info border-info/30",
    accent: "border-l-info",
  },
  completed: {
    label: "Complétée",
    badge: "bg-success/15 text-success border-success/30",
    accent: "border-l-success",
  },
  cancelled: {
    label: "Annulée",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    accent: "border-l-destructive",
  },
};

export type MissionListCardData = {
  id: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  statut?: string;
  devis?: { montant_ttc?: number; amount?: number; devise?: string };
  demandes?: {
    titre?: string;
    title?: string;
    description?: string;
    localisation?: string;
    location?: string;
    urgence?: string;
    urgency?: string;
    images?: string[];
    clients?: { full_name?: string };
  };
};

function missionTitle(m: MissionListCardData): string {
  return m.demandes?.titre || m.demandes?.title || "Mission";
}

function missionBudgetLabel(m: MissionListCardData): string {
  const d = m.demandes as { budget_min?: number; budget_max?: number } | undefined;
  if (d?.budget_min != null && d?.budget_max != null) {
    return `${d.budget_min.toLocaleString("fr-FR")} – ${d.budget_max.toLocaleString("fr-FR")} FC`;
  }
  const amount = m.devis?.montant_ttc || m.devis?.amount || 0;
  return `${Number(amount).toLocaleString("fr-FR")} FC`;
}

function truncateText(text: string, max = 140): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…`;
}

function StatusBadge({ rawStatus }: { rawStatus: string }) {
  const status = getMissionStatus({ status: rawStatus });
  const cfg = MISSION_STATUS_STYLES[status];
  if (!cfg) {
    return (
      <Badge variant="outline" className="text-xs font-medium">
        {MISSION_STATUS_LABELS[status] ?? rawStatus}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", cfg.badge)}>
      {cfg.label}
    </Badge>
  );
}

function UrgencyBadge({ urgency }: { urgency?: string }) {
  if (urgency === "urgent" || urgency === "tres_urgent") {
    return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
  }
  return null;
}

type MissionListCardProps = {
  mission: MissionListCardData;
  onView: () => void;
};

export function MissionListCard({ mission, onView }: MissionListCardProps) {
  const missionStatus = getMissionStatus(mission);
  const statusCfg = MISSION_STATUS_STYLES[missionStatus];
  const title = missionTitle(mission);
  const description = mission.demandes?.description
    ? truncateText(mission.demandes.description)
    : "";
  const showDescription =
    description && description.toLowerCase() !== title.toLowerCase();
  const clientName = mission.demandes?.clients?.full_name || "Client";
  const location =
    mission.demandes?.localisation || mission.demandes?.location || "—";
  const photoCount = mission.demandes?.images?.length ?? 0;
  const budget = missionBudgetLabel(mission);
  const urgency = mission.demandes?.urgence || mission.demandes?.urgency;

  const period =
    mission.start_date &&
    `Du ${new Date(mission.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}${
      mission.end_date
        ? ` au ${new Date(mission.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
        : ""
    }`;

  return (
    <Card
      className={cn(
        "group overflow-hidden border-l-4 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        statusCfg?.accent ?? "border-l-primary/40",
      )}
    >
      <CardContent className="p-0">
        <div className="space-y-3 p-4 md:hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge rawStatus={missionStatus} />
              <UrgencyBadge urgency={urgency} />
            </div>
          </div>
          <h3 className="font-display text-base font-semibold leading-snug line-clamp-2">
            {title}
          </h3>
          {showDescription ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <ListCardMeta icon={User}>{clientName}</ListCardMeta>
            <ListCardMeta icon={MapPin}>{location}</ListCardMeta>
            {photoCount > 0 ? (
              <ListCardMeta icon={ImageIcon}>
                {photoCount} photo{photoCount > 1 ? "s" : ""}
              </ListCardMeta>
            ) : null}
          </div>
          <ListCardBudgetPanel label="Montant mission" value={budget} />
          <Button className="h-10 w-full gap-2" onClick={onView}>
            <Eye className="h-4 w-4" />
            Voir la mission
          </Button>
        </div>

        <div className="hidden gap-5 p-5 md:grid md:grid-cols-[1fr_minmax(180px,220px)_auto] md:items-center lg:p-6">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge rawStatus={missionStatus} />
              <UrgencyBadge urgency={urgency} />
            </div>
            <h3 className="font-display text-lg font-semibold leading-snug">{title}</h3>
            {showDescription ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <ListCardMeta icon={User}>{clientName}</ListCardMeta>
              <ListCardMeta icon={MapPin}>{location}</ListCardMeta>
              {photoCount > 0 ? (
                <ListCardMeta icon={ImageIcon}>
                  {photoCount} photo{photoCount > 1 ? "s" : ""}
                </ListCardMeta>
              ) : null}
              {period ? <ListCardMeta icon={Calendar}>{period}</ListCardMeta> : null}
            </div>
          </div>
          <ListCardBudgetPanel label="Montant" value={budget} className="h-fit" />
          <Button variant="default" className="min-w-[150px] gap-2" onClick={onView}>
            <Eye className="h-4 w-4" />
            Détail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
