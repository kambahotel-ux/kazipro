import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Users, Shield, Zap, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const values: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Shield,
    title: "Confiance",
    description:
      "Relations clients / prestataires via vérifications et engagements sur la plateforme.",
  },
  {
    icon: Zap,
    title: "Simplicité",
    description:
      "De la première demande aux étapes administratives prévues dans l'application.",
  },
  {
    icon: Heart,
    title: "Qualité",
    description:
      "Mettre en avant le travail réalisé et la relation de proximité en RDC.",
  },
  {
    icon: Users,
    title: "Communauté",
    description:
      "Favoriser les échanges entre clients cherchant une solution locale et artisans compétents.",
  },
];

const About = () => {
  return (
    <PublicLayout>
      <section className="py-8 sm:py-14 lg:py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-56 h-56 sm:w-72 sm:h-72 bg-secondary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h1 className="text-[1.55rem] sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-6 tracking-tight px-1">
              À propos de KaziPro
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-primary-foreground/85 leading-relaxed max-sm:mx-auto max-sm:max-w-[22rem]">
              Connecter avec plus de sécurité ceux qui ont un projet et ceux qui ont le métier pour le réaliser.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
            <div>
              <span className="inline-block px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                Notre histoire
              </span>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-4 sm:mb-6">
                Née d&apos;un constat simple
              </h2>
              <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                <p>
                  En RDC, trouver un électricien fiable ou un artisan de confiance repose souvent sur le bouche-à-oreille, sans cadre commun ni sécurité de paiement évidente.
                </p>
                <p>
                  KaziPro existe pour fluidifier ces échanges&nbsp;: mise en ligne des besoins, devis formalisés, contrats et
                  parcours de paiement plus lisibles pour les deux parties.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/90">
                  L&apos;offre précise peut évoluer (escrow totale ou partielle, validations, etc.). Adaptez ce texte à votre produit définitif.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6">
                {[
                  ["500+", "Prestataires vérifiés"],
                  ["2000+", "Missions réalisées"],
                  ["4,8", "Note moyenne"],
                  ["98%", "Clients satisfaits *"],
                ].map(([n, label]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/60 bg-card p-3.5 text-center shadow-sm sm:rounded-2xl sm:border-border/50 sm:p-6 sm:shadow-card"
                  >
                    <div className="mb-1 font-display text-xl font-bold text-secondary tabular-nums sm:text-4xl">
                      {n}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight sm:text-sm">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/90 leading-snug sm:text-xs">
                * Chiffres indicatifs&nbsp;; adaptez-les à vos données réelles.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-20 bg-muted/45">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 lg:p-10 shadow-card border border-border/50">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
                Notre mission
              </h3>
              <p className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                Digitaliser progressivement une partie du secteur services en RDC : transparence des devis, documents partagés
                dans l&apos;app et règles claires lorsque des litiges apparaissent.
              </p>
            </div>

            <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 lg:p-10 shadow-card border border-border/50">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
                Notre vision
              </h3>
              <p className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                Devenir une référence utile au quotidien pour les chantiers domestiques et petites infrastructures, en restant au
                plus près des usages locaux et des moyens de paiement du terrain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Nos valeurs
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-foreground px-2">
              Ce qui nous guide
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 text-center sm:text-left hover:border-secondary/30 transition-colors"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto sm:mx-0 mb-3 sm:mb-4">
                  <value.icon className="w-5 h-5 sm:w-7 sm:h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-[15px] sm:text-lg text-foreground mb-1 sm:mb-2">
                  {value.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-20 gradient-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-secondary blur-3xl max-sm:hidden" />
        </div>
        <div className="container relative z-10 mx-auto px-3 text-center sm:px-4 lg:px-8">
          <h2 className="mb-4 px-2 font-display text-xl font-bold tracking-tight text-primary-foreground sm:text-3xl md:text-4xl">
            Rejoindre KaziPro
          </h2>
          <p className="mx-auto mb-6 max-w-xl px-2 text-primary-foreground/78 text-sm sm:mb-8 sm:text-base">
            Besoin d&apos;un pro ou vous proposez vos services&nbsp;? Les inscriptions sont ouvertes.
          </p>
          <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            <Button asChild variant="hero" size="lg" className="h-12 w-full justify-center rounded-xl sm:h-11 sm:w-auto">
              <Link to="/inscription/client">
                Je cherche un pro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="h-12 w-full justify-center rounded-xl border-primary-foreground/35 sm:h-11 sm:w-auto">
              <Link to="/inscription/prestataire">Devenir prestataire</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
