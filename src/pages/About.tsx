import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Users, Shield, Zap, ArrowRight } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Confiance",
    description: "Nous bâtissons des relations de confiance entre clients et prestataires grâce à notre système de vérification et d'escrow."
  },
  {
    icon: Zap,
    title: "Simplicité",
    description: "Une plateforme intuitive qui facilite la vie des utilisateurs, du premier contact au paiement final."
  },
  {
    icon: Heart,
    title: "Qualité",
    description: "Nous valorisons le travail bien fait et aidons les professionnels à développer leurs compétences."
  },
  {
    icon: Users,
    title: "Communauté",
    description: "Nous créons un écosystème où clients et prestataires prospèrent ensemble."
  }
];

const About = () => {
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
                À propos de KaziPro
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Nous révolutionnons la façon dont les Congolais trouvent et engagent des prestataires de services qualifiés.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                  Notre histoire
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Née d'un constat simple
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    En RDC, trouver un électricien fiable, un plombier compétent ou un menuisier de confiance repose encore largement sur le bouche-à-oreille. Il n'existe pas de cadre formel, pas de garantie de qualité, et surtout pas de sécurité de paiement.
                  </p>
                  <p>
                    KaziPro est né de la volonté de changer cette réalité. Notre mission : créer une plateforme numérique sécurisée où les clients trouvent des prestataires qualifiés et où les professionnels accèdent à de nouvelles opportunités.
                  </p>
                  <p>
                    Grâce à notre système d'escrow, nous garantissons que les clients ne paient que pour un travail bien fait, et que les prestataires reçoivent leur dû après validation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                  <div className="text-4xl font-display font-bold text-secondary mb-2">500+</div>
                  <div className="text-muted-foreground">Prestataires vérifiés</div>
                </div>
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                  <div className="text-4xl font-display font-bold text-secondary mb-2">2000+</div>
                  <div className="text-muted-foreground">Missions réalisées</div>
                </div>
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                  <div className="text-4xl font-display font-bold text-secondary mb-2">4.8</div>
                  <div className="text-muted-foreground">Note moyenne</div>
                </div>
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                  <div className="text-4xl font-display font-bold text-secondary mb-2">98%</div>
                  <div className="text-muted-foreground">Clients satisfaits</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 lg:p-10 shadow-card border border-border/50">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">Notre Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Digitaliser et professionnaliser les services d'installation et de réparation en RDC. Nous offrons une plateforme où les paiements sont sécurisés, les devis sont transparents, et les litiges sont résolus équitablement.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-8 lg:p-10 shadow-card border border-border/50">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">Notre Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Devenir la référence de confiance pour les services à domicile en Afrique centrale. Nous voulons créer un écosystème où chaque professionnel peut développer son activité et où chaque client trouve le bon expert.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                Nos valeurs
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Ce qui nous guide
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <div key={value.title} className="text-center p-6 bg-card rounded-2xl border border-border/50 hover:border-secondary/30 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Rejoignez l'aventure KaziPro
            </h2>
            <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Que vous soyez client à la recherche d'un professionnel ou prestataire souhaitant développer votre activité, KaziPro est fait pour vous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscription/client">
                <Button variant="hero" size="lg">
                  Je cherche un pro
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/inscription/prestataire">
                <Button variant="hero-outline" size="lg">
                  Devenir prestataire
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
