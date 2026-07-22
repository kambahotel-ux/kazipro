import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Droplets,
  Hammer,
  PaintBucket,
  Wind,
  Briefcase,
  HardHat,
  Sofa,
  Car,
  Laptop,
  ArrowRight,
  Search,
  LayoutGrid,
} from "lucide-react";
import { professionsApi, prestatairesApi } from "@/lib/api";
import { toast } from "sonner";

const iconMap: Record<string, LucideIcon> = {
  Électricité: Zap,
  Électricien: Zap,
  Plomberie: Droplets,
  Plombier: Droplets,
  Menuiserie: Hammer,
  Menuisier: Hammer,
  Peinture: PaintBucket,
  Peintre: PaintBucket,
  Climatisation: Wind,
  Climaticien: Wind,
  Mécanique: Car,
  Mécanicien: Car,
  Maçonnerie: HardHat,
  Maçon: HardHat,
  Tapisserie: Sofa,
  Tapissier: Sofa,
  Informatique: Laptop,
  Informaticien: Laptop,
};

const colorMap: Record<string, string> = {
  Électricité: "from-yellow-400 to-orange-500",
  Électricien: "from-yellow-400 to-orange-500",
  Plomberie: "from-blue-400 to-cyan-500",
  Plombier: "from-blue-400 to-cyan-500",
  Menuiserie: "from-amber-500 to-orange-600",
  Menuisier: "from-amber-500 to-orange-600",
  Peinture: "from-purple-400 to-pink-500",
  Peintre: "from-purple-400 to-pink-500",
  Climatisation: "from-teal-400 to-blue-500",
  Climaticien: "from-teal-400 to-blue-500",
  Mécanique: "from-gray-500 to-gray-700",
  Mécanicien: "from-gray-500 to-gray-700",
  Maçonnerie: "from-orange-400 to-red-500",
  Maçon: "from-orange-400 to-red-500",
  Tapisserie: "from-rose-400 to-pink-600",
  Tapissier: "from-rose-400 to-pink-600",
  Informatique: "from-indigo-400 to-purple-500",
  Informaticien: "from-indigo-400 to-purple-500",
};

interface Service {
  id: string;
  nom: string;
  description?: string;
  icon: LucideIcon;
  color: string;
  providers: number;
}

const Services = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);

      const professions = (await professionsApi.getAll()) as Array<{
        id: number;
        nom: string;
        description?: string;
      }>;

      const servicesWithCounts = await Promise.all(
        professions.map(async (profession) => {
          const response = (await prestatairesApi.getAll({
            profession_id: profession.id,
            per_page: 1,
          })) as { total?: number };

          return {
            id: String(profession.id),
            nom: profession.nom,
            description:
              profession.description ||
              `Services de ${profession.nom.toLowerCase()}`,
            icon: iconMap[profession.nom] || Briefcase,
            color:
              colorMap[profession.nom] || "from-gray-400 to-gray-600",
            providers: response.total || 0,
          };
        })
      );

      setServices(servicesWithCounts);
    } catch {
      toast.error("Erreur lors du chargement des services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skeletonItems = Array.from({ length: 6 });

  return (
    <PublicLayout>
      <section className="relative py-10 sm:py-14 lg:py-20 gradient-hero overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 h-52 w-52 sm:h-72 sm:w-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-white/15 blur-2xl sm:hidden" />
        </div>

        <div className="container relative z-10 mx-auto px-3 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center text-primary-foreground">
            <p className="mb-3 inline-flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70 sm:text-xs">
              <LayoutGrid className="h-3.5 w-3.5 text-secondary" />
              Catalogue
            </p>
            <h1 className="mb-3 px-1 font-display text-[1.6rem] font-bold leading-tight tracking-tight sm:mb-4 sm:text-4xl md:text-5xl">
              Tous nos services
            </h1>
            <p className="mx-auto mb-5 max-w-[20rem] text-sm leading-relaxed text-primary-foreground/82 sm:mb-8 sm:max-w-none sm:text-lg md:text-xl">
              Métiers vérifiés et prestataires classés par profession pour votre
              projet.
            </p>

            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer un métier..."
                aria-label="Filtrer les services"
                className="h-11 w-full rounded-lg border border-border/40 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary sm:h-12 sm:rounded-xl md:h-14 sm:pl-12 sm:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 py-10 sm:py-14 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-8">
              {skeletonItems.map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3.5 sm:flex-col sm:p-5"
                >
                  <Skeleton className="h-11 w-11 shrink-0 rounded-lg sm:h-16 sm:w-14 sm:self-start" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="hidden h-4 w-full sm:block" />
                    <Skeleton className="h-10 w-full sm:mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-14 text-center">
              <p className="mx-auto mb-5 max-w-sm text-muted-foreground text-sm sm:text-base">
                Aucun résultat pour «&nbsp;{searchTerm}&nbsp;». Essayez un
                autre mot-clé.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Réinitialiser la recherche
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-8">
              {filteredServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="group flex flex-row gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all active:scale-[0.99] sm:flex-col sm:p-5 md:p-6 sm:hover:-translate-y-1 sm:hover:border-secondary/25 sm:hover:shadow-lg md:rounded-2xl"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm transition-transform duration-300 sm:mb-4 sm:h-16 sm:w-14 sm:rounded-xl group-hover:scale-105 ${service.color}`}
                    >
                      <Icon className="h-5 w-5 text-white sm:h-8 sm:w-8" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h2 className="mb-2 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-secondary sm:text-lg md:text-xl">
                        {service.nom}
                      </h2>
                      <p className="mb-3 line-clamp-2 hidden text-xs text-muted-foreground sm:mb-4 sm:block md:text-sm">
                        {service.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2 max-sm:border-0 max-sm:pt-1 sm:border-t sm:pt-4">
                        <span className="truncate text-xs text-muted-foreground sm:text-sm">
                          <span className="font-semibold tabular-nums text-foreground sm:text-base">
                            {service.providers}
                          </span>{" "}
                          <span className="hidden sm:inline">
                            prestataire
                            {service.providers > 1 ? "s" : ""}
                          </span>
                          <span className="sm:hidden">
                            pro{service.providers > 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-secondary sm:text-sm">
                          <span className="hidden sm:inline">Voir</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:ml-0.5 sm:h-4 sm:w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-muted/45 py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto max-w-xl px-3 text-center sm:max-w-none sm:px-4 lg:px-8">
          <h2 className="mb-3 font-display text-lg font-bold text-foreground sm:mb-4 sm:text-2xl md:text-3xl">
            Vous ne trouvez pas votre service ?
          </h2>
          <p className="mb-6 text-muted-foreground text-sm sm:mb-8 sm:text-base">
            Décrivez votre besoin — nous vous orientons vers les bons corps de
            métier.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full max-w-xs sm:w-auto rounded-xl px-8"
            asChild
          >
            <Link to="/inscription/client">
              Publier une demande
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border/50 py-6 sm:py-8">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-3 text-center text-[13px] text-muted-foreground sm:px-4">
          <Link
            to="/comment-ca-marche"
            className="font-medium text-secondary hover:underline"
          >
            Comment ça marche
          </Link>
          <span className="hidden text-border sm:inline" aria-hidden>
            ·
          </span>
          <Link
            to="/a-propos"
            className="font-medium text-secondary hover:underline"
          >
            À propos
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Services;
