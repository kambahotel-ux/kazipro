import { Search, FileText, CreditCard, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Décrivez votre besoin",
    description: "Expliquez le travail à réaliser et partagez des photos si nécessaire. Plus vous êtes précis, meilleurs seront les devis."
  },
  {
    icon: FileText,
    number: "02",
    title: "Recevez des devis",
    description: "Les prestataires qualifiés de votre zone vous envoient leurs propositions détaillées sous 24h."
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Payez en sécurité",
    description: "Acceptez le devis et payez via Mobile Money. Vos fonds sont sécurisés jusqu'à la fin des travaux."
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Validez le travail",
    description: "Une fois satisfait, validez les travaux. Le prestataire reçoit son paiement et vous pouvez le noter."
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Comment ça marche ?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Un processus simple et sécurisé en 4 étapes pour réaliser vos projets.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-full h-1 bg-gradient-to-r from-secondary via-secondary/50 to-transparent z-0" />
              )}
              
              <div className="relative bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-lg hover:border-secondary/30 transition-all duration-300 h-full">
                {/* Icon with Number */}
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
