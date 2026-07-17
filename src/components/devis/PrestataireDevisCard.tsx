import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatMontant } from '@/lib/devis-form';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Layers,
  MapPin,
  MoreHorizontal,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type PrestataireDevisStatut =
  | 'brouillon'
  | 'envoye'
  | 'accepte'
  | 'refuse'
  | 'expire';

export interface PrestataireDevisCardData {
  id: string;
  numero: string;
  titre: string;
  description?: string;
  statut: PrestataireDevisStatut;
  montant_ht: number;
  montant_ttc: number;
  tva: number;
  devise?: string;
  created_at: string;
  client_name?: string;
  location?: string;
  items_count?: number;
  items_preview?: string[];
}

type StatusConfig = {
  label: string;
  icon: LucideIcon;
  accent: string;
  badge: string;
};

const STATUS: Record<PrestataireDevisStatut, StatusConfig> = {
  brouillon: {
    label: 'Brouillon',
    icon: FileText,
    accent: 'border-l-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground border-border',
  },
  envoye: {
    label: 'Envoyé',
    icon: Send,
    accent: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-800 border-blue-200 dark:text-blue-300 dark:border-blue-800',
  },
  accepte: {
    label: 'Accepté',
    icon: CheckCircle2,
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800',
  },
  refuse: {
    label: 'Refusé',
    icon: XCircle,
    accent: 'border-l-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/25',
  },
  expire: {
    label: 'Expiré',
    icon: Clock,
    accent: 'border-l-amber-500',
    badge: 'bg-amber-500/10 text-amber-900 border-amber-200 dark:text-amber-200 dark:border-amber-800',
  },
};

export function DevisStatusBadge({ statut }: { statut: PrestataireDevisStatut | string }) {
  const cfg = STATUS[statut as PrestataireDevisStatut] ?? STATUS.envoye;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium shrink-0', cfg.badge)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function MontantPanel({
  devis,
  className,
}: {
  devis: PrestataireDevisCardData;
  className?: string;
}) {
  const devise = devis.devise || 'CDF';
  const montantTva = Math.max(0, devis.montant_ttc - devis.montant_ht);

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-muted/30 px-4 py-3 space-y-1.5',
        className,
      )}
    >
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span>HT</span>
        <span className="tabular-nums font-medium text-foreground">
          {formatMontant(devis.montant_ht, devise)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span>TVA ({devis.tva}%)</span>
        <span className="tabular-nums font-medium text-foreground">
          {formatMontant(montantTva, devise)}
        </span>
      </div>
      <div className="flex justify-between gap-4 border-t border-border/60 pt-2">
        <span className="text-sm font-medium">Total TTC</span>
        <span className="font-display text-lg font-bold tabular-nums text-primary">
          {formatMontant(devis.montant_ttc, devise)}
        </span>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      {children}
    </span>
  );
}

export interface PrestataireDevisCardProps {
  devis: PrestataireDevisCardData;
  onView: () => void;
  actionsMenu: ReactNode;
}

export function PrestataireDevisCard({ devis, onView, actionsMenu }: PrestataireDevisCardProps) {
  const cfg = STATUS[devis.statut] ?? STATUS.envoye;
  const description = devis.description?.trim();
  const showDescription =
    description &&
    description.length > 0 &&
    description.toLowerCase() !== devis.titre.toLowerCase();
  const previews = devis.items_preview?.filter(Boolean).slice(0, 3) ?? [];
  const extraLines =
    (devis.items_count ?? previews.length) > previews.length
      ? (devis.items_count ?? 0) - previews.length
      : 0;

  return (
    <Card
      className={cn(
        'group overflow-hidden border-l-4 shadow-sm transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md',
        cfg.accent,
      )}
    >
      <CardContent className="p-0">
        {/* Mobile */}
        <div className="space-y-3 p-4 md:hidden">
          <div className="flex items-start justify-between gap-2">
            <DevisStatusBadge statut={devis.statut} />
            <p className="shrink-0 text-right font-display text-sm font-bold tabular-nums text-primary">
              {formatMontant(devis.montant_ttc, devis.devise || 'CDF')}
            </p>
          </div>

          <div>
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
              {devis.titre}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{devis.numero}</p>
          </div>

          {showDescription && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <MetaRow icon={Calendar}>
              {new Date(devis.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </MetaRow>
            {devis.client_name && <MetaRow icon={User}>{devis.client_name}</MetaRow>}
            {devis.location && <MetaRow icon={MapPin}>{devis.location}</MetaRow>}
            {(devis.items_count ?? 0) > 0 && (
              <MetaRow icon={Layers}>
                {devis.items_count} ligne{(devis.items_count ?? 0) > 1 ? 's' : ''}
              </MetaRow>
            )}
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {previews.map((label, i) => (
                <span
                  key={`${devis.id}-line-${i}`}
                  className="max-w-[140px] truncate rounded-md bg-background px-2 py-0.5 text-[11px] border border-border/60"
                >
                  {label}
                </span>
              ))}
              {extraLines > 0 && (
                <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{extraLines}
                </span>
              )}
            </div>
          )}

          <MontantPanel devis={devis} />

          <div className="flex gap-2">
            <Button variant="default" size="sm" className="h-10 flex-1" onClick={onView}>
              <Eye className="mr-1.5 h-4 w-4" />
              Voir le détail
            </Button>
            {actionsMenu}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden gap-5 p-5 md:grid md:grid-cols-[1fr_minmax(200px,240px)_auto] md:items-center lg:p-6">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <DevisStatusBadge statut={devis.statut} />
              <span className="font-mono text-xs text-muted-foreground">{devis.numero}</span>
            </div>
            <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">
              {devis.titre}
            </h3>
            {showDescription && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <MetaRow icon={Calendar}>
                Créé le{' '}
                {new Date(devis.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </MetaRow>
              {devis.client_name && <MetaRow icon={User}>{devis.client_name}</MetaRow>}
              {devis.location && <MetaRow icon={MapPin}>{devis.location}</MetaRow>}
            </div>
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {previews.map((label, i) => (
                  <span
                    key={`${devis.id}-desk-${i}`}
                    className="max-w-[160px] truncate rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
                {extraLines > 0 && (
                  <span className="self-center text-xs text-muted-foreground">
                    +{extraLines} ligne{extraLines > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <MontantPanel devis={devis} />

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button variant="default" size="sm" className="min-w-[140px] gap-2" onClick={onView}>
              <Eye className="h-4 w-4" />
              Voir le détail
            </Button>
            {actionsMenu}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PrestataireDevisStats({
  counts,
}: {
  counts: { total: number; envoye: number; accepte: number; brouillon: number; refuse: number };
}) {
  const chips = [
    { label: 'Total', value: counts.total, className: 'bg-card border-border' },
    { label: 'Envoyés', value: counts.envoye, className: 'bg-blue-500/8 border-blue-200/80 text-blue-900 dark:text-blue-200' },
    { label: 'Acceptés', value: counts.accepte, className: 'bg-emerald-500/8 border-emerald-200/80 text-emerald-900 dark:text-emerald-200' },
    { label: 'Brouillons', value: counts.brouillon, className: 'bg-muted/80 border-border' },
    ...(counts.refuse > 0
      ? [{ label: 'Refusés', value: counts.refuse, className: 'bg-destructive/8 border-destructive/20 text-destructive' }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
            chip.className,
          )}
        >
          <span className="text-muted-foreground text-xs">{chip.label}</span>
          <span className="font-display font-bold tabular-nums">{chip.value}</span>
        </div>
      ))}
    </div>
  );
}
