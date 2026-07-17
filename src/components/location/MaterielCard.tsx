import { Link } from "react-router-dom";
import { MapPin, Package, Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MaterielListItem } from "@/lib/materiel-display";
import { formatFc } from "@/lib/materiel-display";
import { useState } from "react";

interface MaterielCardProps {
  materiel: MaterielListItem;
  compact?: boolean;
}

export function MaterielCard({ materiel, compact = true }: MaterielCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = materiel.image && !imgError;

  return (
    <Link
      to={`/location/${materiel.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`relative shrink-0 bg-muted ${compact ? "h-28 sm:h-32" : "aspect-[4/3]"}`}>
        {showImage ? (
          <img
            src={materiel.image}
            alt={materiel.titre}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/35" />
          </div>
        )}
        {(materiel.imageCount ?? 0) > 1 && (
          <Badge
            variant="secondary"
            className="absolute bottom-1.5 right-1.5 gap-1 bg-background/90 px-1.5 py-0.5 text-[10px] shadow-sm"
          >
            <Images className="h-3 w-3" />
            {materiel.imageCount}
          </Badge>
        )}
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${compact ? "gap-1 p-2.5 sm:p-3" : "gap-2 p-4"}`}>
        {materiel.categorie && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {materiel.categorie}
          </p>
        )}
        <h3
          className={`line-clamp-2 font-semibold leading-snug text-foreground ${
            compact ? "text-xs sm:text-sm" : "text-base"
          }`}
        >
          {materiel.titre}
        </h3>
        {(materiel.marque || materiel.modele) && (
          <p className="truncate text-[11px] text-muted-foreground">
            {[materiel.marque, materiel.modele].filter(Boolean).join(" ")}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          {(materiel.ville || materiel.quartier) && (
            <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{[materiel.ville, materiel.quartier].filter(Boolean).join(" · ")}</span>
            </span>
          )}
          {materiel.prix_jour != null && (
            <span className={`shrink-0 font-bold text-primary ${compact ? "text-xs" : "text-sm"}`}>
              {formatFc(materiel.prix_jour)}
              <span className="font-normal text-muted-foreground">/j</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
