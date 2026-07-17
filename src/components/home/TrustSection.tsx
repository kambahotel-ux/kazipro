import { useState, useEffect } from "react";
import {
  Shield,
  BadgeCheck,
  Clock,
  HeadphonesIcon,
  Wallet,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useHomePrestataires } from "@/contexts/HomePrestatairesContext";
import { prestatairesApi } from "@/lib/api";

const features = [
  {
    icon: BadgeCheck,
    title: "Prestataires vérifiés",
    description: "Chaque professionnel est vérifié et validé manuellement avant d'intégrer notre plateforme."
  },
  {
    icon: Wallet,
    title: "Paiement sécurisé",
    description: "Vos fonds sont séquestrés et libérés uniquement après validation des travaux."
  },
  {
    icon: Shield,
    title: "Garantie satisfaction",
    description: "En cas de litige, notre équipe intervient pour trouver une solution équitable."
  },
  {
    icon: Clock,
    title: "Réponse rapide",
    description: "Recevez des devis de professionnels qualifiés en moins de 24 heures."
  },
  {
    icon: HeadphonesIcon,
    title: "Support dédié",
    description: "Notre équipe est disponible pour vous accompagner à chaque étape."
  },
  {
    icon: Users,
    title: "Communauté active",
    description: "Rejoignez des milliers d'utilisateurs satisfaits partout en RDC."
  }
];

interface Stats {
  providers: number;
  missions: number;
  rating: number;
}

const TrustSection = () => {
  const homeStats = useHomePrestataires();
  const [stats, setStats] = useState<Stats>({
    providers: 0,
    missions: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(!homeStats);

  useEffect(() => {
    if (homeStats) {
      setStats({
        providers: homeStats.totalProviders,
        missions: homeStats.completedProjects,
        rating: homeStats.averageRating,
      });
      setLoading(homeStats.loading);
      return;
    }
    fetchStats();
  }, [homeStats]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const providersListResponse = (await prestatairesApi.getAll({
        per_page: 100,
      })) as {
        total?: number;
        data?: Array<{ note_moyenne?: number | string; nb_missions?: number }>;
      };

      const providers = providersListResponse.data || [];
      const missionsCount = providers.reduce((sum, p) => sum + (p.nb_missions || 0), 0);
      const avgRating =
        providers.length > 0
          ? providers.reduce((sum, p) => sum + (Number(p.note_moyenne) || 0), 0) / providers.length
          : 4.8;

      setStats({
        providers: providersListResponse.total || 0,
        missions: missionsCount,
        rating: Number(avgRating.toFixed(1)),
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setStats({
        providers: 500,
        missions: 2000,
        rating: 4.8,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 sm:py-16 md:py-24 lg:py-28 bg-muted/35 border-y border-border/60">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-14 lg:mb-20">
          <p className="inline-flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-muted-foreground mb-3 sm:mb-4">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
            Vos garanties
          </p>
          <h2 className="text-[1.5rem] sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4 sm:mb-6 tracking-tight px-1">
            Pourquoi choisir KaziPro ?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-sm:max-w-[18.5rem] max-sm:mx-auto">
            <span className="sm:hidden">Confiance, paiements sécurisés et équipe disponible si besoin.</span>
            <span className="hidden sm:inline">
              Une plateforme pensée pour la confiance&nbsp;: identification des pros, paiement sécurisé et médiation si besoin.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10 max-w-4xl mx-auto mb-10 sm:mb-14 md:mb-20">
          <div className="text-center flex sm:block items-center gap-4 sm:gap-0 max-sm:bg-card max-sm:border max-sm:border-border/70 max-sm:rounded-xl max-sm:p-4 max-sm:text-left">
            {loading ? (
              <div className="h-12 sm:h-16 w-full sm:w-32 bg-muted animate-pulse rounded sm:mx-auto sm:mb-3" />
            ) : (
              <div className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-secondary shrink-0 sm:mb-2 tabular-nums min-w-[4.25rem] sm:min-w-0 text-center sm:text-center">
                {stats.providers}+
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-semibold sm:font-medium text-foreground mb-0.5 sm:mb-1">
                <span className="sm:hidden">Prestataires</span>
                <span className="hidden sm:inline">Prestataires vérifiés</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-snug">
                <span className="sm:hidden">Vérifiés</span>
                <span className="hidden sm:inline">Professionnels qualifiés</span>
              </div>
            </div>
          </div>
          <div className="text-center flex sm:block items-center gap-4 sm:gap-0 max-sm:bg-card max-sm:border max-sm:border-border/70 max-sm:rounded-xl max-sm:p-4 max-sm:text-left">
            {loading ? (
              <div className="h-12 sm:h-16 w-full sm:w-32 bg-muted animate-pulse rounded sm:mx-auto sm:mb-3" />
            ) : (
              <div className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-secondary shrink-0 sm:mb-2 tabular-nums min-w-[4.25rem] sm:min-w-0 text-center">
                {stats.missions}+
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-semibold sm:font-medium text-foreground mb-0.5 sm:mb-1">
                <span className="sm:hidden">Missions</span>
                <span className="hidden sm:inline">Missions réalisées</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-snug">
                <span className="sm:hidden">Réalisées</span>
                <span className="hidden sm:inline">Projets terminés avec succès</span>
              </div>
            </div>
          </div>
          <div className="text-center flex sm:block items-center gap-4 sm:gap-0 max-sm:bg-card max-sm:border max-sm:border-border/70 max-sm:rounded-xl max-sm:p-4 max-sm:text-left sm:col-span-1">
            {loading ? (
              <div className="h-12 sm:h-16 w-full sm:w-32 bg-muted animate-pulse rounded sm:mx-auto sm:mb-3" />
            ) : (
              <div className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-secondary shrink-0 sm:mb-2 tabular-nums min-w-[4.25rem] sm:min-w-0 text-center">
                {stats.rating}/5
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-semibold sm:font-medium text-foreground mb-0.5 sm:mb-1">
                Note moyenne
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Satisfaction client
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-border/80 hover:border-secondary/35 hover:shadow-lg transition-all duration-300 group flex gap-3.5 sm:flex-col sm:gap-0"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-lg sm:rounded-xl bg-secondary/10 flex items-center justify-center sm:mb-5 group-hover:bg-secondary/20 transition-colors">
                <feature.icon className="w-[1.225rem] h-[1.225rem] sm:w-7 sm:h-7 text-secondary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] sm:text-xl font-semibold text-foreground mb-1 sm:mb-3 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-[13px] sm:text-[15px] leading-relaxed sm:leading-relaxed line-clamp-4 sm:line-clamp-none">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
