import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  FileText,
  CreditCard,
  CheckCircle,
  Shield,
  Clock,
  Star,
  Smartphone,
  ArrowRight,
  Building2,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

type Step = {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
};

const clientSteps: Step[] = [
  {
    icon: Search,
    number: "1",
    title: "Décrivez votre besoin",
    description:
      "Créez une demande en décrivant le travail, le lieu et le budget. Ajoutez des photos si utile pour des devis plus précis.",
  },
  {
    icon: FileText,
    number: "2",
    title: "Recevez des devis",
    description:
      "Les prestataires qualifiés vous envoient leurs propositions. Comparez et choisissez celle qui vous convient.",
  },
  {
    icon: CreditCard,
    number: "3",
    title: "Signez et payez",
    description:
      "Après acceptation du devis : contrat, signature électronique puis paiement Mobile Money (acompte, puis solde selon le parcours).",
  },
  {
    icon: CheckCircle,
    number: "4",
    title: "Validez le travail",
    description:
      "Une fois les travaux réalisés, validez la mission. Laissez un avis et clôturez le paiement restant selon vos conditions.",
  },
];

const providerSteps: Step[] = [
  {
    icon: Building2,
    number: "1",
    title: "Créez votre profil",
    description:
      "Inscription prestataire, métier, zone, disponibilités et tarifs pour recevoir les bonnes demandes.",
  },
  {
    icon: Search,
    number: "2",
    title: "Recevez des demandes",
    description:
      "Consultez les opportunités correspondant à votre métier et à votre zone.",
  },
  {
    icon: FileText,
    number: "3",
    title: "Envoyez vos devis",
    description:
      "Répondez avec un devis détaillé (montants, délais). Le client peut accepter en ligne.",
  },
  {
    icon: CreditCard,
    number: "4",
    title: "Sécurisez le paiement",
    description:
      "Une fois les travaux validés par le client, le paiement suit le flux prévu dans l'application.",
  },
];

function StepsGrid({
  steps,
  variant,
}: {
  steps: Step[];
  variant: "client" | "provider";
}) {
  const connector =
    variant === "client"
      ? "hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-secondary/50 to-secondary/10"
      : "hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10";

  const badgeDesktop =
    variant === "client"
      ? "bg-secondary text-secondary-foreground"
      : "bg-primary text-primary-foreground";

  const iconBoxDesktop =
    variant === "client" ? "bg-accent" : "bg-primary/10";

  const iconColorDesktop =
    variant === "client" ? "text-accent-foreground" : "text-primary";

  const iconBoxMobile =
    variant === "client"
      ? "bg-secondary/18"
      : "bg-primary/15";

  const iconColorMobile =
    variant === "client" ? "text-secondary" : "text-primary";

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
      {steps.map((step, index) => (
        <div key={step.number} className="relative">
          {index < steps.length - 1 && (
            <div className={connector} aria-hidden />
          )}

          <div className="md:hidden relative flex gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm">
            <span
              className="absolute top-2.5 right-2.5 text-[10px] font-bold text-muted-foreground tabular-nums"
              aria-hidden
            >
              {step.number}
            </span>
            <div
              className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${iconBoxMobile}`}
            >
              <step.icon className={`w-5 h-5 ${iconColorMobile}`} />
            </div>
            <div className="min-w-0 flex-1 pr-7">
              <h3 className="text-[15px] font-display font-semibold text-foreground leading-snug mb-1">
                {step.title}
              </h3>
              <p className="line-clamp-4 text-[13px] leading-relaxed text-muted-foreground sm:line-clamp-none">
                {step.description}
              </p>
            </div>
          </div>

          <div className="hidden md:block relative bg-card rounded-2xl p-6 shadow-card border border-border/50 h-full">
            <div
              className={`absolute -top-4 left-6 w-8 h-8 text-sm font-bold rounded-full flex items-center justify-center ${badgeDesktop}`}
            >
              {step.number}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 mt-2 ${iconBoxDesktop}`}
            >
              <step.icon className={`w-6 h-6 ${iconColorDesktop}`} />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const HowItWorks = () => {
  return (
    <PublicLayout>
      <section className="py-8 sm:py-14 lg:py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-56 h-56 sm:w-72 sm:h-72 bg-secondary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h1 className="text-[1.55rem] sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-6 tracking-tight px-1">
              Comment ça marche ?
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-primary-foreground/85 leading-relaxed max-sm:mx-auto max-sm:max-w-[21rem]">
              Un parcours clair pour les clients comme pour les professionnels — de la demande aux paiements.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 py-10 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Pour les clients
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4 px-2">
              Trouvez le bon professionnel
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Quatre étapes pour passer de votre besoin à une mission encadrée.
            </p>
          </div>

          <StepsGrid steps={clientSteps} variant="client" />

          <div className="text-center mt-8 sm:mt-12 px-2">
            <Button asChild variant="secondary" size="lg" className="w-full max-w-xs sm:w-auto sm:max-w-none">
              <Link to="/inscription/client">
                Publier une demande
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 bg-muted/45 py-10 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs sm:text-sm font-semibold mb-3 sm:mb-4 border border-secondary/25">
              Pour les prestataires
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4 px-2">
              Développez votre activité
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Inscrivez-vous, proposez vos devis et suivez vos missions depuis le tableau de bord.
            </p>
          </div>

          <StepsGrid steps={providerSteps} variant="provider" />

          <div className="text-center mt-8 sm:mt-12 px-2">
            <Button asChild size="lg" className="w-full max-w-xs sm:w-auto sm:max-w-none">
              <Link to="/inscription/prestataire">
                Devenir prestataire
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <h2 className="mb-8 px-2 text-center font-display text-xl font-bold text-foreground sm:mb-10 sm:text-3xl md:text-4xl">
            Pourquoi utiliser KaziPro ?
          </h2>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-5">
            {[
              { icon: Shield, title: "Paiement sécurisé", text: "Devis, contrats et flux de paiement structurés" },
              { icon: Clock, title: "Réponse rapide", text: "Recevez des retours sous 24 h en pratique" },
              { icon: Star, title: "Pros vérifiés", text: "Validation des profils selon vos règles internes" },
              { icon: Smartphone, title: "Mobile Money", text: "M-Pesa, Airtel Money, Orange Money…" },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-border/70 bg-card p-3.5 text-center shadow-sm sm:p-6 lg:text-center"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-[1.225rem] h-[1.225rem] sm:w-7 sm:h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">{title}</h3>
                <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-muted-foreground text-sm">
            <a
              href="#aide-contact"
              className="font-semibold text-secondary hover:underline"
            >
              Aide rapide &amp; contact
            </a>
            <span className="mx-2 text-border" aria-hidden>
              ·
            </span>
            <Link
              to="/services"
              className="font-semibold text-secondary hover:underline"
            >
              Tous les services
            </Link>
          </div>
        </div>
      </section>

      <section
        id="aide-contact"
        className="scroll-mt-[5.25rem] border-t border-border/50 bg-muted/35 py-8 sm:py-12 lg:scroll-mt-[5.75rem]"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <h3 className="mb-3 text-center font-display text-lg font-bold text-foreground sm:text-xl">
            Besoin d&apos;aide&nbsp;?
          </h3>
          <p className="mx-auto mb-6 max-w-md text-center text-muted-foreground text-sm sm:text-[15px]">
            Nos parcours client et prestataire sont décrits ci-dessus. Pour un dossier précis&nbsp;: écrivez-nous ou appelez-nous.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
            <a
              href="mailto:contact@kazipro.cd"
              className="inline-flex rounded-lg bg-card px-4 py-3 font-medium text-secondary text-sm shadow-sm ring-1 ring-border/70 transition-colors hover:bg-accent/60"
            >
              contact@kazipro.cd
            </a>
            <a
              href="tel:+243831366885"
              className="inline-flex rounded-lg bg-card px-4 py-3 font-medium text-secondary text-sm shadow-sm ring-1 ring-border/70 transition-colors hover:bg-accent/60"
            >
              +243 831 366 885
            </a>
            <Link
              to="/a-propos"
              className="inline-flex rounded-lg px-4 py-3 font-medium text-foreground text-sm hover:text-secondary hover:underline"
            >
              En savoir plus sur KaziPro
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HowItWorks;
