import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Search, FileText, CreditCard, CheckCircle, Shield, 
  Clock, Star, Users, ArrowRight, Smartphone, Building2 
} from "lucide-react";

const clientSteps = [
  {
    icon: Search,
    number: "1",
    title: "Décrivez votre besoin",
    description: "Créez une demande en décrivant précisément le travail à réaliser. Ajoutez des photos si nécessaire pour obtenir des devis plus précis."
  },
  {
    icon: FileText,
    number: "2",
    title: "Recevez des devis",
    description: "Les prestataires qualifiés de votre zone vous envoient leurs propositions détaillées sous 24h. Comparez et choisissez."
  },
  {
    icon: CreditCard,
    number: "3",
    title: "Payez en sécurité",
    description: "Acceptez le devis et payez via Mobile Money (M-Pesa, Airtel Money, Orange Money). Vos fonds sont sécurisés par notre système escrow."
  },
  {
    icon: CheckCircle,
    number: "4",
    title: "Validez le travail",
    description: "Une fois satisfait des travaux, validez-les dans l'app. Le prestataire reçoit son paiement et vous pouvez laisser un avis."
  }
];

const providerSteps = [
  {
    icon: Building2,
    number: "1",
    title: "Créez votre profil",
    description: "Inscrivez-vous et complétez votre profil professionnel : services, zones couvertes, expérience et tarifs."
  },
  {
    icon: Search,
    number: "2",
    title: "Recevez des demandes",
    description: "Recevez des notifications pour les demandes de service dans votre zone et selon vos spécialités."
  },
  {
    icon: FileText,
    number: "3",
    title: "Envoyez vos devis",
    description: "Répondez aux demandes avec des devis détaillés. Définissez le coût, la durée et les étapes de paiement."
  },
  {
    icon: CreditCard,
    number: "4",
    title: "Recevez votre paiement",
    description: "Une fois le travail validé par le client, recevez votre paiement directement sur votre compte Mobile Money."
  }
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-primary-foreground">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Comment ça marche ?
              </h1>
              <p className="text-xl text-primary-foreground/80">
                KaziPro simplifie la mise en relation entre clients et prestataires avec un processus sécurisé de bout en bout.
              </p>
            </div>
          </div>
        </section>

        {/* For Clients */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                Pour les clients
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Trouvez le bon professionnel
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                En 4 étapes simples, publiez votre demande et faites réaliser vos travaux en toute sérénité.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {clientSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < clientSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-secondary/50 to-secondary/10" />
                  )}
                  
                  <div className="relative bg-card rounded-2xl p-6 shadow-card border border-border/50 h-full">
                    <div className="absolute -top-4 left-6 w-8 h-8 bg-secondary text-secondary-foreground text-sm font-bold rounded-full flex items-center justify-center">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5 mt-2">
                      <step.icon className="w-6 h-6 text-accent-foreground" />
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

            <div className="text-center mt-12">
              <Link to="/inscription/client">
                <Button variant="secondary" size="lg">
                  Publier une demande
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* For Providers */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                Pour les prestataires
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Développez votre activité
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Rejoignez notre réseau et accédez à de nouvelles opportunités avec des paiements garantis.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {providerSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < providerSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
                  )}
                  
                  <div className="relative bg-card rounded-2xl p-6 shadow-card border border-border/50 h-full">
                    <div className="absolute -top-4 left-6 w-8 h-8 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mt-2">
                      <step.icon className="w-6 h-6 text-primary" />
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

            <div className="text-center mt-12">
              <Link to="/inscription/prestataire">
                <Button variant="default" size="lg">
                  Devenir prestataire
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Features */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Pourquoi utiliser KaziPro ?
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Paiement sécurisé</h3>
                <p className="text-sm text-muted-foreground">Fonds protégés par système escrow jusqu'à validation</p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Réponse rapide</h3>
                <p className="text-sm text-muted-foreground">Recevez des devis sous 24 heures</p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Pros vérifiés</h3>
                <p className="text-sm text-muted-foreground">Prestataires validés manuellement</p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Mobile Money</h3>
                <p className="text-sm text-muted-foreground">M-Pesa, Airtel Money, Orange Money</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
