import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.15),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="text-center text-primary-foreground mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 md:mb-6 px-2">
              Prêt à commencer ?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto px-4">
              Rejoignez des milliers d'utilisateurs qui font confiance à KaziPro
            </p>
          </div>

          {/* CTA Cards - Mobile First Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* For Clients */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/20 text-secondary text-xs md:text-sm font-semibold mb-4 md:mb-6">
                Pour les clients
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-3 md:mb-4">
                Trouvez votre professionnel
              </h3>
              <p className="text-primary-foreground/80 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">
                Publiez votre demande gratuitement et recevez des devis de prestataires qualifiés en moins de 24h.
              </p>
              <Link to="/inscription/client">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-base md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto w-full sm:w-auto"
                >
                  Publier une demande
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* For Providers */}
            <div className="bg-secondary/20 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-10 border border-secondary/30 hover:bg-secondary/25 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 text-white text-xs md:text-sm font-semibold mb-4 md:mb-6">
                Pour les professionnels
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-3 md:mb-4">
                Développez votre activité
              </h3>
              <p className="text-primary-foreground/80 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">
                Accédez à de nouvelles opportunités, gérez vos missions et recevez vos paiements en toute sécurité.
              </p>
              <Link to="/inscription/prestataire">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-base md:text-lg px-6 md:px-8 py-4 md:py-6 h-auto w-full sm:w-auto"
                >
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Devenir prestataire
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
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
