import { Link } from "react-router-dom";
import {
  Search,
  FileText,
  CreditCard,
  CheckCircle,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Décrivez votre besoin",
    description:
      "Expliquez le travail à réaliser et partagez des photos si nécessaire. Plus vous êtes précis, meilleurs seront les devis.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Recevez des devis",
    description:
      "Les prestataires qualifiés de votre zone vous envoient des propositions détaillées, souvent sous 24 h.",
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Signez et payez",
    description:
      "Contrat lisible et signature électronique, puis paiement sécurisé par Mobile Money (acompte puis solde).",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Validez les travaux",
    description:
      "Une fois satisfait, validez la mission. Le prestataire reçoit son dû ; vous pouvez laisser un avis.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-10 sm:py-16 md:py-24 lg:py-28 bg-gradient-to-b from-background via-muted/20 to-muted/40 relative">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <p className="inline-flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-muted-foreground mb-3 sm:mb-4">
            <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
            Pour les clients
          </p>
          <h2 className="text-[1.5rem] sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-5 tracking-tight px-1">
            Comment ça marche ?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-sm:max-w-[19rem] max-sm:mx-auto">
            <span className="sm:hidden">De votre demande à la mission livrée, étape par étape.</span>
            <span className="hidden sm:inline">
              Un flux clair, de votre demande à la mission livrée, avec des garanties à chaque étape.
            </span>
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-5">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-48px)] h-px bg-gradient-to-r from-secondary/55 to-transparent z-0"
                    aria-hidden
                  />
                )}

                {/* Mobile / tablette&nbsp;: carte compacte horizontale */}
                <div className="relative flex gap-3 sm:gap-3.5 md:hidden bg-card rounded-xl border border-border/90 p-3.5 shadow-sm">
                  <span
                    className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/90 tabular-nums"
                    aria-hidden
                  >
                    {step.number}
                  </span>
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-secondary to-secondary/85 flex items-center justify-center shadow-sm mt-0.5">
                    <step.icon className="w-[1.125rem] h-[1.125rem] text-secondary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 pr-7">
                    <h3 className="text-[15px] font-display font-bold text-foreground leading-snug mb-1">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-[13px] leading-relaxed line-clamp-4 sm:line-clamp-none">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex md:flex-col gap-6 bg-card rounded-2xl border border-border/90 p-7 shadow-sm hover:shadow-md hover:border-secondary/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/85 flex items-center justify-center shadow-md shrink-0">
                      <step.icon className="w-7 h-7 text-secondary-foreground" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground tabular-nums">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-11 md:mt-14 px-1">
            <Button
              variant="outline"
              size="default"
              asChild
              className="rounded-lg sm:rounded-xl font-semibold w-full max-w-sm sm:w-auto sm:max-w-none text-sm sm:text-base h-10 sm:h-11 px-4 sm:px-6"
            >
              <Link to="/comment-ca-marche">
                Guide clients & prestataires
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
