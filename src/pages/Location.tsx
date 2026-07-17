import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, ArrowLeft } from "lucide-react";
import { materielCategoriesApi, materielsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { mapMaterielListItem } from "@/lib/materiel-display";
import { MaterielCard } from "@/components/location/MaterielCard";
import { toast } from "sonner";

export default function Location() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCategorie = searchParams.get("categorie") ?? "";

  const [search, setSearch] = useState(initialQ);
  const [categorieId, setCategorieId] = useState(initialCategorie);
  const [categories, setCategories] = useState<{ id: string; nom: string }[]>([]);
  const [items, setItems] = useState<ReturnType<typeof mapMaterielListItem>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void materielCategoriesApi.getAll().then((raw) => {
      const list = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      setCategories(list.map((c) => ({ id: String(c.id), nom: String(c.nom ?? "") })));
    });
  }, []);

  useEffect(() => {
    void load();
  }, [categorieId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await materielsApi.getAll({
        q: search.trim() || undefined,
        categorie_id: categorieId ? Number(categorieId) : undefined,
        per_page: 24,
      });
      setItems(unwrapPaginated<Record<string, unknown>>(res).map(mapMaterielListItem));
    } catch {
      toast.error("Impossible de charger le catalogue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-3 py-8 sm:px-4 sm:py-10 lg:px-8">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="mb-6 max-w-2xl space-y-1">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Location matériel</h1>
          <p className="text-sm text-muted-foreground">
            Outillage et équipements avec contrat et paiement sécurisé.
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Rechercher un matériel…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Button variant="secondary" className="h-10" onClick={load}>
            Rechercher
          </Button>
        </div>

        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <Badge
              variant={categorieId === "" ? "default" : "outline"}
              className="cursor-pointer px-2.5 py-0.5 text-xs"
              onClick={() => setCategorieId("")}
            >
              Toutes
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c.id}
                variant={categorieId === c.id ? "default" : "outline"}
                className="cursor-pointer px-2.5 py-0.5 text-xs"
                onClick={() => setCategorieId(c.id)}
              >
                {c.nom}
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Aucun matériel trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((m) => (
              <MaterielCard key={m.id} materiel={m} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
