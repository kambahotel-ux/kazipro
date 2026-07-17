import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, LogIn, Package } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-10 sm:py-16 md:py-24 lg:py-28 bg-gradient-to-br from-primary via-primary to-primary/[0.93] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.15),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-primary-foreground mb-8 sm:mb-10 md:mb-14 lg:mb-16">
            <h2 className="text-[1.4rem] sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-4 md:mb-5 px-2 tracking-tight">
              Prêt à commencer ?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/85 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed mb-5 sm:mb-8">
              <span className="sm:hidden">Inscription gratuite ou connexion pour reprendre vos demandes et missions.</span>
              <span className="hidden sm:inline">
                Inscrivez-vous gratuitement ou connectez-vous pour reprendre une demande, un devis ou une mission en cours.
              </span>
            </p>
            <Button
              variant="outline"
              size="default"
              asChild
              className="w-full max-w-[15rem] sm:max-w-none sm:w-auto rounded-lg sm:rounded-xl border-white/35 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground gap-2 h-10 sm:h-11 px-4 text-sm"
            >
              <Link to="/connexion">
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90 shrink-0" />
                Déjà membre&nbsp;?
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/20 text-secondary text-[10px] sm:text-xs md:text-sm font-semibold mb-3 sm:mb-4 md:mb-6">
                Pour les clients
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-snug">
                Trouvez votre professionnel
              </h3>
              <p className="text-primary-foreground/80 text-[13px] sm:text-sm md:text-lg mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                <span className="md:hidden">Demande gratuite et devis de pros sous 24h.</span>
                <span className="hidden md:inline">
                  Publiez votre demande gratuitement et recevez des devis de prestataires qualifiés en moins de 24h.
                </span>
              </p>
              <Link to="/inscription/client" className="block">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 md:py-6 h-auto w-full"
                >
                  Publier une demande
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="bg-secondary/20 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-10 border border-secondary/30 hover:bg-secondary/25 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 text-white text-[10px] sm:text-xs md:text-sm font-semibold mb-3 sm:mb-4 md:mb-6">
                Pour les professionnels
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-snug">
                Développez votre activité
              </h3>
              <p className="text-primary-foreground/80 text-[13px] sm:text-sm md:text-lg mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                <span className="md:hidden">Opportunités, missions et paiements encadrés.</span>
                <span className="hidden md:inline">
                  Accédez à de nouvelles opportunités, gérez vos missions et recevez vos paiements en toute sécurité.
                </span>
              </p>
              <Link to="/inscription/prestataire" className="block">
                <Button 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 font-semibold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 md:py-6 h-auto w-full"
                >
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Devenir prestataire
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-violet-500/20 text-violet-100 text-[10px] sm:text-xs md:text-sm font-semibold mb-3 sm:mb-4 md:mb-6">
                <Package className="h-3.5 w-3.5" />
                Location matériel
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-snug">
                Louez ou proposez du matériel
              </h3>
              <p className="text-primary-foreground/80 text-[13px] sm:text-sm md:text-lg mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                <span className="md:hidden">Outillage et équipements avec contrat et caution.</span>
                <span className="hidden md:inline">
                  Louez une perceuse ou un échafaudage, ou publiez vos équipements en tant que loueur.
                </span>
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/location" className="block">
                  <Button
                    size="lg"
                    className="group/btn w-full bg-white text-primary hover:bg-white/90 font-semibold text-sm sm:text-base h-auto py-3"
                  >
                    Parcourir le catalogue
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/inscription/prestataire" className="block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 h-auto py-3"
                  >
                    Devenir loueur
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
