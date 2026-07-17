import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import {
  ListCardBudgetPanel,
  ListCardMeta,
  urgencyAccentClass,
} from "@/components/prestataire/list-card-primitives";
import { demandeAccepteNouveauDevis } from "@/lib/demande-eligibility";

export type OpportuniteCardDemande = {
  id: string;
  title?: string;
  titre?: string;
  description?: string;
  profession?: string;
  service?: string;
  localisation?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  urgence?: string;
  deadline?: string;
  created_at?: string;
  client_name?: string;
  client_city?: string;
  nombre_devis?: number;
  type?: string;
  statut?: string;
};

type OpportuniteCardProps = {
  demande: OpportuniteCardDemande;
  isInvitation?: boolean;
  invitationStatus?: string;
  invitedAt?: string;
  onView: () => void;
};

function formatBudget(min = 0, max = 0) {
  if (min > 0 && max > 0 && min !== max) {
    return `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} FC`;
  }
  if (max > 0) return `${max.toLocaleString("fr-FR")} FC`;
  if (min > 0) return `À partir de ${min.toLocaleString("fr-FR")} FC`;
  return "Budget non précisé";
}

function formatDate(date?: string, style: "short" | "long" = "long") {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(
    "fr-FR",
    style === "short"
      ? { day: "numeric", month: "short", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" },
  );
}

function UrgenceBadge({ urgence }: { urgence?: string }) {
  const u = urgence ?? "normal";
  if (u === "urgent") {
    return (
      <Badge className="gap-1 border-orange-500/30 bg-orange-500/15 text-orange-800 dark:text-orange-200">
        <Clock className="h-3 w-3" />
        Urgent
      </Badge>
    );
  }
  if (u === "tres_urgent") {
    return (
      <Badge variant="destructive" className="gap-1">
        <Clock className="h-3 w-3" />
        Très urgent
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Normal
    </Badge>
  );
}

function InvitationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-700 border-orange-500/25",
    viewed: "bg-blue-500/10 text-blue-700 border-blue-500/25",
    responded: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
    declined: "bg-muted text-muted-foreground",
    envoyee: "bg-orange-500/10 text-orange-700 border-orange-500/25",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    viewed: "Vue",
    responded: "Répondu",
    declined: "Refusée",
    envoyee: "En attente",
  };
  return (
    <Badge variant="outline" className={cn("font-normal", map[status] ?? map.pending)}>
      {labels[status] ?? status}
    </Badge>
  );
}

export function OpportuniteCard({
  demande,
  isInvitation = false,
  invitationStatus,
  invitedAt,
  onView,
}: OpportuniteCardProps) {
  const title = demande.title || demande.titre || "Demande";
  const location = demande.localisation || demande.location || "—";
  const profession = demande.profession || demande.service;
  const budget = formatBudget(demande.budget_min, demande.budget_max);
  const dateLabel =
    isInvitation && invitedAt
      ? `Invité le ${formatDate(invitedAt)}`
      : `Publié le ${formatDate(demande.created_at)}`;
  const devisCount = demande.nombre_devis ?? 0;
  const devisFerme = demande.statut != null && !demandeAccepteNouveauDevis(demande.statut);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-l-4 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        devisFerme && "opacity-80",
        isInvitation
          ? "border-l-orange-500 bg-gradient-to-br from-orange-500/[0.04] via-card to-card"
          : urgencyAccentClass(demande.urgence ?? "normal"),
      )}
    >
      <CardContent className="p-0">
        {/* Mobile */}
        <div className="space-y-3 p-4 md:hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {isInvitation ? (
                <Badge className="gap-1 bg-orange-500 hover:bg-orange-500">
                  <Target className="h-3 w-3" />
                  Invitation
                </Badge>
              ) : demande.type === "directe" ? (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Directe
                </Badge>
              ) : null}
              <UrgenceBadge urgence={demande.urgence} />
              {devisFerme ? (
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 font-normal text-amber-800 dark:text-amber-200">
                  <Lock className="h-3 w-3" />
                  Devis fermé
                </Badge>
              ) : null}
              {isInvitation && invitationStatus ? (
                <InvitationStatusBadge status={invitationStatus} />
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold leading-snug line-clamp-2">
              {title}
            </h3>
            {profession ? (
              <p className="mt-1 text-xs font-medium text-primary/90">{profession}</p>
            ) : null}
          </div>

          {demande.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {demande.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            <ListCardMeta icon={MapPin}>{location}</ListCardMeta>
            <ListCardMeta icon={Calendar}>{dateLabel}</ListCardMeta>
            {demande.client_name ? (
              <ListCardMeta icon={User}>{demande.client_name}</ListCardMeta>
            ) : null}
          </div>

          <ListCardBudgetPanel
            label="Budget estimé"
            value={budget}
            hint={!isInvitation && devisCount > 0 ? `${devisCount} devis déjà reçus` : undefined}
          />

          <Button className="h-10 w-full gap-2" onClick={onView}>
            Voir l&apos;opportunité
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        {/* Desktop */}
        <div className="hidden gap-5 p-5 md:grid md:grid-cols-[1fr_minmax(180px,220px)_auto] md:items-center lg:p-6">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {isInvitation ? (
                <Badge className="gap-1 bg-orange-500 hover:bg-orange-500">
                  <Target className="h-3.5 w-3.5" />
                  Invitation directe
                </Badge>
              ) : demande.type === "directe" ? (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Demande directe
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Briefcase className="h-3.5 w-3.5" />
                  Publique
                </Badge>
              )}
              <UrgenceBadge urgence={demande.urgence} />
              {devisFerme ? (
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 font-normal text-amber-800 dark:text-amber-200">
                  <Lock className="h-3.5 w-3.5" />
                  Devis fermé
                </Badge>
              ) : null}
              {isInvitation && invitationStatus ? (
                <InvitationStatusBadge status={invitationStatus} />
              ) : null}
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">
                {title}
              </h3>
              {profession ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{profession}</p>
              ) : null}
            </div>

            {demande.description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {demande.description}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <ListCardMeta icon={MapPin}>{location}</ListCardMeta>
              <ListCardMeta icon={Calendar}>{dateLabel}</ListCardMeta>
              {demande.deadline ? (
                <ListCardMeta icon={Clock} className="border-orange-500/20 text-orange-700 dark:text-orange-300">
                  Échéance {formatDate(demande.deadline, "short")}
                </ListCardMeta>
              ) : null}
              {demande.client_name ? (
                <ListCardMeta icon={User}>{demande.client_name}</ListCardMeta>
              ) : null}
              {!isInvitation && devisCount > 0 ? (
                <ListCardMeta icon={MessageSquare}>
                  {devisCount} devis soumis
                </ListCardMeta>
              ) : null}
            </div>
          </div>

          <ListCardBudgetPanel label="Budget" value={budget} className="h-fit" />

          <div className="flex flex-col items-stretch gap-2">
            <Button className="min-w-[160px] gap-2" onClick={onView}>
              Voir le détail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
