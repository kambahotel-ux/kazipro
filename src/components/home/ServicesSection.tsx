import { Link } from "react-router-dom";
import { useState, useEffect, type ComponentType } from "react";
import {
  Zap,
  Droplets,
  Hammer,
  PaintBucket,
  Wind,
  ArrowRight,
  HardHat,
  Sofa,
  Car,
  Laptop,
  Briefcase,
  LayoutGrid,
} from "lucide-react";
import { professionsApi, prestatairesApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { useHomePrestataires } from "@/contexts/HomePrestatairesContext";
import { Skeleton } from "@/components/ui/skeleton";

// Icon mapping
const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "Électricité": Zap,
  "Électricien": Zap,
  "Plomberie": Droplets,
  "Plombier": Droplets,
  "Menuiserie": Hammer,
  "Menuisier": Hammer,
  "Peinture": PaintBucket,
  "Peintre": PaintBucket,
  "Climatisation": Wind,
  "Climaticien": Wind,
  "Mécanique": Car,
  "Mécanicien": Car,
  "Maçonnerie": HardHat,
  "Maçon": HardHat,
  "Tapisserie": Sofa,
  "Tapissier": Sofa,
  "Informatique": Laptop,
  "Informaticien": Laptop,
};

// Color mapping
const colorMap: Record<string, string> = {
  "Électricité": "from-yellow-400 to-orange-500",
  "Électricien": "from-yellow-400 to-orange-500",
  "Plomberie": "from-blue-400 to-cyan-500",
  "Plombier": "from-blue-400 to-cyan-500",
  "Menuiserie": "from-amber-500 to-orange-600",
  "Menuisier": "from-amber-500 to-orange-600",
  "Peinture": "from-purple-400 to-pink-500",
  "Peintre": "from-purple-400 to-pink-500",
  "Climatisation": "from-teal-400 to-blue-500",
  "Climaticien": "from-teal-400 to-blue-500",
  "Mécanique": "from-gray-500 to-gray-700",
  "Mécanicien": "from-gray-500 to-gray-700",
  "Maçonnerie": "from-orange-400 to-red-500",
  "Maçon": "from-orange-400 to-red-500",
  "Tapisserie": "from-rose-400 to-pink-600",
  "Tapissier": "from-rose-400 to-pink-600",
  "Informatique": "from-indigo-400 to-purple-500",
  "Informaticien": "from-indigo-400 to-purple-500",
};

interface Service {
  id: string;
  nom: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  providers: number;
}

const ServicesSection = () => {
  const homeStats = useHomePrestataires();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (homeStats && homeStats.professions.length > 0) {
      buildServices(homeStats.professions, homeStats.providers);
      setLoading(homeStats.loading);
      return;
    }
    void fetchServices();
  }, [homeStats]);

  const buildServices = (
    professions: Array<{ id: number; nom: string; description?: string }>,
    providers: Array<{ profession_id?: number }>,
  ) => {
    const topProfessions = professions.slice(0, 6);
    const servicesWithCounts = topProfessions.map((profession) => {
      const count = providers.filter(
        (p) => Number(p.profession_id) === Number(profession.id),
      ).length;
      return {
        id: String(profession.id),
        nom: profession.nom,
        description: profession.description || `Services de ${profession.nom.toLowerCase()}`,
        icon: iconMap[profession.nom] || Briefcase,
        color: colorMap[profession.nom] || "from-gray-400 to-gray-600",
        providers: count,
      };
    });
    setServices(servicesWithCounts);
    setLoading(false);
  };

  const fetchServices = async () => {
    try {
      const professions = (await professionsApi.getAll()) as Array<{
        id: number;
        nom: string;
        description?: string;
      }>;

      const listRes = await prestatairesApi.getAll({ per_page: 100 });
      const providers = unwrapPaginated<{ profession_id?: number }>(listRes);
      buildServices(professions, providers);
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    } finally {
      setLoading(false);
    }
  };

  const skeletonCards = Array.from({ length: 6 });

  return (
    <section className="py-10 sm:py-16 md:py-24 lg:py-28 bg-background relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none"
        aria-hidden
      />
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-14">
          <p className="inline-flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 sm:mb-4">
            <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
            Nos métiers
          </p>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4 md:mb-5 tracking-tight px-1">
            Une expertise pour chaque besoin
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed px-1 max-sm:mx-auto max-sm:max-w-[min(100%,22rem)]">
            Comparez les profils et demandez vos devis en quelques minutes.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {skeletonCards.map((_, i) => (
              <div
                key={i}
                className="rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4"
              >
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-14 rounded-lg sm:rounded-xl" />
                <Skeleton className="h-5 sm:h-7 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 sm:h-4 w-full rounded-md" />
                <Skeleton className="h-3.5 sm:h-4 w-5/6 rounded-md" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-md mt-2 sm:mt-4" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-8 sm:py-12 rounded-xl sm:rounded-2xl border border-dashed border-border bg-muted/30 px-4 sm:px-6">
            <p className="text-muted-foreground text-sm sm:text-base mb-5 sm:mb-6 leading-relaxed">
              Les professions seront disponibles dès leur configuration dans l&apos;administration.
              Vous pouvez tout de même explorer le catalogue général des services.
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 shadow-md transition-colors"
            >
              Voir les services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="group relative flex flex-row sm:flex-col gap-3 sm:gap-0 bg-card rounded-xl sm:rounded-2xl p-3.5 sm:p-6 md:p-8 border border-border/80 shadow-sm active:scale-[0.99] sm:hover:shadow-xl sm:hover:border-secondary/25 transition-all duration-300 sm:hover:-translate-y-0.5 md:hover:-translate-y-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div
                      className={`w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center sm:mb-4 md:mb-5 group-hover:scale-[1.04] transition-transform duration-300 shadow-md`}
                    >
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>

                    <div className="min-w-0 flex flex-col flex-1 sm:block">
                      <h3 className="text-[15px] sm:text-xl md:text-2xl font-display font-bold text-foreground sm:mb-2 group-hover:text-secondary transition-colors leading-snug">
                        {service.nom}
                      </h3>
                      <p className="hidden sm:block text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-2 flex-1 sm:mb-4 md:mb-5">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 md:pt-5 border-t border-border mt-auto sm:mt-0 max-sm:border-0 max-sm:pt-0 max-sm:mt-1">
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                          <span className="font-semibold tabular-nums text-foreground text-sm sm:text-base">
                            {service.providers}
                          </span>{" "}
                          <span className="hidden sm:inline">
                            prestataire{service.providers !== 1 ? "s" : ""}
                          </span>
                          <span className="sm:hidden">
                            pro{service.providers !== 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-secondary shrink-0">
                          <span className="hidden sm:inline">Découvrir</span>
                          <span className="sm:hidden">Voir</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-6 sm:mt-10 md:mt-14 px-1">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 w-full max-w-sm sm:max-w-none sm:w-auto mx-auto px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl bg-foreground text-background font-semibold text-xs sm:text-sm md:text-base hover:bg-foreground/90 transition-colors shadow-md"
              >
                Tous les services
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
