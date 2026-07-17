import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Package,
  ArrowRight,
  Wrench,
  Layers,
  Truck,
  Zap,
  Droplets,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { materielCategoriesApi, materielsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { mapMaterielListItem } from "@/lib/materiel-display";
import { MaterielCard } from "@/components/location/MaterielCard";

const categoryIconMap: Record<string, typeof Package> = {
  drill: Hammer,
  layers: Layers,
  truck: Truck,
  zap: Zap,
  droplet: Droplets,
  package: Package,
};

interface Category {
  id: string;
  nom: string;
  icone?: string;
}

export default function LocationSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [materiels, setMateriels] = useState<ReturnType<typeof mapMaterielListItem>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [catsRaw, materielsRes] = await Promise.all([
        materielCategoriesApi.getAll(),
        materielsApi.getAll({ per_page: 8 }),
      ]);
      const cats = (Array.isArray(catsRaw) ? catsRaw : []) as Record<string, unknown>[];
      setCategories(
        cats.slice(0, 6).map((c) => ({
          id: String(c.id),
          nom: String(c.nom ?? ""),
          icone: c.icone != null ? String(c.icone) : undefined,
        })),
      );
      const rows = unwrapPaginated<Record<string, unknown>>(materielsRes);
      setMateriels(rows.map(mapMaterielListItem));
      const metaTotal = (materielsRes as { total?: number }).total;
      setTotal(metaTotal ?? rows.length);
    } catch {
      /* catalogue vide ou API indisponible */
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-muted/30 to-background py-10 sm:py-14 md:py-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              <Package className="h-4 w-4 text-secondary" />
              Location matériel
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Louez outils et équipements vérifiés
            </h2>
            <p className="text-sm text-muted-foreground">
              Perceuses, échafaudages, engins… Contrat, caution et Mobile Money.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="w-full shrink-0 sm:w-auto">
            <Link to="/location">
              Voir tout le catalogue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {!loading && categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const Icon = categoryIconMap[cat.icone ?? ""] ?? Wrench;
              return (
                <Link key={cat.id} to={`/location?categorie=${cat.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer gap-1 px-2.5 py-1 text-[11px] hover:bg-muted"
                  >
                    <Icon className="h-3 w-3" />
                    {cat.nom}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : materiels.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-10 text-center">
            <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Catalogue en cours d&apos;enrichissement</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/inscription/prestataire">Proposer du matériel</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {total > 0 ? `${total} annonce${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {materiels.map((m) => (
                <MaterielCard key={m.id} materiel={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
