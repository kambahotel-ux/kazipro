import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Briefcase,
  MapPin,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ListCardMeta } from "@/components/prestataire/list-card-primitives";

export type PublicPrestataireCardData = {
  id: string;
  full_name: string;
  profession: string;
  profession_categorie?: string;
  bio?: string;
  city?: string;
  photo_url?: string;
  verified: boolean;
  rating: number;
  reviews_count?: number;
  missions_completed?: number;
  hourly_rate?: number;
  disponible?: boolean;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRating(rating: number): string {
  if (rating <= 0) return "—";
  return rating.toFixed(1);
}

type PublicPrestataireCardProps = {
  provider: PublicPrestataireCardData;
  /** Lien « Voir le profil » (public ou espace client) */
  profileHref?: string;
  /** Lien action principale (ex. inscription client) */
  contactHref?: string;
  contactLabel?: string;
  className?: string;
};

export function PublicPrestataireCard({
  provider,
  profileHref,
  contactHref = "/inscription/client",
  contactLabel = "Demander un devis",
  className,
}: PublicPrestataireCardProps) {
  const missions = provider.missions_completed ?? 0;
  const avis = provider.reviews_count ?? 0;
  const hasRating = provider.rating > 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200",
        "hover:border-secondary/35 hover:shadow-lg hover:shadow-secondary/5",
        "border-l-[3px] border-l-primary/45 hover:border-l-secondary",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3 sm:gap-4">
          <Avatar className="h-14 w-14 shrink-0 ring-2 ring-background shadow-md sm:h-16 sm:w-16">
            <AvatarImage src={provider.photo_url || undefined} alt={provider.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground sm:text-base">
              {initials(provider.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display text-base font-bold leading-tight text-foreground sm:text-lg">
                {provider.full_name}
              </h3>
              {provider.verified ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Vérifié
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{provider.profession}</span>
            </p>
            {provider.profession_categorie ? (
              <p className="mt-0.5 text-xs text-muted-foreground/80">{provider.profession_categorie}</p>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {provider.disponible ? (
            <Badge className="bg-emerald-600/90 text-[10px] font-medium hover:bg-emerald-600">Disponible</Badge>
          ) : null}
          {provider.hourly_rate && provider.hourly_rate > 0 ? (
            <Badge variant="secondary" className="text-[10px] font-medium tabular-nums">
              {provider.hourly_rate.toLocaleString("fr-FR")} FC/h
            </Badge>
          ) : null}
        </div>

        {provider.bio ? (
          <p className="mb-3 line-clamp-3 rounded-lg border border-border/50 bg-muted/35 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            {provider.bio}
          </p>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {provider.city ? (
            <ListCardMeta icon={MapPin}>{provider.city}</ListCardMeta>
          ) : null}
          {hasRating ? (
            <ListCardMeta icon={Star} className="text-amber-800/90 dark:text-amber-200/90">
              <span className="font-semibold text-foreground">{formatRating(provider.rating)}</span>
              {avis > 0 ? (
                <span className="text-muted-foreground"> · {avis} avis</span>
              ) : null}
            </ListCardMeta>
          ) : null}
          {missions > 0 ? (
            <ListCardMeta icon={User}>
              {missions} mission{missions > 1 ? "s" : ""}
            </ListCardMeta>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          {profileHref ? (
            <Button variant="outline" className="flex-1 rounded-xl" size="sm" asChild>
              <Link to={profileHref}>
                Voir le profil
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
          ) : null}
          <Button
            className={cn("rounded-xl", profileHref ? "flex-1" : "w-full")}
            variant="secondary"
            size="sm"
            asChild
          >
            <Link to={contactHref}>{contactLabel}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
