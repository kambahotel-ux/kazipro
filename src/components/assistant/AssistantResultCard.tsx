import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AssistantResult } from '@/lib/assistant-api';
import { MapPin, Star, ArrowRight } from 'lucide-react';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Carte compacte pour le fil de chat assistant. */
export function AssistantResultCard({ result }: { result: AssistantResult }) {
  const href = result.profile_url ?? `/prestataires/${result.id}`;
  const rating = Number(result.rating) || 0;

  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="flex gap-3 p-3">
        <Avatar className="h-12 w-12 border border-border/60">
          {result.photo_url ? <AvatarImage src={result.photo_url} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(result.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-foreground">{result.full_name}</h3>
            {result.verified && (
              <Badge variant="outline" className="h-5 border-emerald-500/40 px-1.5 text-[10px] text-emerald-700">
                Vérifié
              </Badge>
            )}
            {result.disponible && (
              <Badge className="h-5 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-500/15">
                Dispo
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{result.profession}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {(result.ville || result.quartier) && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {[result.quartier, result.ville].filter(Boolean).join(', ')}
              </span>
            )}
            {rating > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
                {result.reviews_count ? ` (${result.reviews_count})` : ''}
              </span>
            )}
            {result.hourly_rate != null && result.hourly_rate > 0 && (
              <span className="font-medium text-foreground">
                {Number(result.hourly_rate).toLocaleString('fr-FR')} FC/h
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/60 bg-muted/30 px-3 py-2">
        <Button asChild size="sm" variant="outline" className="h-8 flex-1 rounded-lg text-xs">
          <Link to={href}>
            Voir le profil
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
        <Button asChild size="sm" className="h-8 flex-1 rounded-lg text-xs">
          <Link to="/inscription/client">Devis</Link>
        </Button>
      </div>
    </article>
  );
}
