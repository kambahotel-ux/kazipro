import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Calendar,
  Clock,
  Hash,
  Image as ImageIcon,
  MapPin,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type HighlightProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
};

function Highlight({ icon: Icon, label, value, accent }: HighlightProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border p-3 sm:p-4',
        accent
          ? 'border-primary/25 bg-primary/[0.06] shadow-sm'
          : 'border-border/70 bg-card',
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn('h-4 w-4 shrink-0', accent && 'text-primary')} />
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p
        className={cn(
          'text-sm font-semibold leading-snug text-foreground sm:text-base',
          accent && 'text-lg sm:text-xl font-display text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export type DemandeDetailOverviewProps = {
  title: string;
  numero?: string;
  createdAt: string;
  metierNom?: string;
  metierCategorie?: string;
  location: string;
  dateSouhaitee: string;
  budgetLabel?: string | null;
  urgenceLabel?: string;
  typeDemande?: string;
  statutModeration?: string;
  statusBadge: ReactNode;
  description?: string;
  showDescription?: boolean;
  images?: string[];
  onImageClick?: (index: number) => void;
};

export function DemandeDetailOverview({
  title,
  numero,
  createdAt,
  metierNom,
  metierCategorie,
  location,
  dateSouhaitee,
  budgetLabel,
  urgenceLabel,
  typeDemande,
  statutModeration,
  statusBadge,
  description,
  showDescription = false,
  images = [],
  onImageClick,
}: DemandeDetailOverviewProps) {
  const createdLabel = new Date(createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const typeLabel =
    typeDemande === 'publique' ? 'Publique' : typeDemande === 'privee' ? 'Privée' : null;

  const factTiles: HighlightProps[] = [
    ...(budgetLabel
      ? [{ icon: Wallet, label: 'Budget indicatif', value: budgetLabel, accent: true }]
      : []),
    { icon: MapPin, label: 'Lieu', value: location },
    { icon: Calendar, label: 'Date souhaitée', value: dateSouhaitee },
    ...(urgenceLabel ? [{ icon: Clock, label: 'Urgence', value: urgenceLabel }] : []),
    ...(typeLabel ? [{ icon: Hash, label: 'Visibilité', value: typeLabel }] : []),
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <Card className="overflow-hidden border-border/60 shadow-md">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-emerald-500/80" />
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              {metierNom ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="gap-1 border-0 bg-primary/10 px-2.5 py-1 text-primary hover:bg-primary/10">
                    <Briefcase className="h-3.5 w-3.5" />
                    {metierNom}
                  </Badge>
                  {metierCategorie ? (
                    <Badge variant="secondary" className="font-normal">
                      {metierCategorie}
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <h1 className="font-display text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl lg:text-[1.65rem]">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                {numero ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 font-mono text-[11px] sm:text-xs">
                    {numero}
                  </span>
                ) : null}
                <span>Publiée le {createdLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {statutModeration === 'en_attente' ? (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                  Modération en cours
                </Badge>
              ) : null}
              {statusBadge}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {factTiles.map((tile) => (
              <Highlight key={tile.label} {...tile} />
            ))}
          </div>
        </CardContent>
      </Card>

      {showDescription && description ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Description du besoin</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {images.length > 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ImageIcon className="h-4 w-4 text-primary" />
              Photos jointes
              <span className="font-normal text-muted-foreground">({images.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {images.map((url, index) => (
                <button
                  key={url + index}
                  type="button"
                  onClick={() => onImageClick?.(index)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/80 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-left text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 sm:opacity-100">
                    Photo {index + 1}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
