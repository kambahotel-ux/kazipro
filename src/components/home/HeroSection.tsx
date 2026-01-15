import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Shield, Clock, Star, ArrowRight, Users, BadgeCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FeaturedProvider {
  id: string;
  full_name: string;
  profession: string;
  rating: number;
  missions_completed: number;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProvider, setFeaturedProvider] = useState<FeaturedProvider | null>(null);
  const [totalProviders, setTotalProviders] = useState(500);
  const [onlineProviders, setOnlineProviders] = useState(0);

  useEffect(() => {
    fetchFeaturedProvider();
    fetchTotalProviders();
    fetchOnlineProviders();
    
    // Mettre à jour le compteur en ligne toutes les 30 secondes
    const interval = setInterval(fetchOnlineProviders, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedProvider = async () => {
    try {
      // Get a random verified provider with good rating
      const { data, error } = await supabase
        .from("prestataires")
        .select("id, full_name, profession, rating")
        .eq("verified", true)
        .gte("rating", 4.0)
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random one from the top 10
        const randomIndex = Math.floor(Math.random() * data.length);
        const provider = data[randomIndex];
        
        // Count missions for this provider
        const { count } = await supabase
          .from("missions")
          .select("*", { count: "exact", head: true })
          .eq("prestataire_id", provider.id)
          .eq("status", "completed");

        setFeaturedProvider({
          ...provider,
          missions_completed: count || 0
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du prestataire:", error);
    }
  };

  const fetchOnlineProviders = async () => {
    try {
      const { count, error } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", true)
        .eq("is_online", true);

      if (error) {
        console.error("Erreur RLS ou colonnes:", error);
        return;
      }

      console.log("Prestataires en ligne:", count);
      setOnlineProviders(count || 0);
    } catch (error) {
      console.error("Erreur lors du comptage des prestataires en ligne:", error);
    }
  };

  const fetchTotalProviders = async () => {
    try {
      const { count: totalCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);
      
      if (totalCount) setTotalProviders(totalCount);
    } catch (error) {
      console.error("Erreur lors du comptage des prestataires:", error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/services");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Content - Centered */}
          <div className="text-center text-primary-foreground space-y-8 mb-16">
            {/* Online Badge */}
            {onlineProviders > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                {onlineProviders} professionnel{onlineProviders > 1 ? 's' : ''} disponible{onlineProviders > 1 ? 's' : ''} en ce moment
              </div>
            )}
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight max-w-4xl mx-auto">
              Trouvez le professionnel qu'il vous faut
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl lg:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
              Des prestataires qualifiés et vérifiés pour tous vos projets en RDC. Paiement sécurisé, satisfaction garantie.
            </p>

            {/* Search Bar - Prominent */}
            <div className="max-w-3xl mx-auto pt-4">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Quel service recherchez-vous ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 px-8" 
                  onClick={handleSearch}
                >
                  Rechercher
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-sm font-medium">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-sm font-medium">Réponse rapide</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-secondary fill-secondary" />
                </div>
                <span className="text-sm font-medium">4.8/5 satisfaction</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Clean and Professional */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Online Providers */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{onlineProviders}</div>
              <div className="text-sm text-primary-foreground/80">En ligne maintenant</div>
            </div>

            {/* Total Providers */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalProviders}+</div>
              <div className="text-sm text-primary-foreground/80">Prestataires vérifiés</div>
            </div>

            {/* Featured Provider */}
            {featuredProvider && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-secondary fill-secondary" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{featuredProvider.rating}</div>
                <div className="text-sm text-primary-foreground/80">Note moyenne</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
