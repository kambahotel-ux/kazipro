import { useState, useEffect } from "react";
import { Shield, BadgeCheck, Clock, HeadphonesIcon, Wallet, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  const [stats, setStats] = useState<Stats>({
    providers: 0,
    missions: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count verified providers
      const { count: providersCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);

      // Count completed missions
      const { count: missionsCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Calculate average rating
      const { data: providers } = await supabase
        .from("prestataires")
        .select("rating")
        .eq("verified", true);

      const avgRating = providers && providers.length > 0
        ? providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length
        : 4.8;

      setStats({
        providers: providersCount || 0,
        missions: missionsCount || 0,
        rating: Number(avgRating.toFixed(1))
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      // Fallback to default values
      setStats({
        providers: 500,
        missions: 2000,
        rating: 4.8
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Pourquoi choisir KaziPro ?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Une plateforme conçue pour connecter clients et professionnels en toute confiance, avec des garanties à chaque étape.
          </p>
        </div>

        {/* Stats - Prominent Display */}
        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
          <div className="text-center">
            {loading ? (
              <div className="h-16 w-32 bg-muted animate-pulse rounded mx-auto mb-3"></div>
            ) : (
              <div className="text-5xl md:text-6xl font-display font-bold text-secondary mb-3">
                {stats.providers}+
              </div>
            )}
            <div className="text-lg font-medium text-foreground mb-1">Prestataires vérifiés</div>
            <div className="text-sm text-muted-foreground">Professionnels qualifiés</div>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-16 w-32 bg-muted animate-pulse rounded mx-auto mb-3"></div>
            ) : (
              <div className="text-5xl md:text-6xl font-display font-bold text-secondary mb-3">
                {stats.missions}+
              </div>
            )}
            <div className="text-lg font-medium text-foreground mb-1">Missions réalisées</div>
            <div className="text-sm text-muted-foreground">Projets terminés avec succès</div>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-16 w-32 bg-muted animate-pulse rounded mx-auto mb-3"></div>
            ) : (
              <div className="text-5xl md:text-6xl font-display font-bold text-secondary mb-3">
                {stats.rating}/5
              </div>
            )}
            <div className="text-lg font-medium text-foreground mb-1">Note moyenne</div>
            <div className="text-sm text-muted-foreground">Satisfaction client</div>
          </div>
        </div>

        {/* Features Grid - Clean Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 border border-border hover:border-secondary/30 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
