import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.15),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center text-primary-foreground mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui font confiance à KaziPro
            </p>
          </div>

          {/* CTA Cards */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Clients */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-semibold mb-6">
                Pour les clients
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">
                Trouvez votre professionnel
              </h3>
              <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
                Publiez votre demande gratuitement et recevez des devis de prestataires qualifiés en moins de 24h.
              </p>
              <Link to="/inscription/client">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-lg px-8 py-6 h-auto"
                >
                  Publier une demande
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* For Providers */}
            <div className="bg-secondary/20 backdrop-blur-md rounded-3xl p-10 border border-secondary/30 hover:bg-secondary/25 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6">
                Pour les professionnels
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">
                Développez votre activité
              </h3>
              <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
                Accédez à de nouvelles opportunités, gérez vos missions et recevez vos paiements en toute sécurité.
              </p>
              <Link to="/inscription/prestataire">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-lg px-8 py-6 h-auto"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Devenir prestataire
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
