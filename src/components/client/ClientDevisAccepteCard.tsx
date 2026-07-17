import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  User,
} from "lucide-react";
import { ListCardBudgetPanel, ListCardMeta } from "@/components/prestataire/list-card-primitives";
import type { ReactNode } from "react";

export type ClientDevisAccepteCardData = {
  id: string;
  numero?: string;
  titre?: string;
  montant_ttc: number;
  devise?: string;
  date_acceptation?: string;
  created_at?: string;
  demande_id: string;
  prestataire?: { full_name?: string; profession?: string };
  demande?: { title?: string; titre?: string };
};

type ClientDevisAccepteCardProps = {
  devis: ClientDevisAccepteCardData;
  onView: () => void;
  actionsMenu?: ReactNode;
};

export function ClientDevisAccepteCard({
  devis,
  onView,
  actionsMenu,
}: ClientDevisAccepteCardProps) {
  const demandeTitle = devis.demande?.title || devis.demande?.titre;
  const montant = `${Number(devis.montant_ttc).toLocaleString("fr-FR")} ${devis.devise || "FC"}`;
  const acceptedAt = new Date(
    devis.date_acceptation || devis.created_at || "",
  ).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card
      className={cn(
        "group overflow-hidden border-l-4 border-l-emerald-500 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
      )}
    >
      <CardContent className="p-0">
        <div className="space-y-3 p-4 md:hidden">
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          >
            <CheckCircle2 className="h-3 w-3" />
            Devis accepté
          </Badge>
          <h3 className="font-display text-base font-semibold leading-snug">
            {devis.titre || "Sans titre"}
          </h3>
          {demandeTitle ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              Demande : {demandeTitle}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <ListCardMeta icon={User}>
              {devis.prestataire?.full_name || "Prestataire"}
            </ListCardMeta>
            {devis.numero ? (
              <ListCardMeta icon={FileText}>N° {devis.numero}</ListCardMeta>
            ) : null}
          </div>
          <ListCardBudgetPanel label="Montant accepté" value={montant} />
          <p className="text-xs text-muted-foreground">Accepté le {acceptedAt}</p>
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
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepté
              </Badge>
              {devis.numero ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {devis.numero}
                </span>
              ) : null}
            </div>
            <h3 className="font-display text-lg font-semibold">{devis.titre || "Sans titre"}</h3>
            {demandeTitle ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Demande :</span> {demandeTitle}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <ListCardMeta icon={User}>
                {devis.prestataire?.full_name || "Prestataire"}
                {devis.prestataire?.profession
                  ? ` · ${devis.prestataire.profession}`
                  : ""}
              </ListCardMeta>
            </div>
            <p className="text-xs text-muted-foreground">Accepté le {acceptedAt}</p>
          </div>
          <ListCardBudgetPanel label="Montant TTC" value={montant} className="h-fit" />
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
