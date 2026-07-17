import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientRecentDemande } from "@/lib/client-helpers";
import {
  demandeStatusAccentClass,
  ListCardMeta,
  urgencyAccentClass,
} from "@/components/prestataire/list-card-primitives";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ImageIcon,
  MapPin,
  MessageSquare,
  Shield,
  Target,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
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

function ModerationBadge({ statut }: { statut?: string }) {
  if (statut === "en_attente") {
    return (
      <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100">
        <Shield className="h-3 w-3 mr-0.5" />
        Modération
      </Badge>
    );
  }
  if (statut === "rejetee") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Refusée
      </Badge>
    );
  }
  return null;
}

function TypeBadge({
  type,
  prestataireName,
}: {
  type?: string;
  prestataireName?: string;
}) {
  if (type === "directe") {
    return (
      <Badge variant="outline" className="text-[10px] gap-0.5 max-w-full">
        <User className="h-3 w-3 shrink-0" />
        <span className="truncate">
          Directe{prestataireName ? ` · ${prestataireName}` : ""}
        </span>
      </Badge>
    );
  }
  if (type === "publique") {
    return (
      <Badge variant="secondary" className="text-[10px] gap-0.5">
        <Target className="h-3 w-3" />
        Marché public
      </Badge>
    );
  }
  return null;
}

function UrgenceBadge({ urgence }: { urgence?: string }) {
  if (urgence === "urgent" || urgence === "tres_urgent") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        {urgence === "tres_urgent" ? "Très urgent" : "Urgent"}
      </Badge>
    );
  }
  return null;
}

type ClientRecentDemandeCardProps = {
  demande: ClientRecentDemande;
};

export function ClientRecentDemandeCard({ demande }: ClientRecentDemandeCardProps) {
  const statusCfg = STATUS_BADGE[demande.status] ?? {
    label: demande.statut || demande.status,
    className: "bg-muted text-muted-foreground border-border",
  };
  const accent =
    demande.urgence && demande.urgence !== "normal"
      ? urgencyAccentClass(demande.urgence)
      : demandeStatusAccentClass(demande.status);
  const budget =
    demande.budget ||
    (demande.budget_max > 0
      ? `Jusqu'à ${demande.budget_max.toLocaleString("fr-FR")} FC`
      : "Budget non précisé");
  const dateLabel = demande.created_at
    ? new Date(demande.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const description = demande.description.replace(/\s+/g, " ").trim();

  return (
    <Link
      to={`/dashboard/client/demandes/${demande.id}`}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border/80 border-l-4 bg-card p-3.5 shadow-sm transition-all",
        "hover:border-primary/30 hover:bg-muted/20 hover:shadow-md",
        accent,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={cn("text-[10px] font-medium border", statusCfg.className)}>
          {statusCfg.label}
        </Badge>
        <UrgenceBadge urgence={demande.urgence} />
        <ModerationBadge statut={demande.statut_moderation} />
        <TypeBadge
          type={demande.type_demande}
          prestataireName={demande.prestataire_cible_name}
        />
      </div>

      {demande.numero ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {demande.numero}
        </p>
      ) : null}

      <h3 className="mt-0.5 font-display text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary">
        {demande.title}
      </h3>

      {description && description.toLowerCase() !== demande.title.toLowerCase() ? (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {demande.service ? (
          <ListCardMeta icon={Briefcase} className="text-[10px] py-0.5">
            {demande.service}
          </ListCardMeta>
        ) : null}
        {demande.location ? (
          <ListCardMeta icon={MapPin} className="text-[10px] py-0.5">
            {demande.location}
          </ListCardMeta>
        ) : null}
        <ListCardMeta icon={MessageSquare} className="text-[10px] py-0.5">
          {demande.devis_count} devis
        </ListCardMeta>
        {demande.photoCount > 0 ? (
          <ListCardMeta icon={ImageIcon} className="text-[10px] py-0.5">
            {demande.photoCount} photo{demande.photoCount > 1 ? "s" : ""}
          </ListCardMeta>
        ) : null}
        <ListCardMeta icon={Calendar} className="text-[10px] py-0.5">
          {dateLabel}
        </ListCardMeta>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <span className="font-display text-sm font-bold tabular-nums text-primary">{budget}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-80 group-hover:opacity-100">
          Ouvrir
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
