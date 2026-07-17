import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Lock,
  MapPin,
  MessageSquare,
  Users,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { demandeDevisFermeRaison } from '@/lib/demande-eligibility';

function Tile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 sm:p-4',
        accent ? 'border-primary/25 bg-primary/[0.06]' : 'border-border/70 bg-card',
      )}
    >
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        <Icon className={cn('h-4 w-4', accent && 'text-primary')} />
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p
        className={cn(
          'text-sm font-semibold text-foreground',
          accent && 'font-display text-lg text-primary sm:text-xl',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function urgenceBadge(urgence: string) {
  const key = urgence?.toLowerCase();
  if (key === 'urgent') {
    return <Badge className="border-0 bg-orange-500 hover:bg-orange-500">Urgent</Badge>;
  }
  if (key === 'tres_urgent') {
    return <Badge variant="destructive">Très urgent</Badge>;
  }
  return <Badge variant="secondary">Normal</Badge>;
}

function statutDemandeBadge(statut: string) {
  const labels: Record<string, string> = {
    ouverte: 'Ouverte',
    devis_recu: 'Devis reçus',
    en_cours: 'En cours',
    en_attente: 'En attente',
    terminee: 'Terminée',
    annulee: 'Annulée',
  };
  const label = labels[statut] ?? statut;
  return (
    <Badge variant="outline" className="font-normal">
      {label}
    </Badge>
  );
}

export type OpportuniteClientInfo = {
  full_name: string;
  city: string;
  telephone?: string;
};

export type OpportuniteDevisSoumis = {
  montant_ttc: number;
  created_at: string;
};

export type OpportuniteDetailViewProps = {
  title: string;
  numero?: string;
  location: string;
  publishedAt: string;
  budgetLabel: string;
  metierNom?: string;
  metierCategorie?: string;
  description: string;
  urgence: string;
  statut: string;
  nombreDevis: number;
  images?: string[];
  client: OpportuniteClientInfo | null;
  devisSoumis?: OpportuniteDevisSoumis | null;
  canSubmitDevis: boolean;
  onBack: () => void;
  onSubmitDevis: () => void;
  onContact: () => void;
};

export function OpportuniteDetailView({
  title,
  numero,
  location,
  publishedAt,
  budgetLabel,
  metierNom,
  metierCategorie,
  description,
  urgence,
  statut,
  nombreDevis,
  images = [],
  client,
  devisSoumis,
  canSubmitDevis,
  onBack,
  onSubmitDevis,
  onContact,
}: OpportuniteDetailViewProps) {
  const publishedLabel = new Date(publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const devisSoumisLabel = devisSoumis
    ? new Date(devisSoumis.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const devisFermeRaison = !canSubmitDevis && !devisSoumis ? demandeDevisFermeRaison(statut) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Opportunités
      </Button>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-5 lg:col-span-2">
          {devisSoumis ? (
            <div className="flex gap-3 rounded-xl border border-blue-200/80 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Devis déjà envoyé
                </p>
                <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/80">
                  {devisSoumis.montant_ttc.toLocaleString('fr-FR')} FC
                  {devisSoumisLabel ? ` · ${devisSoumisLabel}` : ''}
                </p>
              </div>
            </div>
          ) : devisFermeRaison ? (
            <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="font-medium text-amber-900 dark:text-amber-100">Devis fermé</p>
                <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/80">{devisFermeRaison}</p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden border-border/60 shadow-md">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-emerald-500/70" />
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {metierNom ? (
                  <Badge className="gap-1 border-0 bg-primary/10 text-primary hover:bg-primary/10">
                    <Briefcase className="h-3.5 w-3.5" />
                    {metierNom}
                  </Badge>
                ) : null}
                {metierCategorie ? (
                  <Badge variant="secondary" className="font-normal">
                    {metierCategorie}
                  </Badge>
                ) : null}
                {urgenceBadge(urgence)}
                {statutDemandeBadge(statut)}
              </div>

              <div>
                <h1 className="font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                  {title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {numero ? (
                    <span className="rounded-md bg-muted/80 px-2 py-0.5 font-mono text-xs">
                      {numero}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Publiée le {publishedLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Tile icon={Wallet} label="Budget indicatif" value={budgetLabel} accent />
                <Tile icon={MapPin} label="Lieu" value={location} />
                <Tile
                  icon={Users}
                  label="Concurrence"
                  value={
                    nombreDevis === 0
                      ? 'Soyez le premier'
                      : `${nombreDevis} devis reçu${nombreDevis > 1 ? 's' : ''}`
                  }
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <h2 className="mb-2 text-sm font-semibold">Description du besoin</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((src, i) => (
                    <img
                      key={src + i}
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="aspect-[4/3] w-full rounded-lg border border-border/80 object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <h2 className="text-sm font-semibold">Client</h2>
              {client ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {client.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{client.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{client.city}</p>
                      {client.telephone ? (
                        <p className="text-xs text-muted-foreground">{client.telephone}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={onContact}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contacter
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Informations non disponibles</p>
              )}
            </CardContent>
          </Card>

          {canSubmitDevis ? (
            <Card className="border-primary/30 bg-primary/[0.04] shadow-sm">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <p className="text-sm font-medium">Prêt à répondre ?</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Proposez un devis détaillé avec votre tarif et vos délais d’intervention.
                </p>
                <Button className="w-full" size="lg" onClick={onSubmitDevis}>
                  <FileText className="mr-2 h-4 w-4" />
                  Soumettre un devis
                </Button>
              </CardContent>
            </Card>
          ) : devisSoumis ? (
            <p className="px-1 text-center text-xs text-muted-foreground">
              Vous serez notifié si le client répond à votre proposition.
            </p>
          ) : devisFermeRaison ? (
            <Card className="border-amber-200/80 bg-amber-50/50 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-muted-foreground">{devisFermeRaison}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Skeleton aligné sur la grille opportunité (prestataire) */
export function OpportuniteDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-300 space-y-5">
      <div className="h-9 w-32 rounded-md bg-muted/80" />
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <Card className="overflow-hidden border-border/60 shadow-md lg:col-span-2">
          <div className="h-1 bg-muted/60" />
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-muted/80" />
              <div className="h-6 w-16 rounded-full bg-muted/80" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-4/5 max-w-md rounded-md bg-muted/80" />
              <div className="h-4 w-48 rounded-md bg-muted/80" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl border border-border/60 bg-muted/30" />
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 p-4">
              <div className="h-4 w-36 rounded-md bg-muted/80" />
              <div className="h-4 w-full rounded-md bg-muted/80" />
              <div className="h-4 w-5/6 rounded-md bg-muted/80" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="h-4 w-16 rounded-md bg-muted/80" />
              <div className="flex gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-muted/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded-md bg-muted/80" />
                  <div className="h-3 w-20 rounded-md bg-muted/80" />
                </div>
              </div>
              <div className="h-10 w-full rounded-md bg-muted/80" />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="h-4 w-32 rounded-md bg-muted/80" />
              <div className="h-3 w-full rounded-md bg-muted/80" />
              <div className="h-11 w-full rounded-md bg-muted/80" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
